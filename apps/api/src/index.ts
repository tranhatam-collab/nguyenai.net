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
  getEntitlementStore,
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
  chat as prismChat,
  type ModelDescriptor,
} from '@nai/prism';
import { recordEvidence, getEvidenceForCommand } from '@nai/evidence';
import {
  writeMemory,
  readMemory,
  listMemory,
  deleteMemory,
  type MemoryType,
} from '@nai/relic';
import {
  InMemoryProofStore,
  setProofStore,
  getProofStore,
  generateCertificateId,
  verifyCertificateId,
  type Proof,
  type Certificate,
  type ReviewerResult,
  type ReviewDecision,
} from '@nai/proof';

// Scholarship routes (Sprint 1 — 21 endpoints per EDU_MASTER_PLAN_V4 §XXXV)
import { scholarshipRoutes } from './scholarship-routes';

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
    GEN1_GATEWAY_URL: string;
    GEN1_ADMIN_KEY?: string;
    // Phase 3 — evidence signing secret (HMAC-SHA256 for evidence packs)
    EVIDENCE_SIGNING_KEY: string;
    // Phase 3 — LLM provider mode: 'gen1' | 'mock'
    LLM_PROVIDER_MODE?: string;
  };
  Variables: {
    session: Session | null;
  };
}

const app = new Hono<AppEnv>();

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
  setProofStore(new InMemoryProofStore());

  // Phase 3 — initialize LLM platform (prism)
  // Load model registry from product-catalog models.json (bundled at build time)
  setPrismModelRegistry(modelsData as unknown as ModelDescriptor[]);

  // Configure LLM provider: 'gen1' (default) or 'mock' (for tests/dev)
  const mode = env.LLM_PROVIDER_MODE ?? 'gen1';
  if (mode === 'mock') {
    configureMockProvider();
  } else if (env.GEN1_GATEWAY_URL) {
    configureGen1Adapter({
      baseUrl: env.GEN1_GATEWAY_URL,
      adminKey: env.GEN1_ADMIN_KEY,
    });
  } else {
    // No GEN1 URL configured — fall back to mock so the API still responds.
    configureMockProvider();
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
// Service-write entitlements — POST /v1/internal/entitlements/{grant,revoke,recalculate}
// Per ENTITLEMENT_API_RFC §3.3 — service-authenticated only (X-Service-Key + IP allowlist)
// All write endpoints require idempotency_key (return 400 if missing)
// ============================================================

const SERVICE_KEY = (env: any): string | null => env?.SERVICE_KEY ?? null;
// IP allowlist — empty in dev means allow all; production must set
const SERVICE_IP_ALLOWLIST = (env: any): string[] | null => {
  const raw: string = env?.SERVICE_IP_ALLOWLIST ?? '';
  return raw ? raw.split(',').map((s: string) => s.trim()).filter(Boolean) : null;
};

async function verifyServiceAuth(c: Context): Promise<{ ok: boolean; error?: string; status?: number }> {
  const key = c.req.header('X-Service-Key');
  if (!key) return { ok: false, error: 'X-Service-Key header required', status: 401 };
  const expected = SERVICE_KEY((c as any).env);
  if (!expected) return { ok: false, error: 'service auth not configured', status: 500 };
  if (key !== expected) return { ok: false, error: 'invalid service key', status: 401 };

  const allowlist = SERVICE_IP_ALLOWLIST((c as any).env);
  if (allowlist && allowlist.length > 0) {
    const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? '';
    if (!allowlist.includes(ip)) return { ok: false, error: 'IP not allowed', status: 403 };
  }
  return { ok: true };
}

// Idempotency cache — uses KV in production; in-memory fallback for dev/tests
const idempotencyCache = new Map<string, { result: unknown; status: number; expires_at: number }>();

async function checkIdempotency(key: string): Promise<{ result: unknown; status: number } | null> {
  const cached = idempotencyCache.get(key);
  if (cached && cached.expires_at > Date.now()) {
    return { result: cached.result, status: cached.status };
  }
  if (cached) idempotencyCache.delete(key);
  return null;
}

async function storeIdempotency(key: string, result: unknown, status: number): Promise<void> {
  // 24h retention
  idempotencyCache.set(key, { result, status, expires_at: Date.now() + 24 * 60 * 60 * 1000 });
}

app.post('/v1/internal/entitlements/grant', async (c) => {
  const auth = await verifyServiceAuth(c);
  if (!auth.ok) return c.json({ error: auth.error }, (auth.status ?? 401) as any);

  const body = await c.req.json().catch(() => ({}));
  const { user_id, entitlement_key, value, source, idempotency_key, reason } = body ?? {};
  if (!user_id || !entitlement_key) {
    return c.json({ error: 'user_id and entitlement_key required' }, 400);
  }
  if (!idempotency_key) {
    return c.json({ error: 'idempotency_key required (per ENTITLEMENT_API_RFC §5)' }, 400);
  }

  // Idempotency check
  const cached = await checkIdempotency(`grant:${idempotency_key}`);
  if (cached) return c.json(cached.result, cached.status as any);

  const store = getEntitlementStore();
  const existing = await store.getEntitlements(user_id, '');
  const alreadyGranted = existing.find(
    (r) => r.key === entitlement_key && r.value === value && r.revoked_at === null
  );
  if (alreadyGranted) {
    const result = { entitlement_id: alreadyGranted.entitlement_id, granted_at: alreadyGranted.granted_at, already_granted: true };
    await storeIdempotency(`grant:${idempotency_key}`, result, 200);
    return c.json(result, 200);
  }

  const entitlementId = await store.grant({
    user_id,
    tenant_id: '',
    key: entitlement_key,
    value,
    source: source ?? 'service',
    granted_by: 'service',
    granted_at: new Date().toISOString(),
    expires_at: null,
    revoked_at: null,
  } as any);

  await logAuditEvent({
    user_id,
    tenant_id: '',
    session_id: null,
    event_type: 'entitlement_granted',
    actor_ip: c.req.header('CF-Connecting-IP') ?? null,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `entitlement:${entitlementId}`,
    result: 'success',
    metadata: { entitlement_key, value, source, reason, idempotency_key },
  });

  const result = { entitlement_id: entitlementId, granted_at: new Date().toISOString() };
  await storeIdempotency(`grant:${idempotency_key}`, result, 200);
  return c.json(result, 200);
});

app.post('/v1/internal/entitlements/revoke', async (c) => {
  const auth = await verifyServiceAuth(c);
  if (!auth.ok) return c.json({ error: auth.error }, (auth.status ?? 401) as any);

  const body = await c.req.json().catch(() => ({}));
  const { user_id, entitlement_key, revoked_by, reason, idempotency_key } = body ?? {};
  if (!user_id || !entitlement_key) {
    return c.json({ error: 'user_id and entitlement_key required' }, 400);
  }
  if (!idempotency_key) {
    return c.json({ error: 'idempotency_key required (per ENTITLEMENT_API_RFC §5)' }, 400);
  }

  const cached = await checkIdempotency(`revoke:${idempotency_key}`);
  if (cached) return c.json(cached.result, cached.status as any);

  const store = getEntitlementStore();
  const existing = await store.getEntitlements(user_id, '');
  const target = existing.find((r) => r.key === entitlement_key && r.revoked_at === null);
  if (!target) {
    const result = { error: 'not_found' };
    await storeIdempotency(`revoke:${idempotency_key}`, result, 404);
    return c.json(result, 404);
  }

  await store.revoke(target.entitlement_id, revoked_by ?? 'service');

  await logAuditEvent({
    user_id,
    tenant_id: '',
    session_id: null,
    event_type: 'entitlement_revoked',
    actor_ip: c.req.header('CF-Connecting-IP') ?? null,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `entitlement:${target.entitlement_id}`,
    result: 'success',
    metadata: { entitlement_key, revoked_by, reason, idempotency_key },
  });

  const result = { revoked_at: new Date().toISOString() };
  await storeIdempotency(`revoke:${idempotency_key}`, result, 200);
  return c.json(result, 200);
});

app.post('/v1/internal/entitlements/recalculate', async (c) => {
  const auth = await verifyServiceAuth(c);
  if (!auth.ok) return c.json({ error: auth.error }, (auth.status ?? 401) as any);

  const body = await c.req.json().catch(() => ({}));
  const { user_id, trigger, idempotency_key } = body ?? {};
  if (!user_id) return c.json({ error: 'user_id required' }, 400);
  if (!idempotency_key) {
    return c.json({ error: 'idempotency_key required (per ENTITLEMENT_API_RFC §5)' }, 400);
  }

  const cached = await checkIdempotency(`recalc:${idempotency_key}`);
  if (cached) return c.json(cached.result, cached.status as any);

  // Recalculation: re-resolve entitlements from plan (no-op if no plan change)
  // For now, this is a placeholder that records the trigger and returns empty changes
  // Production should re-read plan from org membership and diff against current entitlements
  const changes: unknown[] = [];

  await logAuditEvent({
    user_id,
    tenant_id: '',
    session_id: null,
    event_type: 'entitlement_recalculated',
    actor_ip: c.req.header('CF-Connecting-IP') ?? null,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `user:${user_id}`,
    result: 'success',
    metadata: { trigger, changes_count: changes.length, idempotency_key },
  });

  const result = { recalculated_at: new Date().toISOString(), changes };
  await storeIdempotency(`recalc:${idempotency_key}`, result, 200);
  return c.json(result, 200);
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

// POST /v1/chat — proxy to Gen1 /v1/chat
app.post('/v1/chat', (c) => proxyToGen1(c, '/v1/chat', 'POST'));

// POST /v1/stream — proxy to Gen1 /v1/stream (SSE passthrough)
app.post('/v1/stream', (c) => proxyToGen1(c, '/v1/stream', 'POST'));

// GET /v1/gen1/models — list Gen1 native models (separate from local catalog)
app.get('/v1/gen1/models', (c) => proxyToGen1(c, '/v1/models', 'GET'));

// GET /v1/gen1/health — check Gen1 upstream health
app.get('/v1/gen1/health', (c) => proxyToGen1(c, '/v1/health', 'GET'));

// GET /v1/gen1/quota — check Gen1 quota for current session
app.get('/v1/gen1/quota', (c) => proxyToGen1(c, '/v1/quota', 'GET'));

// GET /v1/gen1/tos — fetch Gen1 Terms of Service
app.get('/v1/gen1/tos', (c) => proxyToGen1(c, '/v1/tos', 'GET'));

// POST /v1/gen1/tos/accept — accept Gen1 TOS on behalf of user
app.post('/v1/gen1/tos/accept', (c) => proxyToGen1(c, '/v1/tos/accept', 'POST'));

// POST /v1/workflows — proxy to Gen1 /v1/workflows
app.post('/v1/workflows', (c) => proxyToGen1(c, '/v1/workflows', 'POST'));

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
    }, c.env.EVIDENCE_SIGNING_KEY ?? 'dev-evidence-key');
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
    }, c.env.EVIDENCE_SIGNING_KEY ?? 'dev-evidence-key');
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

