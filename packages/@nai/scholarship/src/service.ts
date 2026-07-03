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

// ============================================================
// Sprint 2 — Scholarship Room: messages, documents, timeline
// ============================================================

import type { ApplicationMessage, ApplicationDocument, StatusTimelineEntry, DocumentType } from './types';

export async function sendMessage(
  applicationId: string,
  fromUserId: string,
  fromRole: ApplicationMessage['from_role'],
  toUserId: string | null,
  subject: string,
  body: string,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createMessage({
    application_id: applicationId,
    from_user_id: fromUserId,
    from_role: fromRole,
    to_user_id: toUserId,
    subject,
    body,
    read: false,
    read_at: null,
  });
  return id;
}

export async function listMessages(applicationId: string, userId: string): Promise<ApplicationMessage[]> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  // Applicant sees their own messages; council/admin sees all
  if (app.user_id !== userId) {
    // TODO: check investor/council access
    throw new Error('Not authorized');
  }
  return store.listMessages(applicationId);
}

export async function uploadDocument(
  applicationId: string,
  userId: string,
  type: DocumentType,
  filename: string,
  storageKey: string,
  mimeType: string,
  sizeBytes: number,
): Promise<string> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.user_id !== userId) throw new Error('Not authorized');

  const id = await store.createDocument({
    application_id: applicationId,
    user_id: userId,
    type,
    filename,
    storage_key: storageKey,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    status: 'pending_review',
    reviewed_at: null,
  });
  return id;
}

export async function listDocuments(applicationId: string, userId: string): Promise<ApplicationDocument[]> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.user_id !== userId) throw new Error('Not authorized');
  return store.listDocuments(applicationId);
}

export async function reviewDocument(
  documentId: string,
  reviewerId: string,
  approved: boolean,
): Promise<void> {
  const store = getScholarshipStore();
  await store.updateDocument(documentId, {
    status: approved ? 'approved' : 'rejected',
    reviewed_at: new Date().toISOString(),
  });
}

export async function getApplicationTimeline(applicationId: string, userId: string): Promise<StatusTimelineEntry[]> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.user_id !== userId) throw new Error('Not authorized');
  return store.listTimeline(applicationId);
}

export async function transitionApplicationStatus(
  applicationId: string,
  changedBy: string,
  changedByRole: string,
  toStatus: ApplicationStatus,
  reason?: string,
): Promise<void> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  const fromStatus = app.status;
  await store.updateApplication(applicationId, { status: toStatus });
  await store.createTimelineEntry({
    application_id: applicationId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: changedBy,
    changed_by_role: changedByRole,
    reason: reason ?? null,
  });

  // Notify applicant
  await store.createNotification({
    user_id: app.user_id,
    type: 'status_change',
    title: `Trạng thái đơn: ${toStatus}`,
    body: reason ?? `Đơn của bạn đã chuyển sang trạng thái ${toStatus}`,
    read: false,
    read_at: null,
  });
}

// ============================================================
// Sprint 3 — Investor Room: verification, access grant, feed, email
// ============================================================

// Investor verification — admin verifies an investor before granting access
export async function createInvestorProfile(
  userId: string,
  displayName: string,
  roles: InvestorRole[],
  bio?: string,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createInvestorProfile({
    user_id: userId,
    display_name: displayName,
    bio: bio ?? null,
    roles,
    verified: false,
    verified_at: null,
    access_expires_at: null,
  });
  return id;
}

export async function verifyInvestor(investorId: string, adminId: string): Promise<void> {
  const store = getScholarshipStore();
  await store.updateInvestorProfile(investorId, {
    verified: true,
    verified_at: new Date().toISOString(),
  });

  await logAuditEvent({
    user_id: adminId,
    session_id: null,
    event_type: 'investor_access_granted',
    actor_ip: null,
    user_agent: null,
    target: investorId,
    result: 'success',
    metadata: { action: 'investor_verified' },
  });
}

export async function grantInvestorAccess(
  investorId: string,
  scope: InvestorAccessGrant['scope'],
  grantedBy: string,
  durationDays: number = 90,
  applicationId?: string,
): Promise<string> {
  const store = getScholarshipStore();
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const id = await store.createAccessGrant({
    investor_id: investorId,
    application_id: applicationId ?? null,
    scope,
    granted_by: grantedBy,
    expires_at: expiresAt,
    revoked_at: null,
  });

  await logAuditEvent({
    user_id: grantedBy,
    session_id: null,
    event_type: 'investor_access_granted',
    actor_ip: null,
    user_agent: null,
    target: id,
    result: 'success',
    metadata: { investor_id: investorId, scope, duration_days: durationDays },
  });

  return id;
}

