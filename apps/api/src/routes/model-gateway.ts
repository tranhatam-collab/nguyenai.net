/**
 * @nai/api — Model gateway routes.
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md:
 * - Invoke model through gateway
 * - Get invocation receipts
 * - List user invocations
 */

import { Hono } from 'hono';
import type { Context } from 'hono';

import {
  invokeModel,
  getInvocationReceipt,
  listUserInvocations,
  setModelGatewayStore,
  D1ModelGatewayStore,
  type ModelProvider,
} from '@nai/model-gateway';

const modelGatewayRoutes = new Hono();

// P0-AI: Initialize D1-backed model gateway store when DB is available
let modelGatewayStoreInitialized = false;
function initModelGatewayStore(env: { DB?: D1Database; MODEL_GATEWAY_SIGNING_KEY?: string }) {
  if (modelGatewayStoreInitialized || !env.DB) return;
  setModelGatewayStore(new D1ModelGatewayStore(env.DB, env.MODEL_GATEWAY_SIGNING_KEY));
  modelGatewayStoreInitialized = true;
}

// ============================================================
// Helper: require authenticated user
// ============================================================

function requireAuth(c: Context) {
  const session = c.get('session') as { user_id: string; tenant_id: string; session_id: string } | null;
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return null;
}

// ============================================================
// POST /v1/model-gateway/invoke — invoke model
// ============================================================

modelGatewayRoutes.post('/v1/model-gateway/invoke', async (c) => {
  initModelGatewayStore(c.env as unknown as { DB?: D1Database; MODEL_GATEWAY_SIGNING_KEY?: string });
  const authError = requireAuth(c);
  if (authError) return authError;

  const session = (c as Context).get('session') as { user_id: string; tenant_id: string; session_id: string };
  const body = await c.req.json();
  const { provider, model, prompt_tokens, completion_tokens, cost_usd, data_classification } = body;

  if (!provider || !model || typeof prompt_tokens !== 'number' || typeof completion_tokens !== 'number') {
    return c.json({ error: 'Missing required fields: provider, model, prompt_tokens, completion_tokens' }, 400);
  }

  const result = await invokeModel(
    session.user_id,
    session.tenant_id,
    session.session_id,
    provider as ModelProvider,
    model,
    prompt_tokens,
    completion_tokens,
    cost_usd ?? 0,
    data_classification ?? 'public'
  );

  return c.json({ invocation_id: result.invocationId, receipt_id: result.receiptId }, 201);
});

// ============================================================
// GET /v1/model-gateway/invocations/:id/receipt — get invocation receipt
// ============================================================

modelGatewayRoutes.get('/v1/model-gateway/invocations/:id/receipt', async (c) => {
  const authError = requireAuth(c);
  if (authError) return authError;

  const id = c.req.param('id');
  const receipt = await getInvocationReceipt(id);

  if (!receipt) {
    return c.json({ error: 'Receipt not found' }, 404);
  }

  return c.json({ receipt });
});

// ============================================================
// GET /v1/model-gateway/invocations — list user invocations
// ============================================================

modelGatewayRoutes.get('/v1/model-gateway/invocations', async (c) => {
  const authError = requireAuth(c);
  if (authError) return authError;

  const session = (c as Context).get('session') as { user_id: string; tenant_id: string };
  const invocations = await listUserInvocations(session.user_id, session.tenant_id);

  return c.json({ invocations });
});

export default modelGatewayRoutes;
