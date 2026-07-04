/**
 * @nai/warden — Security policy engine for the Nguyen AI monorepo.
 *
 * Provides policy-based request evaluation, rate limiting, and IP allow-listing
 * with CIDR support. Consumed directly as TypeScript source by Workers / apps.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RuleType = 'ip' | 'path' | 'method' | 'header' | 'rate' | 'country';

export type RuleOperator = 'equals' | 'contains' | 'matches' | 'in';

export interface Rule {
  type: RuleType;
  value: string;
  operator?: RuleOperator;
}

export type PolicyAction = 'allow' | 'deny' | 'challenge';

export interface Policy {
  id: string;
  name: string;
  rules: Rule[];
  action: PolicyAction;
  priority: number;
}

export interface RequestContext {
  ip: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  country?: string;
}

export interface EvaluateResult {
  action: PolicyAction;
  matchedPolicy?: Policy;
}

// ---------------------------------------------------------------------------
// Rule evaluation
// ---------------------------------------------------------------------------

/**
 * Apply an operator comparison between a target string and the rule value.
 * - `equals`: strict equality (case-insensitive for method/header/country).
 * - `contains`: substring match.
 * - `matches`: RegExp match.
 * - `in`: comma-separated list membership.
 */
function applyOperator(target: string, value: string, operator: RuleOperator, caseInsensitive: boolean): boolean {
  let t = target;
  let v = value;
  if (caseInsensitive) {
    t = target.toLowerCase();
    v = value.toLowerCase();
  }
  switch (operator) {
    case 'equals':
      return t === v;
    case 'contains':
      return t.includes(v);
    case 'matches':
      try {
        const flags = caseInsensitive ? 'i' : '';
        return new RegExp(value, flags).test(target);
      } catch {
        return false;
      }
    case 'in': {
      const items = value.split(',').map((s) => (caseInsensitive ? s.trim().toLowerCase() : s.trim()));
      return items.includes(t);
    }
    default:
      return false;
  }
}

/**
 * Evaluate a single rule against a request context.
 * Header rule value uses `Header-Name:expected-value` format (e.g.
 * `User-Agent:curl`). If no expected value is given after the colon, the rule
 * matches when the header is present (any value).
 */
function evaluateRule(rule: Rule, context: RequestContext): boolean {
  const operator: RuleOperator = rule.operator ?? 'equals';
  switch (rule.type) {
    case 'ip':
      return applyOperator(context.ip, rule.value, operator, false);
    case 'path':
      return applyOperator(context.path, rule.value, operator, false);
    case 'method':
      return applyOperator(context.method, rule.value, operator, true);
    case 'country':
      return applyOperator(context.country ?? '', rule.value, operator, true);
    case 'header': {
      const sep = rule.value.indexOf(':');
      const headerName = sep >= 0 ? rule.value.slice(0, sep).trim() : rule.value.trim();
      const expected = sep >= 0 ? rule.value.slice(sep + 1).trim() : '';
      const actual = lookupHeader(context.headers, headerName);
      if (actual === undefined) return false;
      if (expected === '') return true; // presence-only match
      return applyOperator(actual, expected, operator, true);
    }
    case 'rate':
      // Rate rules are evaluated by the RateLimiter integration, not here.
      // A bare `rate` rule in a policy is treated as a no-op (never matches on
      // its own) so policies that rely on rate limiting should be wired up by
      // the caller via RateLimiter before policy evaluation.
      return false;
    default:
      return false;
  }
}

function lookupHeader(headers: Record<string, string>, name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) return headers[key];
  }
  return undefined;
}

function policyMatches(policy: Policy, context: RequestContext): boolean {
  if (policy.rules.length === 0) return false;
  // All rules must match (AND semantics).
  for (const rule of policy.rules) {
    if (!evaluateRule(rule, context)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Policy evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a list of policies against a request context.
 *
 * Policies are sorted by priority (highest first). The first policy whose
 * rules all match the context wins. If no policy matches, the default action
 * is `allow`.
 */
export function evaluatePolicies(policies: Policy[], context: RequestContext): EvaluateResult {
  const sorted = [...policies].sort((a, b) => b.priority - a.priority);
  for (const policy of sorted) {
    if (policyMatches(policy, context)) {
      return { action: policy.action, matchedPolicy: policy };
    }
  }
  return { action: 'allow' };
}

// ---------------------------------------------------------------------------
// RateLimiter — fixed-window counter per key
// ---------------------------------------------------------------------------

interface RateBucket {
  count: number;
  windowStart: number;
}

/**
 * Fixed-window rate limiter. Each key gets its own counter that resets after
 * `windowMs` milliseconds. `check()` is O(1) and mutates internal state.
 */
export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, RateBucket>();

  constructor(maxRequests: number, windowMs: number) {
    if (maxRequests <= 0) throw new Error('maxRequests must be > 0');
    if (windowMs <= 0) throw new Error('windowMs must be > 0');
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (bucket === undefined || now >= bucket.windowStart + this.windowMs) {
      bucket = { count: 0, windowStart: now };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    const allowed = bucket.count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - bucket.count);
    const resetAt = bucket.windowStart + this.windowMs;
    return { allowed, remaining, resetAt };
  }

  /** Remove a key's bucket (useful for tests / manual reset). */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /** Clear all buckets. */
  clear(): void {
    this.buckets.clear();
  }
}

// ---------------------------------------------------------------------------
// IpAllowList — supports single IPs and CIDR ranges (IPv4)
// ---------------------------------------------------------------------------

function ipToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    result = (result << 8) + n;
    // Use unsigned 32-bit.
    result = result >>> 0;
  }
  return result >>> 0;
}

