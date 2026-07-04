/**
 * @nai/scholarship — unit tests
 *
 * Tests:
 * - 18 entities type check
 * - 24 audit events
 * - 9 programs
 * - 14 moderation criteria
 * - Scoring weights sum to 100
 * - Application create/update/submit flow
 * - Verification flow (email/phone/identity)
 * - Wish create + visibility update
 * - Review + scoring + vote
 * - Forum post + moderation
 * - Notification + appeal
 * - IDOR protection (user cannot access other's application)
 */

import {
  InMemoryScholarshipStore,
  setScholarshipStore,
  getScholarshipStore,
  createApplication,
  updateApplication,
  submitApplication,
  getApplication,
  startVerification,
  completeVerification,
  createWish,
  updateWishVisibility,
  requestWishPublication,
  createReview,
  submitVote,
  declareConflict,
  createSponsorship,
  markSponsorshipPaid,
  createForumPost,
  submitForumPost,
  moderateForumPost,
  createNotification,
  listNotifications,
  markNotificationRead,
  createAppeal,
  calculateTotalScore,
  sendMessage,
  listMessages,
  uploadDocument,
  listDocuments,
  reviewDocument,
  getApplicationTimeline,
  transitionApplicationStatus,
  createInvestorProfile,
  verifyInvestor,
  grantInvestorAccess,
  revokeInvestorAccess,
  checkInvestorAccess,
  getInvestorApplicationFeed,
  submitReviewWithScores,
  awardScholarship,
  declineScholarship,
  createComment,
  listComments,
  deleteComment,
  reportContent,
  getModerationQueue,
  reviewReport,
  listPublishedPosts,
  makeCouncilDecision,
  getCouncilDecision,
  addToWaitlist,
  listWaitlist,
  offerWaitlistSpot,
  withdrawFromWaitlist,
  SCORING_RUBRIC,
  COUNCIL_CONFIG,
  grantEntitlement,
  suspendEntitlement,
  restoreEntitlement,
  revokeEntitlement,
  completeEntitlement,
  addLearningPath,
  getUserEntitlements,
  getEntitlementByApplication,
  getEntitlementEvents,
  createCohort,
  listCohorts,
  ENTITLEMENT_LIFECYCLE,
  SCHOLARSHIP_AUDIT_EVENTS,
  SCHOLARSHIP_PROGRAMS,
  MODERATION_PROHIBITED,
  SCORING_WEIGHTS,
  exportUserData,
  runRetentionSweep,
} from './index';
import { InMemoryAuditStore, setAuditStore, queryAuditLog } from '@nai/audit';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

async function testEntitiesAndConstants() {
  console.log('Test: entities + constants');
  assert(SCHOLARSHIP_AUDIT_EVENTS.length === 24, `24 audit events, got ${SCHOLARSHIP_AUDIT_EVENTS.length}`);
  assert(SCHOLARSHIP_PROGRAMS.length === 9, `9 programs, got ${SCHOLARSHIP_PROGRAMS.length}`);
  assert(MODERATION_PROHIBITED.length === 14, `14 moderation criteria, got ${MODERATION_PROHIBITED.length}`);
  const weightSum = Object.values(SCORING_WEIGHTS).reduce((a, b) => a + b, 0);
  assert(weightSum === 100, `scoring weights sum to 100, got ${weightSum}`);
}

