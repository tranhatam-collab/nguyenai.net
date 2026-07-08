/**
 * @nai/api — Fallback routes.
 *
 * Per FALLBACK_TO_GEN1_GEN2_POLICY.md:
 * - Request fallback to Gen 1/Gen 2
 * - Approve/deny fallback requests
 * - Execute fallback
 * - List pending fallbacks
 */

import { Hono } from 'hono';
import type { Context } from 'hono';

import {
  requestFallback,
  approveFallback,
  denyFallback,
  executeFallback,
  failFallback,
  listPendingFallbacks,
  getFallbackStore,
  setFallbackEnabled,
  isFallbackEnabled,
  isSensitiveData,
  requiresFallbackApproval,
  type FallbackSeverity,
  type FallbackTarget,
} from '@nai/fallback';

const fallbackRoutes = new Hono();

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
// POST /v1/fallback/request — request fallback
// ============================================================

fallbackRoutes.post('/v1/fallback/request', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const body = await c.req.json();
  const { severity, target, reason, component, data_classification, purpose, retention_period } = body;

  if (!severity || !target || !reason || !component || !data_classification || !purpose) {
    return c.json({ error: 'Missing required fields: severity, target, reason, component, data_classification, purpose' }, 400);
  }

  const validSeverities: FallbackSeverity[] = ['F1', 'F2', 'F3', 'F4', 'F5'];
  if (!validSeverities.includes(severity)) {
    return c.json({ error: 'Invalid severity. Must be F1-F5' }, 400);
  }

  const validTargets: FallbackTarget[] = ['gen1', 'gen2'];
  if (!validTargets.includes(target)) {
    return c.json({ error: 'Invalid target. Must be gen1 or gen2' }, 400);
  }

  // Check if fallback is enabled
  if (!isFallbackEnabled()) {
    return c.json({ error: 'Fallback is not enabled' }, 400);
  }

  // Check if sensitive data requires additional info
  if (isSensitiveData(data_classification) && !retention_period) {
    return c.json({ error: 'retention_period is required for sensitive data' }, 400);
  }

  const requestId = await requestFallback(
    severity,
    target,
    reason,
    component,
    data_classification,
    purpose,
    retention_period ?? null,
    getSessionUserId(c)
  );

  return c.json({ request_id: requestId }, 201);
});

// ============================================================
// POST /v1/fallback/:id/approve — approve fallback
// ============================================================

fallbackRoutes.post('/v1/fallback/:id/approve', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  await approveFallback(id, getSessionUserId(c));

  return c.json({ success: true });
});

// ============================================================
// POST /v1/fallback/:id/deny — deny fallback
// ============================================================

fallbackRoutes.post('/v1/fallback/:id/deny', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  await denyFallback(id, getSessionUserId(c));

  return c.json({ success: true });
});

// ============================================================
// POST /v1/fallback/:id/execute — execute fallback
// ============================================================

fallbackRoutes.post('/v1/fallback/:id/execute', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  await executeFallback(id);

  return c.json({ success: true });
});

// ============================================================
// POST /v1/fallback/:id/fail — fail fallback
// ============================================================

fallbackRoutes.post('/v1/fallback/:id/fail', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const body = await c.req.json();
  const { error } = body;

  if (!error) {
    return c.json({ error: 'Missing required field: error' }, 400);
  }

  await failFallback(id, error);

  return c.json({ success: true });
});

// ============================================================
// GET /v1/fallback/pending — list pending fallbacks
// ============================================================

fallbackRoutes.get('/v1/fallback/pending', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const pending = await listPendingFallbacks();

  return c.json({ fallbacks: pending });
});

// ============================================================
// GET /v1/fallback/:id — get fallback request details
// ============================================================

fallbackRoutes.get('/v1/fallback/:id', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const store = getFallbackStore();
  const request = await store.getRequest(id);

  if (!request) {
    return c.json({ error: 'Fallback request not found' }, 404);
  }

  return c.json({ request });
});

// ============================================================
// POST /v1/fallback/enable — enable fallback
// ============================================================

fallbackRoutes.post('/v1/fallback/enable', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  setFallbackEnabled(true);

  return c.json({ success: true, enabled: true });
});

// ============================================================
// POST /v1/fallback/disable — disable fallback
// ============================================================

fallbackRoutes.post('/v1/fallback/disable', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  setFallbackEnabled(false);

  return c.json({ success: true, enabled: false });
});

// ============================================================
// GET /v1/fallback/status — get fallback status
// ============================================================

fallbackRoutes.get('/v1/fallback/status', async (c) => {
  const authError = requireAdmin(c);
  if (authError) return authError;

  return c.json({ enabled: isFallbackEnabled() });
});

export default fallbackRoutes;
