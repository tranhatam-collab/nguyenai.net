/**
 * @nai/api — Admin approval routes.
 *
 * Per AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md:
 * - Request approval for sensitive operations
 * - Approve/deny requests
 * - List pending approvals
 * - Check approval status
 */

import { Hono } from 'hono';
import type { Context } from 'hono';

import {
  requestApproval,
  approveRequest,
  denyRequest,
  revokeApproval,
  checkApprovalStatus,
  listPendingApprovals,
  getApprovalStore,
  validateApprover,
  type ApprovalCategory,
  type ApprovalStage,
} from '@nai/admin-approval';
import type { Role } from '@nai/auth';

const approvalRoutes = new Hono();

// ============================================================
// Helper: require admin role
// ============================================================

function requireAdmin(c: Context) {
  const session = c.get('session') as { user_id: string; role: string } | null;
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden: admin only' }, 403);
  }
  return null;
}

// ============================================================
// POST /v1/admin-approvals — request approval
// ============================================================

approvalRoutes.post('/v1/admin-approvals', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const body = await c.req.json();
  const { category, stage, title, description, metadata, expires_at } = body;

  if (!category || !stage || !title || !description) {
    return c.json({ error: 'Missing required fields: category, stage, title, description' }, 400);
  }

  const validCategories: ApprovalCategory[] = ['self_heal', 'secret_rotation', 'data_mutation', 'deployment', 'other'];
  if (!validCategories.includes(category)) {
    return c.json({ error: 'Invalid category. Must be one of: self_heal, secret_rotation, data_mutation, deployment, other' }, 400);
  }

  const validStages: ApprovalStage[] = ['preview', 'production'];
  if (!validStages.includes(stage)) {
    return c.json({ error: 'Invalid stage. Must be preview or production' }, 400);
  }

  const requestId = await requestApproval(
    category,
    stage,
    title,
    description,
    ((c as Context).get('session') as { user_id: string } | null)?.user_id ?? 'system',
    metadata ?? {},
    expires_at
  );

  return c.json({ request_id: requestId }, 201);
});

// ============================================================
// POST /v1/admin-approvals/:id/approve — approve request
// ============================================================

approvalRoutes.post('/v1/admin-approvals/:id/approve', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const { reason } = await c.req.json();

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    return c.json({ error: 'Reason is required for approval' }, 400);
  }

  const session = (c as Context).get('session') as { user_id: string; role: string } | null;
  const userRoles = session?.role ? [session.role] as Role[] : [];

  await approveRequest(id, session?.user_id ?? 'system', reason.trim(), userRoles);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/admin-approvals/:id/deny — deny request
// ============================================================

approvalRoutes.post('/v1/admin-approvals/:id/deny', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const { reason } = await c.req.json();

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    return c.json({ error: 'Reason is required for denial' }, 400);
  }

  const session = (c as Context).get('session') as { user_id: string; role: string } | null;
  const userRoles = session?.role ? [session.role] as Role[] : [];

  await denyRequest(id, session?.user_id ?? 'system', reason.trim(), userRoles);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/admin-approvals/:id/revoke — revoke approval
// ============================================================

approvalRoutes.post('/v1/admin-approvals/:id/revoke', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const { reason } = await c.req.json();

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    return c.json({ error: 'Reason is required for revocation' }, 400);
  }

  await revokeApproval(id, ((c as Context).get('session') as { user_id: string } | null)?.user_id ?? 'system', reason.trim());

  return c.json({ success: true });
});

// ============================================================
// GET /v1/admin-approvals/:id/status — check approval status
// ============================================================

approvalRoutes.get('/v1/admin-approvals/:id/status', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const status = await checkApprovalStatus(id);

  return c.json({ status });
});

// ============================================================
// GET /v1/admin-approvals — list pending approvals
// ============================================================

approvalRoutes.get('/v1/admin-approvals', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const { category, stage } = c.req.query();
  const approvals = await listPendingApprovals(
    category as ApprovalCategory,
    stage as ApprovalStage
  );

  return c.json({ approvals });
});

// ============================================================
// GET /v1/admin-approvals/:id — get approval details
// ============================================================

approvalRoutes.get('/v1/admin-approvals/:id', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const store = getApprovalStore();
  const request = await store.getRequest(id);

  if (!request) {
    return c.json({ error: 'Approval request not found' }, 404);
  }

  return c.json({ request });
});

export default approvalRoutes;
