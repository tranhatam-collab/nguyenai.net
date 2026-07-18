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
  parseSessionCookieValue,
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
import { D1EntitlementStore } from './d1-entitlement-store';
import { D1ApprovalStore } from './d1-approval-store';

import {
  resolveEntitlements,
  checkCommandQuota,
  InMemoryEntitlementStore,
  setEntitlementStore,
  D1SubscriptionStore,
  setSubscriptionStore,
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
  createPayOsCheckout,
  createStripeRefund,
  createVnPayRefund,
  createPayOsRefund,
  verifyStripeWebhook,
  verifyVnPayReturn,
  verifyPayOsWebhook,
  parseStripeEvent,
  parseStripeRefundEvent,
  parseVnPayReturn,
  parsePayOsWebhook,
  generateInvoice,
  computeVat,
  type Gateway,
  type Currency,
  type CheckoutRequest,
  type RefundRequest,
  type RefundResult,
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
  setLLMProvider as setPrismLLMProvider,
  configureGen1Adapter,
  configureMockProvider,
  type ModelDescriptor,
} from '@nai/prism';
import { configureProviderGateway } from '@nai/ai-provider-client';
import { invokeThroughTrainingGateway } from '@nai/training-gateway';
import { recordEvidence, getEvidenceForCommand } from '@nai/evidence';
// P1-3: rate limiters for chat/stream/payment routes.
import { chatRateLimit, paymentRateLimit } from './rate-limiter';
// P0-PAY-1: Webhook replay protection.
import { checkReplay, recordProcessed, setReplayStore, createD1ReplayStore } from './webhook-replay';

