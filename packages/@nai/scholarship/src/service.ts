/**
 * @nai/scholarship — Service layer
 *
 * Business logic for scholarship application flow:
 * - Create/update/submit application
 * - Email/phone/identity verification
 * - Wish management + visibility
 * - Investor review + scoring + voting
 * - Sponsorship
 * - Forum + moderation
 * - Notifications + appeals
 *
 * Per EDU_MASTER_PLAN_V4.md Sections XXIII-XXXV.
 */

import { getScholarshipStore, type ScholarshipStore } from './store';
import { logAuditEvent } from '@nai/audit';
import type {
  ScholarshipApplication,
  IdentityVerification,
  ScholarshipWish,
  Review,
  ReviewScore,
  Vote,
  ConflictDisclosure,
  Sponsorship,
  InvestorProfile,
  InvestorAccessGrant,
  ForumPost,
  ModerationDecision,
  Notification,
  Appeal,
  ApplicationStatus,
  WishVisibility,
  VerificationType,
  InvestorRole,
  ReviewScoreCriteria,
  SponsorshipType,
  ModerationAction,
  AppealType,
} from './types';
import { SCORING_WEIGHTS } from './types';

// ============================================================
// Application flow
// ============================================================

export async function createApplication(
  userId: string,
  data: Pick<ScholarshipApplication, 'full_name' | 'email' | 'phone' | 'program_code' | 'program_id'>,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createApplication({
    user_id: userId,
    program_code: data.program_code,
    status: 'draft',
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    birth_year: null,
    country: '',
    city: '',
    identity_verified: false,
    email_verified: false,
    phone_verified: false,
    has_nguyen_surname: false,
    surname_type: null,
    wants_community: false,
    consents_story_sharing: false,
    program_id: data.program_id,
    wish_text: '',
    wish_visibility: 'private',
    circumstances_text: '',
    financial_need_level: null,
    capability_text: '',
    portfolio_url: null,
    commits_to_attendance: false,
    commits_to_graduation: false,
    commits_to_community: false,
    consents_to_data_processing: false,
    consents_to_audit: false,
    submitted_at: null,
  });

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'scholarship_application_created',
    actor_ip: null,
    user_agent: null,
    target: id,
    result: 'success',
    metadata: { program_code: data.program_code },
  });

  return id;
}

export async function updateApplication(
  applicationId: string,
  userId: string,
  patch: Partial<ScholarshipApplication>,
): Promise<void> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.user_id !== userId) throw new Error('Not authorized to update this application');
  if (app.status !== 'draft' && app.status !== 'needs_supplement') {
    throw new Error(`Cannot update application with status ${app.status}`);
  }

  await store.updateApplication(applicationId, patch);

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'scholarship_application_updated',
    actor_ip: null,
    user_agent: null,
    target: applicationId,
    result: 'success',
    metadata: { fields: Object.keys(patch) },
  });
}

export async function submitApplication(applicationId: string, userId: string): Promise<void> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.user_id !== userId) throw new Error('Not authorized');
  if (app.status !== 'draft') throw new Error(`Cannot submit application with status ${app.status}`);

  // Validate required fields
  const errors: string[] = [];
  if (!app.full_name) errors.push('full_name is required');
  if (!app.email) errors.push('email is required');
  if (!app.phone) errors.push('phone is required');
  if (!app.program_id) errors.push('program_id is required');
  if (!app.wish_text) errors.push('wish_text is required');
  if (!app.circumstances_text) errors.push('circumstances_text is required');
  if (!app.consents_to_data_processing) errors.push('data processing consent is required');
  if (!app.consents_to_audit) errors.push('audit consent is required');
  if (!app.commits_to_attendance) errors.push('attendance commitment is required');
  if (!app.commits_to_graduation) errors.push('graduation commitment is required');
  if (errors.length > 0) throw new Error(`Validation failed: ${errors.join(', ')}`);

  await store.updateApplication(applicationId, {
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  });
}

