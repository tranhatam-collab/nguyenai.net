/**
 * @nai/seismograph — Lightweight distributed tracing
 *
 * Provides spans, traces, and context-local current-span tracking.
 * Supports parent/child span relationships, events, attributes,
 * and a runInSpan helper for automatic span lifecycle management.
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
}
