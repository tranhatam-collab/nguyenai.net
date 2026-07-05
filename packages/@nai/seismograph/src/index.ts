/**
 * @nai/seismograph — Lightweight distributed tracing + LLM observability
 *
 * Provides spans, traces, and context-local current-span tracking.
 * Supports parent/child span relationships, events, attributes,
 * and a runInSpan helper for automatic span lifecycle management.
 *
 * P1-D.1: LLM Observability — cost, latency, token tracking per call.
 */

export type SpanStatus = 'active' | 'ended' | 'error';

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, unknown>;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: SpanStatus;
  attributes: Record<string, unknown>;
  events: SpanEvent[];
}

export interface Trace {
  traceId: string;
  spans: Span[];
  rootSpanId: string;
}

/** Generate a random hex ID of the given length. */
function generateId(length: number): string {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}

function generateTraceId(): string {
  return generateId(32);
}

function generateSpanId(): string {
  return generateId(16);
}

// In-memory trace store: traceId -> Trace
const traces = new Map<string, Trace>();

// Context-local current span stack (using a module-level variable;
// AsyncLocalStorage would be ideal but this keeps it dependency-free)
let currentSpanStack: Span[] = [];

/** Start a new span. If parentSpanId is provided, continues that trace. */
export function startSpan(
  name: string,
  parentSpanId?: string,
  attributes?: Record<string, unknown>,
): Span {
  let traceId: string;
  let parentSpan: Span | undefined;

  if (parentSpanId !== undefined) {
    // Find the parent span across all traces
    for (const trace of traces.values()) {
      const found = trace.spans.find((s) => s.spanId === parentSpanId);
      if (found) {
        parentSpan = found;
        break;
      }
    }
    traceId = parentSpan?.traceId ?? generateTraceId();
  } else {
    // Check if there's a current span to continue from
    const current = currentSpanStack[currentSpanStack.length - 1];
    if (current && current.status === 'active') {
      parentSpan = current;
      traceId = current.traceId;
      parentSpanId = current.spanId;
    } else {
      traceId = generateTraceId();
    }
  }

  const span: Span = {
    traceId,
    spanId: generateSpanId(),
    parentSpanId,
    name,
    startTime: Date.now(),
    status: 'active',
    attributes: { ...(attributes ?? {}) },
    events: [],
  };

  // Register in trace store
  let trace = traces.get(traceId);
  if (!trace) {
    trace = { traceId, spans: [], rootSpanId: span.spanId };
    traces.set(traceId, trace);
  }
  trace.spans.push(span);

  // Push onto context stack
  currentSpanStack.push(span);

  return span;
}

/** End a span — sets endTime, durationMs, and status. */
export function endSpan(span: Span): void {
  if (span.status === 'ended') return;
  span.endTime = Date.now();
  span.durationMs = span.endTime - span.startTime;
  span.status = 'ended';

  // Pop from context stack if it's the current span
  const idx = currentSpanStack.lastIndexOf(span);
  if (idx >= 0) {
    currentSpanStack.splice(idx, 1);
  }
}

/** Add an event to a span. */
export function addEvent(span: Span, name: string, attributes?: Record<string, unknown>): void {
  span.events.push({
    name,
    timestamp: Date.now(),
    attributes: attributes ? { ...attributes } : undefined,
  });
}

/** Set an attribute on a span. */
export function setAttribute(span: Span, key: string, value: unknown): void {
  span.attributes[key] = value;
}

/** Get a trace by ID. */
export function getTrace(traceId: string): Trace | null {
  return traces.get(traceId) ?? null;
}

/** List all traces. */
export function listTraces(): Trace[] {
  return Array.from(traces.values());
}

/** Get the current active span (context-local). */
export function getCurrentSpan(): Span | null {
  const span = currentSpanStack[currentSpanStack.length - 1];
  if (span && span.status === 'active') return span;
  return null;
}

