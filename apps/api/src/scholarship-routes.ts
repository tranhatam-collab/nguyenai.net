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
import { defaultRateLimit, formSubmitRateLimit, cleanupBuckets } from './rate-limiter';
import { EmailService } from '@nai/email';
import { logAuditEvent } from '@nai/audit';
import {
  getApiSession,
  requireAuthSession,
  sessionHasScholarshipRole,
  type ApiSession,
} from './session-auth';
import {
  InMemoryScholarshipStore,
  D1ScholarshipStore,
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
  setRequestContext,
  clearRequestContext,
  setEmailService,
  getEmailService,
  exportUserData,
  runRetentionSweep,
} from '@nai/scholarship';

export interface ScholarshipEnv {
  Bindings: {
    DB?: D1Database;
    /** Primary — mail.iai.one (Founder directive: sole email provider) */
    MAIL_IAI_ONE_API_KEY?: string;
    /** @deprecated */
    RESEND_API_KEY?: string;
  };
  Variables: {
    session: { user_id: string; role: string } | null;
  };
}

let scholarshipStoreInitialized = false;

function initScholarshipStore(env: ScholarshipEnv['Bindings']): void {
  if (scholarshipStoreInitialized) return;
  if (env.DB) {
    setScholarshipStore(new D1ScholarshipStore(env.DB as never));
  } else {
    setScholarshipStore(new InMemoryScholarshipStore());
  }
  // Initialize email service (mock in dev; mail.iai.one primary, Resend temporary fallback)
  if (!getEmailService()) {
    const mailKey = env.MAIL_IAI_ONE_API_KEY;
    const resendKey = env.RESEND_API_KEY;
    const apiKey = mailKey ?? resendKey;
    setEmailService(new EmailService({
      apiKey,
      from: { email: 'scholarship@nguyenai.net', name: 'Nguyen AI Scholarship' },
      replyTo: { email: 'hello@nguyenai.net', name: 'Nguyen AI' },
      provider: mailKey ? 'mail_iai_one' : 'resend',
      mock: !apiKey,
    }) as unknown as Parameters<typeof setEmailService>[0]);
  }
  scholarshipStoreInitialized = true;
}

function requireAuth(c: { req: { header: (n: string) => string | undefined }; get: (k: string) => unknown }): ApiSession | null {
  const session = getApiSession(c as any);
  return session;
}

export const scholarshipRoutes = new Hono<ScholarshipEnv>();

// Middleware: set request context (IP + User-Agent) for audit logging
scholarshipRoutes.use('*', async (c, next) => {
  cleanupBuckets();
  setRequestContext({});
  await next();
  clearRequestContext();
});

// Default rate limit: 60 req/min per IP
scholarshipRoutes.use('*', defaultRateLimit);

