/**
 * @nai/api — Nguyen AI API gateway on Cloudflare Workers (Hono).
 *
 * Routes:
 * - GET  /health — health check (no auth)
 * - GET  /v1/session — resolve session from cookie
 * - POST /v1/logout — revoke session
 * - GET  /v1/me — current user profile
 * - GET  /v1/entitlements — current user entitlements
 * - GET  /v1/plans — list all plans from product-catalog
 * - GET  /v1/usage — current usage state
 * - POST /v1/approvals — request approval
 * - POST /v1/approvals/:id/approve — approve request
 * - POST /v1/approvals/:id/deny — deny request
 * - GET  /v1/audit — query audit log (SUPER_ADMIN only)
 * - POST /v1/payment/checkout — create checkout session (Stripe or VNPay)
 * - GET  /v1/payment/vnpay/return — VNPay return URL
 * - POST /v1/payment/webhook/stripe — Stripe webhook
 * - GET  /v1/prices — list all prices from product-catalog
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';

import {
  SESSION_COOKIE_NAME,
  buildClearCookieHeader,
  type Session,
  type Role,
} from '@nai/auth';

import {
  logAuditEvent,
  logLogout,
  logAccessDenied,
  queryAuditLog,
  InMemoryAuditStore,
  setAuditStore,
} from '@nai/audit';
import { D1AuditStore } from './d1-audit-store';

import {
  resolveEntitlements,
  checkCommandQuota,
  InMemoryEntitlementStore,
  setEntitlementStore,
} from '@nai/entitlement';

import {
  requestApproval,
  approveRequest,
  denyRequest,
  checkApprovalStatus,
  listPendingApprovals,
  InMemoryApprovalStore,
  setApprovalStore,
} from '@nai/approval';

import { getAllPlans, getPlan, type PlanId } from '@nai/product-catalog';
// WI-1.2: resolveEntitlements is async and needs PlanId — re-imported for clarity.
import { resolveEntitlements as resolveEntitlementsAsync } from '@nai/entitlement';
import {
  createStripeCheckout,
  createVnPayCheckout,
  verifyStripeWebhook,
  verifyVnPayReturn,
  parseStripeEvent,
  parseVnPayReturn,
  generateInvoice,
  computeVat,
  type Gateway,
  type Currency,
  type CheckoutRequest,
} from '@nai/billing';

// Phase 3 — Core Runtime imports
import {
  resolveEntitlements as resolveEnt,
} from '@nai/entitlement';
import {
  AGENTS as NAI_AGENTS,
  listAgents as listNaiAgents,
  routeAgent as routeNaiAgent,
  isAgentEnabled as isNaiAgentEnabled,
  newCommandContext,
  DefaultAgentRuntime,
  runCommand,
  resumeCommand,
  cancelCommand,
  type AgentId,
  type LLMChatFn,
} from '@nai/conductor';
import {
  setModelRegistry as setPrismModelRegistry,
  configureGen1Adapter,
  configureMockProvider,
  configureDirectProvider,
  chat as prismChat,
  type ModelDescriptor,
} from '@nai/prism';
import { recordEvidence, getEvidenceForCommand } from '@nai/evidence';
// P1-3: rate limiters for chat/stream/payment routes.
import { chatRateLimit, paymentRateLimit } from './rate-limiter';

// WI-1.1: Route modules — mounted for independent operation.
import modelGatewayRoutes from './routes/model-gateway';
import fallbackRoutes from './routes/fallback';
import incidentRoutes from './routes/incidents';
import selfHealRoutes from './routes/self-heal';
import notificationRoutes from './routes/notifications';
import approvalRoutes from './routes/admin-approvals';
import { scholarshipRoutes } from './scholarship-routes';
import investorRoutes from './investor-routes';
import {
  writeMemory,
  readMemory,
  listMemory,
  deleteMemory,
  type MemoryType,
} from '@nai/relic';

// Load prices.json + models.json statically (bundled at build time)
import pricesData from '../../../packages/product-catalog/prices.json';
import modelsData from '../../../packages/product-catalog/models.json';

// ============================================================
// App context
// ============================================================

interface AppEnv {
  Bindings: {
    ENVIRONMENT: string;
    AUTH_ISSUER: string;
    AUDIT_ARCHIVE: R2Bucket;
    DB: D1Database;
    DATABASE_URL?: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    VNPAY_TMN_CODE: string;
    VNPAY_HASH_SECRET: string;
    VNPAY_PAY_URL: string;
    VNPAY_RETURN_URL: string;
    // Gen1 upstream gateway (aiagent.iai.one — FROZEN reference, adapter only)
    // WI-1.3: GEN1_GATEWAY_URL is now optional — only used when LEGACY_BRIDGE_ENABLED=true.
    GEN1_GATEWAY_URL?: string;
    GEN1_ADMIN_KEY?: string;
    // WI-1.3: Legacy bridge flag. Default: disabled (undefined = false).
    // When false, /v1/gen1/* routes return 404 and /v1/chat uses direct providers.
    // When true, Gen1 proxy is enabled for failoff only.
    LEGACY_BRIDGE_ENABLED?: string;
    // WI-1.2: Direct LLM provider keys (set via `wrangler secret put`).
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    GOOGLE_AI_API_KEY?: string;
    // Phase 3 — evidence signing secret (HMAC-SHA256 for evidence packs)
    // SEC-P0-3: Must be set via `wrangler secret put EVIDENCE_SIGNING_KEY`.
    // Never committed. In production (ENVIRONMENT !== 'development') the
    // evidence signing helper throws if this is missing.
    EVIDENCE_SIGNING_KEY?: string;
    // Phase 3 — LLM provider mode: 'gen1' | 'mock'
    LLM_PROVIDER_MODE?: string;
    // P1-4: KV namespace for durable rate limiting across Worker instances.
    RATE_LIMIT?: KVNamespace;
  };
  Variables: {
    session: Session | null;
  };
}

const app = new Hono<AppEnv>();

// SEC-P0-3: Resolve the evidence signing key from the secret store. In
// production the key must be provisioned via `wrangler secret put
// EVIDENCE_SIGNING_KEY`. A stable dev-only fallback is allowed only when
// ENVIRONMENT === 'development'. Never commit a production key.
function resolveEvidenceSigningKey(env: AppEnv['Bindings']): string {
  if (env.EVIDENCE_SIGNING_KEY) return env.EVIDENCE_SIGNING_KEY;
  if (env.ENVIRONMENT === 'development') {
    return 'dev-evidence-key-DO-NOT-USE-IN-PROD';
  }
  throw new Error('EVIDENCE_SIGNING_KEY secret is not set; run `wrangler secret put EVIDENCE_SIGNING_KEY`');
}

// CORS — restrict to nguyenai.net subdomains only
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return null;
    if (/^https:\/\/.*\.nguyenai\.net$/.test(origin)) return origin;
    if (origin === 'http://localhost:4321') return origin;
    return null;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// P1-2: Security headers on every API response.
app.use('*', async (c, next) => {
  await next();
  c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
  // CSP for API JSON responses — restrictive since there is no HTML to render.
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  c.header('X-XSS-Protection', '0'); // disabled in favor of CSP; avoids old-browser bugs
});

// ============================================================
// Initialize stores
// Audit: D1-backed (persistent) — R2 fix
// Entitlement: InMemory for custom records (plan-based comes from static catalog)
// Approval: InMemory (will move to D1 in next sprint)
// ============================================================

let storesInitialized = false;
function initStores(env: AppEnv['Bindings']): void {
  if (storesInitialized) return;
  // Use D1 audit store for persistence (R2 fix)
  if (env.DB) {
    setAuditStore(new D1AuditStore(env.DB));
  } else {
    setAuditStore(new InMemoryAuditStore());
  }
  setEntitlementStore(new InMemoryEntitlementStore());
  setApprovalStore(new InMemoryApprovalStore());

  // Phase 3 — initialize LLM platform (prism)
  // Load model registry from product-catalog models.json (bundled at build time)
  setPrismModelRegistry(modelsData as unknown as ModelDescriptor[]);

  // WI-1.2: Configure LLM provider — direct providers take priority.
  // Gen1 adapter is only used when LEGACY_BRIDGE_ENABLED=true (failoff).
  const mode = env.LLM_PROVIDER_MODE ?? 'auto';
  if (mode === 'mock') {
    configureMockProvider();
  } else {
    // Try direct providers first (OpenAI, Anthropic, Google)
    const hasDirect = configureDirectProvider({
      openaiApiKey: env.OPENAI_API_KEY,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      googleApiKey: env.GOOGLE_AI_API_KEY,
    });
    if (!hasDirect) {
      // No direct keys — try Gen1 adapter only if legacy bridge is enabled
      const legacyEnabled = env.LEGACY_BRIDGE_ENABLED === 'true';
      if (legacyEnabled && env.GEN1_GATEWAY_URL) {
        configureGen1Adapter({
          baseUrl: env.GEN1_GATEWAY_URL,
          adminKey: env.GEN1_ADMIN_KEY,
        });
      } else {
        // No keys at all — fall back to mock so the API still responds.
        configureMockProvider();
      }
    }
  }

  storesInitialized = true;
}

// ============================================================
// Middleware — resolve session from cookie
// ============================================================

app.use('/v1/*', async (c, next) => {
  initStores(c.env);
  const cookie = c.req.header('Cookie') ?? '';
  const sessionCookie = parseCookie(cookie, SESSION_COOKIE_NAME);
  c.set('session', sessionCookie ? await resolveSessionFromCookie(sessionCookie, c.env) : null);
  await next();
});

// ============================================================
// Health check — no auth
// ============================================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'nai-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

// ============================================================
// Session — GET /v1/session
// ============================================================

app.get('/v1/session', (c) => {
  const session = c.get('session');
  if (!session || session.revoked_at) {
    return c.json({ error: 'no valid session' }, 401);
  }
  return c.json(session);
});

// ============================================================
// Logout — POST /v1/logout
// ============================================================

app.post('/v1/logout', async (c) => {
  const session = c.get('session');
  if (session) {
    await logLogout(session.user_id, session.session_id);
  }
  c.header('Set-Cookie', buildClearCookieHeader(SESSION_COOKIE_NAME));
  return c.body(null, 204);
});

// ============================================================
// Me — GET /v1/me
// ============================================================

app.get('/v1/me', (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  return c.json({
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    roles: session.roles,
    permissions: session.permissions,
    audience: session.audience,
  });
});

// ============================================================
// Entitlements — GET /v1/entitlements
// ============================================================

app.get('/v1/entitlements', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  // P0 escalation fix: plan comes from session (org), NOT from query param
  const planId = (session.plan_id ?? 'nguyen-start') as PlanId;
  const ent = await resolveEntitlements(session.user_id, session.tenant_id, planId);
  return c.json(ent);
});

// ============================================================
// Plans — GET /v1/plans
// ============================================================

app.get('/v1/plans', (c) => {
  return c.json(getAllPlans());
});

app.get('/v1/plans/:id', (c) => {
  const id = c.req.param('id') as PlanId;
  const plan = getPlan(id);
  if (!plan) return c.json({ error: 'plan not found' }, 404);
  return c.json(plan);
});

// ============================================================
// Usage — GET /v1/usage
// ============================================================

app.get('/v1/usage', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  // P0 escalation fix: plan comes from session (org), NOT from query param
  const planId = (session.plan_id ?? 'nguyen-start') as PlanId;
  const quota = await checkCommandQuota(session.user_id, session.tenant_id, planId);
  return c.json({ command_quota: quota });
});

// ============================================================
// Approvals — POST /v1/approvals
// ============================================================

app.post('/v1/approvals', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const body = await c.req.json();
  const id = await requestApproval({
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    action: body.action,
    resource: body.resource,
    requested_by: session.user_id,
    reason: body.reason,
    metadata: body.metadata,
  });
  return c.json({ approval_id: id, status: 'pending' }, 201);
});

app.post('/v1/approvals/:id/approve', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const id = c.req.param('id');
  try {
    await approveRequest(id, session.user_id, session.tenant_id);
    return c.json({ approval_id: id, status: 'approved' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

app.post('/v1/approvals/:id/deny', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const id = c.req.param('id');
  try {
    await denyRequest(id, session.user_id, session.tenant_id);
    return c.json({ approval_id: id, status: 'denied' });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

app.get('/v1/approvals', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const pending = await listPendingApprovals(session.user_id, session.tenant_id);
  return c.json({ pending });
});

// ============================================================
// Audit — GET /v1/audit (SUPER_ADMIN only)
// ============================================================

app.get('/v1/audit', async (c) => {
  const session = c.get('session');
  if (!session) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  if (!session.roles.includes('SUPER_ADMIN' as Role)) {
    await logAccessDenied(session.user_id, session.session_id, '/v1/audit', 'missing SUPER_ADMIN role');
    return c.json({ error: 'forbidden: SUPER_ADMIN only' }, 403);
  }
  const events = await queryAuditLog({
    user_id: c.req.query('user_id') ?? undefined,
    event_type: c.req.query('event_type') as never ?? undefined,
    limit: parseInt(c.req.query('limit') ?? '100', 10),
  });
  return c.json({ events });
});

// ============================================================
// Gen1 Gateway Adapter — proxy to aiagent.iai.one (FROZEN reference)
// Per Founder Architecture Amendment: adapter owned by Nguyen AI,
// Gen1 stays frozen. We proxy chat/stream/models/workflows.
// Source of truth remains Nguyen AI (entitlement, billing, audit).
// ============================================================

/**
 * Forward request to Gen1 gateway with session propagation.
 * Gen1 requires X-Session-Id header — we synthesize from Nguyen AI session.
 */