export async function revokeInvestorAccess(grantId: string, revokedBy: string, reason?: string): Promise<void> {
  const store = getScholarshipStore();
  await store.revokeAccessGrant(grantId, revokedBy);

  await logAuditEvent({
    user_id: revokedBy,
    session_id: null,
    event_type: 'investor_access_revoked',
    actor_ip: null,
    user_agent: null,
    target: grantId,
    result: 'success',
    metadata: { reason: reason ?? 'no reason provided' },
  });
}

export async function checkInvestorAccess(investorId: string): Promise<InvestorAccessGrant[]> {
  const store = getScholarshipStore();
  const grants = await store.listAccessGrants(investorId);
  // Filter out expired
  const now = new Date();
  return grants.filter((g) => new Date(g.expires_at) > now);
}

// Helper: find investor profile by user_id, then check access
async function checkUserInvestorAccess(userId: string): Promise<InvestorAccessGrant[]> {
  const store = getScholarshipStore();
  // First try direct (userId might be investor_id)
  const grants = await checkInvestorAccess(userId);
  if (grants.length > 0) return grants;
  // Look up investor profile by user_id
  const profile = await store.getInvestorProfileByUserId(userId);
  if (profile) {
    return checkInvestorAccess(profile.investor_id);
  }
  return [];
}

// Application feed for investors — filtered by access scope
export async function getInvestorApplicationFeed(investorId: string): Promise<ScholarshipApplication[]> {
  const store = getScholarshipStore();
  const grants = await checkUserInvestorAccess(investorId);
  if (grants.length === 0) return [];

  // If investor has all_applications scope, return all submitted apps
  const hasAllAccess = grants.some((g) => g.scope === 'all_applications');
  if (hasAllAccess) {
    return store.listApplications({ status: 'submitted' });
  }

  // If investor has single_application scope, return only that app
  const singleAppGrants = grants.filter((g) => g.scope === 'single_application' && g.application_id);
  const apps: ScholarshipApplication[] = [];
  for (const g of singleAppGrants) {
    const app = await store.getApplication(g.application_id!);
    if (app) apps.push(app);
  }
  return apps;
}

// Submit review with scores + send email notification to applicant
export async function submitReviewWithScores(
  applicationId: string,
  reviewerId: string,
  reviewerRole: InvestorRole,
  scores: { criteria: ReviewScoreCriteria; score: number; notes?: string }[],
): Promise<{ review_id: string; total_score: number }> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  // Check investor access
  const grants = await checkUserInvestorAccess(reviewerId);
  if (grants.length === 0) throw new Error('No investor access');

  // Create review
  const reviewId = await createReview(applicationId, reviewerId, reviewerRole);

  // Create scores
  const fullScores: ReviewScore[] = [];
  for (const s of scores) {
    const scoreId = await store.createScore({
      review_id: reviewId,
      criteria: s.criteria,
      score: s.score,
      weight: SCORING_WEIGHTS[s.criteria],
      notes: s.notes ?? null,
    });
    const created = await store.listScoresForReview(reviewId);
    const score = created.find((sc) => sc.score_id === scoreId);
    if (score) fullScores.push(score);
  }

  const totalScore = calculateTotalScore(fullScores);

  // Log audit
  await logAuditEvent({
    user_id: reviewerId,
    session_id: null,
    event_type: 'scholarship_review_submitted',
    actor_ip: null,
    user_agent: null,
    target: reviewId,
    result: 'success',
    metadata: { application_id: applicationId, total_score: totalScore },
  });

  // Notify applicant
  await store.createNotification({
    user_id: app.user_id,
    type: 'review_submitted',
    title: 'Đơn của bạn đã được review',
    body: `Reviewer đã chấm điểm đơn của bạn. Tổng điểm: ${totalScore}/100`,
    read: false,
    read_at: null,
  });

  return { review_id: reviewId, total_score: totalScore };
}

