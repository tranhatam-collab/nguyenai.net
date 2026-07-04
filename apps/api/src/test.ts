/**
 * @nai/api — unit tests
 *
 * Tests the Hono app by simulating requests via app.request().
 * Uses in-memory stores (default in index.ts).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import the app (side-effects: initializes in-memory stores)
import app from './index.ts';

describe('@nai/api', () => {
  it('GET /health returns 200 with service info', async () => {
    const res = await app.request('/health');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'nai-api');
    assert.ok(body.timestamp);
  });

  it('GET /v1/session without cookie returns 401', async () => {
    const res = await app.request('/v1/session');
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'no valid session');
  });

  it('GET /v1/me without session returns 401', async () => {
    const res = await app.request('/v1/me');
    assert.equal(res.status, 401);
  });

  it('GET /v1/plans returns 8 plans from catalog', async () => {
    const res = await app.request('/v1/plans');
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.plans));
    assert.equal(body.plans.length, 8);
  });

  it('GET /v1/audit without SUPER_ADMIN returns 403', async () => {
    const res = await app.request('/v1/audit');
    // No session → 401 (unauthorized) or 403 (forbidden)
    assert.ok(res.status === 401 || res.status === 403);
  });

  it('CORS rejects non-nguyenai.net origin', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'https://evil.com' },
    });
    // Health still returns 200 but CORS header should not allow evil.com
    assert.equal(res.status, 200);
    const acao = res.headers.get('Access-Control-Allow-Origin');
    // Either null or not evil.com
    assert.ok(!acao || acao !== 'https://evil.com');
  });

  it('CORS allows nguyenai.net subdomain', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'https://app.nguyenai.net' },
    });
    assert.equal(res.status, 200);
    const acao = res.headers.get('Access-Control-Allow-Origin');
    assert.equal(acao, 'https://app.nguyenai.net');
  });
});

console.log('=== @nai/api unit tests ===\n');
