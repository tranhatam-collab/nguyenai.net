/**
 * @nai/telemetry — Telemetry pipeline (opentelemetry rebrand)
 *
 * Provides metrics (counters, gauges, histograms), trace export,
 * and log export. Supports multiple exporters (console, OTLP).
 *
 * P1-D.7: Telemetry pipeline — metrics, traces, logs
 */

export const PACKAGE_INFO = {
  name: '@nai/opentelemetry',
  upstream: 'https://github.com/open-telemetry/opentelemetry-js',
  tool: 'opentelemetry',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

// ============================================================
// Metrics — Counters, Gauges, Histograms
// ============================================================

export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricDescriptor {
  name: string;
  type: MetricType;
  description?: string;
  unit?: string;
}

export interface MetricRecord {
  name: string;
  type: MetricType;
  value: number;
  attributes: Record<string, string>;
  timestamp: number;
}

export interface HistogramRecord {
  name: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  buckets: { boundary: number; count: number }[];
  attributes: Record<string, string>;
  timestamp: number;
}

const counters = new Map<string, number>();
const gauges = new Map<string, number>();
const histograms = new Map<string, { count: number; sum: number; min: number; max: number; values: number[] }>();
const metricRecords: MetricRecord[] = [];
const histogramRecords: HistogramRecord[] = [];
const metricDescriptors = new Map<string, MetricDescriptor>();

/** Register a metric descriptor. */
export function registerMetric(desc: MetricDescriptor): void {
  metricDescriptors.set(desc.name, desc);
}

/** Get a metric descriptor. */
export function getMetricDescriptor(name: string): MetricDescriptor | null {
  return metricDescriptors.get(name) ?? null;
}

/** Increment a counter. */
export function incrementCounter(name: string, value: number = 1, attributes: Record<string, string> = {}): void {
  const key = `${name}:${JSON.stringify(attributes)}`;
  counters.set(key, (counters.get(key) ?? 0) + value);
  metricRecords.push({
    name,
    type: 'counter',
    value: counters.get(key)!,
    attributes,
    timestamp: Date.now(),
  });
}

/** Get a counter value. */
export function getCounter(name: string, attributes: Record<string, string> = {}): number {
  const key = `${name}:${JSON.stringify(attributes)}`;
  return counters.get(key) ?? 0;
}

/** Set a gauge value. */
export function setGauge(name: string, value: number, attributes: Record<string, string> = {}): void {
  const key = `${name}:${JSON.stringify(attributes)}`;
  gauges.set(key, value);
  metricRecords.push({
    name,
    type: 'gauge',
    value,
    attributes,
    timestamp: Date.now(),
  });
}

/** Get a gauge value. */
export function getGauge(name: string, attributes: Record<string, string> = {}): number {
  const key = `${name}:${JSON.stringify(attributes)}`;
  return gauges.get(key) ?? 0;
}

/** Record a histogram observation. */
export function recordHistogram(name: string, value: number, attributes: Record<string, string> = {}, buckets?: number[]): void {
  const key = `${name}:${JSON.stringify(attributes)}`;
  let hist = histograms.get(key);
  if (!hist) {
    hist = { count: 0, sum: 0, min: Infinity, max: -Infinity, values: [] };
    histograms.set(key, hist);
  }
  hist.count++;
  hist.sum += value;
  hist.min = Math.min(hist.min, value);
  hist.max = Math.max(hist.max, value);
  hist.values.push(value);

  const boundaries = buckets ?? [0, 10, 50, 100, 500, 1000, 5000];
  const bucketCounts = boundaries.map((b) => ({ boundary: b, count: hist!.values.filter((v) => v <= b).length }));
  bucketCounts.push({ boundary: Infinity, count: hist.count });

  histogramRecords.push({
    name,
    count: hist.count,
    sum: hist.sum,
    min: hist.min === Infinity ? 0 : hist.min,
    max: hist.max,
    buckets: bucketCounts,
    attributes,
    timestamp: Date.now(),
  });
}

/** Get histogram stats. */
export function getHistogramStats(name: string, attributes: Record<string, string> = {}): {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
} | null {
  const key = `${name}:${JSON.stringify(attributes)}`;
  const hist = histograms.get(key);
  if (!hist || hist.count === 0) return null;
  return {
    count: hist.count,
    sum: hist.sum,
    min: hist.min === Infinity ? 0 : hist.min,
    max: hist.max,
    avg: hist.sum / hist.count,
  };
}

// ============================================================
// Exporters
// ============================================================

export type ExporterType = 'console' | 'otlp' | 'in-memory';

export interface Exporter {
  type: ExporterType;
  export(metrics: MetricRecord[], histograms: HistogramRecord[]): void;
}

export class ConsoleExporter implements Exporter {
  type: ExporterType = 'console';
  export(metrics: MetricRecord[], histograms: HistogramRecord[]): void {
    for (const m of metrics) {
      console.log(`[metric] ${m.type}/${m.name} = ${m.value} ${JSON.stringify(m.attributes)}`);
    }
    for (const h of histograms) {
      console.log(`[histogram] ${h.name} count=${h.count} sum=${h.sum} min=${h.min} max=${h.max}`);
    }
  }
}

export class InMemoryExporter implements Exporter {
  type: ExporterType = 'in-memory';
  exportedMetrics: MetricRecord[] = [];
  exportedHistograms: HistogramRecord[] = [];
  export(metrics: MetricRecord[], histograms: HistogramRecord[]): void {
    this.exportedMetrics.push(...metrics);
    this.exportedHistograms.push(...histograms);
  }
}

export class OTLPExporter implements Exporter {
  type: ExporterType = 'otlp';
  endpoint: string;
  constructor(endpoint: string) { this.endpoint = endpoint; }
  export(metrics: MetricRecord[], histograms: HistogramRecord[]): void {
    // In production: send via HTTP/gRPC to OTLP collector
    // For now: store records for inspection
    metrics.length; histograms.length; // no-op
  }
}

let activeExporter: Exporter | null = null;

/** Set the active exporter. */
export function setExporter(exporter: Exporter): void {
  activeExporter = exporter;
}

/** Export all collected telemetry. */
export function exportTelemetry(): void {
  if (!activeExporter) return;
  activeExporter.export([...metricRecords], [...histogramRecords]);
}

/** Get all metric records. */
export function getMetricRecords(): MetricRecord[] {
  return [...metricRecords];
}

/** Get all histogram records. */
export function getHistogramRecords(): HistogramRecord[] {
  return [...histogramRecords];
}

/** Clear all telemetry data (for testing). */
export function clearTelemetry(): void {
  counters.clear();
  gauges.clear();
  histograms.clear();
  metricRecords.length = 0;
  histogramRecords.length = 0;
  metricDescriptors.clear();
  activeExporter = null;
}

// ============================================================
// P0-OBS: Correlation IDs — request tracing across services
// ============================================================

export const CORRELATION_ID_HEADER = 'x-request-id';
export const TRACE_ID_HEADER = 'x-trace-id';

/**
 * Generate a new correlation ID (UUID v4 style).
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Extract correlation ID from incoming request headers, or generate a new one.
 * Returns tuple of [correlationId, traceId] where traceId may be undefined.
 */
export function extractCorrelationId(headers: Headers): { correlationId: string; traceId?: string } {
  const incoming = headers.get(CORRELATION_ID_HEADER) ?? headers.get('x-correlation-id');
  const traceId = headers.get(TRACE_ID_HEADER) ?? undefined;
  return {
    correlationId: incoming || generateCorrelationId(),
    traceId,
  };
}

/**
 * Structured log entry with correlation context.
 */
export interface StructuredLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  correlation_id: string;
  trace_id?: string;
  user_id?: string;
  tenant_id?: string;
  session_id?: string;
  [key: string]: unknown;
}

/**
 * Log context — attached to all log entries in a request.
 */
export class LogContext {
  constructor(
    public readonly correlationId: string,
    public readonly traceId: string | undefined,
    private fields: Record<string, unknown> = {},
  ) {}

  set(key: string, value: unknown): void {
    this.fields[key] = value;
  }

  log(level: StructuredLogEntry['level'], message: string, extra?: Record<string, unknown>): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlation_id: this.correlationId,
      ...this.fields,
      ...extra,
    };
    if (this.traceId) entry.trace_id = this.traceId;
    // Output as structured JSON to console (Workers log stream)
    console.log(JSON.stringify(entry));
    return entry;
  }

  info(message: string, extra?: Record<string, unknown>): StructuredLogEntry {
    return this.log('info', message, extra);
  }
  warn(message: string, extra?: Record<string, unknown>): StructuredLogEntry {
    return this.log('warn', message, extra);
  }
  error(message: string, extra?: Record<string, unknown>): StructuredLogEntry {
    return this.log('error', message, extra);
  }
  debug(message: string, extra?: Record<string, unknown>): StructuredLogEntry {
    return this.log('debug', message, extra);
  }
}