async function testApplicationFlow() {
  console.log('Test: application create/update/submit');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const id = await createApplication('u1', {
    full_name: 'Nguyen Van A',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });
  assert(typeof id === 'string', 'application created with id');

  const app = await getApplication(id, 'u1');
  assert(app !== null, 'application fetched');
  assert(app?.status === 'draft', 'initial status is draft');
  assert(app?.full_name === 'Nguyen Van A', 'full_name correct');

  // Update
  await updateApplication(id, 'u1', {
    wish_text: 'I want to learn AI',
    circumstances_text: 'Financial need',
    consents_to_data_processing: true,
    consents_to_audit: true,
    commits_to_attendance: true,
    commits_to_graduation: true,
  });
  const updated = await getApplication(id, 'u1');
  assert(updated?.wish_text === 'I want to learn AI', 'wish_text updated');

  // Submit
  await submitApplication(id, 'u1');
  const submitted = await getApplication(id, 'u1');
  assert(submitted?.status === 'submitted', 'status is submitted');
  assert(submitted?.submitted_at !== null, 'submitted_at set');

  // Audit
  const events = await queryAuditLog({ event_type: 'scholarship_application_created' });
  assert(events.length === 1, '1 application_created audit event');
}

async function testIDORProtection() {
  console.log('Test: IDOR — user cannot access other application');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const id = await createApplication('u1', {
    full_name: 'User 1',
    email: 'u1@example.com',
    phone: '+84901111111',
    program_code: 'NAO',
    program_id: 'nao',
  });

  try {
    await getApplication(id, 'u2');
    assert(false, 'should throw IDOR error');
  } catch (e) {
    assert((e as Error).message.includes('Not authorized'), 'IDOR throws not authorized');
  }
}

async function testVerificationFlow() {
  console.log('Test: verification flow');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });

  const vId = await startVerification(appId, 'u1', 'email');
  assert(typeof vId === 'string', 'verification started');

  const v = await store.getVerification(vId);
  assert(v !== null, 'verification record exists');

  await completeVerification(vId, 'u1', v!.token);
  const vCompleted = await store.getVerification(vId);
  assert(vCompleted?.status === 'verified', 'verification completed');

  const events = await queryAuditLog({ event_type: 'identity_verification_completed' });
  assert(events.length === 1, '1 verification_completed audit event');
}

async function testWishFlow() {
  console.log('Test: wish management');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });

  const wishId = await createWish(appId, 'u1', 'My wish is to learn AI', 'private');
  assert(typeof wishId === 'string', 'wish created');

  await updateWishVisibility(wishId, 'u1', 'investors_only');
  const events = await queryAuditLog({ event_type: 'wish_shared_with_investors' });
  assert(events.length === 1, '1 wish_shared_with_investors event');

  await requestWishPublication(wishId, 'u1');
  const pubEvents = await queryAuditLog({ event_type: 'wish_publication_requested' });
  assert(pubEvents.length === 1, '1 wish_publication_requested event');
}

async function testReviewAndVoting() {
  console.log('Test: review + voting');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });

  const reviewId = await createReview(appId, 'investor1', 'reviewer');
  assert(typeof reviewId === 'string', 'review created');

  const voteId = await submitVote(appId, 'investor1', 'reviewer', 'approve', 'good application');
  assert(typeof voteId === 'string', 'vote submitted');

  const voteEvents = await queryAuditLog({ event_type: 'scholarship_vote_submitted' });
  assert(voteEvents.length === 1, '1 vote_submitted event');

  // Conflict disclosure
  const discId = await declareConflict('investor1', appId, 'professional', 'Worked with applicant before');
  assert(typeof discId === 'string', 'conflict disclosed');

  const discEvents = await queryAuditLog({ event_type: 'conflict_of_interest_declared' });
  assert(discEvents.length === 1, '1 conflict_declared event');
}