app.post('/v1/payment/checkout', async (c) => {
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
// Scholarship routes — 21 endpoints per EDU_MASTER_PLAN_V4 §XXXV
// Mounted at /v1/scholarship/*
// ============================================================

app.route('/v1/scholarship', scholarshipRoutes);

// ============================================================
// Proof & Certification — 8 endpoints per PROOF_AND_CERTIFICATION_RFC §3
// ============================================================

// POST /v1/me/proofs — submit proof (session + academy.pass/preview)
app.post('/v1/me/proofs', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const { program_id, evidence_refs, attempt_id } = await c.req.json().catch(() => ({}));
  if (!program_id || !Array.isArray(evidence_refs)) {
    return c.json({ error: 'program_id and evidence_refs[] required' }, 400);
  }

  const store = getProofStore();
  const proofId = await store.createProof({
    proof_id: '',
    user_id: session.user_id,
    program_id,
    attempt_id: attempt_id ?? null,
    submitted_at: new Date().toISOString(),
    evidence_refs,
    rubric_scores: null,
    ai_review: null,
    human_review: null,
    certificate_id: null,
  });

  await logAuditEvent({
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    session_id: session.session_id,
    event_type: 'proof_submitted' as any,
    actor_ip: c.req.header('CF-Connecting-IP') ?? null,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `proof:${proofId}`,
    result: 'success',
    metadata: { program_id, evidence_refs_count: evidence_refs.length },
  });

  return c.json({ proof_id: proofId, status: 'submitted' }, 201);
});

// GET /v1/me/proofs — list user's proofs
app.get('/v1/me/proofs', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const store = getProofStore();
  const proofs = await store.getProofsByUser(session.user_id);
  return c.json({
    proofs: proofs.map((p) => ({
      proof_id: p.proof_id,
      program_id: p.program_id,
      status: p.status,
      submitted_at: p.submitted_at,
    })),
  });
});