async function proxyToGen1(
  c: Context<AppEnv>,
  path: string,
  method: string = 'POST',
): Promise<Response> {
  // WI-1.3: Legacy bridge is disabled by default. Only enable when
  // LEGACY_BRIDGE_ENABLED=true (set via wrangler secret for failoff).
  if (c.env.LEGACY_BRIDGE_ENABLED !== 'true') {
    return c.json({ error: 'legacy_bridge_disabled', message: 'Gen1 proxy is disabled. Set LEGACY_BRIDGE_ENABLED=true to enable failoff.' }, 404);
  }
  const base = c.env.GEN1_GATEWAY_URL;
  if (!base) return c.json({ error: 'GEN1_GATEWAY_URL not configured' }, 500);

  const session = c.get('session');
  // Synthesize Gen1 session ID from Nguyen AI session (deterministic mapping)
  // For anonymous users, derive stable ID from IP so TOS acceptance persists
  const gen1SessionId = session
    ? `nai-${session.tenant_id}-${session.session_id.slice(0, 8)}`
    : `nai-anon-${(c.req.header('CF-Connecting-IP') ?? 'local').slice(0, 12)}`;

  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-Id': gen1SessionId,
    'X-Tier': 'free-demo', // Nguyen AI maps plan to Gen1 tier in future
    'X-User-Id': session?.user_id ?? 'anonymous',
  };
  // P1-5: The Gen1 admin key is forwarded over HTTPS (encrypted in transit).
  // It MUST be provisioned via `wrangler secret put GEN1_ADMIN_KEY` and never
  // committed. Because Gen1 is FROZEN and expects the raw key in X-Admin-Key,
  // a signed short-lived token cannot be used until Gen1 is unfrozen or
  // migrated to a Cloudflare service binding. Every admin-authenticated proxy
  // call is audit-logged below so admin actions are traceable.
  if (c.env.GEN1_ADMIN_KEY) headers['X-Admin-Key'] = c.env.GEN1_ADMIN_KEY;

  // Forward Authorization if present
  const authz = c.req.header('Authorization');
  if (authz) headers['Authorization'] = authz;

  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') {
    const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
    // Inject synthesized sessionId for Gen1 endpoints that require it in body
    if (typeof body === 'object' && body !== null && !body.sessionId) {
      body.sessionId = gen1SessionId;
    }
    init.body = JSON.stringify(body);
  }

  try {
    const upstream = await fetch(url, init);
    const body = await upstream.text();
    // P1-5: audit every admin-authenticated Gen1 proxy call so admin actions
    // are traceable, even though the key is forwarded as X-Admin-Key.
    if (c.env.GEN1_ADMIN_KEY) {
      try {
        await logAuditEvent({
          user_id: session?.user_id ?? 'anonymous',
          session_id: session?.session_id ?? null,
          event_type: 'gen1_admin_proxy_call',
          actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
          user_agent: c.req.header('User-Agent') ?? 'unknown',
          target: path,
          result: upstream.ok ? 'success' : 'failure',
          metadata: { method, upstream_status: upstream.status, gen1_session: gen1SessionId },
        });
      } catch {
        // Audit failure must not mask the proxy response.
      }
    }
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
        'X-Gen1-Upstream': 'aiagent.iai.one',
        'X-Gen1-Session': gen1SessionId,
      },
    });
  } catch (err) {
    console.error('Gen1 proxy error:', err);
    return c.json({ error: 'gen1 gateway unreachable', upstream: base }, 502);
  }
}