async function testScoring() {
  console.log('Test: scoring calculation');
  const scores = [
    { score_id: '1', review_id: 'r1', criteria: 'need' as const, score: 8, weight: 20, notes: null },
    { score_id: '2', review_id: 'r1', criteria: 'clarity' as const, score: 7, weight: 15, notes: null },
    { score_id: '3', review_id: 'r1', criteria: 'feasibility' as const, score: 9, weight: 15, notes: null },
    { score_id: '4', review_id: 'r1', criteria: 'product_value' as const, score: 8, weight: 20, notes: null },
    { score_id: '5', review_id: 'r1', criteria: 'commitment' as const, score: 9, weight: 15, notes: null },
    { score_id: '6', review_id: 'r1', criteria: 'giveback' as const, score: 7, weight: 10, notes: null },
    { score_id: '7', review_id: 'r1', criteria: 'integrity' as const, score: 10, weight: 5, notes: null },
  ];
  const total = calculateTotalScore(scores);
  assert(total > 0 && total <= 100, `total score in 0-100 range, got ${total}`);
  // Expected: (8/10*20) + (7/10*15) + (9/10*15) + (8/10*20) + (9/10*15) + (7/10*10) + (10/10*5)
  // = 16 + 10.5 + 13.5 + 16 + 13.5 + 7 + 5 = 81.5
  assert(total === 81.5, `expected 81.5, got ${total}`);
}

async function testSponsorship() {
  console.log('Test: sponsorship');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const sId = await createSponsorship('sponsor1', null, 'full_scholarship', 999000, 40);
  assert(typeof sId === 'string', 'sponsorship created');

  const commitEvents = await queryAuditLog({ event_type: 'sponsorship_committed' });
  assert(commitEvents.length === 1, '1 sponsorship_committed event');

  await markSponsorshipPaid(sId, 'sponsor1');
  const paidEvents = await queryAuditLog({ event_type: 'sponsorship_paid' });
  assert(paidEvents.length === 1, '1 sponsorship_paid event');
}

async function testForumModeration() {
  console.log('Test: forum + moderation');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const store = getScholarshipStore();
  const roomId = await store.createForumRoom({ name: 'General', description: 'General discussion', is_public: false });
  const postId = await createForumPost(roomId, 'u1', 'My Journey', 'I want to share my story');
  assert(typeof postId === 'string', 'forum post created');

  await submitForumPost(postId, 'u1');
  const submitEvents = await queryAuditLog({ event_type: 'forum_post_submitted' });
  assert(submitEvents.length === 1, '1 forum_post_submitted event');

  await moderateForumPost(postId, 'mod1', 'approve', 'content is appropriate');
  const approveEvents = await queryAuditLog({ event_type: 'forum_post_approved' });
  assert(approveEvents.length === 1, '1 forum_post_approved event');
}

async function testNotifications() {
  console.log('Test: notifications');
  setScholarshipStore(new InMemoryScholarshipStore());

  const id = await createNotification('u1', 'application_update', 'Application Updated', 'Your application has been updated');
  assert(typeof id === 'string', 'notification created');

  const notes = await listNotifications('u1');
  assert(notes.length === 1, '1 notification listed');
  assert(notes[0]?.read === false, 'notification is unread');

  await markNotificationRead(id, 'u1');
  const notesAfter = await listNotifications('u1');
  assert(notesAfter[0]?.read === true, 'notification marked as read');
}

async function testAppeal() {
  console.log('Test: appeal');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });

  const appealId = await createAppeal(appId, 'u1', 'rejection', 'I believe the decision was incorrect');
  assert(typeof appealId === 'string', 'appeal created');

  const events = await queryAuditLog({ event_type: 'appeal_submitted' });
  assert(events.length === 1, '1 appeal_submitted event');
}

async function testMessages() {
  console.log('Test: Sprint 2 messages');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });

  const msgId = await sendMessage(appId, 'u1', 'applicant', null, 'Hello', 'I have a question');
  assert(typeof msgId === 'string', 'message created');

  const msgs = await listMessages(appId, 'u1');
  assert(msgs.length === 1, '1 message listed');
  assert(msgs[0]?.subject === 'Hello', 'subject correct');

  // IDOR: other user cannot list
  try {
    await listMessages(appId, 'u2');
    assert(false, 'should throw IDOR');
  } catch (e) {
    assert((e as Error).message.includes('Not authorized'), 'IDOR blocked');
  }
}