export async function getApplication(applicationId: string, userId: string): Promise<ScholarshipApplication | null> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) return null;
  // P0 IDOR fix: only owner or authorized investor can view
  if (app.user_id !== userId) {
    // Check if user has investor access
    // For now, throw — investor access checked at API layer
    throw new Error('Not authorized to view this application');
  }
  return app;
}

// ============================================================
// Verification flow
// ============================================================

export async function startVerification(
  applicationId: string,
  userId: string,
  type: VerificationType,
): Promise<string> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.user_id !== userId) throw new Error('Not authorized');

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const id = await store.createVerification({
    application_id: applicationId,
    type,
    status: 'pending',
    token,
    verified_at: null,
    expires_at: expiresAt,
    attempts: 0,
  });

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'identity_verification_started',
    actor_ip: null,
    user_agent: null,
    target: id,
    result: 'success',
    metadata: { type, application_id: applicationId },
  });

  return id;
}

export async function completeVerification(
  verificationId: string,
  userId: string,
  token: string,
): Promise<void> {
  const store = getScholarshipStore();
  const v = await store.getVerification(verificationId);
  if (!v) throw new Error(`Verification ${verificationId} not found`);
  if (v.token !== token) throw new Error('Invalid verification token');
  if (new Date(v.expires_at) < new Date()) throw new Error('Verification token expired');

  await store.updateVerification(verificationId, {
    status: 'verified',
    verified_at: new Date().toISOString(),
  });

  // Update application verification flags
  const app = await store.getApplication(v.application_id);
  if (app && app.user_id === userId) {
    const patch: Partial<ScholarshipApplication> = {};
    if (v.type === 'email') patch.email_verified = true;
    if (v.type === 'phone') patch.phone_verified = true;
    if (v.type === 'identity') patch.identity_verified = true;
    await store.updateApplication(v.application_id, patch);
  }

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'identity_verification_completed',
    actor_ip: null,
    user_agent: null,
    target: verificationId,
    result: 'success',
    metadata: { type: v.type },
  });
}

// ============================================================
// Wish management
// ============================================================

export async function createWish(
  applicationId: string,
  userId: string,
  text: string,
  visibility: WishVisibility,
): Promise<string> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.user_id !== userId) throw new Error('Not authorized');

  const id = await store.createWish({
    application_id: applicationId,
    user_id: userId,
    text,
    visibility,
    publication_requested: false,
    publication_approved: false,
    publication_rejected: false,
  });

  // Update application wish text
  await store.updateApplication(applicationId, { wish_text: text, wish_visibility: visibility });

  return id;
}

export async function updateWishVisibility(
  wishId: string,
  userId: string,
  visibility: WishVisibility,
): Promise<void> {
  const store = getScholarshipStore();
  const wish = await store.getWish(wishId);
  if (!wish) throw new Error(`Wish ${wishId} not found`);
  if (wish.user_id !== userId) throw new Error('Not authorized');

  await store.updateWish(wishId, { visibility });

  if (visibility === 'investors_only') {
    await logAuditEvent({
      user_id: userId,
      session_id: null,
      event_type: 'wish_shared_with_investors',
      actor_ip: null,
      user_agent: null,
      target: wishId,
      result: 'success',
      metadata: {},
    });
  }
}

export async function requestWishPublication(wishId: string, userId: string): Promise<void> {
  const store = getScholarshipStore();
  const wish = await store.getWish(wishId);
  if (!wish) throw new Error(`Wish ${wishId} not found`);
  if (wish.user_id !== userId) throw new Error('Not authorized');

  await store.updateWish(wishId, { publication_requested: true });

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'wish_publication_requested',
    actor_ip: null,
    user_agent: null,
    target: wishId,
    result: 'success',
    metadata: {},
  });
}