// Audit middleware — logs every write operation (POST/PATCH/DELETE/PUT)
// Per ENTITLEMENT_API_RFC §6: every write operation MUST log to audit_log
// Per INVESTOR_ACCESS_POLICY §8: every private room event must be audited
scholarshipRoutes.use('*', async (c, next) => {
  const method = c.req.method.toUpperCase();
  // Only audit write operations
  if (!['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
    await next();
    return;
  }
  await next();
  // Log after handler completes — captures success/failure
  const session = (c as any).get('session') as { user_id?: string; tenant_id?: string; session_id?: string } | null;
  const status = c.res.status;
  // Build event type from method + path
  const path = c.req.path.replace('/v1/scholarship/', '').replace(/\//g, '_');
  const eventType = `scholarship_${method.toLowerCase()}_${path}`.substring(0, 80) as any;
  try {
    await logAuditEvent({
      user_id: session?.user_id ?? 'anonymous',
      tenant_id: session?.tenant_id ?? '',
      session_id: session?.session_id ?? null,
      event_type: eventType,
      actor_ip: c.req.header('CF-Connecting-IP') ?? c.req.header('cf-connecting-ip') ?? null,
      user_agent: c.req.header('User-Agent') ?? c.req.header('user-agent') ?? null,
      target: c.req.path,
      result: status >= 200 && status < 400 ? 'success' : 'failure',
      metadata: { method, path: c.req.path, status },
    });
  } catch {
    // Audit failure should not block response
  }
});

// ============================================================
// 1-4. Application endpoints
// ============================================================

// 1. POST /applications
scholarshipRoutes.post('/applications', formSubmitRateLimit, async (c) => {
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
scholarshipRoutes.post('/applications/:id/submit', formSubmitRateLimit, async (c) => {
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
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
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
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
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
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
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
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
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
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
    return c.json({ error: 'Admin/council access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.status) return c.json({ error: 'status required' }, 400);
  try {
    await transitionApplicationStatus(
      c.req.param('id'),
      session.user_id,
      session.roles[0] ?? 'USER',
      body.status as ApplicationStatus,
      body.reason,
    );
    return c.json({ ok: true, status: body.status });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// Sprint 3 — Investor Room: verification, access grant, feed, review+scores
// ============================================================

import {
  createInvestorProfile,
  verifyInvestor,
  grantInvestorAccess,
  revokeInvestorAccess,
  checkInvestorAccess,
  getInvestorApplicationFeed,
  submitReviewWithScores,
  awardScholarship,
  declineScholarship,
} from '@nai/scholarship';

// 28. POST /investor/profile — create investor profile
scholarshipRoutes.post('/investor/profile', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  if (!body.display_name || !body.roles) return c.json({ error: 'display_name and roles required' }, 400);
  try {
    const id = await createInvestorProfile(session.user_id, body.display_name, body.roles as InvestorRole[], body.bio);
    return c.json({ investor_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 29. POST /investor/:id/verify — admin verifies investor
scholarshipRoutes.post('/investor/:id/verify', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  try {
    await verifyInvestor(c.req.param('id'), session.user_id);
    return c.json({ ok: true, verified: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 30. POST /investor/:id/access — grant access
scholarshipRoutes.post('/investor/:id/access', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.scope) return c.json({ error: 'scope required' }, 400);
  try {
    const id = await grantInvestorAccess(
      c.req.param('id'),
      body.scope,
      session.user_id,
      body.duration_days ?? 90,
      body.application_id,
    );
    return c.json({ grant_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 31. DELETE /investor/access/:id — revoke access
scholarshipRoutes.delete('/investor/access/:id', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json().catch(() => ({}));
  try {
    await revokeInvestorAccess(c.req.param('id'), session.user_id, body.reason);
    return c.json({ ok: true, revoked: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 32. GET /investor/feed — application feed for investor
scholarshipRoutes.get('/investor/feed', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const allowedRoles = ['investor', 'council_member', 'council_observer', 'auditor', 'founder_liaison', 'super_admin'];
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
    return c.json({ error: 'Investor access required' }, 403);
  }
  try {
    const apps = await getInvestorApplicationFeed(session.user_id);
    return c.json({ applications: apps, count: apps.length });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 33. POST /investor/reviews/submit — submit review with scores
scholarshipRoutes.post('/investor/reviews/submit', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const allowedRoles = ['investor', 'council_member', 'council_observer', 'auditor', 'founder_liaison', 'super_admin'];
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
    return c.json({ error: 'Investor access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.application_id || !body.scores || !Array.isArray(body.scores)) {
    return c.json({ error: 'application_id and scores[] required' }, 400);
  }
  try {
    const result = await submitReviewWithScores(
      body.application_id,
      session.user_id,
      body.reviewer_role ?? 'reviewer',
      body.scores,
    );
    return c.json(result, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 34. POST /council/award — council awards scholarship
scholarshipRoutes.post('/council/award', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['council_member', 'super_admin'])) {
    return c.json({ error: 'Council member access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.application_id || !body.program_code) {
    return c.json({ error: 'application_id and program_code required' }, 400);
  }
  try {
    await awardScholarship(body.application_id, session.user_id, body.program_code);
    return c.json({ ok: true, status: 'awarded' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 35. POST /applications/:id/decline — applicant declines offer
scholarshipRoutes.post('/applications/:id/decline', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  if (!body.reason) return c.json({ error: 'reason required' }, 400);
  try {
    await declineScholarship(c.req.param('id'), session.user_id, body.reason);
    return c.json({ ok: true, status: 'rejected' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// Sprint 4 — Forum: comments, reports, moderation queue
// ============================================================

import {
  createComment,
  listComments,
  deleteComment,
  reportContent,
  getModerationQueue,
  reviewReport,
  listPublishedPosts,
  type ReportCategory,
} from '@nai/scholarship';

// 36. GET /forum/rooms/:id/posts — list published posts in room
scholarshipRoutes.get('/forum/rooms/:id/posts', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const posts = await listPublishedPosts(c.req.param('id'));
    return c.json({ posts });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 37. GET /forum/posts/:id/comments — list comments on post
scholarshipRoutes.get('/forum/posts/:id/comments', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const comments = await listComments(c.req.param('id'));
    return c.json({ comments });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 38. POST /forum/posts/:id/comments — create comment
scholarshipRoutes.post('/forum/posts/:id/comments', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  if (!body.body) return c.json({ error: 'body required' }, 400);
  try {
    const id = await createComment(c.req.param('id'), session.user_id, body.body, body.parent_comment_id);
    return c.json({ comment_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 39. DELETE /forum/comments/:id — delete own comment
scholarshipRoutes.delete('/forum/comments/:id', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    await deleteComment(c.req.param('id'), session.user_id);
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 40. POST /reports — report a post or comment
scholarshipRoutes.post('/reports', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const body = await c.req.json();
  if (!body.target_type || !body.target_id || !body.reason || !body.category) {
    return c.json({ error: 'target_type, target_id, reason, category required' }, 400);
  }
  try {
    const id = await reportContent(
      body.target_type,
      body.target_id,
      session.user_id,
      body.reason,
      body.category as ReportCategory,
    );
    return c.json({ report_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 41. GET /moderation/queue — moderation queue (moderator/admin only)
scholarshipRoutes.get('/moderation/queue', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const allowedRoles = ['moderator', 'admin', 'super_admin'];
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
    return c.json({ error: 'Moderator access required' }, 403);
  }
  try {
    const queue = await getModerationQueue();
    return c.json({ queue, count: queue.length });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 42. POST /moderation/reports/:id/review — review a report
scholarshipRoutes.post('/moderation/reports/:id/review', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const allowedRoles = ['moderator', 'admin', 'super_admin'];
  if (!sessionHasScholarshipRole(session, allowedRoles)) {
    return c.json({ error: 'Moderator access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.action || !['actioned', 'dismissed'].includes(body.action)) {
    return c.json({ error: 'action must be actioned or dismissed' }, 400);
  }
  try {
    await reviewReport(c.req.param('id'), session.user_id, body.action);
    return c.json({ ok: true, status: body.action });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// Sprint 5 — Decision Engine: council decision, waitlist
// ============================================================

import {
  makeCouncilDecision,
  getCouncilDecision,
  addToWaitlist,
  listWaitlist,
  offerWaitlistSpot,
  withdrawFromWaitlist,
  SCORING_RUBRIC,
  COUNCIL_CONFIG,
} from '@nai/scholarship';

// 43. POST /council/decide — aggregate votes and make decision
scholarshipRoutes.post('/council/decide', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['council_member', 'super_admin'])) {
    return c.json({ error: 'Council member access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.application_id) return c.json({ error: 'application_id required' }, 400);
  try {
    const decision = await makeCouncilDecision(body.application_id, session.user_id);
    return c.json(decision);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 44. GET /council/decision/:id — get council decision for application
scholarshipRoutes.get('/council/decision/:id', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const decision = await getCouncilDecision(c.req.param('id'));
    if (!decision) return c.json({ error: 'No decision found' }, 404);
    return c.json(decision);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 45. GET /council/rubric — get scoring rubric
scholarshipRoutes.get('/council/rubric', (c) => {
  return c.json({ rubric: SCORING_RUBRIC, council: COUNCIL_CONFIG });
});

// 46. GET /waitlist — list waitlist (admin/council)
scholarshipRoutes.get('/waitlist', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin', 'council_member'])) {
    return c.json({ error: 'Admin/council access required' }, 403);
  }
  const status = c.req.query('status') as 'waiting' | 'offered' | 'expired' | 'withdrawn' | undefined;
  const programCode = c.req.query('program_code');
  try {
    const entries = await listWaitlist({ status, program_code: programCode });
    return c.json({ waitlist: entries, count: entries.length });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 47. POST /waitlist/:id/offer — offer waitlist spot (admin)
scholarshipRoutes.post('/waitlist/:id/offer', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  try {
    await offerWaitlistSpot(c.req.param('id'), session.user_id);
    return c.json({ ok: true, status: 'offered' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 48. POST /waitlist/:id/withdraw — applicant withdraws from waitlist
scholarshipRoutes.post('/waitlist/:id/withdraw', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    await withdrawFromWaitlist(c.req.param('id'), session.user_id);
    return c.json({ ok: true, status: 'withdrawn' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// Sprint 6 — Scholarship Entitlement: grant, suspend, revoke, restore
// ============================================================

import {
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
} from '@nai/scholarship';

// 49. POST /entitlements — grant entitlement (admin)
scholarshipRoutes.post('/entitlements', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.application_id || !body.cohort_id) {
    return c.json({ error: 'application_id and cohort_id required' }, 400);
  }
  try {
    const id = await grantEntitlement(
      body.application_id,
      body.cohort_id,
      session.user_id,
      body.learning_paths ?? [],
      body.ai_computer_instance_id,
      body.duration_days,
    );
    return c.json({ entitlement_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 50. GET /entitlements — get user's entitlements
scholarshipRoutes.get('/entitlements', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const entitlements = await getUserEntitlements(session.user_id);
    return c.json({ entitlements });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 51. GET /entitlements/:id — get entitlement detail
scholarshipRoutes.get('/entitlements/:id', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    // For user, check ownership; for admin, allow all
    const events = await getEntitlementEvents(c.req.param('id'));
    return c.json({ events });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 52. POST /entitlements/:id/suspend — suspend (admin)
scholarshipRoutes.post('/entitlements/:id/suspend', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.reason) return c.json({ error: 'reason required' }, 400);
  try {
    await suspendEntitlement(c.req.param('id'), session.user_id, body.reason);
    return c.json({ ok: true, status: 'suspended' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 53. POST /entitlements/:id/restore — restore (admin)
scholarshipRoutes.post('/entitlements/:id/restore', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json().catch(() => ({}));
  try {
    await restoreEntitlement(c.req.param('id'), session.user_id, body.reason);
    return c.json({ ok: true, status: 'active' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 54. POST /entitlements/:id/revoke — revoke (admin)
scholarshipRoutes.post('/entitlements/:id/revoke', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.reason) return c.json({ error: 'reason required' }, 400);
  try {
    await revokeEntitlement(c.req.param('id'), session.user_id, body.reason);
    return c.json({ ok: true, status: 'revoked' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 55. POST /entitlements/:id/complete — mark completed (admin)
scholarshipRoutes.post('/entitlements/:id/complete', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  try {
    await completeEntitlement(c.req.param('id'), session.user_id);
    return c.json({ ok: true, status: 'completed' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 56. POST /entitlements/:id/learning-paths — add learning path
scholarshipRoutes.post('/entitlements/:id/learning-paths', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.program_id) return c.json({ error: 'program_id required' }, 400);
  try {
    await addLearningPath(c.req.param('id'), body.program_id, session.user_id);
    return c.json({ ok: true });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 57. GET /cohorts — list cohorts
scholarshipRoutes.get('/cohorts', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  const programCode = c.req.query('program_code');
  const status = c.req.query('status') as 'open' | 'in_progress' | 'completed' | 'cancelled' | undefined;
  try {
    const cohorts = await listCohorts({ program_code: programCode, status: status as 'open' | 'in_progress' | 'completed' | undefined });
    return c.json({ cohorts });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// 58. POST /cohorts — create cohort (admin)
scholarshipRoutes.post('/cohorts', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json();
  if (!body.name || !body.program_code || !body.start_date || !body.end_date || !body.capacity) {
    return c.json({ error: 'name, program_code, start_date, end_date, capacity required' }, 400);
  }
  try {
    const id = await createCohort(body.name, body.program_code, body.start_date, body.end_date, body.capacity);
    return c.json({ cohort_id: id }, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

// ============================================================
// 59. GET /me/export — GDPR/PDPD right to data portability
// Returns all user-owned scholarship records as a JSON bundle.
// Per Article 20 (GDPR) + Article 26 (PDPD). Audit-logged.
// ============================================================
scholarshipRoutes.get('/me/export', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const bundle = await exportUserData(session.user_id);
    c.header('Content-Type', 'application/json; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="nguyenai-scholarship-export-${session.user_id}.json"`);
    return c.body(JSON.stringify(bundle, null, 2));
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});

// ============================================================
// 60. POST /admin/retention-sweep — run retention automation (admin)
// Hard-deletes or anonymizes records past retention period per
// DATA_CLASSIFICATION_AND_RETENTION.md §6. Audit-logged.
// Body: { before_date: ISO string, dry_run?: boolean, terminal_statuses?: ApplicationStatus[] }
// ============================================================
scholarshipRoutes.post('/admin/retention-sweep', async (c) => {
  initScholarshipStore(c.env);
  const session = requireAuth(c);
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  if (!sessionHasScholarshipRole(session, ['admin', 'super_admin'])) {
    return c.json({ error: 'Admin access required' }, 403);
  }
  const body = await c.req.json().catch(() => ({}));
  if (!body.before_date) {
    return c.json({ error: 'before_date (ISO string) required' }, 400);
  }
  try {
    const result = await runRetentionSweep({});
    return c.json(result);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 500);
  }
});