interface CidrEntry {
  base: number;
  mask: number;
  prefix: number;
  raw: string;
}

function parseCidr(cidr: string): CidrEntry | null {
  const slash = cidr.indexOf('/');
  if (slash < 0) {
    // Single IP — treat as /32.
    const ip = ipToInt(cidr);
    if (ip === null) return null;
    return { base: ip, mask: 0xffffffff, prefix: 32, raw: cidr };
  }
  const ipPart = cidr.slice(0, slash);
  const prefixPart = cidr.slice(slash + 1);
  const prefix = Number(prefixPart);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;
  const ip = ipToInt(ipPart);
  if (ip === null) return null;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return { base: (ip & mask) >>> 0, mask, prefix, raw: cidr };
}

/**
 * IP allow-list supporting IPv4 addresses and CIDR notation (e.g.
 * `192.168.1.0/24`). Entries are stored normalized; `check()` performs CIDR
 * matching.
 */
export class IpAllowList {
  private readonly entries = new Map<string, CidrEntry>();

  add(ip: string): void {
    const entry = parseCidr(ip);
    if (entry === null) {
      throw new Error(`Invalid IP or CIDR: ${ip}`);
    }
    this.entries.set(entry.raw, entry);
  }

  remove(ip: string): void {
    const entry = parseCidr(ip);
    if (entry !== null) {
      this.entries.delete(entry.raw);
      // Also try removing by the raw input string in case normalization differs.
      this.entries.delete(ip);
    } else {
      this.entries.delete(ip);
    }
  }

  check(ip: string): boolean {
    const target = ipToInt(ip);
    if (target === null) return false;
    for (const entry of this.entries.values()) {
      if ((target & entry.mask) >>> 0 === entry.base) {
        return true;
      }
    }
    return false;
  }

  list(): string[] {
    return Array.from(this.entries.keys());
  }

  clear(): void {
    this.entries.clear();
  }
}

// ---------------------------------------------------------------------------
// Policy helpers
// ---------------------------------------------------------------------------

let policyCounter = 0;

function generateId(): string {
  policyCounter += 1;
  return `policy_${Date.now().toString(36)}_${policyCounter}`;
}

/**
 * Create a policy from a partial config. Fills in sensible defaults for
 * missing fields. `name` is required.
 */
export function createPolicy(config: Partial<Policy> & { name: string }): Policy {
  return {
    id: config.id ?? generateId(),
    name: config.name,
    rules: config.rules ?? [],
    action: config.action ?? 'deny',
    priority: config.priority ?? 0,
  };
}

/**
 * Validate a policy and return an array of human-readable error strings. An
 * empty array means the policy is valid.
 */
export function validatePolicy(policy: Policy): string[] {
  const errors: string[] = [];
  if (!policy.id || typeof policy.id !== 'string') {
    errors.push('id must be a non-empty string');
  }
  if (!policy.name || typeof policy.name !== 'string') {
    errors.push('name must be a non-empty string');
  }
  if (policy.action !== 'allow' && policy.action !== 'deny' && policy.action !== 'challenge') {
    errors.push(`action must be 'allow', 'deny', or 'challenge' (got '${policy.action}')`);
  }
  if (typeof policy.priority !== 'number' || Number.isNaN(policy.priority)) {
    errors.push('priority must be a number');
  }
  if (!Array.isArray(policy.rules)) {
    errors.push('rules must be an array');
  } else {
    const validTypes: RuleType[] = ['ip', 'path', 'method', 'header', 'rate', 'country'];
    const validOperators: RuleOperator[] = ['equals', 'contains', 'matches', 'in'];
    policy.rules.forEach((rule, i) => {
      const ctx = `rules[${i}]`;
      if (!rule || typeof rule !== 'object') {
        errors.push(`${ctx} must be an object`);
        return;
      }
      if (!validTypes.includes(rule.type)) {
        errors.push(`${ctx}.type must be one of ${validTypes.join(', ')} (got '${rule.type}')`);
      }
      if (typeof rule.value !== 'string' || rule.value.length === 0) {
        errors.push(`${ctx}.value must be a non-empty string`);
      }
      if (rule.operator !== undefined && !validOperators.includes(rule.operator)) {
        errors.push(`${ctx}.operator must be one of ${validOperators.join(', ')} (got '${rule.operator}')`);
      }
    });
  }
  return errors;
}