export async function approveWishPublication(wishId: string, adminId: string): Promise<void> {
  const store = getScholarshipStore();
  await store.updateWish(wishId, { publication_approved: true, visibility: 'public' });

  await logAuditEvent({
    user_id: adminId,
    session_id: null,
    event_type: 'wish_publication_approved',
    actor_ip: null,
    user_agent: null,
    target: wishId,
    result: 'success',
    metadata: {},
  });
}

export async function rejectWishPublication(wishId: string, adminId: string, reason: string): Promise<void> {
  const store = getScholarshipStore();
  await store.updateWish(wishId, { publication_rejected: true });

  await logAuditEvent({
    user_id: adminId,
    session_id: null,
    event_type: 'wish_publication_rejected',
    actor_ip: null,
    user_agent: null,
    target: wishId,
    result: 'success',
    metadata: { reason },
  });
}

// ============================================================
// Investor review + scoring + voting
// ============================================================

export async function createReview(
  applicationId: string,
  reviewerId: string,
  reviewerRole: InvestorRole,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createReview({
    application_id: applicationId,
    reviewer_id: reviewerId,
    reviewer_role: reviewerRole,
    status: 'draft',
    submitted_at: null,
  });
  return id;
}

export async function submitReviewScores(
  reviewId: string,
  reviewerId: string,
  scores: Pick<ReviewScore, 'criteria' | 'score' | 'notes'>[],
): Promise<void> {
  const store = getScholarshipStore();
  const review = await store.getReview(reviewId);
  if (!review) throw new Error(`Review ${reviewId} not found`);
  if (review.reviewer_id !== reviewerId) throw new Error('Not authorized');
  if (review.status === 'submitted') throw new Error('Review already submitted');

  // Create scores with weights
  for (const s of scores) {
    await store.createScore({
      review_id: reviewId,
      criteria: s.criteria,
      score: s.score,
      weight: SCORING_WEIGHTS[s.criteria],
      notes: s.notes ?? null,
    });
  }

  // Mark review as submitted
  const reviewPatch: Partial<Review> = { status: 'submitted', submitted_at: new Date().toISOString() };
  await store.updateApplication(review.application_id, {}); // touch
  // Update review status via store — need to add updateReview to store
  // For now, use createReview's returned id to track
}

export async function submitVote(
  applicationId: string,
  voterId: string,
  voterRole: InvestorRole,
  decision: 'approve' | 'deny' | 'abstain',
  reason?: string,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createVote({
    application_id: applicationId,
    voter_id: voterId,
    voter_role: voterRole,
    decision,
    reason: reason ?? null,
  });

  await logAuditEvent({
    user_id: voterId,
    session_id: null,
    event_type: 'scholarship_vote_submitted',
    actor_ip: null,
    user_agent: null,
    target: id,
    result: 'success',
    metadata: { decision, application_id: applicationId },
  });

  return id;
}

export async function declareConflict(
  reviewerId: string,
  applicationId: string,
  conflictType: ConflictDisclosure['conflict_type'],
  description: string,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createDisclosure({
    reviewer_id: reviewerId,
    application_id: applicationId,
    conflict_type: conflictType,
    description,
  });

  await logAuditEvent({
    user_id: reviewerId,
    session_id: null,
    event_type: 'conflict_of_interest_declared',
    actor_ip: null,
    user_agent: null,
    target: id,
    result: 'success',
    metadata: { conflict_type: conflictType, application_id: applicationId },
  });

  return id;
}

// ============================================================
// Sponsorship
// ============================================================

export async function createSponsorship(
  sponsorId: string,
  applicationId: string | null,
  type: SponsorshipType,
  amountVnd: number,
  amountUsd: number,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createSponsorship({
    sponsor_id: sponsorId,
    application_id: applicationId,
    type,
    amount_vnd: amountVnd,
    amount_usd: amountUsd,
    status: 'committed',
    paid_at: null,
  });

  await logAuditEvent({
    user_id: sponsorId,
    session_id: null,
    event_type: 'sponsorship_committed',
    actor_ip: null,
    user_agent: null,
    target: id,
    result: 'success',
    metadata: { type, amount_vnd: amountVnd, application_id: applicationId },
  });

  return id;
}