// Award scholarship — council decision
export async function awardScholarship(
  applicationId: string,
  councilMemberId: string,
  programCode: string,
): Promise<void> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  await store.updateApplication(applicationId, { status: 'awarded' });
  await store.createTimelineEntry({
    application_id: applicationId,
    from_status: app.status,
    to_status: 'awarded',
    changed_by: councilMemberId,
    changed_by_role: 'council_member',
    reason: `Scholarship awarded for program ${programCode}`,
  });

  await logAuditEvent({
    user_id: councilMemberId,
    session_id: null,
    event_type: 'scholarship_awarded',
    actor_ip: null,
    user_agent: null,
    target: applicationId,
    result: 'success',
    metadata: { program_code: programCode },
  });

  // Notify applicant
  await store.createNotification({
    user_id: app.user_id,
    type: 'scholarship_awarded',
    title: '🎉 Chúc mừng! Bạn đã nhận học bổng',
    body: `Đơn đăng ký chương trình ${programCode} đã được duyệt. Vui lòng kiểm tra email để biết bước tiếp theo.`,
    read: false,
    read_at: null,
  });
}

// Decline scholarship — applicant declines the offer
export async function declineScholarship(
  applicationId: string,
  userId: string,
  reason: string,
): Promise<void> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.user_id !== userId) throw new Error('Not authorized');
  if (app.status !== 'awarded' && app.status !== 'approved') {
    throw new Error(`Cannot decline application with status ${app.status}`);
  }

  await store.updateApplication(applicationId, { status: 'rejected' });
  await store.createTimelineEntry({
    application_id: applicationId,
    from_status: app.status,
    to_status: 'rejected',
    changed_by: userId,
    changed_by_role: 'applicant',
    reason: `Declined: ${reason}`,
  });

  await logAuditEvent({
    user_id: userId,
    session_id: null,
    event_type: 'scholarship_declined',
    actor_ip: null,
    user_agent: null,
    target: applicationId,
    result: 'success',
    metadata: { reason },
  });
}

// ============================================================
// Sprint 4 — Forum: comments, reports, moderation queue
// ============================================================

import type { ForumComment, ForumReport, ReportCategory, ForumRoom } from './types';

export async function createComment(
  postId: string,
  userId: string,
  body: string,
  parentCommentId?: string,
): Promise<string> {
  const store = getScholarshipStore();
  const post = await store.getForumPost(postId);
  if (!post) throw new Error(`Post ${postId} not found`);
  if (post.status !== 'published') throw new Error('Cannot comment on unpublished post');

  const id = await store.createComment({
    post_id: postId,
    user_id: userId,
    parent_comment_id: parentCommentId ?? null,
    body,
    status: 'visible',
  });
  return id;
}

export async function listComments(postId: string): Promise<ForumComment[]> {
  const store = getScholarshipStore();
  return store.listComments(postId);
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const store = getScholarshipStore();
  // We need to find the comment — listComments requires a postId
  // This is a limitation of the in-memory store. In production, use a direct lookup.
  // For now, we'll try to update directly.
  try {
    await store.updateComment(commentId, { status: 'deleted' });
  } catch {
    throw new Error(`Comment ${commentId} not found`);
  }
}

export async function reportContent(
  targetType: ForumReport['target_type'],
  targetId: string,
  reportedBy: string,
  reason: string,
  category: ReportCategory,
): Promise<string> {
  const store = getScholarshipStore();
  const id = await store.createReport({
    target_type: targetType,
    target_id: targetId,
    reported_by: reportedBy,
    reason,
    category,
    status: 'pending',
    reviewed_at: null,
  });

  // If reporting a post, mark it as reported
  if (targetType === 'post') {
    const post = await store.getForumPost(targetId);
    if (post && post.status === 'published') {
      await store.updateForumPost(targetId, { status: 'reported' });
    }
  }

  await logAuditEvent({
    user_id: reportedBy,
    session_id: null,
    event_type: 'complaint_submitted',
    actor_ip: null,
    user_agent: null,
    target: id,
    result: 'success',
    metadata: { target_type: targetType, target_id: targetId, category },
  });

  return id;
}

export async function getModerationQueue(): Promise<ForumPost[]> {
  const store = getScholarshipStore();
  return store.listModerationQueue();
}

export async function reviewReport(
  reportId: string,
  moderatorId: string,
  action: 'actioned' | 'dismissed',
): Promise<void> {
  const store = getScholarshipStore();
  await store.updateReport(reportId, {
    status: action,
    reviewed_at: new Date().toISOString(),
  });
}