async function testDocuments() {
  console.log('Test: Sprint 2 documents');
  setScholarshipStore(new InMemoryScholarshipStore());

  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });

  const docId = await uploadDocument(appId, 'u1', 'income_proof', 'income.pdf', 'sch/test/income.pdf', 'application/pdf', 1024);
  assert(typeof docId === 'string', 'document created');

  const docs = await listDocuments(appId, 'u1');
  assert(docs.length === 1, '1 document listed');
  assert(docs[0]?.status === 'pending_review', 'initial status pending_review');

  await reviewDocument(docId, 'admin1', true);
  const docsAfter = await listDocuments(appId, 'u1');
  assert(docsAfter[0]?.status === 'approved', 'document approved');
}

async function testTimelineAndStatusTransition() {
  console.log('Test: Sprint 2 timeline + status transition');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });

  // Transition status
  await transitionApplicationStatus(appId, 'admin1', 'admin', 'verified', 'All verifications passed');

  const app = await getApplication(appId, 'u1');
  assert(app?.status === 'verified', 'status transitioned to verified');

  const timeline = await getApplicationTimeline(appId, 'u1');
  assert(timeline.length === 1, '1 timeline entry');
  assert(timeline[0]?.to_status === 'verified', 'timeline to_status correct');
  assert(timeline[0]?.from_status === 'draft', 'timeline from_status correct');

  // Notification should be created
  const notes = await store.listNotifications('u1');
  assert(notes.length === 1, '1 notification created for status change');
}

async function testInvestorRoom() {
  console.log('Test: Sprint 3 investor room');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  // Create investor profile
  const invId = await createInvestorProfile('inv1', 'Investor 1', ['reviewer', 'sponsor'], 'Bio');
  assert(typeof invId === 'string', 'investor profile created');

  // Verify investor
  await verifyInvestor(invId, 'admin1');
  const inv = await store.getInvestorProfile(invId);
  assert(inv?.verified === true, 'investor verified');

  // Grant access
  const grantId = await grantInvestorAccess(invId, 'all_applications', 'admin1', 90);
  assert(typeof grantId === 'string', 'access granted');

  // Check access
  const grants = await checkInvestorAccess(invId);
  assert(grants.length === 1, '1 active grant');

  // Create application and submit
  const appId = await createApplication('u1', {
    full_name: 'Applicant',
    email: 'app@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });
  await updateApplication(appId, 'u1', {
    wish_text: 'Learn AI',
    circumstances_text: 'Need help',
    consents_to_data_processing: true,
    consents_to_audit: true,
    commits_to_attendance: true,
    commits_to_graduation: true,
  });
  await submitApplication(appId, 'u1');

  // Get investor feed
  const feed = await getInvestorApplicationFeed(invId);
  assert(feed.length === 1, 'investor feed has 1 application');

  // Submit review with scores
  const result = await submitReviewWithScores(appId, 'inv1', 'reviewer', [
    { criteria: 'need', score: 8 },
    { criteria: 'clarity', score: 7 },
    { criteria: 'feasibility', score: 9 },
    { criteria: 'product_value', score: 8 },
    { criteria: 'commitment', score: 9 },
    { criteria: 'giveback', score: 7 },
    { criteria: 'integrity', score: 10 },
  ]);
  assert(typeof result.review_id === 'string', 'review submitted');
  assert(result.total_score === 81.5, `total score 81.5, got ${result.total_score}`);

  // Revoke access
  await revokeInvestorAccess(grantId, 'admin1', 'test revoke');
  const grantsAfter = await checkInvestorAccess(invId);
  assert(grantsAfter.length === 0, '0 active grants after revoke');
}

async function testAwardAndDecline() {
  console.log('Test: Sprint 3 award + decline');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });
  await updateApplication(appId, 'u1', {
    wish_text: 'Learn',
    circumstances_text: 'Need',
    consents_to_data_processing: true,
    consents_to_audit: true,
    commits_to_attendance: true,
    commits_to_graduation: true,
  });
  await submitApplication(appId, 'u1');

  // Award
  await awardScholarship(appId, 'council1', 'NAO');
  const awarded = await getApplication(appId, 'u1');
  assert(awarded?.status === 'awarded', 'status is awarded');

  // Check notification
  const notes = await store.listNotifications('u1');
  assert(notes.length >= 1, 'notification created for award');

  // Decline
  await declineScholarship(appId, 'u1', 'Cannot attend');
  const declined = await getApplication(appId, 'u1');
  assert(declined?.status === 'rejected', 'status is rejected after decline');

  // Audit events
  const awardEvents = await queryAuditLog({ event_type: 'scholarship_awarded' });
  assert(awardEvents.length === 1, '1 scholarship_awarded event');
  const declineEvents = await queryAuditLog({ event_type: 'scholarship_declined' });
  assert(declineEvents.length === 1, '1 scholarship_declined event');
}