// GET /v1/me/proofs/:proof_id — get proof detail
app.get('/v1/me/proofs/:proof_id', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const proofId = c.req.param('proof_id');
  const store = getProofStore();
  const proof = await store.getProof(proofId);
  if (!proof) return c.json({ error: 'not found' }, 404);
  if (proof.user_id !== session.user_id) return c.json({ error: 'forbidden' }, 403);

  return c.json({
    proof_id: proof.proof_id,
    status: proof.status,
    rubric_scores: proof.rubric_scores,
    ai_review: proof.ai_review,
    human_review: proof.human_review,
    certificate_id: proof.certificate_id,
  });
});

// GET /v1/me/certificates — list user's certificates
app.get('/v1/me/certificates', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const store = getProofStore();
  const certs = await store.getCertificatesByUser(session.user_id);
  return c.json({
    certificates: certs.map((cert) => ({
      certificate_id: cert.certificate_id,
      program_id: cert.program_id,
      issued_at: cert.issued_at,
      status: cert.status,
    })),
  });
});

// GET /v1/review/queue — reviewer: list pending proofs
app.get('/v1/review/queue', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);
  // TODO: check reviewer.certified permission — for now any authenticated user
  // Production: check session.permissions includes 'reviewer.certified'

  const store = getProofStore();
  const queue = await store.getReviewQueue();
  return c.json({
    queue: queue.map((p) => ({
      proof_id: p.proof_id,
      user_id: p.user_id,
      program_id: p.program_id,
      submitted_at: p.submitted_at,
      ai_review: p.ai_review,
    })),
  });
});

