/**
 * idempotency.test.ts — Test idempotency middleware via Hono app.
 *
 * Verifies:
 * - Write endpoint without idempotency_key returns 400
 * - Write endpoint with idempotency_key returns 200
 * - Duplicate request with same key returns cached response
 * - GET endpoints are exempt
 * - /health is exempt
 */

import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { idempotencyMiddleware, clearIdempotencyCache } from './idempotency.js';

let passed = 0;
let failed = 0;

function ok(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ ${msg}`);
  }
}

function buildApp(): Hono {
  const app = new Hono();
  app.use('/v1/*', idempotencyMiddleware);

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/v1/session', (c) => c.json({ user_id: 'test' }));
  app.post('/v1/test-write', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    return c.json({ received: true, echo: body }, 200);
  });
  app.post('/v1/auth/test', async (c) => {
    return c.json({ auth: true }, 200);
  });
  app.post('/v1/internal/entitlements/grant', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    return c.json({ granted: true, user_id: body.user_id }, 200);
  });
  return app;
}

async function main(): Promise<void> {
  console.log('=== Idempotency Middleware Tests ===\n');
  clearIdempotencyCache();

  // Test 1: GET /health is exempt (no idempotency_key needed)
  console.log('Test 1: GET /health is exempt');
  {
    const app = buildApp();
    const res = await app.request('http://test/health', { method: 'GET' });
    ok(res.status === 200, `GET /health returns 200 (got ${res.status})`);
  }

  // Test 2: GET /v1/session is exempt
  console.log('Test 2: GET /v1/session is exempt');
  {
    const app = buildApp();
    const res = await app.request('http://test/v1/session', { method: 'GET' });
    ok(res.status === 200, `GET /v1/session returns 200 (got ${res.status})`);
  }

  // Test 3: POST /v1/test-write WITHOUT idempotency_key returns 400
  console.log('Test 3: POST without idempotency_key returns 400');
  {
    const app = buildApp();
    const res = await app.request('http://test/v1/test-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' }),
    });
    ok(res.status === 400, `POST without key returns 400 (got ${res.status})`);
    const body = await res.json() as any;
    ok(body.error.includes('idempotency_key'), `Error mentions idempotency_key: ${body.error}`);
  }

  // Test 4: POST /v1/test-write WITH idempotency_key returns 200
  console.log('Test 4: POST with idempotency_key returns 200');
  {
    const app = buildApp();
    const res = await app.request('http://test/v1/test-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test', idempotency_key: 'test-key-1' }),
    });
    ok(res.status === 200, `POST with key returns 200 (got ${res.status})`);
    const body = await res.json() as any;
    ok(body.received === true, `Response body correct: ${JSON.stringify(body)}`);
  }

  // Test 5: Duplicate request with same key returns cached response
  console.log('Test 5: Duplicate request returns cached response');
  {
    const app = buildApp();
    const res1 = await app.request('http://test/v1/test-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'first', idempotency_key: 'dup-key-1' }),
    });
    ok(res1.status === 200, `First request returns 200`);
    const body1 = await res1.json() as any;
    ok(body1.echo.data === 'first', `First response has data=first: ${body1.echo.data}`);

    const res2 = await app.request('http://test/v1/test-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'second', idempotency_key: 'dup-key-1' }),
    });
    ok(res2.status === 200, `Duplicate request returns 200 (got ${res2.status})`);
    ok(res2.headers.get('X-Idempotent-Replay') === 'true', `Replay header set`);
    const body2 = await res2.json() as any;
    ok(body2.echo.data === 'first', `Duplicate returns cached (first), not second: ${body2.echo.data}`);
  }

  // Test 6: /v1/auth/* is exempt (auth flows use token-based idempotency)
  console.log('Test 6: /v1/auth/* is exempt');
  {
    const app = buildApp();
    const res = await app.request('http://test/v1/auth/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    ok(res.status === 200, `POST /v1/auth/test without key returns 200 (got ${res.status})`);
  }

  // Test 7: Idempotency-Key header also works
  console.log('Test 7: Idempotency-Key header works');
  {
    const app = buildApp();
    const res = await app.request('http://test/v1/test-write', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'header-key-1',
      },
      body: JSON.stringify({ data: 'header-test' }),
    });
    ok(res.status === 200, `POST with header key returns 200 (got ${res.status})`);
  }

  // Test 8: Different keys → different responses (no false cache hits)
  console.log('Test 8: Different keys → different responses');
  {
    const app = buildApp();
    const res1 = await app.request('http://test/v1/test-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'a', idempotency_key: 'key-a' }),
    });
    const res2 = await app.request('http://test/v1/test-write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'b', idempotency_key: 'key-b' }),
    });
    const body1 = await res1.json() as any;
    const body2 = await res2.json() as any;
    ok(body1.echo.data === 'a' && body2.echo.data === 'b', `Different keys → different responses: ${body1.echo.data}, ${body2.echo.data}`);
    ok(res2.headers.get('X-Idempotent-Replay') !== 'true', `Second request not marked as replay`);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    (globalThis as any).process?.exit?.(1);
  }
}

main().catch((err) => {
  console.error('Test runner error:', err);
  (globalThis as any).process?.exit?.(1);
});