// POST /v1/chat — local LLM via prism (direct provider, no Gen1 proxy)
// WI-1.2: Routed through @nai/prism which uses direct OpenAI/Anthropic/Google
// providers. Gen1 adapter is only used when LEGACY_BRIDGE_ENABLED=true (failoff).
app.post('/v1/chat', chatRateLimit, async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({})) as {
    model?: string;
    messages?: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  };

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: 'messages is required and must be a non-empty array' }, 400);
  }

  // Resolve user tier from entitlements
  const ents = await resolveEntitlements(session.user_id, session.tenant_id, session.plan_id as PlanId);
  const userTier = ents.machine.model_tier ?? 'free';

  const result = await prismChat({
    tenant_id: session.tenant_id,
    user_id: session.user_id,
    plan_id: session.plan_id,
    model: body.model ?? 'auto-route',
    messages: body.messages as Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string }>,
    max_tokens: body.max_tokens,
    temperature: body.temperature,
  }, userTier);

  if (!result.tier_allowed) {
    return c.json({ error: 'tier_not_allowed', reason: result.tier_reason }, 403);
  }

  // Record evidence for the chat call
  try {
    await recordEvidence({
      command_id: `chat-${Date.now()}`,
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      agent_id: 'chat-endpoint',
      proof_type: 'execution' as never,
      payload: {
        model: result.model,
        served_by: result.served_by,
        usage: result.usage,
      },
    }, resolveEvidenceSigningKey(c.env));
  } catch {
    // Evidence recording failure must not mask the chat response.
  }

  return c.json({
    model: result.model,
    content: result.content,
    finish_reason: result.finish_reason,
    usage: result.usage,
    served_by: result.served_by,
  });
});