/** Run a function within a span, automatically ending it when done. */
export async function runInSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, unknown>,
): Promise<T> {
  const span = startSpan(name, undefined, attributes);
  try {
    const result = await fn();
    endSpan(span);
    return result;
  } catch (err) {
    span.status = 'error';
    setAttribute(span, 'error', err instanceof Error ? err.message : String(err));
    endSpan(span);
    throw err;
  }
}

/** Clear all traces and reset context (for testing). */
export function clearTraces(): void {
  traces.clear();
  currentSpanStack = [];
  llmCalls.length = 0;
}

// ============================================================
// P1-D.1: LLM Observability — cost, latency, token tracking
// ============================================================

export interface LLMCallRecord {
  call_id: string;
  trace_id?: string;
  span_id?: string;
  timestamp: number;
  provider: string;
  model: string;
  model_tier: string;
  tenant_id: string;
  user_id: string;
  agent_id?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number;
  cost_usd: number;
  cost_vnd: number;
  status: 'success' | 'error' | 'timeout';
  error?: string;
}

/** In-memory LLM call log (production: export to Postgres / Helicone). */
const llmCalls: LLMCallRecord[] = [];

/** Cost per 1K tokens (USD) by model tier — configurable. */
const COST_PER_1K: Record<string, { input: number; output: number }> = {
  free: { input: 0, output: 0 },
  student: { input: 0.0005, output: 0.0015 },
  standard: { input: 0.001, output: 0.003 },
  pro: { input: 0.003, output: 0.015 },
  business: { input: 0.005, output: 0.025 },
  enterprise: { input: 0.01, output: 0.05 },
};

/** VND per USD (configurable, default 25000). */
let vndPerUsd = 25000;

export function setVndPerUsd(rate: number): void {
  vndPerUsd = rate;
}

/** Record an LLM call with cost + latency + token tracking. */
export function recordLLMCall(opts: {
  provider: string;
  model: string;
  model_tier: string;
  tenant_id: string;
  user_id: string;
  agent_id?: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  status?: 'success' | 'error' | 'timeout';
  error?: string;
  trace_id?: string;
  span_id?: string;
}): LLMCallRecord {
  const tier = opts.model_tier in COST_PER_1K ? opts.model_tier : 'standard';
  const rates = COST_PER_1K[tier]!;
  const costUsd =
    (opts.prompt_tokens / 1000) * rates.input +
    (opts.completion_tokens / 1000) * rates.output;
  const record: LLMCallRecord = {
    call_id: generateId(16),
    trace_id: opts.trace_id,
    span_id: opts.span_id,
    timestamp: Date.now(),
    provider: opts.provider,
    model: opts.model,
    model_tier: opts.model_tier,
    tenant_id: opts.tenant_id,
    user_id: opts.user_id,
    agent_id: opts.agent_id,
    prompt_tokens: opts.prompt_tokens,
    completion_tokens: opts.completion_tokens,
    total_tokens: opts.prompt_tokens + opts.completion_tokens,
    latency_ms: opts.latency_ms,
    cost_usd: Math.round(costUsd * 1e6) / 1e6,
    cost_vnd: Math.round(costUsd * vndPerUsd),
    status: opts.status ?? 'success',
    error: opts.error,
  };
  llmCalls.push(record);
  return record;
}

/** Wrap an LLM call with automatic observability. */
export async function observeLLMCall<T>(
  opts: {
    provider: string;
    model: string;
    model_tier: string;
    tenant_id: string;
    user_id: string;
    agent_id?: string;
    prompt_tokens: number;
  },
  fn: () => Promise<{ result: T; completion_tokens: number }>,
): Promise<{ result: T; record: LLMCallRecord }> {
  const start = Date.now();
  const currentSpan = getCurrentSpan();
  try {
    const { result, completion_tokens } = await fn();
    const latency = Date.now() - start;
    const record = recordLLMCall({
      ...opts,
      completion_tokens,
      latency_ms: latency,
      status: 'success',
      trace_id: currentSpan?.traceId,
      span_id: currentSpan?.spanId,
    });
    return { result, record };
  } catch (err) {
    const latency = Date.now() - start;
    const record = recordLLMCall({
      ...opts,
      completion_tokens: 0,
      latency_ms: latency,
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
      trace_id: currentSpan?.traceId,
      span_id: currentSpan?.spanId,
    });
    throw err;
  }
}