// WI-1.1: Route modules — mounted for independent operation.
import modelGatewayRoutes from './routes/model-gateway';
import aiNguyenRoutes from './routes/ai-nguyen';
import fallbackRoutes from './routes/fallback';
import incidentRoutes from './routes/incidents';
import selfHealRoutes from './routes/self-heal';
import notificationRoutes from './routes/notifications';
import approvalRoutes from './routes/admin-approvals';
import { scholarshipRoutes } from './scholarship-routes';
import investorRoutes from './investor-routes';
import { eduRoutes } from './edu-routes';
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
    // pay-gateway.nguyenai.net — VietQR canonical gateway (VND, merchant of record: KASAN JSC)
    PAY_GATEWAY_BASE_URL?: string;
    PAY_GATEWAY_API_KEY?: string;
    PAY_GATEWAY_TENANT_CODE?: string;
    PAY_GATEWAY_SITE_CODE?: string;
    PAY_GATEWAY_PROVIDER?: string;
    PAY_GATEWAY_CALLBACK_BASE?: string;
    PAY_NAI_HMAC?: string;
    // Gen1 upstream gateway (aiagent-upstream — FROZEN reference, adapter only)
    // WI-1.3: GEN1_GATEWAY_URL is now optional — only used when LEGACY_BRIDGE_ENABLED=true.
    GEN1_GATEWAY_URL?: string;
    GEN1_ADMIN_KEY?: string;
    // WI-1.3: Legacy bridge flag. Default: disabled (undefined = false).
    // When false, /v1/gen1/* routes return 404 and /v1/chat uses direct providers.
    // When true, Gen1 proxy is enabled for failoff only.
    LEGACY_BRIDGE_ENABLED?: string;
    // AI Provider Gateway — single source for all model invocations.
    // See AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md
    AI_PROVIDER_GATEWAY_URL?: string;
    AI_PROVIDER_API_KEY?: string;
    // Phase 3 — evidence signing secret (HMAC-SHA256 for evidence packs)
    // SEC-P0-3: Must be set via `wrangler secret put EVIDENCE_SIGNING_KEY`.
    // Never committed. In production (ENVIRONMENT !== 'development') the
    // evidence signing helper throws if this is missing.
    EVIDENCE_SIGNING_KEY?: string;
    /** Same AUTH_SECRET as auth worker — verify signed session cookies. */
    AUTH_SECRET?: string;
    // Phase 3 — LLM provider mode: 'gen1' | 'mock'
    LLM_PROVIDER_MODE?: string;
    // P1-4: KV namespace for durable rate limiting across Worker instances.
    RATE_LIMIT?: KVNamespace;
  };
  Variables: {
    session: Session | null;
    correlationId: string;
    traceId: string | undefined;
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

// P0-OBS: Correlation ID middleware — attach x-request-id to every request
app.use('*', async (c, next) => {
  const incomingId = c.req.header('x-request-id') ?? c.req.header('x-correlation-id');
  const correlationId = incomingId || crypto.randomUUID();
  const traceId = c.req.header('x-trace-id') ?? undefined;
  c.set('correlationId', correlationId);
  c.set('traceId', traceId);
  c.header('x-request-id', correlationId);
  if (traceId) c.header('x-trace-id', traceId);
  await next();
});

// ============================================================
// Initialize stores
// Audit / Entitlement / Approval: D1 when DB bound, else InMemory
// ============================================================

let storesInitialized = false;
function initStores(env: AppEnv['Bindings']): void {
  if (storesInitialized) return;
  if (env.DB) {
    setAuditStore(new D1AuditStore(env.DB));
    setEntitlementStore(new D1EntitlementStore(env.DB));
    setApprovalStore(new D1ApprovalStore(env.DB));
  } else {
    setAuditStore(new InMemoryAuditStore());
    setEntitlementStore(new InMemoryEntitlementStore());
    setApprovalStore(new InMemoryApprovalStore());
  }

  // Phase 3 — initialize LLM platform (prism)
  // Load model registry from product-catalog models.json (bundled at build time)
  setPrismModelRegistry(modelsData as unknown as ModelDescriptor[]);

  // AI Provider Gateway — single source for all model invocations.
  // See AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md
  const isProduction = env.ENVIRONMENT === 'production';
  const mode = env.LLM_PROVIDER_MODE ?? 'auto';

  if (mode === 'mock' && isProduction) {
    // BANNED: mock provider in production. Refuse to serve AI requests.
    // This is a hard stop — do NOT fall back to mock.
    console.error('[FATAL] LLM_PROVIDER_MODE=mock is BANNED in production. Set AI_PROVIDER_API_KEY.');
  } else if (mode === 'mock') {
    configureMockProvider();
  } else {
    // Use AI Provider Gateway (aiagent.iai.one) — no direct vendor keys
    const hasGateway = configureProviderGateway({
      gatewayUrl: env.AI_PROVIDER_GATEWAY_URL ?? 'https://aiagent.iai.one',
      apiKey: env.AI_PROVIDER_API_KEY ?? '',
    }, setPrismLLMProvider);
    if (!hasGateway) {
      if (isProduction) {
        // BANNED: no gateway key in production. Do NOT fall back to mock or Gen1.
        // The API will return 503 on AI endpoints until AI_PROVIDER_API_KEY is set.
        console.error('[FATAL] AI_PROVIDER_API_KEY not set in production. AI endpoints will return 503.');
      } else {
        // Development only: try Gen1 adapter if legacy bridge is enabled (failoff)
        const legacyEnabled = env.LEGACY_BRIDGE_ENABLED === 'true';
        if (legacyEnabled && env.GEN1_GATEWAY_URL) {
          configureGen1Adapter({
            baseUrl: env.GEN1_GATEWAY_URL,
            adminKey: env.GEN1_ADMIN_KEY,
          });
        } else {
          // Dev fallback — mock is allowed in development only
          configureMockProvider();
        }
      }
    }
  }

  // P0-PAY-01: Durable webhook replay store (D1) — replaces in-memory Map
  if (env.DB) {
    setReplayStore(createD1ReplayStore(env.DB));
    // P0-PAY-02: Durable subscription store (D1) — replaces in-memory Map
    setSubscriptionStore(new D1SubscriptionStore(env.DB));
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
  const sessionId = sessionCookie
    ? await parseSessionCookieValue(sessionCookie, c.env.AUTH_SECRET)
    : null;
  c.set('session', sessionId ? await resolveSessionFromCookie(sessionId, c.env) : null);

  // P0-AUTHZ: CSRF enforcement for state-changing requests (POST/PUT/PATCH/DELETE)
  const method = c.req.method.toUpperCase();
  const session = c.get('session');
  if (session && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    const csrfHeader = c.req.header('X-CSRF-Token');
    if (!csrfHeader || csrfHeader !== session.csrf_token) {
      return c.json({ error: 'CSRF token required' }, 403);
    }
  }

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
// Gen1 Gateway Adapter — proxy to aiagent-upstream (FROZEN reference)
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
        'X-Gen1-Upstream': 'aiagent-upstream',
        'X-Gen1-Session': gen1SessionId,
      },
    });
  } catch (err) {
    console.error('Gen1 proxy error:', err);
    return c.json({ error: 'gen1 gateway unreachable', upstream: base }, 502);
  }
}