// POST /v1/review/:proof_id/decision — reviewer: approve/reject/request_changes
app.post('/v1/review/:proof_id/decision', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);

  const proofId = c.req.param('proof_id');
  const { decision, scores, notes } = await c.req.json().catch(() => ({}));
  if (!decision || !['approve', 'reject', 'request_changes'].includes(decision)) {
    return c.json({ error: 'decision must be approve|reject|request_changes' }, 400);
  }

  const store = getProofStore();
  const proof = await store.getProof(proofId);
  if (!proof) return c.json({ error: 'proof not found' }, 404);

  const review: ReviewerResult = {
    reviewer_id: session.user_id,
    reviewer_type: 'human',
    reviewed_at: new Date().toISOString(),
    decision: decision as ReviewDecision,
    scores: scores ?? {},
    notes: notes ?? '',
  };

  await store.recordReview(proofId, review);

  let certificateId: string | null = null;
  if (decision === 'approve') {
    // Issue certificate
    const year = new Date().getFullYear();
    const sequence = await store.getNextSequence(proof.program_id, year);
    certificateId = await store.issueCertificate({
      user_id: proof.user_id,
      program_id: proof.program_id,
      proof_id: proofId,
      issued_by: session.user_id,
      public_visible: true,
      user_display_name: null,
      program: proof.program_id,
      year,
      sequence,
    });

    // Link certificate to proof
    await store.updateProofStatus(proofId, 'approved', { certificate_id: certificateId });

    await logAuditEvent({
      user_id: session.user_id,
      tenant_id: session.tenant_id,
      session_id: session.session_id,
      event_type: 'certificate_issued' as any,
      actor_ip: c.req.header('CF-Connecting-IP') ?? null,
      user_agent: c.req.header('User-Agent') ?? null,
      target: `certificate:${certificateId}`,
      result: 'success',
      metadata: { proof_id: proofId, program_id: proof.program_id, recipient_user_id: proof.user_id },
    });
  }

  return c.json({ proof_id: proofId, decision, certificate_id: certificateId });
});