export async function markSponsorshipPaid(sponsorshipId: string, sponsorId: string): Promise<void> {
  const store = getScholarshipStore();
  await store.updateSponsorship(sponsorshipId, {
    status: 'paid',
    paid_at: new Date().toISOString(),
  });

  await logAuditEvent({
    user_id: sponsorId,
    session_id: null,
    event_type: 'sponsorship_paid',
    actor_ip: null,
    user_agent: null,
    target: sponsorshipId,
    result: 'success',
    metadata: {},
  });
}

// ============================================================
// Forum + moderation
// ============================================================

export async function createForumPost(
  roomId: string,
  userId: string,
  title: string,
  content: string,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createForumPost({
    room_id: roomId,
    user_id: userId,
    title,
    content,
    status: 'draft',
    submitted_at: null,
    published_at: null,
  });
  return id;
}

export async function submitForumPost(postId: string, userId: string): Promise<void> {
  const store = getScholarshipStore();
  const post = await store.getForumPost(postId);
  if (!post) throw new Error(`Post ${postId} not found`);
  if (post.user_id !== userId) throw new Error('Not authorized');

  await store.updateForumPost(postId, {
    status: 'pending_moderation',
    submitted_at: new Date().toISOString(),
  });

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'forum_post_submitted',
    actor_ip: null,
    user_agent: null,
    target: postId,
    result: 'success',
    metadata: { room_id: post.room_id },
  });
}

export async function moderateForumPost(
  postId: string,
  moderatorId: string,
  action: ModerationAction,
  reason: string,
): Promise<void> {
  const store = getScholarshipStore();
  const post = await store.getForumPost(postId);
  if (!post) throw new Error(`Post ${postId} not found`);

  const statusMap: Record<ModerationAction, ForumPost['status']> = {
    approve: 'published',
    reject: 'rejected',
    hide: 'hidden',
    request_revision: 'needs_revision',
  };

  await store.updateForumPost(postId, {
    status: statusMap[action],
    published_at: action === 'approve' ? new Date().toISOString() : null,
  });

  await store.createModerationDecision({
    post_id: postId,
    moderator_id: moderatorId,
    action,
    reason,
  });

  const eventType = action === 'approve' ? 'forum_post_approved' : 'forum_post_rejected';
  await logAuditEvent({
    user_id: moderatorId,
    session_id: null,
    event_type: eventType,
    actor_ip: null,
    user_agent: null,
    target: postId,
    result: 'success',
    metadata: { action, reason },
  });
}

// ============================================================
// Notifications + appeals
// ============================================================

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
): Promise<string> {
  const store = getScholarshipStore();
  return store.createNotification({ user_id: userId, type, title, body, read: false, read_at: null });
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const store = getScholarshipStore();
  return store.listNotifications(userId);
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const store = getScholarshipStore();
  const notes = await store.listNotifications(userId);
  if (!notes.find((n) => n.notification_id === notificationId)) {
    throw new Error('Notification not found or not authorized');
  }
  await store.markNotificationRead(notificationId);
}

export async function createAppeal(
  applicationId: string,
  userId: string,
  type: AppealType,
  reason: string,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createAppeal({
    application_id: applicationId,
    user_id: userId,
    type,
    reason,
    status: 'pending',
    reviewed_at: null,
  });

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'appeal_submitted',
    actor_ip: null,
    user_agent: null,
    target: id,
    result: 'success',
    metadata: { type, application_id: applicationId },
  });

  return id;
}

// ============================================================
// Scoring calculation (Section XXVIII.2)
// ============================================================

export function calculateTotalScore(scores: ReviewScore[]): number {
  let total = 0;
  for (const s of scores) {
    const weight = SCORING_WEIGHTS[s.criteria] ?? 0;
    total += (s.score / 10) * weight;
  }
  return Math.round(total * 100) / 100; // 0-100
}