// POST /v1/chat — Nguyễn AI Training Gateway entry point
// All model calls route through @nai/training-gateway, which enforces
// identity, language, safety, data classification, and output guard policies.
app.post('/v1/chat', chatRateLimit, async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  // Production guard: refuse if AI_PROVIDER_API_KEY is not set
  if (c.env.ENVIRONMENT === 'production' && !c.env.AI_PROVIDER_API_KEY) {
    return c.json({
      error: 'llm_providers_not_configured',
      message: 'AI_PROVIDER_API_KEY chưa set. AI endpoints không khả dụng cho đến khi gateway credential được cấp.',
    }, 503);
  }

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

  let result: Awaited<ReturnType<typeof invokeThroughTrainingGateway>>;
  try {
    result = await invokeThroughTrainingGateway({
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      plan_id: session.plan_id,
      session_id: session.session_id ?? null,
      model: body.model ?? 'auto-route',
      messages: body.messages as Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string }>,
      max_tokens: body.max_tokens,
      temperature: body.temperature,
      user_tier: userTier,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/provider\s+mock\s+is\s+not\s+allowed/i.test(msg) || /is not allowed/i.test(msg)) {
      return c.json({
        error: 'llm_providers_not_configured',
        message: 'AI_PROVIDER_API_KEY chưa set trên nguyenai-api-gateway. Liên hệ Team A để cấp gateway credential.',
      }, 503);
    }
    throw err;
  }

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
        receipt_id: result.receipt_id,
        usage: result.usage,
        guard_action: result.guard_action,
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
    receipt_id: result.receipt_id,
    guard_action: result.guard_action,
  });
});

