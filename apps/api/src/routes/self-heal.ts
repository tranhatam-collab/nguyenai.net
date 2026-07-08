/**
 * @nai/api — Self-healing routes.
 *
 * Per AI_AGENT_SELF_HEALING_APPROVAL_POLICY_2026-07-07.md:
 * - Detect issues
 * - Diagnose and propose patches
 * - Run tests
 * - Request preview/production approval
 * - Deploy and verify
 * - Complete or fail self-heal attempts
 */

import { Hono } from 'hono';
import type { Context } from 'hono';

import {
  detectIssue,
  diagnoseIssue,
  proposePatch,
  runTests,
  requestPreviewApproval,
  deployPreview,
  verifyPreview,
  requestProductionApproval,
  deployProduction,
  completeSelfHeal,
  failSelfHeal,
  denySelfHeal,
  getSelfHealStore,
  canMutateData,
} from '@nai/self-heal';

const selfHealRoutes = new Hono();

// ============================================================
// Helper: require admin role
// ============================================================

function requireAdmin(c: Context) {
  const session = c.get('session') as { role?: string } | undefined;
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN') {
    return c.json({ error: 'Forbidden: admin only' }, 403);
  }
  return null;
}

function getSessionUserId(c: Context): string {
  const session = c.get('session') as { user_id?: string } | undefined;
  return session?.user_id ?? 'system';
}

// ============================================================
// POST /v1/self-heal/detect — detect issue
// ============================================================

selfHealRoutes.post('/v1/self-heal/detect', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const body = await c.req.json();
  const { component, issue_description, incident_id } = body;

  if (!component || !issue_description) {
    return c.json({ error: 'Missing required fields: component, issue_description' }, 400);
  }

  const attemptId = await detectIssue(
    component,
    issue_description,
    getSessionUserId(c),
    incident_id
  );

  return c.json({ attempt_id: attemptId }, 201);
});

// ============================================================
// POST /v1/self-heal/:id/diagnose — diagnose issue
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/diagnose', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { diagnosis } = body;

  if (!diagnosis) {
    return c.json({ error: 'Missing required field: diagnosis' }, 400);
  }

  await diagnoseIssue(id, diagnosis);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/self-heal/:id/propose — propose patch
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/propose', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { proposed_patch, patch_code } = body;

  if (!proposed_patch || !patch_code) {
    return c.json({ error: 'Missing required fields: proposed_patch, patch_code' }, 400);
  }

  await proposePatch(id, proposed_patch, patch_code);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/self-heal/:id/test — run tests
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/test', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { test_results } = body;

  if (!test_results) {
    return c.json({ error: 'Missing required field: test_results' }, 400);
  }

  await runTests(id, test_results);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/self-heal/:id/request-preview-approval — request preview approval
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/request-preview-approval', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const approvalId = await requestPreviewApproval(id, getSessionUserId(c));

  return c.json({ approval_id: approvalId });
});

// ============================================================
// POST /v1/self-heal/:id/deploy-preview — deploy preview
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/deploy-preview', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { deployment_id } = body;

  if (!deployment_id) {
    return c.json({ error: 'Missing required field: deployment_id' }, 400);
  }

  await deployPreview(id, deployment_id);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/self-heal/:id/verify-preview — verify preview
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/verify-preview', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { verification_results } = body;

  if (!verification_results) {
    return c.json({ error: 'Missing required field: verification_results' }, 400);
  }

  await verifyPreview(id, verification_results);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/self-heal/:id/request-production-approval — request production approval
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/request-production-approval', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const approvalId = await requestProductionApproval(id, getSessionUserId(c));

  return c.json({ approval_id: approvalId });
});

// ============================================================
// POST /v1/self-heal/:id/deploy-production — deploy production
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/deploy-production', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { deployment_id } = body;

  if (!deployment_id) {
    return c.json({ error: 'Missing required field: deployment_id' }, 400);
  }

  await deployProduction(id, deployment_id);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/self-heal/:id/complete — complete self-heal
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/complete', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { verification_results } = body;

  if (!verification_results) {
    return c.json({ error: 'Missing required field: verification_results' }, 400);
  }

  await completeSelfHeal(id, verification_results);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/self-heal/:id/fail — fail self-heal
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/fail', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { error } = body;

  if (!error) {
    return c.json({ error: 'Missing required field: error' }, 400);
  }

  await failSelfHeal(id, error);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/self-heal/:id/deny — deny self-heal
// ============================================================

selfHealRoutes.post('/v1/self-heal/:id/deny', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  await denySelfHeal(id);

  return c.json({ success: true });
});

// ============================================================
// GET /v1/self-heal/:id — get self-heal attempt details
// ============================================================

selfHealRoutes.get('/v1/self-heal/:id', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const store = getSelfHealStore();
  const attempt = await store.getAttempt(id);

  if (!attempt) {
    return c.json({ error: 'Self-heal attempt not found' }, 404);
  }

  return c.json({ attempt });
});

// ============================================================
// GET /v1/self-heal — list self-heal attempts
// ============================================================

selfHealRoutes.get('/v1/self-heal', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const { status, component } = c.req.query();
  const store = getSelfHealStore();
  const attempts = await store.listAttempts({
    status: status as any,
    component,
  });

  return c.json({ attempts });
});

// ============================================================
// POST /v1/self-heal/check-mutation — check if data mutation is allowed
// ============================================================

selfHealRoutes.post('/v1/self-heal/check-mutation', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const body = await c.req.json();
  const check = canMutateData(body);

  return c.json(check);
});

export default selfHealRoutes;
