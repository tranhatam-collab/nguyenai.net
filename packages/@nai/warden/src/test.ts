/**
 * @nai/warden — Security policy engine unit tests.
 */
import {
  evaluatePolicies,
  RateLimiter,
  IpAllowList,
  createPolicy,
  validatePolicy,
  type Policy,
  type RequestContext,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

function baseContext(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    ip: '203.0.113.5',
    path: '/api/data',
    method: 'GET',
    headers: { 'user-agent': 'Mozilla/5.0' },
    timestamp: Date.now(),
    ...overrides,
  };
}

async function main(): Promise<void> {
  // --- Policy evaluation -------------------------------------------------

  // 1. Default allow when no policies match
  {
    const res = evaluatePolicies([], baseContext());
    assert(res.action === 'allow' && res.matchedPolicy === undefined,
      'empty policy list defaults to allow with no matched policy');
  }

  // 2. IP rule with equals operator — deny match
  {
    const p: Policy = {
      id: 'p1', name: 'block-bad-ip', priority: 10, action: 'deny',
      rules: [{ type: 'ip', value: '203.0.113.5' }],
    };
    const res = evaluatePolicies([p], baseContext({ ip: '203.0.113.5' }));
    assert(res.action === 'deny' && res.matchedPolicy?.id === 'p1',
      'ip equals rule denies matching IP');
  }

  // 3. IP rule does not match a different IP
  {
    const p: Policy = {
      id: 'p1', name: 'block-bad-ip', priority: 10, action: 'deny',
      rules: [{ type: 'ip', value: '203.0.113.5' }],
    };
    const res = evaluatePolicies([p], baseContext({ ip: '198.51.100.1' }));
    assert(res.action === 'allow', 'non-matching IP falls through to allow');
  }

  // 4. Priority ordering — highest priority wins
  {
    const low: Policy = {
      id: 'low', name: 'low', priority: 1, action: 'challenge',
      rules: [{ type: 'method', value: 'GET' }],
    };
    const high: Policy = {
      id: 'high', name: 'high', priority: 100, action: 'deny',
      rules: [{ type: 'method', value: 'GET' }],
    };
    const res = evaluatePolicies([low, high], baseContext());
    assert(res.action === 'deny' && res.matchedPolicy?.id === 'high',
      'higher priority policy wins over lower priority');
  }

  // 5. Path contains operator
  {
    const p: Policy = {
      id: 'admin', name: 'admin-protect', priority: 5, action: 'challenge',
      rules: [{ type: 'path', value: '/admin', operator: 'contains' }],
    };
    const res = evaluatePolicies([p], baseContext({ path: '/admin/users' }));
    assert(res.action === 'challenge', 'path contains rule matches substring');
  }

  // 6. Method equals (case-insensitive)
  {
    const p: Policy = {
      id: 'post-only', name: 'post-only', priority: 5, action: 'deny',
      rules: [{ type: 'method', value: 'post' }],
    };
    const res = evaluatePolicies([p], baseContext({ method: 'POST' }));
    assert(res.action === 'deny', 'method rule matches case-insensitively');
  }

  // 7. Header presence match
  {
    const p: Policy = {
      id: 'curl', name: 'block-curl', priority: 5, action: 'deny',
      rules: [{ type: 'header', value: 'User-Agent:curl', operator: 'contains' }],
    };
    const res = evaluatePolicies([p], baseContext({ headers: { 'user-agent': 'curl/8.0' } }));
    assert(res.action === 'deny', 'header rule matches header value via contains');
  }

  // 8. Header presence-only (no expected value)
  {
    const p: Policy = {
      id: 'auth-required', name: 'auth-required', priority: 5, action: 'challenge',
      rules: [{ type: 'header', value: 'Authorization' }],
    };
    const withAuth = evaluatePolicies([p], baseContext({ headers: { authorization: 'Bearer x' } }));
    const withoutAuth = evaluatePolicies([p], baseContext({ headers: {} }));
    assert(withAuth.action === 'challenge' && withoutAuth.action === 'allow',
      'header presence-only rule matches when header exists, allows when absent');
  }

  // 9. Country rule with `in` operator
  {
    const p: Policy = {
      id: 'geo', name: 'geo-block', priority: 5, action: 'deny',
      rules: [{ type: 'country', value: 'CN,RU,KP', operator: 'in' }],
    };
    const blocked = evaluatePolicies([p], baseContext({ country: 'CN' }));
    const allowed = evaluatePolicies([p], baseContext({ country: 'US' }));
    assert(blocked.action === 'deny' && allowed.action === 'allow',
      'country in-operator matches listed countries, allows others');
  }

  // 10. Multiple rules AND semantics
  {
    const p: Policy = {
      id: 'and', name: 'and', priority: 5, action: 'deny',
      rules: [
        { type: 'method', value: 'POST' },
        { type: 'path', value: '/api/login', operator: 'contains' },
      ],
    };
    const both = evaluatePolicies([p], baseContext({ method: 'POST', path: '/api/login' }));
    const one = evaluatePolicies([p], baseContext({ method: 'GET', path: '/api/login' }));
    assert(both.action === 'deny' && one.action === 'allow',
      'multiple rules require all to match (AND semantics)');
  }

  // 11. Path regex (matches operator)
  {
    const p: Policy = {
      id: 'regex', name: 'regex', priority: 5, action: 'deny',
      rules: [{ type: 'path', value: '^/api/v[0-9]+/secret', operator: 'matches' }],
    };
    const match = evaluatePolicies([p], baseContext({ path: '/api/v2/secret/data' }));
    const noMatch = evaluatePolicies([p], baseContext({ path: '/api/secret' }));
    assert(match.action === 'deny' && noMatch.action === 'allow',
      'path matches-operator uses RegExp anchoring');
  }

  // --- RateLimiter -------------------------------------------------------

  // 12. Rate limiter allows under limit, blocks over limit
  {
    const rl = new RateLimiter(3, 1000);
    const a = rl.check('k1');
    const b = rl.check('k1');
    const c = rl.check('k1');
    const d = rl.check('k1');
    assert(a.allowed && b.allowed && c.allowed && !d.allowed,
      'rate limiter allows up to max then blocks');
  }

  // 13. Rate limiter remaining count and resetAt
  {
    const rl = new RateLimiter(5, 500);
    const r1 = rl.check('k2');
    assert(r1.remaining === 4 && r1.resetAt > Date.now(),
      'rate limiter reports remaining and future resetAt');
  }

  // 14. Rate limiter independent keys
  {
    const rl = new RateLimiter(1, 1000);
    const x = rl.check('keyX');
    const y = rl.check('keyY');
    assert(x.allowed && y.allowed,
      'rate limiter tracks keys independently');
  }

  // --- IpAllowList -------------------------------------------------------

  // 15. Single IP allow list
  {
    const list = new IpAllowList();
    list.add('10.0.0.5');
    assert(list.check('10.0.0.5') && !list.check('10.0.0.6'),
      'single IP allow list matches exact IP only');
  }

  // 16. CIDR matching
  {
    const list = new IpAllowList();
    list.add('192.168.1.0/24');
    assert(list.check('192.168.1.0') && list.check('192.168.1.255') && !list.check('192.168.2.1'),
      'CIDR /24 matches range and rejects outside');
  }

  // 17. CIDR /16 and /32
  {
    const list = new IpAllowList();
    list.add('172.16.0.0/16');
    list.add('8.8.8.8/32');
    assert(list.check('172.16.5.5') && list.check('172.16.255.255') && !list.check('172.17.0.1'),
      'CIDR /16 matches wide range');
    assert(list.check('8.8.8.8') && !list.check('8.8.8.9'),
      'CIDR /32 matches single IP only');
  }

  // 18. Remove and list
  {
    const list = new IpAllowList();
    list.add('10.0.0.1');
    list.add('10.0.0.2');
    list.remove('10.0.0.1');
    assert(!list.check('10.0.0.1') && list.check('10.0.0.2'),
      'remove deletes entry from allow list');
    assert(list.list().length === 1, 'list returns remaining entries');
  }

  // --- createPolicy / validatePolicy -------------------------------------

  // 19. createPolicy fills defaults
  {
    const p = createPolicy({ name: 'my-policy' });
    assert(p.id.length > 0 && p.name === 'my-policy' && p.rules.length === 0 && p.priority === 0,
      'createPolicy fills id, defaults rules and priority');
  }

  // 20. createPolicy respects provided fields
  {
    const p = createPolicy({ name: 'x', action: 'allow', priority: 42, rules: [{ type: 'ip', value: '1.2.3.4' }] });
    assert(p.action === 'allow' && p.priority === 42 && p.rules.length === 1,
      'createPolicy respects provided action, priority, rules');
  }

  // 21. validatePolicy returns errors for invalid policy
  {
    const bad = { id: '', name: '', rules: 'not-array' as unknown as [], action: 'bogus', priority: NaN };
    const errors = validatePolicy(bad as unknown as Policy);
    assert(errors.length >= 4, 'validatePolicy reports multiple errors for invalid policy');
  }

  // 22. validatePolicy returns no errors for valid policy
  {
    const good: Policy = {
      id: 'good', name: 'good', priority: 1, action: 'deny',
      rules: [{ type: 'path', value: '/x', operator: 'contains' }],
    };
    const errors = validatePolicy(good);
    assert(errors.length === 0, 'validatePolicy returns no errors for valid policy');
  }

  // 23. validatePolicy catches invalid rule type and operator
  {
    const p: Policy = {
      id: 'r', name: 'r', priority: 1, action: 'deny',
      rules: [{ type: 'bogus' as never, value: '', operator: 'bogus' as never }],
    };
    const errors = validatePolicy(p);
    assert(errors.some((e) => e.includes('type')) && errors.some((e) => e.includes('value')) && errors.some((e) => e.includes('operator')),
      'validatePolicy catches invalid rule type, value, and operator');
  }

  console.log('\n@nai/warden test');
  console.log('-----------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