// POST /v1/stream — streaming chat via Nguyễn AI Training Gateway (SSE)
// For now, non-streaming fallback wrapped in SSE format. Full streaming requires
// provider SDK support and output guard per-chunk.
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

  let result: Awaited<ReturnType<typeof invokeThroughTrainingGateway>>;
  try {
    result = await invokeThroughTrainingGateway({
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      plan_id: session.plan_id,
      session_id: session.session_id ?? null,
      model: body.model ?? 'auto-route',
      messages: body.messages as Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; name?: string; tool_call_id?: string }>,
      max_tokens: body.max_tokens,
      temperature: body.temperature,
      user_tier: userTier,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/provider\s+mock\s+is\s+not\s+allowed/i.test(msg) || /is not allowed/i.test(msg)) {
      return c.json({
        error: 'llm_providers_not_configured',
        message: 'AI_PROVIDER_API_KEY chưa set trên nguyenai-api-gateway. Liên hệ Team A để cấp gateway credential.',
      }, 503);
    }
    throw err;
  }

  if (!result.tier_allowed) {
    return c.json({ error: 'tier_not_allowed', reason: result.tier_reason }, 403);
  }

  // Wrap as SSE — single data event with the full response (non-streaming fallback)
  const sseData = JSON.stringify({
    model: result.model,
    content: result.content,
    finish_reason: result.finish_reason,
    usage: result.usage,
    receipt_id: result.receipt_id,
    guard_action: result.guard_action,
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
    const result = await invokeThroughTrainingGateway({
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      plan_id: planId,
      session_id: session.session_id ?? null,
      model: 'auto-route',
      messages: [
        { role: 'system', content: opts.systemPrompt },
        { role: 'user', content: opts.userMessage },
      ],
      user_tier: userTier,
    });
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
  if (gateway !== 'stripe' && gateway !== 'vnpay' && gateway !== 'payos') {
    return c.json({ error: 'gateway must be stripe, vnpay, or payos' }, 400);
  }
  if ((gateway === 'vnpay' || gateway === 'payos') && currency !== 'VND') {
    return c.json({ error: `${gateway} only supports VND` }, 400);
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
      // P0-PAY: Log checkout_created, NOT payment_received — money has NOT arrived yet.
      // payment_received is emitted by the settlement webhook only.
      await logAuditEvent({
        user_id: session.user_id,
        session_id: session.session_id,
        event_type: 'checkout_created',
        actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
        target: price_id,
        result: 'success',
        metadata: { gateway: 'stripe', amount: session_url.amount, currency, checkout_url: session_url.authorize_url },
      });
      // P0-PAY: Record pending ledger entry
      if (c.env.DB) {
        try {
          await c.env.DB.prepare(
            'INSERT OR IGNORE INTO payment_ledger (ledger_id, payment_id, user_id, tenant_id, gateway, price_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            crypto.randomUUID(), session_url.session_id,
            session.user_id, session.tenant_id ?? 'default',
            'stripe', price_id, session_url.amount, currency, 'pending',
          ).run();
        } catch { /* ledger best-effort */ }
      }
      return c.json(session_url);
    } else if (gateway === 'vnpay') {
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
      // P0-PAY: Log checkout_created, NOT payment_received — money has NOT arrived yet.
      await logAuditEvent({
        user_id: session.user_id,
        session_id: session.session_id,
        event_type: 'checkout_created',
        actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
        target: price_id,
        result: 'success',
        metadata: { gateway: 'vnpay', amount: session_url.amount, currency: 'VND', checkout_url: session_url.authorize_url },
      });
      // P0-PAY: Record pending ledger entry
      if (c.env.DB) {
        try {
          await c.env.DB.prepare(
            'INSERT OR IGNORE INTO payment_ledger (ledger_id, payment_id, user_id, tenant_id, gateway, price_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            crypto.randomUUID(), session_url.session_id,
            session.user_id, session.tenant_id ?? 'default',
            'vnpay', price_id, session_url.amount, 'VND', 'pending',
          ).run();
        } catch { /* ledger best-effort */ }
      }
      return c.json(session_url);
    } else {
      // payos — VietQR via pay-gateway.nguyenai.net (merchant of record: KASAN JSC).
      // No payment_received audit here: the money has NOT arrived yet. The
      // settlement webhook (POST /v1/payment/webhook) emits payment_received.
      const session_url = await createPayOsCheckout(
        {
          PAY_GATEWAY_BASE_URL: c.env.PAY_GATEWAY_BASE_URL,
          PAY_GATEWAY_API_KEY: c.env.PAY_GATEWAY_API_KEY ?? '',
          PAY_GATEWAY_TENANT_CODE: c.env.PAY_GATEWAY_TENANT_CODE,
          PAY_GATEWAY_SITE_CODE: c.env.PAY_GATEWAY_SITE_CODE,
          PAY_GATEWAY_PROVIDER: c.env.PAY_GATEWAY_PROVIDER,
          PAY_GATEWAY_CALLBACK_BASE: c.env.PAY_GATEWAY_CALLBACK_BASE,
        },
        req,
        price as any,
      );
      // P0-PAY: Log checkout_created + record pending ledger entry
      await logAuditEvent({
        user_id: session.user_id,
        session_id: session.session_id,
        event_type: 'checkout_created',
        actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
        target: price_id,
        result: 'success',
        metadata: { gateway: 'payos', amount: session_url.amount, currency: 'VND', checkout_url: session_url.authorize_url },
      });
      if (c.env.DB) {
        try {
          await c.env.DB.prepare(
            'INSERT OR IGNORE INTO payment_ledger (ledger_id, payment_id, user_id, tenant_id, gateway, price_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            crypto.randomUUID(), session_url.session_id,
            session.user_id, session.tenant_id ?? 'default',
            'payos', price_id, session_url.amount, 'VND', 'pending',
          ).run();
        } catch { /* ledger best-effort */ }
      }
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
  const stripeEventId = String(event.id ?? '');
  const result = parseStripeEvent(event);

  if (!result) {
    // Event type not payment-related — acknowledge but don't process
    if (stripeEventId) await recordProcessed('stripe', stripeEventId, 'ignored', { received: true, processed: false });
    return c.json({ received: true, processed: false });
  }

  // Replay protection — check if this event was already processed
  const replayKey = stripeEventId || result.gateway_payment_id;
  if (replayKey) {
    const replay = await checkReplay('stripe', replayKey);
    if (replay) {
      return c.json({ ...replay.response_body as object, replayed: true });
    }
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
    metadata: { gateway: 'stripe', amount: result.amount, invoice_id: invoice.invoice_id, event_id: stripeEventId },
  });

  // P0-PAY: Update ledger to paid
  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        'UPDATE payment_ledger SET status = ?, paid_at = ?, gateway_payment_id = ? WHERE payment_id = ?'
      ).bind('paid', new Date().toISOString(), result.gateway_payment_id, result.gateway_payment_id).run();
    } catch { /* ledger best-effort */ }
  }

  // P0-PAY-2: Grant entitlement after successful payment
  try {
    if (result.user_id && result.user_id !== 'unknown') {
      const { grantPaymentEntitlement } = await import('@nai/entitlement');
      const grantResult = await grantPaymentEntitlement(
        result.user_id,
        'default',
        result.price_id,
        'stripe',
        result.gateway_payment_id,
      );
      await logAuditEvent({
        user_id: result.user_id,
        session_id: null,
        event_type: 'entitlement_granted',
        actor_ip: 'webhook',
        user_agent: 'stripe-webhook',
        target: result.price_id,
        result: grantResult.granted ? 'success' : 'failure',
        metadata: { gateway: 'stripe', payment_id: result.gateway_payment_id, grant: grantResult },
      });
    }
  } catch (entErr) {
    console.error('Entitlement grant failed (stripe):', entErr);
    // Don't fail the webhook — payment is confirmed, entitlement can be reconciled
  }

  const response = { received: true, processed: true, payment: result, invoice };
  if (replayKey) await recordProcessed('stripe', replayKey, 'processed', response);
  return c.json(response);
});