// POST /v1/stream — streaming chat via prism (SSE)
// WI-1.2: Uses prism for the first token, then streams. For now, non-streaming
// fallback wrapped in SSE format. Full streaming requires provider SDK support.
app.post('/v1/stream', chatRateLimit, async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({})) as {
    model?: string;
    messages?: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  };

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: 'messages is required and must be a non-empty array' }, 400);
  }

  const ents = await resolveEntitlements(session.user_id, session.tenant_id, session.plan_id as PlanId);
  const userTier = ents.machine.model_tier ?? 'free';

  const result = await prismChat({
    tenant_id: session.tenant_id,
    user_id: session.user_id,
    plan_id: session.plan_id,
    model: body.model ?? 'auto-route',
    messages: body.messages as Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string }>,
    max_tokens: body.max_tokens,
    temperature: body.temperature,
  }, userTier);

  if (!result.tier_allowed) {
    return c.json({ error: 'tier_not_allowed', reason: result.tier_reason }, 403);
  }

  // Wrap as SSE — single data event with the full response (non-streaming fallback)
  const sseData = JSON.stringify({
    model: result.model,
    content: result.content,
    finish_reason: result.finish_reason,
    usage: result.usage,
    served_by: result.served_by,
  });
  return new Response(`data: ${sseData}\n\ndata: [DONE]\n\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

// GET /v1/gen1/models — Gen1 native models (LEGACY BRIDGE ONLY)
// WI-1.3: Returns 404 when LEGACY_BRIDGE_ENABLED is not set.
app.get('/v1/gen1/models', (c) => proxyToGen1(c, '/v1/models', 'GET'));

// GET /v1/gen1/health — check Gen1 upstream health (LEGACY BRIDGE ONLY)
app.get('/v1/gen1/health', (c) => proxyToGen1(c, '/v1/health', 'GET'));

// GET /v1/gen1/quota — check Gen1 quota for current session (LEGACY BRIDGE ONLY)
app.get('/v1/gen1/quota', (c) => proxyToGen1(c, '/v1/quota', 'GET'));

// GET /v1/gen1/tos — fetch Gen1 Terms of Service (LEGACY BRIDGE ONLY)
app.get('/v1/gen1/tos', (c) => proxyToGen1(c, '/v1/tos', 'GET'));

// POST /v1/gen1/tos/accept — accept Gen1 TOS on behalf of user (LEGACY BRIDGE ONLY)
app.post('/v1/gen1/tos/accept', (c) => proxyToGen1(c, '/v1/tos/accept', 'POST'));

// POST /v1/workflows — local workflow execution (WI-1.2: no Gen1 proxy)
// For now, returns 501 until @nai/aqueduct workflow executor is wired.
app.post('/v1/workflows', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);
  // If legacy bridge is enabled, fall back to Gen1 for workflows
  if (c.env.LEGACY_BRIDGE_ENABLED === 'true') {
    return proxyToGen1(c, '/v1/workflows', 'POST');
  }
  return c.json({ error: 'workflows_not_yet_implemented', message: 'Local workflow executor is not yet wired. Enable LEGACY_BRIDGE_ENABLED=true for Gen1 failoff.' }, 501);
});

// ============================================================
// Phase 3 — Core Runtime: /v1/command, /v1/agents, /v1/memory, /v1/evidence
// ============================================================

/**
 * LLM chat function adapter — bridges conductor's LLMChatFn to prism's chat().
 * The conductor calls this to produce agent plan + output; prism handles
 * model routing + tier gating + GEN1 adapter calls.
 */
function makeLLMChatFn(session: Session, planId: PlanId): LLMChatFn {
  return async (opts) => {
    // Resolve entitlements to get the user's model tier.
    const ent = await resolveEnt(session.user_id, session.tenant_id, planId);
    const userTier = String(ent.machine.model_tier ?? 'free');
    const result = await prismChat({
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      plan_id: planId,
      model: 'auto-route',
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userMessage },
      ],
    }, userTier);
    if (result.finish_reason === 'error') {
      throw new Error(result.tier_reason ?? 'LLM error');
    }
    return result.content;
  };
}

// GET /v1/agents — list all NAI agents (with enabled flag for current session)
app.get('/v1/agents', async (c) => {
  const session = c.get('session');
  const allAgents = listNaiAgents();
  if (!session) {
    // Anonymous: return agent catalog without enabled flags.
    return c.json({ agents: allAgents.map((a) => ({ ...a, enabled: false })) });
  }
  const planId = (session.plan_id ?? 'nguyen-start') as PlanId;
  const ent = await resolveEnt(session.user_id, session.tenant_id, planId);
  const enabled = Array.isArray(ent.machine.agents_enabled) ? ent.machine.agents_enabled : [];
  return c.json({
    agents: allAgents.map((a) => ({
      ...a,
      enabled: isNaiAgentEnabled(a.id, enabled as AgentId[]),
    })),
  });
});

// POST /v1/command — submit a command to the agent runtime
app.post('/v1/command', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);

  const body = await c.req.json().catch(() => ({})) as {
    input: string;
    agent_id?: AgentId;
  };
  if (!body.input || typeof body.input !== 'string') {
    return c.json({ error: 'input (string) is required' }, 400);
  }

  const planId = (session.plan_id ?? 'nguyen-start') as PlanId;
  const ent = await resolveEnt(session.user_id, session.tenant_id, planId);
  const modelTier = String(ent.machine.model_tier ?? 'free');
  const agentsEnabled = (Array.isArray(ent.machine.agents_enabled) ? ent.machine.agents_enabled : []) as AgentId[];
  const approvalRequired = String(ent.machine.approval_required ?? 'all') as 'all' | 'sensitive' | 'none';

  // Route to agent (or use explicit agent_id if provided + enabled)
  let agentId: AgentId;
  if (body.agent_id) {
    if (!isNaiAgentEnabled(body.agent_id, agentsEnabled)) {
      return c.json({ error: `agent "${body.agent_id}" not enabled for your plan`, enabled_agents: agentsEnabled }, 403);
    }
    agentId = body.agent_id;
  } else {
    agentId = routeNaiAgent(body.input, agentsEnabled);
  }

  const commandId = `cmd_${crypto.randomUUID()}`;
  const ctx = newCommandContext({
    command_id: commandId,
    tenant_id: session.tenant_id,
    user_id: session.user_id,
    input: body.input,
    plan_id: planId,
    model_tier: modelTier,
    agent_id: agentId,
    agents_enabled: agentsEnabled,
    approval_required: approvalRequired,
  });

  const chatFn = makeLLMChatFn(session, planId);
  const runtime = new DefaultAgentRuntime(chatFn);
  const result = await runCommand(ctx, runtime);

  // Record command_executed / command_failed evidence
  try {
    await recordEvidence({
      command_id: commandId,
      user_id: session.user_id,
      tenant_id: session.tenant_id,
      agent_id: agentId,
      proof_type: result.success ? 'command_executed' : 'command_failed',
      classification: 'internal',
      payload: {
        input: body.input,
        output: result.context.output,
        plan: result.context.plan,
        state: result.context.state,
        evidence_labels: result.context.evidence_labels,
        error: result.context.error,
      },
    }, resolveEvidenceSigningKey(c.env));
  } catch {
    // Evidence failure should not mask the command result.
  }

  // Audit log
  await logAuditEvent({
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    session_id: session.session_id,
    event_type: 'command_executed',
    actor_ip: c.req.header('CF-Connecting-IP') ?? null,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `command:${commandId}`,
    result: result.success ? 'success' : 'failure',
    metadata: {
      command_id: commandId,
      agent_id: agentId,
      state: result.context.state,
      evidence_labels: result.context.evidence_labels,
    },
  });

  if (result.context.state === 'approval_required') {
    return c.json({
      command_id: commandId,
      state: 'approval_required',
      agent_id: agentId,
      plan: result.context.plan,
      message: 'Command requires approval before execution. Approve via POST /v1/approvals/:id/approve then POST /v1/command/:id/resume.',
    }, 202);
  }

  return c.json({
    command_id: commandId,
    state: result.context.state,
    agent_id: agentId,
    plan: result.context.plan,
    output: result.context.output,
    evidence_labels: result.context.evidence_labels,
    error: result.context.error,
    transitions: result.context.transitions,
  });
});

// POST /v1/command/:id/resume — resume a command after approval
app.post('/v1/command/:id/resume', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  const commandId = c.req.param('id');

  // In MVP (InMemory stores), we cannot look up the paused context by id.
  // The client must send the paused context back in the body.
  // (Production: store command context in D1/Postgres and look it up.)
  const body = await c.req.json().catch(() => ({})) as {
    paused_context: Record<string, unknown>;
  };
  if (!body.paused_context) {
    return c.json({ error: 'paused_context is required to resume (MVP — InMemory store)' }, 400);
  }

  const planId = (session.plan_id ?? 'nguyen-start') as PlanId;
  const chatFn = makeLLMChatFn(session, planId);
  const runtime = new DefaultAgentRuntime(chatFn);
  // Reconstruct context from body (typed loosely for MVP)
  const ctx = body.paused_context as never; // CommandContext shape
  const result = await resumeCommand(ctx, runtime);

  try {
    await recordEvidence({
      command_id: commandId,
      user_id: session.user_id,
      tenant_id: session.tenant_id,
      agent_id: (ctx as { agent_id: string }).agent_id,
      proof_type: result.success ? 'command_executed' : 'command_failed',
      classification: 'internal',
      payload: {
        output: result.context.output,
        state: result.context.state,
        evidence_labels: result.context.evidence_labels,
        error: result.context.error,
        resumed: true,
      },
    }, resolveEvidenceSigningKey(c.env));
  } catch {
    // ignore
  }

  return c.json({
    command_id: commandId,
    state: result.context.state,
    output: result.context.output,
    evidence_labels: result.context.evidence_labels,
    error: result.context.error,
  });
});

// POST /v1/command/:id/cancel — cancel a paused command
app.post('/v1/command/:id/cancel', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  const body = await c.req.json().catch(() => ({})) as {
    paused_context: Record<string, unknown>;
  };
  if (!body.paused_context) {
    return c.json({ error: 'paused_context is required to cancel (MVP — InMemory store)' }, 400);
  }
  const ctx = body.paused_context as never;
  const cancelled = cancelCommand(ctx);
  return c.json({ command_id: c.req.param('id'), state: cancelled.state });
});

// GET /v1/command/:id/evidence — get evidence records for a command
app.get('/v1/command/:id/evidence', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  const commandId = c.req.param('id');
  const records = await getEvidenceForCommand(commandId);
  // Tenant isolation: filter by session tenant
  const filtered = records.filter((r) => r.tenant_id === session.tenant_id);
  return c.json({ command_id: commandId, evidence: filtered, count: filtered.length });
});

// GET /v1/memory — list memories for current user
app.get('/v1/memory', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  const type = c.req.query('type') as MemoryType | undefined;
  const limit = parseInt(c.req.query('limit') ?? '50', 10);
  const records = await listMemory(session.tenant_id, session.user_id, { type, limit });
  return c.json({ memories: records, count: records.length });
});

// GET /v1/memory/:key — read a specific memory
app.get('/v1/memory/:key', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  const key = c.req.param('key');
  const rec = await readMemory(session.tenant_id, session.user_id, key);
  if (!rec) return c.json({ error: 'memory not found' }, 404);
  return c.json(rec);
});

// POST /v1/memory — write a memory
app.post('/v1/memory', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  const body = await c.req.json().catch(() => ({})) as {
    memory_type: MemoryType;
    key: string;
    value: unknown;
    tags?: string[];
    visibility?: 'private' | 'tenant' | 'public';
  };
  if (!body.memory_type || !body.key) {
    return c.json({ error: 'memory_type and key are required' }, 400);
  }
  const id = await writeMemory({
    tenant_id: session.tenant_id,
    user_id: session.user_id,
    memory_type: body.memory_type,
    key: body.key,
    value: body.value,
    tags: body.tags,
    visibility: body.visibility,
  });
  await logAuditEvent({
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    session_id: session.session_id,
    event_type: 'tool_called',
    actor_ip: c.req.header('CF-Connecting-IP') ?? null,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `memory:${body.key}`,
    result: 'success',
    metadata: { memory_id: id, memory_type: body.memory_type },
  });
  return c.json({ memory_id: id, memory_type: body.memory_type, key: body.key }, 201);
});

// DELETE /v1/memory/:key — delete a memory
app.delete('/v1/memory/:key', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  const key = c.req.param('key');
  await deleteMemory(session.tenant_id, session.user_id, key);
  return c.body(null, 204);
});

// ============================================================
// 404 handler
// ============================================================

app.notFound((c) => c.json({ error: 'not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'internal server error' }, 500);
});

// ============================================================
// Helpers
// ============================================================

function parseCookie(cookieHeader: string, name: string): string | null {
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, v] = part.trim().split('=');
    if (k === name) return v ?? null;
  }
  return null;
}

// R2 fix: resolve session from D1 (shared with auth Worker)
async function resolveSessionFromCookie(sessionId: string, env: AppEnv['Bindings']): Promise<Session | null> {
  if (!env.DB) return null;
  const row = await env.DB.prepare(
    `SELECT s.*, o.plan_id
     FROM sessions s
     JOIN organizations o ON o.tenant_id = s.tenant_id
     WHERE s.session_id = ?1 AND s.revoked_at IS NULL`
  ).bind(sessionId).first<{
    session_id: string; user_id: string; tenant_id: string; plan_id: string;
    audience: string; issuer: string; roles: string; permissions: string;
    csrf_token: string; issued_at: string; expires_at: string;
    rotated_at: string | null; revoked_at: string | null;
    device: string | null; ip_address: string | null; user_agent: string | null;
  }>();
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  return {
    session_id: row.session_id,
    user_id: row.user_id,
    tenant_id: row.tenant_id,
    plan_id: row.plan_id ?? 'nguyen-start',
    audience: row.audience,
    issuer: row.issuer,
    roles: JSON.parse(row.roles ?? '[]'),
    permissions: JSON.parse(row.permissions ?? '[]'),
    device: row.device ? JSON.parse(row.device) : null,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    csrf_token: row.csrf_token,
    issued_at: row.issued_at,
    expires_at: row.expires_at,
    rotated_at: row.rotated_at,
    revoked_at: row.revoked_at,
  };
}

// ============================================================
// Prices — GET /v1/prices
// ============================================================

app.get('/v1/prices', (c) => {
  return c.json({ prices: pricesData });
});

// ============================================================
// Models — GET /v1/models
// ============================================================

app.get('/v1/models', (c) => {
  const tier = c.req.query('tier');
  let models = modelsData as Array<{ id: string; tier: string; displayName: string; provider: string; providerModel: string; freeTier: boolean }>;
  if (tier) {
    models = models.filter((m) => m.tier === tier);
  }
  return c.json({ models, count: models.length });
});

// ============================================================
// Payment checkout — POST /v1/payment/checkout
// ============================================================

app.post('/v1/payment/checkout', paymentRateLimit, async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);

  const body = await c.req.json();
  const { price_id, gateway, currency, success_url, cancel_url, locale } = body as {
    price_id: string;
    gateway: Gateway;
    currency: Currency;
    success_url: string;
    cancel_url: string;
    locale: 'vi' | 'en';
  };

  if (!price_id || !gateway || !currency) {
    return c.json({ error: 'price_id, gateway, currency are required' }, 400);
  }
  if (gateway !== 'stripe' && gateway !== 'vnpay') {
    return c.json({ error: 'gateway must be stripe or vnpay' }, 400);
  }
  if (gateway === 'vnpay' && currency !== 'VND') {
    return c.json({ error: 'VNPay only supports VND' }, 400);
  }

  const price = (pricesData as Array<{ id: string }>).find((p) => p.id === price_id);
  if (!price) return c.json({ error: 'price not found' }, 404);

  const req: CheckoutRequest = {
    price_id,
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    email: '', // would fetch from auth service
    currency,
    gateway,
    success_url: success_url ?? `https://app.nguyenai.net/payment/success`,
    cancel_url: cancel_url ?? `https://app.nguyenai.net/payment/cancel`,
    locale: locale ?? 'vi',
  };

  try {
    if (gateway === 'stripe') {
      const session_url = await createStripeCheckout(
        { STRIPE_SECRET_KEY: c.env.STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: c.env.STRIPE_WEBHOOK_SECRET },
        req,
        price as any,
      );
      await logAuditEvent({
        user_id: session.user_id,
        session_id: session.session_id,
        event_type: 'payment_received',
        actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
        target: price_id,
        result: 'success',
        metadata: { gateway: 'stripe', amount: session_url.amount, currency },
      });
      return c.json(session_url);
    } else {
      const session_url = await createVnPayCheckout(
        {
          VNPAY_TMN_CODE: c.env.VNPAY_TMN_CODE,
          VNPAY_HASH_SECRET: c.env.VNPAY_HASH_SECRET,
          VNPAY_PAY_URL: c.env.VNPAY_PAY_URL,
          VNPAY_RETURN_URL: c.env.VNPAY_RETURN_URL,
        },
        req,
        price as any,
      );
      await logAuditEvent({
        user_id: session.user_id,
        session_id: session.session_id,
        event_type: 'payment_received',
        actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
        target: price_id,
        result: 'success',
        metadata: { gateway: 'vnpay', amount: session_url.amount, currency: 'VND' },
      });
      return c.json(session_url);
    }
  } catch (err) {
    console.error('Checkout creation failed:', err);
    return c.json({ error: 'checkout creation failed' }, 502);
  }
});