// GET /v1/certificates/:certificate_id — public verification (no auth, no PII)
app.get('/v1/certificates/:certificate_id', async (c) => {
  const certificateId = c.req.param('certificate_id');

  // Verify format
  if (!verifyCertificateId(certificateId)) {
    return c.json({ error: 'invalid certificate ID format' }, 400);
  }

  const store = getProofStore();
  const cert = await store.getCertificate(certificateId);
  if (!cert) return c.json({ error: 'not_found' }, 404);
  if (!cert.public_visible) return c.json({ error: 'not_found' }, 404);

  // Public response — NO PII (per RFC §2.10)
  return c.json({
    certificate_id: cert.certificate_id,
    program_id: cert.program_id,
    issued_at: cert.issued_at,
    status: cert.status,
    user_display_name: cert.user_display_name,
  }, 200, {
    'Cache-Control': 'public, max-age=3600', // CDN cache 1 hour per RFC
  });
});

// POST /v1/internal/certificates/:certificate_id/revoke — admin/service only
app.post('/v1/internal/certificates/:certificate_id/revoke', async (c) => {
  const auth = await verifyServiceAuth(c);
  if (!auth.ok) return c.json({ error: auth.error }, (auth.status ?? 401) as any);

  const certificateId = c.req.param('certificate_id');
  const { reason, revoked_by } = await c.req.json().catch(() => ({}));
  if (!reason || reason.length < 20) {
    return c.json({ error: 'reason required (min 20 chars) per RFC §2.9' }, 400);
  }

  const store = getProofStore();
  const cert = await store.getCertificate(certificateId);
  if (!cert) return c.json({ error: 'not_found' }, 404);
  if (cert.status === 'revoked') return c.json({ error: 'already revoked' }, 409);

  await store.revokeCertificate(certificateId, reason, revoked_by ?? 'service');

  await logAuditEvent({
    user_id: revoked_by ?? 'service',
    tenant_id: '',
    session_id: null,
    event_type: 'certificate_revoked' as any,
    actor_ip: c.req.header('CF-Connecting-IP') ?? null,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `certificate:${certificateId}`,
    result: 'success',
    metadata: { reason, revoked_by },
  });

  return c.json({ revoked_at: new Date().toISOString() });
});

// ============================================================
// Investor private room — 5 endpoints per INVESTOR_ACCESS_POLICY §9-11
// All require session + invest:private-read permission + audit
// ============================================================

// GET /v1/investor/me — current investor's access grant + scopes
app.get('/v1/investor/me', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);
  if (!session.permissions.includes('invest:private-read')) {
    return c.json({ error: 'forbidden — no investor access' }, 403);
  }

  // TODO: load investor_grant from store — placeholder returns session-derived data
  return c.json({
    user_id: session.user_id,
    permissions: session.permissions.filter((p: string) => p.startsWith('invest:')),
    grant: {
      grant_id: `grant-${session.user_id}`,
      room_scope: session.permissions.filter((p: string) => p.startsWith('invest:') && p !== 'invest:private-read'),
      expires_at: null, // TODO: load from investor grant store
      suspended: false,
    },
  });
});

// GET /v1/investor/documents — list private documents available to this investor
app.get('/v1/investor/documents', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);
  if (!session.permissions.includes('invest:private-read')) {
    return c.json({ error: 'forbidden — no investor access' }, 403);
  }

  // TODO: load from document store — placeholder returns static list
  const documents = [
    { document_id: 'cap-table-2026-q3', name: 'Cap Table 2026 Q3', scope: 'cap-table', size_bytes: 245678, updated_at: '2026-07-01T00:00:00Z' },
    { document_id: 'financial-model-2026', name: 'Financial Model 2026', scope: 'invest:financial-read', size_bytes: 1892344, updated_at: '2026-07-02T00:00:00Z' },
    { document_id: 'contracts-index', name: 'Contracts Index', scope: 'contracts', size_bytes: 45123, updated_at: '2026-06-15T00:00:00Z' },
    { document_id: 'ip-portfolio', name: 'IP Portfolio', scope: 'ip', size_bytes: 234567, updated_at: '2026-06-20T00:00:00Z' },
  ];

  // Filter by user's scopes (room_scope strings, not Permission type)
  const userPerms: string[] = session.permissions as string[];
  const visibleDocs = documents.filter((d) => {
    if (d.scope === 'cap-table') return userPerms.includes('cap-table');
    if (d.scope === 'invest:financial-read') return userPerms.includes('invest:financial-read');
    if (d.scope === 'contracts') return userPerms.includes('contracts');
    if (d.scope === 'ip') return userPerms.includes('ip');
    return false;
  });

  return c.json({ documents: visibleDocs });
});