// ============================================================
// pay-gateway.nguyenai.net webhook — POST /v1/payment/webhook
// VietQR settlement callback (merchant of record: KASAN JSC).
// HMAC-SHA256 hex over raw body; header x-iai-signature (fallback
// x-webhook-signature). Paid gate: event_type payment.completed | order.paid.
// ============================================================

app.post('/v1/payment/webhook', async (c) => {
  const payload = await c.req.text();
  const signature =
    c.req.header('x-iai-signature') ?? c.req.header('x-webhook-signature') ?? '';

  const valid = await verifyPayOsWebhook(
    { PAY_NAI_HMAC: c.env.PAY_NAI_HMAC ?? '' },
    payload,
    signature,
  );
  if (!valid) return c.json({ error: 'invalid signature' }, 400);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return c.json({ error: 'invalid json' }, 400);
  }

  const result = parsePayOsWebhook(body);
  const payosEventId = String(body.event_id ?? body.order_id ?? '');

  if (!result) {
    // Non-terminal / non-paid event — acknowledge without processing.
    if (payosEventId) await recordProcessed('payos', payosEventId, 'ignored', { received: true, processed: false });
    return c.json({ received: true, processed: false });
  }

  // Replay protection — check if this event was already processed
  const replayKey = payosEventId || result.gateway_payment_id;
  if (replayKey) {
    const replay = await checkReplay('payos', replayKey);
    if (replay) {
      return c.json({ ...replay.response_body as object, replayed: true });
    }
  }

  const invoice = generateInvoice(result, true); // VietQR = VN customer → KASAN JSC VAT 10%

  await logAuditEvent({
    user_id: result.user_id || 'unknown',
    session_id: null,
    event_type: 'payment_received',
    actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
    user_agent: c.req.header('User-Agent') ?? 'unknown',
    target: result.gateway_payment_id,
    result: 'success',
    metadata: {
      gateway: 'payos',
      amount: result.amount,
      invoice_id: invoice.invoice_id,
      event_id: payosEventId,
      merchant: 'KASAN_JSC',
    },
  });

  // P0-PAY: Update ledger to paid
  if (c.env.DB) {
    try {
      await c.env.DB.prepare(
        'UPDATE payment_ledger SET status = ?, paid_at = ?, gateway_payment_id = ? WHERE payment_id = ?'
      ).bind('paid', new Date().toISOString(), result.gateway_payment_id, result.gateway_payment_id).run();
    } catch { /* ledger best-effort */ }
  }

  // P0-PAY-2: Grant entitlement after successful payment
  try {
    if (result.user_id && result.user_id !== 'unknown') {
      const { grantPaymentEntitlement } = await import('@nai/entitlement');
      const grantResult = await grantPaymentEntitlement(
        result.user_id,
        'default',
        result.price_id,
        'payos',
        result.gateway_payment_id,
      );
      await logAuditEvent({
        user_id: result.user_id,
        session_id: null,
        event_type: 'entitlement_granted',
        actor_ip: 'webhook',
        user_agent: 'payos-webhook',
        target: result.price_id,
        result: grantResult.granted ? 'success' : 'failure',
        metadata: { gateway: 'payos', payment_id: result.gateway_payment_id, grant: grantResult },
      });
    }
  } catch (entErr) {
    console.error('Entitlement grant failed (payos):', entErr);
    // Don't fail the webhook — payment is confirmed, entitlement can be reconciled
  }

  const response = { received: true, processed: true, payment: result, invoice };
  if (replayKey) await recordProcessed('payos', replayKey, 'processed', response);
  return c.json(response);
});