async function testForumComments() {
  console.log('Test: Sprint 4 forum comments');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  // Create room + published post
  const roomId = await store.createForumRoom({ name: 'Test', description: 'Test', is_public: true });
  const postId = await createForumPost(roomId, 'u1', 'Test Post', 'Content here');
  await submitForumPost(postId, 'u1');
  await moderateForumPost(postId, 'mod1', 'approve', 'ok');

  // Create comment
  const commentId = await createComment(postId, 'u2', 'Great post!');
  assert(typeof commentId === 'string', 'comment created');

  const comments = await listComments(postId);
  assert(comments.length === 1, '1 comment listed');

  // Delete comment
  await deleteComment(commentId, 'u2');
  const commentsAfter = await listComments(postId);
  assert(commentsAfter.length === 0, '0 comments after delete (deleted filtered)');

  // List published posts
  const published = await listPublishedPosts(roomId);
  assert(published.length === 1, '1 published post');
  assert(published[0]?.status === 'published', 'post is published');
}

async function testReportAndModeration() {
  console.log('Test: Sprint 4 report + moderation queue');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  // Create room + published post
  const roomId = await store.createForumRoom({ name: 'Test', description: 'Test', is_public: true });
  const postId = await createForumPost(roomId, 'u1', 'Bad Post', 'Bad content');
  await submitForumPost(postId, 'u1');
  await moderateForumPost(postId, 'mod1', 'approve', 'ok');

  // Report the post
  const reportId = await reportContent('post', postId, 'u2', 'Contains personal info', 'personal_info');
  assert(typeof reportId === 'string', 'report created');

  // Post should be marked as reported
  const post = await store.getForumPost(postId);
  assert(post?.status === 'reported', 'post status is reported');

  // Moderation queue should contain the post
  const queue = await getModerationQueue();
  assert(queue.length >= 1, 'moderation queue has items');

  // Review report
  await reviewReport(reportId, 'mod1', 'actioned');
  const events = await queryAuditLog({ event_type: 'complaint_submitted' });
  assert(events.length === 1, '1 complaint_submitted event');
}