// GET /v1/investor/documents/:document_id/download — download private document
// Per INVESTOR_ACCESS_POLICY §8: requires invest:download permission + audit
app.get('/v1/investor/documents/:document_id/download', async (c) => {
  const session = c.get('session');
  if (!session) return c.json({ error: 'unauthorized' }, 401);
  if (!session.permissions.includes('invest:private-read')) {
    return c.json({ error: 'forbidden — no investor access' }, 403);
  }
  if (!session.permissions.includes('invest:download')) {
    return c.json({ error: 'forbidden — no download permission' }, 403);
  }

  const documentId = c.req.param('document_id');
  const ip = c.req.header('CF-Connecting-IP') ?? null;

  // Audit the download (per §8: every document download must be audited)
  await logAuditEvent({
    user_id: session.user_id,
    tenant_id: session.tenant_id,
    session_id: session.session_id,
    event_type: 'investor_document_downloaded' as any,
    actor_ip: ip,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `document:${documentId}`,
    result: 'success',
    metadata: { document_id: documentId, ip },
  });

  // TODO: stream actual document from R2 — placeholder returns signed URL
  return c.json({
    document_id: documentId,
    download_url: `https://r2.nguyenai.net/private/${documentId}?token=placeholder`,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
});

// POST /v1/audit/investor-access — record investor private room access event
// Called by invest.nguyenai.net middleware
app.post('/v1/audit/investor-access', async (c) => {
  const session = c.get('session');
  // Allow internal calls (from invest middleware) with session
  if (!session) {
    // Allow service-authenticated calls
    const auth = await verifyServiceAuth(c);
    if (!auth.ok) return c.json({ error: auth.error }, (auth.status ?? 401) as any);
  }

  const { event_type, user_id, route, ip, user_agent } = await c.req.json().catch(() => ({}));
  if (!event_type || !route) {
    return c.json({ error: 'event_type and route required' }, 400);
  }

  await logAuditEvent({
    user_id: user_id ?? session?.user_id ?? 'unknown',
    tenant_id: session?.tenant_id ?? '',
    session_id: session?.session_id ?? null,
    event_type: event_type as any,
    actor_ip: ip ?? c.req.header('CF-Connecting-IP') ?? null,
    user_agent: user_agent ?? c.req.header('User-Agent') ?? null,
    target: `route:${route}`,
    result: event_type === 'private_route_denied' ? 'failure' : 'success',
    metadata: { route },
  });

  return c.json({ recorded: true });
});

// POST /v1/investor-interest — request access form submission
// Per INVESTOR_ACCESS_POLICY §10 (LOCKED): submit to real backend, store in Postgres, email verification
app.post('/v1/investor-interest', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { full_name, email, company, jurisdiction, intended_investment_size_range, message, consent_to_contact } = body ?? {};

  if (!full_name || !email || !jurisdiction || !intended_investment_size_range) {
    return c.json({ error: 'full_name, email, jurisdiction, intended_investment_size_range required' }, 400);
  }
  if (!consent_to_contact) {
    return c.json({ error: 'consent_to_contact must be true' }, 400);
  }

  // Rate limit: max 3 per 24h per email (per §10.2)
  // TODO: implement with KV — placeholder allows all
  const ip = c.req.header('CF-Connecting-IP') ?? null;

  // Store submission (TODO: insert into Postgres investor_interest table)
  const submissionId = crypto.randomUUID();

  await logAuditEvent({
    user_id: email,
    tenant_id: '',
    session_id: null,
    event_type: 'investor_interest_submitted' as any,
    actor_ip: ip,
    user_agent: c.req.header('User-Agent') ?? null,
    target: `submission:${submissionId}`,
    result: 'success',
    metadata: { full_name, email, company, jurisdiction, intended_investment_size_range },
  });

  // TODO: send verification email via @nai/email
  // For now, return submission ID — production must wire email verification flow

  return c.json({
    submission_id: submissionId,
    status: 'received',
    next_step: 'check email for verification link',
  }, 202);
});

export default app;
