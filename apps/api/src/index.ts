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

export default app;