export async function listPublishedPosts(roomId: string): Promise<ForumPost[]> {
  const store = getScholarshipStore();
  const posts = await store.listForumPosts(roomId);
  return posts.filter((p) => p.status === 'published');
}

// ============================================================
// Sprint 5 — Decision Engine: council decision, waitlist
// ============================================================

import type { CouncilDecision, WaitlistEntry } from './types';
import { COUNCIL_CONFIG } from './types';

// Aggregate votes and make council decision
export async function makeCouncilDecision(
  applicationId: string,
  councilMemberId: string,
): Promise<CouncilDecision> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);

  // Get all votes for this application
  const votes = await store.listVotesForApplication(applicationId);
  const approve = votes.filter((v) => v.decision === 'approve').length;
  const deny = votes.filter((v) => v.decision === 'deny').length;
  const abstain = votes.filter((v) => v.decision === 'abstain').length;

  // Determine outcome
  let outcome: CouncilDecision['outcome'];
  if (approve >= COUNCIL_CONFIG.approvalThreshold) {
    outcome = 'approved';
  } else if (deny >= COUNCIL_CONFIG.approvalThreshold) {
    outcome = 'denied';
  } else if (approve > 0 && approve < COUNCIL_CONFIG.approvalThreshold) {
    outcome = 'waitlisted';
  } else {
    outcome = 'pending';
  }

  // Check if decision already exists
  const existing = await store.getCouncilDecisionByApplication(applicationId);
  const decidedAt = outcome !== 'pending' ? new Date().toISOString() : null;

  if (existing) {
    await store.updateCouncilDecision(existing.decision_id, {
      total_approve: approve,
      total_deny: deny,
      total_abstain: abstain,
      outcome,
      decided_at: decidedAt,
    });
    return { ...existing, total_approve: approve, total_deny: deny, total_abstain: abstain, outcome, decided_at };
  }

  const id = await store.createCouncilDecision({
    application_id: applicationId,
    total_approve: approve,
    total_deny: deny,
    total_abstain: abstain,
    outcome,
    threshold: COUNCIL_CONFIG.approvalThreshold,
    decided_at: decidedAt,
  });

  // If approved, award scholarship
  if (outcome === 'approved') {
    await awardScholarship(applicationId, councilMemberId, app.program_code);
  } else if (outcome === 'waitlisted') {
    await addToWaitlist(applicationId, app.user_id, app.program_code);
  } else if (outcome === 'denied') {
    await store.updateApplication(applicationId, { status: 'rejected' });
    await store.createTimelineEntry({
      application_id: applicationId,
      from_status: app.status,
      to_status: 'rejected',
      changed_by: councilMemberId,
      changed_by_role: 'council_member',
      reason: 'Council denied application',
    });
  }

  return {
    decision_id: id,
    application_id: applicationId,
    total_approve: approve,
    total_deny: deny,
    total_abstain: abstain,
    outcome,
    threshold: COUNCIL_CONFIG.approvalThreshold,
    decided_at: decidedAt,
    created_at: new Date().toISOString(),
  };
}

export async function getCouncilDecision(applicationId: string): Promise<CouncilDecision | null> {
  const store = getScholarshipStore();
  return store.getCouncilDecisionByApplication(applicationId);
}

// Waitlist management
export async function addToWaitlist(
  applicationId: string,
  userId: string,
  programCode: string,
): Promise<string> {
  const store = getScholarshipStore();
  // Get current max position for this program
  const current = await store.listWaitlist({ program_code: programCode, status: 'waiting' });
  const maxPosition = current.reduce((max, e) => Math.max(max, e.position), 0);

  const id = await store.createWaitlistEntry({
    application_id: applicationId,
    user_id: userId,
    program_code: programCode,
    position: maxPosition + 1,
    status: 'waiting',
    offered_at: null,
  });

  // Update application status
  await store.updateApplication(applicationId, { status: 'waitlisted' });

  return id;
}

export async function listWaitlist(filter?: { status?: WaitlistEntry['status']; program_code?: string }): Promise<WaitlistEntry[]> {
  const store = getScholarshipStore();
  return store.listWaitlist(filter);
}