/** Query LLM call records. */
export function queryLLMCalls(filter?: {
  tenant_id?: string;
  user_id?: string;
  agent_id?: string;
  provider?: string;
  model?: string;
  start_time?: number;
  end_time?: number;
  limit?: number;
}): LLMCallRecord[] {
  let results = [...llmCalls];
  if (filter?.tenant_id) results = results.filter((r) => r.tenant_id === filter.tenant_id);
  if (filter?.user_id) results = results.filter((r) => r.user_id === filter.user_id);
  if (filter?.agent_id) results = results.filter((r) => r.agent_id === filter.agent_id);
  if (filter?.provider) results = results.filter((r) => r.provider === filter.provider);
  if (filter?.model) results = results.filter((r) => r.model === filter.model);
  if (filter?.start_time) results = results.filter((r) => r.timestamp >= filter.start_time!);
  if (filter?.end_time) results = results.filter((r) => r.timestamp <= filter.end_time!);
  results.sort((a, b) => b.timestamp - a.timestamp);
  return results.slice(0, filter?.limit ?? 1000);
}

/** Get aggregate LLM metrics for a tenant. */
export function getLLMMetrics(tenantId: string, timeRange?: { start?: number; end?: number }): {
  total_calls: number;
  total_tokens: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_cost_usd: number;
  total_cost_vnd: number;
  avg_latency_ms: number;
  error_count: number;
  by_model: Record<string, { calls: number; tokens: number; cost_usd: number }>;
  by_agent: Record<string, { calls: number; tokens: number; cost_usd: number }>;
} {
  const calls = queryLLMCalls({ tenant_id: tenantId, start_time: timeRange?.start, end_time: timeRange?.end, limit: 100000 });
  const byModel: Record<string, { calls: number; tokens: number; cost_usd: number }> = {};
  const byAgent: Record<string, { calls: number; tokens: number; cost_usd: number }> = {};
  let totalTokens = 0, totalPrompt = 0, totalCompletion = 0, totalCostUsd = 0, totalCostVnd = 0, totalLatency = 0, errors = 0;
  for (const c of calls) {
    totalTokens += c.total_tokens;
    totalPrompt += c.prompt_tokens;
    totalCompletion += c.completion_tokens;
    totalCostUsd += c.cost_usd;
    totalCostVnd += c.cost_vnd;
    totalLatency += c.latency_ms;
    if (c.status !== 'success') errors++;
    const mk = c.model;
    if (!byModel[mk]) byModel[mk] = { calls: 0, tokens: 0, cost_usd: 0 };
    byModel[mk].calls++;
    byModel[mk].tokens += c.total_tokens;
    byModel[mk].cost_usd += c.cost_usd;
    const ak = c.agent_id ?? 'unknown';
    if (!byAgent[ak]) byAgent[ak] = { calls: 0, tokens: 0, cost_usd: 0 };
    byAgent[ak].calls++;
    byAgent[ak].tokens += c.total_tokens;
    byAgent[ak].cost_usd += c.cost_usd;
  }
  return {
    total_calls: calls.length,
    total_tokens: totalTokens,
    total_prompt_tokens: totalPrompt,
    total_completion_tokens: totalCompletion,
    total_cost_usd: Math.round(totalCostUsd * 1e6) / 1e6,
    total_cost_vnd: totalCostVnd,
    avg_latency_ms: calls.length > 0 ? Math.round(totalLatency / calls.length) : 0,
    error_count: errors,
    by_model: byModel,
    by_agent: byAgent,
  };
}

/** Clear LLM call log (for testing). */
export function clearLLMCalls(): void {
  llmCalls.length = 0;
}