async function testCouncilDecision() {
  console.log('Test: Sprint 5 council decision');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  // Verify rubric
  assert(SCORING_RUBRIC.length === 7, '7 rubric criteria');
  assert(COUNCIL_CONFIG.size === 5, 'council size 5');
  assert(COUNCIL_CONFIG.approvalThreshold === 3, 'threshold 3');

  // Create + submit application
  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });
  await updateApplication(appId, 'u1', {
    wish_text: 'Learn',
    circumstances_text: 'Need',
    consents_to_data_processing: true,
    consents_to_audit: true,
    commits_to_attendance: true,
    commits_to_graduation: true,
  });
  await submitApplication(appId, 'u1');

  // 3 approve votes (meets threshold)
  await submitVote(appId, 'c1', 'council_member', 'approve');
  await submitVote(appId, 'c2', 'council_member', 'approve');
  await submitVote(appId, 'c3', 'council_member', 'approve');

  // Make decision
  const decision = await makeCouncilDecision(appId, 'c1');
  assert(decision.outcome === 'approved', 'outcome approved with 3 votes');
  assert(decision.total_approve === 3, '3 approve votes');

  // Application should be awarded
  const app = await getApplication(appId, 'u1');
  assert(app?.status === 'awarded', 'status is awarded');

  // Deny scenario
  const appId2 = await createApplication('u2', {
    full_name: 'Test2',
    email: 'test2@example.com',
    phone: '+84901234568',
    program_code: 'NAO',
    program_id: 'nao',
  });
  await updateApplication(appId2, 'u2', {
    wish_text: 'Learn',
    circumstances_text: 'Need',
    consents_to_data_processing: true,
    consents_to_audit: true,
    commits_to_attendance: true,
    commits_to_graduation: true,
  });
  await submitApplication(appId2, 'u2');

  await submitVote(appId2, 'c1', 'council_member', 'deny');
  await submitVote(appId2, 'c2', 'council_member', 'deny');
  await submitVote(appId2, 'c3', 'council_member', 'deny');

  const decision2 = await makeCouncilDecision(appId2, 'c1');
  assert(decision2.outcome === 'denied', 'outcome denied with 3 deny votes');
}

async function testWaitlist() {
  console.log('Test: Sprint 5 waitlist');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  // Create + submit application
  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });
  await updateApplication(appId, 'u1', {
    wish_text: 'Learn',
    circumstances_text: 'Need',
    consents_to_data_processing: true,
    consents_to_audit: true,
    commits_to_attendance: true,
    commits_to_graduation: true,
  });
  await submitApplication(appId, 'u1');

  // Add to waitlist
  const entryId = await addToWaitlist(appId, 'u1', 'NAO');
  assert(typeof entryId === 'string', 'waitlist entry created');

  const app = await getApplication(appId, 'u1');
  assert(app?.status === 'waitlisted', 'status is waitlisted');

  // List waitlist
  const list = await listWaitlist({ status: 'waiting' });
  assert(list.length === 1, '1 waiting entry');
  assert(list[0]?.position === 1, 'position 1');

  // Offer spot
  await offerWaitlistSpot(entryId, 'admin1');
  const offered = await listWaitlist({ status: 'offered' });
  assert(offered.length === 1, '1 offered entry');

  // Withdraw
  await withdrawFromWaitlist(entryId, 'u1');
  const withdrawn = await listWaitlist({ status: 'withdrawn' });
  assert(withdrawn.length === 1, '1 withdrawn entry');
}

async function testEntitlementLifecycle() {
  console.log('Test: Sprint 6 entitlement lifecycle');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  // Create cohort
  const cohortId = await createCohort('Cohort 2026 Q3', 'NAO', '2026-07-01', '2026-12-31', 20);

  // Create + submit + award application
  const appId = await createApplication('u1', {
    full_name: 'Test',
    email: 'test@example.com',
    phone: '+84901234567',
    program_code: 'NAO',
    program_id: 'nao',
  });
  await updateApplication(appId, 'u1', {
    wish_text: 'Learn',
    circumstances_text: 'Need',
    consents_to_data_processing: true,
    consents_to_audit: true,
    commits_to_attendance: true,
    commits_to_graduation: true,
  });
  await submitApplication(appId, 'u1');
  await awardScholarship(appId, 'council1', 'NAO');

  // Grant entitlement
  const entId = await grantEntitlement(appId, cohortId, 'admin1', ['nao-module-1', 'nao-module-2']);
  assert(typeof entId === 'string', 'entitlement granted');

  const app = await getApplication(appId, 'u1');
  assert(app?.status === 'enrolled', 'status is enrolled');

  // Get user entitlements
  const userEnts = await getUserEntitlements('u1');
  assert(userEnts.length === 1, '1 entitlement for user');
  assert(userEnts[0]?.status === 'active', 'entitlement active');

  // Add learning path
  await addLearningPath(entId, 'nao-module-3', 'admin1');
  const ent = await getEntitlementByApplication(appId);
  assert(ent?.learning_paths.length === 3, '3 learning paths');

  // Suspend
  await suspendEntitlement(entId, 'admin1', 'Violation');
  const suspended = await getEntitlementByApplication(appId);
  assert(suspended?.status === 'suspended', 'entitlement suspended');

  // Restore
  await restoreEntitlement(entId, 'admin1', 'Resolved');
  const restored = await getEntitlementByApplication(appId);
  assert(restored?.status === 'active', 'entitlement restored');

  // Complete
  await completeEntitlement(entId, 'admin1');
  const completed = await getEntitlementByApplication(appId);
  assert(completed?.status === 'completed', 'entitlement completed');

  // Check events
  const events = await getEntitlementEvents(entId);
  assert(events.length >= 5, 'at least 5 entitlement events');
}

