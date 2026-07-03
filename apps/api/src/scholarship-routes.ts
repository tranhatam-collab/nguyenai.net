/**
 * Scholarship routes — 21 API endpoints per EDU_MASTER_PLAN_V4 §XXXV
 *
 * Mounted at /v1/scholarship/*
 *
 * Endpoints:
 *  1. POST   /applications
 *  2. GET    /applications/:id
 *  3. PATCH  /applications/:id
 *  4. POST   /applications/:id/submit
 *  5. POST   /verification/email
 *  6. POST   /verification/phone
 *  7. POST   /verification/identity
 *  8. POST   /wishes
 *  9. PATCH  /wishes/:id/visibility
 * 10. POST   /wishes/:id/request-publication
 * 11. GET    /investor/applications
 * 12. GET    /investor/applications/:id
 * 13. POST   /investor/reviews
 * 14. POST   /investor/sponsorships
 * 15. POST   /forum/posts
 * 16. POST   /forum/posts/:id/submit
 * 17. POST   /moderation/posts/:id/approve
 * 18. POST   /moderation/posts/:id/reject
 * 19. POST   /appeals
 * 20. GET    /notifications
 * 21. PATCH  /notifications/:id/read
 */

import { Hono } from 'hono';
import {
  InMemoryScholarshipStore,
  setScholarshipStore,
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
  type ScholarshipApplication,
  type WishVisibility,
  type VerificationType,
  type InvestorRole,
  type ModerationAction,
  type AppealType,
  type SponsorshipType,
} from '@nai/scholarship';

export interface ScholarshipEnv {
  Bindings: {
    DB?: D1Database;
  };
  Variables: {
    session: { user_id: string; role: string } | null;
  };
}

let scholarshipStoreInitialized = false;

function initScholarshipStore(env: ScholarshipEnv['Bindings']): void {
  if (scholarshipStoreInitialized) return;
  setScholarshipStore(new InMemoryScholarshipStore());
  scholarshipStoreInitialized = true;
}

function requireAuth(c: { req: { header: (n: string) => string | undefined }; get: (k: string) => unknown }): { user_id: string; role: string } | null {
  // Session is set by main app middleware
  const session = (c as unknown as { get: (k: string) => unknown }).get('session') as { user_id: string; role: string } | null;
  return session;
}

export const scholarshipRoutes = new Hono<ScholarshipEnv>();

// ============================================================
// 1-4. Application endpoints
// ============================================================

// 1. POST /applications
scholarshipRoutes.post('/applications', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.full_name || !body.email || !body.phone || !body.program_code || !body.program_id) {
    return c.json({ error: 'Missing required fields: full_name, email, phone, program_code, program_id' }, 400);
  }

  try {
    const id = await createApplication(session.user_id, {
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      program_code: body.program_code,
      program_id: body.program_id,
    });
    return c.json({ application_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

// 2. GET /applications/:id
scholarshipRoutes.get('/applications/:id', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const app = await getApplication(c.req.param('id'), session.user_id);
    if (!app) return c.json({ error: 'Application not found' }, 404);
    return c.json(app);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Not authorized')) return c.json({ error: msg }, 403);
    return c.json({ error: msg }, 500);
  }
});

// 3. PATCH /applications/:id
scholarshipRoutes.patch('/applications/:id', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  try {
    await updateApplication(c.req.param('id'), session.user_id, body);
    return c.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Not authorized')) return c.json({ error: msg }, 403);
    if (msg.includes('not found')) return c.json({ error: msg }, 404);
    return c.json({ error: msg }, 400);
  }
});

// 4. POST /applications/:id/submit
scholarshipRoutes.post('/applications/:id/submit', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  try {
    await submitApplication(c.req.param('id'), session.user_id);
    return c.json({ ok: true, status: 'submitted' });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Not authorized')) return c.json({ error: msg }, 403);
    if (msg.includes('not found')) return c.json({ error: msg }, 404);
    return c.json({ error: msg }, 400);
  }
});

// ============================================================
// 5-7. Verification endpoints
// ============================================================

