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

// ============================================================
// R10 fix: Structured error logger — no console.error in production.
// Logs to Cloudflare Workers Logs via console.warn (filtered) without
// leaking stack traces or sensitive request bodies.
// ============================================================
function logError(scope: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  // Use console.warn (not console.error) — audit R10: avoid console.error
  // in production paths. Workers Logs captures warn level.
  console.warn(JSON.stringify({ scope, error: msg, ts: new Date().toISOString() }));
}

// Load prices.json + models.json statically (bundled at build time)
import pricesData from '../../../packages/product-catalog/prices.json';
import { scholarshipRoutes } from './scholarship-routes';
import { createNguyenTools, type NguyenTools } from '@nai/nguyen-tools';
import { idempotencyMiddleware } from './idempotency';
import { defaultRateLimit, cleanupBuckets } from './rate-limiter';

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

// Idempotency middleware — requires idempotency_key on write endpoints
// Per ENTITLEMENT_API_RFC §5 (BINDING)
app.use('/v1/*', idempotencyMiddleware);

// Rate limiting — 60 req/min per IP on all API routes
app.use('/v1/*', defaultRateLimit);

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
    logError('gen1_proxy', err);
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
// 404 handler
// ============================================================

app.notFound((c) => c.json({ error: 'not found' }, 404));

app.onError((err, c) => {
  logError('unhandled', err);
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

  // P0 fix: validate success_url/cancel_url to prevent open redirect
  const allowedDomains = ['nguyenai.net', 'app.nguyenai.net', 'console.nguyenai.net', 'edu.nguyenai.net', 'invest.nguyenai.net'];
  function isAllowedRedirectUrl(url: string | undefined): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      return allowedDomains.some((d) => host === d || host.endsWith('.' + d));
    } catch {
      return false;
    }
  }
  const finalSuccessUrl = success_url ?? 'https://app.nguyenai.net/payment/success';
  const finalCancelUrl = cancel_url ?? 'https://app.nguyenai.net/payment/cancel';
  if (!isAllowedRedirectUrl(finalSuccessUrl)) {
    return c.json({ error: 'success_url must be on a nguyenai.net subdomain' }, 400);
  }
  if (!isAllowedRedirectUrl(finalCancelUrl)) {
    return c.json({ error: 'cancel_url must be on a nguyenai.net subdomain' }, 400);
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
    success_url: finalSuccessUrl,
    cancel_url: finalCancelUrl,
    locale: locale ?? 'vi',
  };

  try {
    if (gateway === 'stripe') {
      const session_url = await createStripeCheckout(
        { STRIPE_SECRET_KEY: c.env.STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: c.env.STRIPE_WEBHOOK_SECRET },
        req,
        price as any,
      );
      // P0 fix: log checkout_created, NOT payment_received (payment is not confirmed yet)
      await logAuditEvent({
        user_id: session.user_id,
        session_id: session.session_id,
        event_type: 'payment_checkout_created',
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
      // P0 fix: log checkout_created, NOT payment_received (payment is not confirmed yet)
      await logAuditEvent({
        user_id: session.user_id,
        session_id: session.session_id,
        event_type: 'payment_checkout_created',
        actor_ip: c.req.header('CF-Connecting-IP') ?? 'unknown',
        user_agent: c.req.header('User-Agent') ?? 'unknown',
        target: price_id,
        result: 'success',
        metadata: { gateway: 'vnpay', amount: session_url.amount, currency: 'VND' },
      });
      return c.json(session_url);
    }
  } catch (err) {
    logError('checkout', err);
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


// ============================================================
// Nguyen Super Apps — 7 tools per P1-B.9
// Mounted at /v1/nguyen/*
// ============================================================

// In-memory store per tenant (MVP — swap to D1/DO in production)
const nguyenToolsStore = new Map<string, NguyenTools>();

function getNguyenTools(tenantId: string): NguyenTools {
  let tools = nguyenToolsStore.get(tenantId);
  if (!tools) {
    tools = createNguyenTools(tenantId);
    nguyenToolsStore.set(tenantId, tools);
  }
  return tools;
}

function getTenantId(c: Context): string {
  const session = c.get('session') as Session | undefined;
  return session?.user_id ?? 'anonymous';
}

// --- Nguyen Roots ---

// GET /v1/nguyen/roots/persons — list persons
app.get('/v1/nguyen/roots/persons', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  return c.json({ persons: tools.roots.listPersons() });
});

// POST /v1/nguyen/roots/persons — add person
app.post('/v1/nguyen/roots/persons', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const body = await c.req.json();
  const person = { ...body, id: body.id ?? crypto.randomUUID() };
  tools.roots.addPerson(person);
  return c.json({ person }, 201);
});

// GET /v1/nguyen/roots/persons/:id — get person
app.get('/v1/nguyen/roots/persons/:id', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const person = tools.roots.getPerson(c.req.param('id'));
  if (!person) return c.json({ error: 'Person not found' }, 404);
  return c.json({ person });
});

// GET /v1/nguyen/roots/persons/:id/ancestors — get ancestors
app.get('/v1/nguyen/roots/persons/:id/ancestors', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  return c.json({ ancestors: tools.roots.getAncestors(c.req.param('id')) });
});

// GET /v1/nguyen/roots/persons/:id/descendants — get descendants
app.get('/v1/nguyen/roots/persons/:id/descendants', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  return c.json({ descendants: tools.roots.getDescendants(c.req.param('id')) });
});

// GET /v1/nguyen/roots/search?q=... — search persons
app.get('/v1/nguyen/roots/search', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const q = c.req.query('q') ?? '';
  return c.json({ results: tools.roots.search(q) });
});