// ============================================================
// WI-1.1: Mount route modules — independent operation
// These route files were previously dead code (written but not imported).
// They are now mounted and accessible.
// ============================================================

app.route('/', modelGatewayRoutes);
app.route('/', aiNguyenRoutes);
// ============================================================
// POST /v1/payment/refund — refund a payment (admin only)
// P0-PAY-3: Refund flow with entitlement revocation
// ============================================================

app.post('/v1/payment/refund', paymentRateLimit, async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'authentication required' }, 401);
  if (!session.roles?.includes('ADMIN') && !session.roles?.includes('SUPER_ADMIN')) {
    return c.json({ error: 'admin only' }, 403);
  }

  const body = await c.req.json();
  const { payment_id, gateway, gateway_payment_id, amount, currency, reason, user_id, tenant_id, price_id } = body as {
    payment_id: string;
    gateway: Gateway;
    gateway_payment_id: string;
    amount: number;
    currency: Currency;
    reason: string;
    user_id: string;
    tenant_id: string;
    price_id?: string;
  };

  if (!payment_id || !gateway || !gateway_payment_id || !amount || !reason) {
    return c.json({ error: 'payment_id, gateway, gateway_payment_id, amount, reason are required' }, 400);
  }
  if (!reason.trim()) {
    return c.json({ error: 'reason is required for refund' }, 400);
  }

  // P0-PAY: Look up price_id from ledger if not provided in request
  let resolvedPriceId = price_id;
  if (!resolvedPriceId && c.env.DB) {
    const ledgerRow = await c.env.DB.prepare(
      'SELECT price_id FROM payment_ledger WHERE payment_id = ?1'
    ).bind(payment_id).first<{ price_id: string }>();
    if (ledgerRow?.price_id) {
      resolvedPriceId = ledgerRow.price_id;
    }
  }
  if (!resolvedPriceId) {
    return c.json({ error: 'price_id required (not found in ledger for this payment_id)' }, 400);
  }

  const refundReq: RefundRequest = {
    payment_id,
    gateway,
    gateway_payment_id,
    amount,
    currency,
    reason: reason.trim(),
    user_id: user_id || session.user_id,
    tenant_id: tenant_id || 'default',
  };

  try {
    let refundResult: RefundResult;
    if (gateway === 'stripe') {
      refundResult = await createStripeRefund(
        { STRIPE_SECRET_KEY: c.env.STRIPE_SECRET_KEY },
        refundReq,
      );
    } else if (gateway === 'vnpay') {
      refundResult = await createVnPayRefund(
        {
          VNPAY_TMN_CODE: c.env.VNPAY_TMN_CODE,
          VNPAY_HASH_SECRET: c.env.VNPAY_HASH_SECRET,
        },
        refundReq,
      );
    } else {
      refundResult = await createPayOsRefund(
        {
          PAY_GATEWAY_BASE_URL: c.env.PAY_GATEWAY_BASE_URL ?? '',
          PAY_GATEWAY_API_KEY: c.env.PAY_GATEWAY_API_KEY ?? '',
        },
        refundReq,
      );
    }

    // Revoke entitlement after refund — use resolved price_id, NOT payment_id
    try {
      const { revokePaymentEntitlement } = await import('@nai/entitlement');
      const revokeResult = await revokePaymentEntitlement(
        refundReq.user_id,
        refundReq.tenant_id,
        resolvedPriceId!,
        refundResult.refund_id,
      );
      await logAuditEvent({
        user_id: refundReq.user_id,
        session_id: null,
        event_type: 'entitlement_revoked',
        actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
        target: payment_id,
        result: revokeResult.revoked ? 'success' : 'failure',
        metadata: { refund_id: refundResult.refund_id, gateway, revoke: revokeResult },
      });
    } catch (revErr) {
      console.error('Entitlement revoke failed:', revErr);
    }

    await logAuditEvent({
      user_id: refundReq.user_id,
      session_id: session.session_id,
      event_type: 'payment_refunded',
      actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
      user_agent: c.req.header('User-Agent') ?? 'unknown',
      target: payment_id,
      result: refundResult.status === 'failed' ? 'failure' : 'success',
      metadata: {
        gateway,
        refund_id: refundResult.refund_id,
        amount: refundResult.amount,
        currency: refundResult.currency,
        reason: refundResult.reason,
      },
    });

    // P0-PAY: Update payment ledger with refund result
    if (c.env.DB && refundResult.status !== 'failed') {
      try {
        await c.env.DB.prepare(
          'UPDATE payment_ledger SET status = ?, refunded_at = ?, refund_id = ?, refund_amount = ? WHERE payment_id = ?'
        ).bind(
          refundResult.status === 'refunded' ? 'refunded' : 'partial',
          refundResult.refunded_at ?? new Date().toISOString(),
          refundResult.refund_id,
          refundResult.amount,
          payment_id,
        ).run();
      } catch (ledgerErr) {
        console.error('Ledger update failed:', ledgerErr);
      }
    }

    return c.json(refundResult);
  } catch (err) {
    console.error('Refund creation failed:', err);
    return c.json({ error: 'refund creation failed' }, 502);
  }
});

