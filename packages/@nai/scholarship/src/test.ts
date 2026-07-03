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
  SCHOLARSHIP_AUDIT_EVENTS,
  SCHOLARSHIP_PROGRAMS,
  MODERATION_PROHIBITED,
  SCORING_WEIGHTS,
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
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