async function testCohorts() {
  console.log('Test: Sprint 6 cohorts');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);

  const id1 = await createCohort('Cohort A', 'NAO', '2026-01-01', '2026-06-30', 15);
  const id2 = await createCohort('Cohort B', 'NAO', '2026-07-01', '2026-12-31', 20);
  assert(typeof id1 === 'string' && typeof id2 === 'string', 'cohorts created');

  const all = await listCohorts();
  assert(all.length === 2, '2 cohorts');

  const naoCohorts = await listCohorts({ program_code: 'NAO' });
  assert(naoCohorts.length === 2, '2 NAO cohorts');

  assert(ENTITLEMENT_LIFECYCLE.defaultDurationDays === 365, 'default 365 days');
  assert(ENTITLEMENT_LIFECYCLE.transitions.active.includes('suspended'), 'active -> suspended allowed');
}

// ============================================================
// P1-3: Data export (GDPR/PDPD right to portability)
// ============================================================
async function testDataExport() {
  console.log('Test: data export (GDPR/PDPD)');
  setScholarshipStore(new InMemoryScholarshipStore());
  setAuditStore(new InMemoryAuditStore());

  const userId = 'user-export-test';
  const appId = await createApplication(userId, {
    full_name: 'Export Test',
    email: 'export@test.local',
    phone: '+84999999999',
    program_code: 'nguyen-ai-computer',
    program_id: 'prog-test',
  });
  // Fill required fields before submit
  await updateApplication(appId, userId, {
    wish_text: 'I want to learn AI',
    circumstances_text: 'Need support',
    consents_to_data_processing: true,
    consents_to_audit: true,
    commits_to_attendance: true,
    commits_to_graduation: true,
  });
  await submitApplication(appId, userId);
  await createWish(appId, userId, 'I want to learn AI', 'private');
  await createNotification(userId, 'Test', 'Test title', 'Test body');

  const bundle = await exportUserData(userId);
  assert(bundle.user_id === userId, 'export: user_id matches');
  assert(bundle.schema_version === '1.0.0', 'export: schema_version 1.0.0');
  assert(bundle.applications.length === 1, 'export: 1 application');
  assert(bundle.applications[0]!.application_id === appId, 'export: correct application_id');
  assert(bundle.wishes.length === 1, 'export: 1 wish');
  assert(bundle.notifications.length === 1, 'export: 1 notification');
  assert(bundle.investor_profile === null, 'export: no investor profile');
  assert(bundle.exported_at.length > 0, 'export: has timestamp');

  // Verify audit event was logged
  const logs = await queryAuditLog({ user_id: userId });
  const exportEvent = logs.find((e) => e.event_type === 'scholarship_data_exported');
  assert(!!exportEvent, 'export: audit event scholarship_data_exported logged');

  // Verify empty user returns empty bundle (not error)
  const emptyBundle = await exportUserData('nonexistent-user');
  assert(emptyBundle.applications.length === 0, 'export: empty user has 0 applications');
  assert(emptyBundle.user_id === 'nonexistent-user', 'export: empty user_id preserved');

  console.log('  OK');
}

