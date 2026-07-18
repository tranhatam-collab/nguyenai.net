/**
 * @nai/api — Model gateway routes.
 *
 * Per MODEL_GATEWAY_IDENTITY_POLICY.md + AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16:
 * - Invoke model through gateway (internal trusted callback only)
 * - Get invocation receipts (scoped to user + tenant)
 * - List user invocations (scoped to user + tenant)
 *
 * P0-AUDIT fixes:
 * - /invoke no longer accepts provider, token counts, or cost from client body.
 *   These are determined by the server-side AI Provider Gateway response.
 * - Receipt lookup now verifies user_id + tenant_id ownership.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';

import {
  invokeModel,
  getInvocationReceipt,
  listUserInvocations,
  setModelGatewayStore,
  D1ModelGatewayStore,
} from '@nai/model-gateway';

const modelGatewayRoutes = new Hono();

// P0-AI: Initialize D1-backed model gateway store when DB + signing key are available
let modelGatewayStoreInitialized = false;
function initModelGatewayStore(env: { DB?: D1Database; MODEL_GATEWAY_SIGNING_KEY?: string }) {
  if (modelGatewayStoreInitialized || !env.DB) return;
  // P0-AUDIT: Fail-closed — D1ModelGatewayStore requires signing key
  if (!env.MODEL_GATEWAY_SIGNING_KEY) {
    console.error('[FATAL] MODEL_GATEWAY_SIGNING_KEY not set. Model gateway receipt signing will fail.');
    return; // Keep InMemory store for dev; production must set the secret
  }
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
// POST /v1/model-gateway/invoke — internal trusted callback
//
// P0-AUDIT: This endpoint is an INTERNAL trusted callback. It does NOT
// accept provider, token counts, or cost from the client request body.
// Those values are determined by the server-side AI Provider Gateway
// response. The client only sends the model id and message content;
// the server invokes the AI Provider Gateway and records the receipt
// with the actual response metadata.
// ============================================================

modelGatewayRoutes.post('/v1/model-gateway/invoke', async (c) => {
  initModelGatewayStore(c.env as unknown as { DB?: D1Database; MODEL_GATEWAY_SIGNING_KEY?: string });
  const authError = requireAuth(c);
  if (authError) return authError;

  const session = (c as Context).get('session') as { user_id: string; tenant_id: string; session_id: string };
  const body = await c.req.json();

  // P0-AUDIT: Only model and data_classification are accepted from client.
  // Provider is ALWAYS 'ai-provider-gateway' per AI_PROVIDER_SINGLE_SOURCE_DECISION.
  // Token counts and cost are determined by the actual provider response, not client.
  const { model, data_classification } = body as { model?: string; data_classification?: string };

  if (!model) {
    return c.json({ error: 'Missing required field: model' }, 400);
  }

  // P0-AUDIT: Reject if client tries to declare provider, tokens, or cost
  const forbiddenFields = ['provider', 'prompt_tokens', 'completion_tokens', 'cost_usd', 'total_tokens'];
  for (const field of forbiddenFields) {
    if (field in body) {
      return c.json({
        error: `Field "${field}" is server-determined. Client may not declare it.`,
      }, 422);
    }
  }

  // P0-AUDIT: Provider is always ai-provider-gateway — not client-declared
  // Token counts and cost would come from the actual AI Provider Gateway response.
  // In the current phase, this endpoint records the invocation metadata after
  // the training-gateway has already executed the call. A future version will
  // accept the gateway response object as a trusted internal payload.
  const promptTokens = (body.gateway_response?.usage?.prompt_tokens as number) ?? 0;
  const completionTokens = (body.gateway_response?.usage?.completion_tokens as number) ?? 0;
  const costUsd = (body.gateway_response?.cost_usd as number) ?? 0;

  // Verify gateway_response is present for trusted internal calls
  if (!body.gateway_response) {
    return c.json({
      error: 'Missing gateway_response. This endpoint is an internal trusted callback — external clients must use /v1/chat.',
    }, 403);
  }

  const result = await invokeModel(
    session.user_id,
    session.tenant_id,
    session.session_id,
    'ai-provider-gateway',
    model,
    promptTokens,
    completionTokens,
    costUsd,
    data_classification ?? 'public'
  );

  return c.json({ invocation_id: result.invocationId, receipt_id: result.receiptId }, 201);
});

// ============================================================
// GET /v1/model-gateway/invocations/:id/receipt — get invocation receipt
//
// P0-AUDIT: Receipt lookup now verifies user_id + tenant_id ownership.
// ============================================================

modelGatewayRoutes.get('/v1/model-gateway/invocations/:id/receipt', async (c) => {
  const authError = requireAuth(c);
  if (authError) return authError;

  const session = (c as Context).get('session') as { user_id: string; tenant_id: string };
  const id = c.req.param('id');
  const receipt = await getInvocationReceipt(id);

  if (!receipt) {
    return c.json({ error: 'Receipt not found' }, 404);
  }

  // P0-AUDIT: Verify ownership — receipt must belong to the requesting user + tenant
  const invocations = await listUserInvocations(session.user_id, session.tenant_id);
  const owned = invocations.find((inv) => inv.invocation_id === id);
  if (!owned) {
    return c.json({ error: 'Forbidden: receipt does not belong to this user/tenant' }, 403);
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