export async function offerWaitlistSpot(entryId: string, adminId: string): Promise<void> {
  const store = getScholarshipStore();
  await store.updateWaitlistEntry(entryId, {
    status: 'offered',
    offered_at: new Date().toISOString(),
  });

  const entries = await store.listWaitlist();
  const entry = entries.find((e) => e.entry_id === entryId);
  if (entry) {
    await store.createNotification({
      user_id: entry.user_id,
      type: 'waitlist_offered',
      title: 'Học bổng có chỗ trống!',
      body: 'Bạn đã được offer từ waitlist. Vui lòng phản hồi trong 7 ngày.',
      read: false,
      read_at: null,
    });
  }
}

export async function withdrawFromWaitlist(entryId: string, userId: string): Promise<void> {
  const store = getScholarshipStore();
  const entries = await store.listWaitlist();
  const entry = entries.find((e) => e.entry_id === entryId);
  if (!entry) throw new Error(`Waitlist entry ${entryId} not found`);
  if (entry.user_id !== userId) throw new Error('Not authorized');

  await store.updateWaitlistEntry(entryId, { status: 'withdrawn' });

  // Reorder positions
  const waiting = await store.listWaitlist({ program_code: entry.program_code, status: 'waiting' });
  for (let i = 0; i < waiting.length; i++) {
    await store.updateWaitlistEntry(waiting[i].entry_id, { position: i + 1 });
  }
}

// ============================================================
// Sprint 6 — Scholarship Entitlement: grant, suspend, revoke, restore
// ============================================================

import type { ScholarshipEntitlement, Cohort, EntitlementEvent } from './types';
import { ENTITLEMENT_LIFECYCLE } from './types';

// Grant entitlement to awarded applicant
export async function grantEntitlement(
  applicationId: string,
  cohortId: string,
  grantedBy: string,
  learningPaths: string[] = [],
  aiComputerInstanceId?: string,
  durationDays: number = ENTITLEMENT_LIFECYCLE.defaultDurationDays,
): Promise<string> {
  const store = getScholarshipStore();
  const app = await store.getApplication(applicationId);
  if (!app) throw new Error(`Application ${applicationId} not found`);
  if (app.status !== 'awarded') throw new Error('Application must be awarded before granting entitlement');

  // Check if entitlement already exists
  const existing = await store.getEntitlementByApplication(applicationId);
  if (existing) throw new Error('Entitlement already exists for this application');

  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const id = await store.createEntitlement({
    application_id: applicationId,
    user_id: app.user_id,
    program_code: app.program_code,
    cohort_id: cohortId,
    status: 'active',
    expires_at: expiresAt,
    suspended_at: null,
    revoked_at: null,
    completed_at: null,
    ai_computer_instance_id: aiComputerInstanceId ?? null,
    learning_paths: learningPaths,
    suspend_reason: null,
    revoke_reason: null,
  });

  // Update application status to enrolled
  await store.updateApplication(applicationId, { status: 'enrolled' });
  await store.createTimelineEntry({
    application_id: applicationId,
    from_status: 'awarded',
    to_status: 'enrolled',
    changed_by: grantedBy,
    changed_by_role: 'admin',
    reason: 'Entitlement granted',
  });

  // Log entitlement event
  await store.createEntitlementEvent({
    entitlement_id: id,
    event_type: 'granted',
    changed_by: grantedBy,
    reason: null,
    metadata: { cohort_id: cohortId, duration_days: durationDays },
  });

  // Notify applicant
  await store.createNotification({
    user_id: app.user_id,
    type: 'entitlement_granted',
    title: 'Học bổng đã được cấp',
    body: `Bạn đã được cấp entitlement cho chương trình ${app.program_code}. Cohort: ${cohortId}. Hạn hạn: ${new Date(expiresAt).toLocaleDateString('vi-VN')}`,
    read: false,
    read_at: null,
  });

  return id;
}

// Suspend entitlement
export async function suspendEntitlement(entitlementId: string, suspendedBy: string, reason: string): Promise<void> {
  const store = getScholarshipStore();
  const ent = await store.getEntitlement(entitlementId);
  if (!ent) throw new Error(`Entitlement ${entitlementId} not found`);
  if (ent.status !== 'active') throw new Error(`Cannot suspend entitlement with status ${ent.status}`);

  await store.updateEntitlement(entitlementId, {
    status: 'suspended',
    suspended_at: new Date().toISOString(),
    suspend_reason: reason,
  });

  await store.createEntitlementEvent({
    entitlement_id: entitlementId,
    event_type: 'suspended',
    changed_by: suspendedBy,
    reason,
    metadata: {},
  });
}