// ============================================================
// P1-4: Retention automation
// ============================================================
async function testRetentionSweep() {
  console.log('Test: retention sweep');
  const store = new InMemoryScholarshipStore();
  setScholarshipStore(store);
  setAuditStore(new InMemoryAuditStore());

  // Create an application in 'rejected' status with old timestamp
  const oldAppId = await createApplication('user-old', {
    full_name: 'Old Rejected',
    email: 'old@test.local',
    phone: '+84999999998',
    program_code: 'nguyen-ai-computer',
    program_id: 'prog-test',
  });
  // Force status to rejected + old updated_at via store directly
  await store.updateApplication(oldAppId, { status: 'rejected' });
  // Use a future before_date so the just-created record qualifies
  // (record updated_at = now; before_date = now+1s ensures < comparison passes)
  const futureDate = new Date(Date.now() + 100000).toISOString();

  // Dry run — should report but not delete
  const dryRun = await runRetentionSweep({
    before_date: futureDate,
    dry_run: true,
  });
  assert(dryRun.dry_run === true, 'retention: dry_run flag preserved');
  assert(dryRun.total_deleted >= 1, 'retention: dry run reports >=1 to delete');
  const stillExists = await getApplication(oldAppId, 'user-old');
  assert(stillExists !== null, 'retention: dry run does NOT delete');

  // Real run — should delete
  const realRun = await runRetentionSweep({
    before_date: futureDate,
    dry_run: false,
  });
  assert(realRun.dry_run === false, 'retention: real run dry_run=false');
  assert(realRun.total_deleted >= 1, 'retention: real run deletes >=1');
  assert((realRun.deleted['applications'] ?? 0) >= 1, 'retention: applications deleted count');
  const deleted = await getApplication(oldAppId, 'user-old');
  assert(deleted === null, 'retention: application actually deleted');

  // Verify audit event was logged
  const logs = await queryAuditLog({});
  const sweepEvent = logs.find((e) => e.event_type === 'scholarship_retention_sweep');
  assert(!!sweepEvent, 'retention: audit event scholarship_retention_sweep logged');

  // Test anonymization for awarded applications
  const awardedAppId = await createApplication('user-awarded', {
    full_name: 'Awarded User',
    email: 'awarded@test.local',
    phone: '+84999999997',
    program_code: 'nguyen-ai-computer',
    program_id: 'prog-test',
  });
  await store.updateApplication(awardedAppId, { status: 'awarded' });
  const anonymizeRun = await runRetentionSweep({
    before_date: futureDate,
    dry_run: false,
  });
  assert((anonymizeRun.anonymized['applications'] ?? 0) >= 1, 'retention: awarded app anonymized');
  const anonymized = await getApplication(awardedAppId, 'user-awarded');
  assert(anonymized !== null, 'retention: awarded app NOT deleted (anonymized)');
  assert(anonymized?.full_name === '[ANONYMIZED]', 'retention: PII scrubbed to [ANONYMIZED]');
  assert(anonymized?.email === '[anonymized]@deleted.local', 'retention: email scrubbed');

  console.log('  OK');
}

async function main() {
  console.log('=== @nai/scholarship unit tests ===\n');
  await testEntitiesAndConstants();
  await testApplicationFlow();
  await testIDORProtection();
  await testVerificationFlow();
  await testWishFlow();
  await testReviewAndVoting();
  await testScoring();
  await testSponsorship();
  await testForumModeration();
  await testNotifications();
  await testAppeal();
  await testMessages();
  await testDocuments();
  await testTimelineAndStatusTransition();
  await testInvestorRoom();
  await testAwardAndDecline();
  await testForumComments();
  await testReportAndModeration();
  await testCouncilDecision();
  await testWaitlist();
  await testEntitlementLifecycle();
  await testCohorts();
  await testDataExport();
  await testRetentionSweep();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