// ============================================================
// POST /v1/payment/webhook/stripe/refund — Stripe refund webhook
// ============================================================

app.post('/v1/payment/webhook/stripe/refund', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('Stripe-Signature') ?? '';

  const valid = await verifyStripeWebhook(
    { STRIPE_SECRET_KEY: c.env.STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: c.env.STRIPE_WEBHOOK_SECRET },
    payload,
    signature,
  );
  if (!valid) return c.json({ error: 'invalid signature' }, 400);

  const event = JSON.parse(payload) as Record<string, unknown>;
  const stripeEventId = String(event.id ?? '');

  // Replay protection
  if (stripeEventId) {
    const replay = await checkReplay('stripe-refund', stripeEventId);
    if (replay) {
      return c.json({ ...replay.response_body as object, replayed: true });
    }
  }

  const result = parseStripeRefundEvent(event);
  if (!result) {
    if (stripeEventId) await recordProcessed('stripe-refund', stripeEventId, 'ignored', { received: true, processed: false });
    return c.json({ received: true, processed: false });
  }

  await logAuditEvent({
    user_id: 'unknown', // Stripe webhook doesn't always include user_id
    session_id: null,
    event_type: 'payment_refunded',
    actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
    user_agent: c.req.header('User-Agent') ?? 'unknown',
    target: result.original_payment_id,
    result: 'success',
    metadata: {
      gateway: 'stripe',
      refund_id: result.refund_id,
      amount: result.amount,
      event_id: stripeEventId,
    },
  });

  const response = { received: true, processed: true, refund: result };
  if (stripeEventId) await recordProcessed('stripe-refund', stripeEventId, 'processed', response);
  return c.json(response);
});

app.route('/', fallbackRoutes);
app.route('/', incidentRoutes);
app.route('/', selfHealRoutes);
app.route('/', notificationRoutes);
app.route('/', approvalRoutes);
app.route('/v1/scholarship', scholarshipRoutes);
app.route('/v1/investor', investorRoutes);
app.route('/v1/edu', eduRoutes);

export default app;