// 5. POST /verification/email
scholarshipRoutes.post('/verification/email', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.application_id) return c.json({ error: 'application_id required' }, 400);

  try {
    const id = await startVerification(body.application_id, session.user_id, 'email');
    return c.json({ verification_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 6. POST /verification/phone
scholarshipRoutes.post('/verification/phone', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.application_id) return c.json({ error: 'application_id required' }, 400);

  try {
    const id = await startVerification(body.application_id, session.user_id, 'phone');
    return c.json({ verification_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 7. POST /verification/identity
scholarshipRoutes.post('/verification/identity', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.application_id) return c.json({ error: 'application_id required' }, 400);

  try {
    const id = await startVerification(body.application_id, session.user_id, 'identity');
    return c.json({ verification_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// 8-10. Wish endpoints
// ============================================================

// 8. POST /wishes
scholarshipRoutes.post('/wishes', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.application_id || !body.text) return c.json({ error: 'application_id and text required' }, 400);

  try {
    const id = await createWish(
      body.application_id,
      session.user_id,
      body.text,
      (body.visibility as WishVisibility) ?? 'private',
    );
    return c.json({ wish_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 9. PATCH /wishes/:id/visibility
scholarshipRoutes.patch('/wishes/:id/visibility', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.visibility) return c.json({ error: 'visibility required' }, 400);

  try {
    await updateWishVisibility(c.req.param('id'), session.user_id, body.visibility as WishVisibility);
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 10. POST /wishes/:id/request-publication
scholarshipRoutes.post('/wishes/:id/request-publication', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  try {
    await requestWishPublication(c.req.param('id'), session.user_id);
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// 11-14. Investor endpoints
// ============================================================

// 11. GET /investor/applications
scholarshipRoutes.get('/investor/applications', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  // Only investors/council can access
  const allowedRoles = ['investor', 'council_member', 'council_observer', 'auditor', 'founder_liaison', 'super_admin'];
  if (!allowedRoles.includes(session.role)) {
    return c.json({ error: 'Investor access required' }, 403);
  }

  // Return all submitted applications (investor view)
  const { getScholarshipStore } = await import('@nai/scholarship');
  const store = getScholarshipStore();
  const apps = await store.listApplications({ status: 'submitted' });
  return c.json({ applications: apps });
});

// 12. GET /investor/applications/:id
scholarshipRoutes.get('/investor/applications/:id', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const allowedRoles = ['investor', 'council_member', 'council_observer', 'auditor', 'founder_liaison', 'super_admin'];
  if (!allowedRoles.includes(session.role)) {
    return c.json({ error: 'Investor access required' }, 403);
  }

  const { getScholarshipStore } = await import('@nai/scholarship');
  const store = getScholarshipStore();
  const app = await store.getApplication(c.req.param('id'));
  if (!app) return c.json({ error: 'Application not found' }, 404);
  return c.json(app);
});

// 13. POST /investor/reviews
scholarshipRoutes.post('/investor/reviews', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.application_id) return c.json({ error: 'application_id required' }, 400);

  const reviewerRole = (body.reviewer_role as InvestorRole) ?? 'reviewer';
  try {
    const id = await createReview(body.application_id, session.user_id, reviewerRole);
    return c.json({ review_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 14. POST /investor/sponsorships
scholarshipRoutes.post('/investor/sponsorships', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.type || body.amount_vnd === undefined) return c.json({ error: 'type and amount_vnd required' }, 400);

  try {
    const id = await createSponsorship(
      session.user_id,
      body.application_id ?? null,
      body.type as SponsorshipType,
      body.amount_vnd,
      body.amount_usd ?? 0,
    );
    return c.json({ sponsorship_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// 15-16. Forum endpoints
// ============================================================

// 15. POST /forum/posts
scholarshipRoutes.post('/forum/posts', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.room_id || !body.title || !body.content) {
    return c.json({ error: 'room_id, title, content required' }, 400);
  }

  try {
    const id = await createForumPost(body.room_id, session.user_id, body.title, body.content);
    return c.json({ post_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 16. POST /forum/posts/:id/submit
scholarshipRoutes.post('/forum/posts/:id/submit', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  try {
    await submitForumPost(c.req.param('id'), session.user_id);
    return c.json({ ok: true, status: 'pending_moderation' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// 17-18. Moderation endpoints
// ============================================================

// 17. POST /moderation/posts/:id/approve
scholarshipRoutes.post('/moderation/posts/:id/approve', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const allowedRoles = ['moderator', 'admin', 'super_admin'];
  if (!allowedRoles.includes(session.role)) {
    return c.json({ error: 'Moderator access required' }, 403);
  }

  const body = await c.req.json();
  try {
    await moderateForumPost(c.req.param('id'), session.user_id, 'approve', body.reason ?? 'approved');
    return c.json({ ok: true, status: 'published' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 18. POST /moderation/posts/:id/reject
scholarshipRoutes.post('/moderation/posts/:id/reject', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const allowedRoles = ['moderator', 'admin', 'super_admin'];
  if (!allowedRoles.includes(session.role)) {
    return c.json({ error: 'Moderator access required' }, 403);
  }

  const body = await c.req.json();
  if (!body.reason) return c.json({ error: 'reason required' }, 400);

  try {
    await moderateForumPost(c.req.param('id'), session.user_id, 'reject', body.reason);
    return c.json({ ok: true, status: 'rejected' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// 19. Appeals
// ============================================================

// 19. POST /appeals
scholarshipRoutes.post('/appeals', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();
  if (!body.application_id || !body.type || !body.reason) {
    return c.json({ error: 'application_id, type, reason required' }, 400);
  }

  try {
    const id = await createAppeal(
      body.application_id,
      session.user_id,
      body.type as AppealType,
      body.reason,
    );
    return c.json({ appeal_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// 20-21. Notifications
// ============================================================

// 20. GET /notifications
scholarshipRoutes.get('/notifications', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  const notes = await listNotifications(session.user_id);
  return c.json({ notifications: notes });
});

// 21. PATCH /notifications/:id/read
scholarshipRoutes.patch('/notifications/:id/read', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);

  try {
    await markNotificationRead(c.req.param('id'), session.user_id);
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// Sprint 2 — Scholarship Room: messages, documents, timeline
// ============================================================

import {
  sendMessage,
  listMessages,
  uploadDocument,
  listDocuments,
  reviewDocument,
  getApplicationTimeline,
  transitionApplicationStatus,
  type DocumentType,
  type ApplicationStatus,
} from '@nai/scholarship';

// 22. GET /applications/:id/messages
scholarshipRoutes.get('/applications/:id/messages', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const msgs = await listMessages(c.req.param('id'), session.user_id);
    return c.json({ messages: msgs });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Not authorized')) return c.json({ error: msg }, 403);
    return c.json({ error: msg }, 400);
  }
});

// 23. POST /applications/:id/messages
scholarshipRoutes.post('/applications/:id/messages', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  if (!body.subject || !body.body) return c.json({ error: 'subject and body required' }, 400);
  try {
    const id = await sendMessage(
      c.req.param('id'),
      session.user_id,
      'applicant',
      null,
      body.subject,
      body.body,
    );
    return c.json({ message_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 24. GET /applications/:id/documents
scholarshipRoutes.get('/applications/:id/documents', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const docs = await listDocuments(c.req.param('id'), session.user_id);
    return c.json({ documents: docs });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Not authorized')) return c.json({ error: msg }, 403);
    return c.json({ error: msg }, 400);
  }
});

// 25. POST /applications/:id/documents
scholarshipRoutes.post('/applications/:id/documents', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  if (!body.type || !body.filename || !body.storage_key) {
    return c.json({ error: 'type, filename, storage_key required' }, 400);
  }
  try {
    const id = await uploadDocument(
      c.req.param('id'),
      session.user_id,
      body.type as DocumentType,
      body.filename,
      body.storage_key,
      body.mime_type ?? 'application/octet-stream',
      body.size_bytes ?? 0,
    );
    return c.json({ document_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 26. GET /applications/:id/timeline
scholarshipRoutes.get('/applications/:id/timeline', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const timeline = await getApplicationTimeline(c.req.param('id'), session.user_id);
    return c.json({ timeline });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Not authorized')) return c.json({ error: msg }, 403);
    return c.json({ error: msg }, 400);
  }
});

// 27. POST /applications/:id/status — admin/council only
scholarshipRoutes.post('/applications/:id/status', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const allowedRoles = ['admin', 'super_admin', 'council_member', 'moderator'];
  if (!allowedRoles.includes(session.role)) {
    return c.json({ error: 'Admin/council access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.status) return c.json({ error: 'status required' }, 400);
  try {
    await transitionApplicationStatus(
      c.req.param('id'),
      session.user_id,
      session.role,
      body.status as ApplicationStatus,
      body.reason,
    );
    return c.json({ ok: true, status: body.status });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});