// Restore suspended entitlement
export async function restoreEntitlement(entitlementId: string, restoredBy: string, reason?: string): Promise<void> {
  const store = getScholarshipStore();
  const ent = await store.getEntitlement(entitlementId);
  if (!ent) throw new Error(`Entitlement ${entitlementId} not found`);
  if (ent.status !== 'suspended') throw new Error(`Cannot restore entitlement with status ${ent.status}`);

  await store.updateEntitlement(entitlementId, {
    status: 'active',
    suspended_at: null,
    suspend_reason: null,
  });

  await store.createEntitlementEvent({
    entitlement_id: entitlementId,
    event_type: 'restored',
    changed_by: restoredBy,
    reason: reason ?? null,
    metadata: {},
  });
}

// Revoke entitlement (permanent)
export async function revokeEntitlement(entitlementId: string, revokedBy: string, reason: string): Promise<void> {
  const store = getScholarshipStore();
  const ent = await store.getEntitlement(entitlementId);
  if (!ent) throw new Error(`Entitlement ${entitlementId} not found`);
  if (ent.status === 'revoked' || ent.status === 'completed') {
    throw new Error(`Cannot revoke entitlement with status ${ent.status}`);
  }

  await store.updateEntitlement(entitlementId, {
    status: 'revoked',
    revoked_at: new Date().toISOString(),
    revoke_reason: reason,
  });

  await store.createEntitlementEvent({
    entitlement_id: entitlementId,
    event_type: 'revoked',
    changed_by: revokedBy,
    reason,
    metadata: {},
  });

  // Update application status
  await store.updateApplication(ent.application_id, { status: 'rejected' });
  await store.createTimelineEntry({
    application_id: ent.application_id,
    from_status: 'enrolled',
    to_status: 'rejected',
    changed_by: revokedBy,
    changed_by_role: 'admin',
    reason: `Entitlement revoked: ${reason}`,
  });
}

// Complete entitlement (successful graduation)
export async function completeEntitlement(entitlementId: string, completedBy: string): Promise<void> {
  const store = getScholarshipStore();
  const ent = await store.getEntitlement(entitlementId);
  if (!ent) throw new Error(`Entitlement ${entitlementId} not found`);
  if (ent.status !== 'active') throw new Error(`Cannot complete entitlement with status ${ent.status}`);

  await store.updateEntitlement(entitlementId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  await store.createEntitlementEvent({
    entitlement_id: entitlementId,
    event_type: 'completed',
    changed_by: completedBy,
    reason: 'Successfully completed program',
    metadata: {},
  });
}

// Add learning path to entitlement
export async function addLearningPath(entitlementId: string, programId: string, addedBy: string): Promise<void> {
  const store = getScholarshipStore();
  const ent = await store.getEntitlement(entitlementId);
  if (!ent) throw new Error(`Entitlement ${entitlementId} not found`);
  if (ent.learning_paths.includes(programId)) return;

  await store.updateEntitlement(entitlementId, {
    learning_paths: [...ent.learning_paths, programId],
  });

  await store.createEntitlementEvent({
    entitlement_id: entitlementId,
    event_type: 'learning_path_added',
    changed_by: addedBy,
    reason: null,
    metadata: { program_id: programId },
  });
}

// Get entitlement for user
export async function getUserEntitlements(userId: string): Promise<ScholarshipEntitlement[]> {
  const store = getScholarshipStore();
  return store.getEntitlementsByUser(userId);
}

// Get entitlement by application
export async function getEntitlementByApplication(appId: string): Promise<ScholarshipEntitlement | null> {
  const store = getScholarshipStore();
  return store.getEntitlementByApplication(appId);
}

// Get entitlement lifecycle events
export async function getEntitlementEvents(entitlementId: string): Promise<EntitlementEvent[]> {
  const store = getScholarshipStore();
  return store.listEntitlementEvents(entitlementId);
}

// Cohort management
export async function createCohort(
  name: string,
  programCode: string,
  startDate: string,
  endDate: string,
  capacity: number,
): Promise<string> {
  const store = getScholarshipStore();
  return store.createCohort({
    name,
    program_code: programCode,
    start_date: startDate,
    end_date: endDate,
    capacity,
    enrolled_count: 0,
    status: 'open',
  });
}

export async function listCohorts(filter?: { program_code?: string; status?: Cohort['status'] }): Promise<Cohort[]> {
  const store = getScholarshipStore();
  return store.listCohorts(filter);
}