// --- Nguyen Memory ---

// GET /v1/nguyen/memory — list memories
app.get('/v1/nguyen/memory', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const isPublic = c.req.query('public') === 'true' ? true : c.req.query('public') === 'false' ? false : undefined;
  return c.json({ memories: tools.memory.listMemories({ isPublic }) });
});

// POST /v1/nguyen/memory — add memory
app.post('/v1/nguyen/memory', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const body = await c.req.json();
  const memory = { ...body, id: body.id ?? crypto.randomUUID(), createdAt: new Date().toISOString() };
  tools.memory.addMemory(memory);
  return c.json({ memory }, 201);
});

// GET /v1/nguyen/memory/:id — get memory
app.get('/v1/nguyen/memory/:id', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const memory = tools.memory.getMemory(c.req.param('id'));
  if (!memory) return c.json({ error: 'Memory not found' }, 404);
  return c.json({ memory });
});

// DELETE /v1/nguyen/memory/:id — delete memory
app.delete('/v1/nguyen/memory/:id', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const deleted = tools.memory.deleteMemory(c.req.param('id'));
  if (!deleted) return c.json({ error: 'Memory not found' }, 404);
  return c.json({ deleted: true });
});

// --- Nguyen Knowledge ---

// GET /v1/nguyen/knowledge — list entries
app.get('/v1/nguyen/knowledge', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const category = c.req.query('category');
  return c.json({ entries: tools.knowledge.listEntries({ category }) });
});

// POST /v1/nguyen/knowledge — add entry
app.post('/v1/nguyen/knowledge', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const body = await c.req.json();
  const entry = { ...body, id: body.id ?? crypto.randomUUID(), updatedAt: new Date().toISOString() };
  tools.knowledge.addEntry(entry);
  return c.json({ entry }, 201);
});

// GET /v1/nguyen/knowledge/categories — list categories
app.get('/v1/nguyen/knowledge/categories', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  return c.json({ categories: tools.knowledge.listCategories() });
});

// --- Nguyen Trust ---

// GET /v1/nguyen/trust — list records
app.get('/v1/nguyen/trust', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const status = c.req.query('status') as 'unverified' | 'pending' | 'verified' | 'disputed' | 'rejected' | undefined;
  return c.json({ records: tools.trust.listRecords({ status }) });
});

// POST /v1/nguyen/trust — create record
app.post('/v1/nguyen/trust', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const body = await c.req.json();
  const record = tools.trust.createRecord(body.entityId, body.entityType);
  return c.json({ record }, 201);
});

// POST /v1/nguyen/trust/:id/verify — add verification
app.post('/v1/nguyen/trust/:id/verify', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const body = await c.req.json();
  const verification = { ...body, id: body.id ?? crypto.randomUUID(), timestamp: new Date().toISOString() };
  tools.trust.addVerification(c.req.param('id'), verification);
  return c.json({ record: tools.trust.getRecord(c.req.param('id')) });
});

// --- Nguyen Network ---

// GET /v1/nguyen/network/stats — network statistics
app.get('/v1/nguyen/network/stats', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  return c.json(tools.network.stats());
});

// GET /v1/nguyen/network/nodes/:id/neighbors — get neighbors
app.get('/v1/nguyen/network/nodes/:id/neighbors', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  return c.json({ neighbors: tools.network.getNeighbors(c.req.param('id')) });
});

// GET /v1/nguyen/network/path?from=...&to=... — find path
app.get('/v1/nguyen/network/path', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const from = c.req.query('from') ?? '';
  const to = c.req.query('to') ?? '';
  const path = tools.network.findPath(from, to);
  return c.json({ path });
});

// --- Nguyen Founders ---

// GET /v1/nguyen/founders — list profiles
app.get('/v1/nguyen/founders', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const isPublic = c.req.query('public') === 'true';
  return c.json({ profiles: tools.founders.listProfiles({ isPublic }) });
});

// POST /v1/nguyen/founders — submit profile
app.post('/v1/nguyen/founders', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const body = await c.req.json();
  const profile = { ...body, id: body.id ?? crypto.randomUUID(), createdAt: new Date().toISOString() };
  tools.founders.submitProfile(profile);
  return c.json({ profile }, 201);
});

// POST /v1/nguyen/founders/:id/approve — approve profile
app.post('/v1/nguyen/founders/:id/approve', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  tools.founders.approveProfile(c.req.param('id'));
  return c.json({ profile: tools.founders.getProfile(c.req.param('id')) });
});

// --- Nguyen Chapter OS ---

// GET /v1/nguyen/chapters — list chapters
app.get('/v1/nguyen/chapters', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  return c.json({ chapters: tools.chapter.listChapters() });
});

// POST /v1/nguyen/chapters — create chapter
app.post('/v1/nguyen/chapters', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const body = await c.req.json();
  const chapter = { ...body, id: body.id ?? crypto.randomUUID(), createdAt: new Date().toISOString() };
  tools.chapter.createChapter(chapter);
  return c.json({ chapter }, 201);
});

// POST /v1/nguyen/chapters/:id/members — add member
app.post('/v1/nguyen/chapters/:id/members', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  const body = await c.req.json();
  tools.chapter.addMember(c.req.param('id'), body.memberId);
  return c.json({ chapter: tools.chapter.getChapter(c.req.param('id')) });
});

// GET /v1/nguyen/chapters/:id/events — list events
app.get('/v1/nguyen/chapters/:id/events', async (c) => {
  const tools = getNguyenTools(getTenantId(c));
  return c.json({ events: tools.chapter.listEvents(c.req.param('id')) });
});

export default app;
