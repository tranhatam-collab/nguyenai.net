/**
 * @nai/api — AI Nguyễn Training Gateway routes.
 *
 * These routes are the only public entry points for model-backed chat.
 * They route every request through @nai/training-gateway, which enforces:
 * - identity policy
 * - language policy
 * - data classification
 * - agent role selection
 * - model routing
 * - output guard
 * - receipt creation
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { resolveEntitlements } from '@nai/entitlement';
import type { PlanId } from '@nai/product-catalog';
import { invokeThroughTrainingGateway, type TrainingGatewayRequest } from '@nai/training-gateway';

const aiNguyenRoutes = new Hono();

// ============================================================
// POST /v1/ai-nguyen/invoke — non-streaming chat
// ============================================================

aiNguyenRoutes.post('/v1/ai-nguyen/invoke', async (c: Context) => {
  const session = c.get('session') as { user_id: string; tenant_id: string; plan_id: string; session_id: string } | null;
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({})) as {
    model?: string;
    messages?: Array<{ role: string; content: string; name?: string; tool_call_id?: string }>;
    max_tokens?: number;
    temperature?: number;
    task_hint?: string;
  };

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: 'messages is required and must be a non-empty array' }, 400);
  }

  // Resolve user tier from entitlements
  const ents = await resolveEntitlements(session.user_id, session.tenant_id, session.plan_id as PlanId);
  const userTier = ents.machine.model_tier ?? 'free';

  const req: TrainingGatewayRequest = {
    tenant_id: session.tenant_id,
    user_id: session.user_id,
    plan_id: session.plan_id,
    session_id: session.session_id ?? null,
    model: body.model ?? 'auto-route',
    messages: body.messages as Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string }>,
    max_tokens: body.max_tokens,
    temperature: body.temperature,
    task_hint: body.task_hint,
    user_tier: userTier,
  };

  const result = await invokeThroughTrainingGateway(req);

  return c.json({
    content: result.content,
    model: result.model,
    finish_reason: result.finish_reason,
    usage: result.usage,
    receipt_id: result.receipt_id,
    tier_allowed: result.tier_allowed,
    tier_reason: result.tier_reason,
    guard_action: result.guard_action,
    guard_reason: result.guard_reason,
  });
});

export default aiNguyenRoutes;