// ============================================================
// VNPay return — GET /v1/payment/vnpay/return
// ============================================================

app.get('/v1/payment/vnpay/return', async (c) => {
  const params: Record<string, string> = {};
  const queries = c.req.queries();
  for (const key of Object.keys(queries)) {
    const vals = queries[key];
    params[key] = Array.isArray(vals) ? vals[0] : vals;
  }

  const valid = await verifyVnPayReturn(
    {
      VNPAY_TMN_CODE: c.env.VNPAY_TMN_CODE,
      VNPAY_HASH_SECRET: c.env.VNPAY_HASH_SECRET,
      VNPAY_PAY_URL: c.env.VNPAY_PAY_URL,
      VNPAY_RETURN_URL: c.env.VNPAY_RETURN_URL,
    },
    params,
  );

  if (!valid) return c.json({ error: 'invalid signature' }, 400);

  const result = parseVnPayReturn(params);
  const invoice = generateInvoice(result, true); // VNPay = Vietnam customer

  await logAuditEvent({
    user_id: result.user_id || 'unknown',
    session_id: null,
    event_type: 'payment_received',
    actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
    user_agent: c.req.header('User-Agent') ?? 'unknown',
    target: result.gateway_payment_id,
    result: result.status === 'paid' ? 'success' : 'failure',
    metadata: { gateway: 'vnpay', amount: result.amount, invoice_id: invoice.invoice_id },
  });

  return c.json({ payment: result, invoice });
});

// ============================================================
// Stripe webhook — POST /v1/payment/webhook/stripe
// ============================================================

app.post('/v1/payment/webhook/stripe', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('Stripe-Signature') ?? '';

  const valid = await verifyStripeWebhook(
    { STRIPE_SECRET_KEY: c.env.STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: c.env.STRIPE_WEBHOOK_SECRET },
    payload,
    signature,
  );

  if (!valid) return c.json({ error: 'invalid signature' }, 400);

  const event = JSON.parse(payload) as Record<string, unknown>;
  const result = parseStripeEvent(event);

  if (!result) {
    // Event type not payment-related — acknowledge but don't process
    return c.json({ received: true, processed: false });
  }

  const invoice = generateInvoice(result, false); // Stripe = international, no VAT

  await logAuditEvent({
    user_id: result.user_id || 'unknown',
    session_id: null,
    event_type: 'payment_received',
    actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
    user_agent: c.req.header('User-Agent') ?? 'unknown',
    target: result.gateway_payment_id,
    result: 'success',
    metadata: { gateway: 'stripe', amount: result.amount, invoice_id: invoice.invoice_id },
  });

  return c.json({ received: true, processed: true, payment: result, invoice });
});

// ============================================================
// WI-1.1: Mount route modules — independent operation
// These route files were previously dead code (written but not imported).
// They are now mounted and accessible.
// ============================================================

app.route('/', modelGatewayRoutes);
app.route('/', fallbackRoutes);
app.route('/', incidentRoutes);
app.route('/', selfHealRoutes);
app.route('/', notificationRoutes);
app.route('/', approvalRoutes);
app.route('/', scholarshipRoutes);
app.route('/', investorRoutes);

export default app;
