/**
 * @nai/atlas — dashboard & metrics aggregation
 *
 * In-process metrics store, time-series aggregation, and dashboard
 * configuration for the Nguyen AI monorepo. Metrics are kept in memory
 * and queried by name + tag filters, then aggregated into time series
 * for dashboard widgets.
 */

/** A single metric point. */
export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
}

/** A point within a metric series. */
export interface SeriesPoint {
  timestamp: number;
  value: number;
}

/** An aggregated time series for a metric. */
export interface MetricSeries {
  name: string;
  points: SeriesPoint[];
  tags: Record<string, string>;
}

/** Aggregation function selector. */
export type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count';

/** Widget type selector. */
export type WidgetType = 'line' | 'bar' | 'gauge' | 'table';

/** A dashboard widget definition. */
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  metricName: string;
  tags?: Record<string, string>;
  aggregation?: AggregationFn;
}

/** Input shape for a widget — id is optional (auto-generated). */
export interface WidgetInput {
  id?: string;
  type: WidgetType;
  title: string;
  metricName: string;
  tags?: Record<string, string>;
  aggregation?: AggregationFn;
}

/** A dashboard definition. */
export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
  refreshIntervalMs: number;
}

interface InternalMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
}

const store: InternalMetric[] = [];
const dashboards: Dashboard[] = [];

let dashboardCounter = 0;
let widgetCounter = 0;

/** Default unit when none is supplied. */
const DEFAULT_UNIT = 'count';

/**
 * Record a metric point at the current time (or an explicit timestamp).
 */
export function recordMetric(
  name: string,
  value: number,
  tags: Record<string, string> = {},
  unit: string = DEFAULT_UNIT,
  timestamp: number = Date.now(),
): void {
  store.push({
    name,
    value,
    unit,
    timestamp,
    tags: { ...tags },
  });
}

/**
 * Returns true when the candidate tags contain every key/value pair in
 * the filter tags.
 */
function tagsMatch(filter: Record<string, string>, candidate: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (candidate[key] !== value) return false;
  }
  return true;
}

/**
 * Query stored metrics by name and optional tag filter.
 */
export function getMetric(name: string, tags: Record<string, string> = {}): Metric[] {
  return store
    .filter((m) => m.name === name && tagsMatch(tags, m.tags))
    .map((m) => ({
      name: m.name,
      value: m.value,
      unit: m.unit,
      timestamp: m.timestamp,
      tags: { ...m.tags },
    }));
}

/**
 * Aggregate a list of metric values using the given function.
 */
export function aggregate(metrics: Metric[], fn: AggregationFn): number {
  if (fn === 'count') return metrics.length;
  if (metrics.length === 0) return 0;
  const values = metrics.map((m) => m.value);
  switch (fn) {
    case 'sum':
      return values.reduce((acc, v) => acc + v, 0);
    case 'avg':
      return values.reduce((acc, v) => acc + v, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
}

/**
 * Aggregate stored metrics for `name` into a time series of fixed buckets
 * spanning the last `timeRangeMs` milliseconds ending now.
 */
export function getSeries(
  name: string,
  timeRangeMs: number,
  tags: Record<string, string> = {},
  bucketCount = 12,
): MetricSeries {
  const now = Date.now();
  const start = now - timeRangeMs;
  const bucketSize = timeRangeMs / bucketCount;
  const buckets: SeriesPoint[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = start + i * bucketSize;
    const bucketEnd = bucketStart + bucketSize;
    const isLast = i === bucketCount - 1;
    const inBucket = store.filter(
      (m) =>
        m.name === name &&
        tagsMatch(tags, m.tags) &&
        m.timestamp >= bucketStart &&
        (isLast ? m.timestamp <= now : m.timestamp < bucketEnd),
    );
    const point: SeriesPoint = {
      timestamp: bucketStart,
      value: inBucket.length === 0 ? 0 : inBucket.reduce((acc, m) => acc + m.value, 0),
    };
    buckets.push(point);
  }

  return {
    name,
    points: buckets,
    tags: { ...tags },
  };
}

/**
 * Create and register a dashboard from a partial config. Missing ids are
 * generated and missing widgets default to an empty array.
 */
export function createDashboard(config: {
  id?: string;
  name: string;
  widgets?: WidgetInput[];
  refreshIntervalMs?: number;
}): Dashboard {
  const id = config.id ?? `dash-${++dashboardCounter}`;
  const widgets = (config.widgets ?? []).map((w) => ({
    id: w.id ?? `widget-${++widgetCounter}`,
    type: w.type,
    title: w.title,
    metricName: w.metricName,
    tags: w.tags ? { ...w.tags } : undefined,
    aggregation: w.aggregation,
  }));
  const dashboard: Dashboard = {
    id,
    name: config.name,
    widgets,
    refreshIntervalMs: config.refreshIntervalMs ?? 5000,
  };
  dashboards.push(dashboard);
  return dashboard;
}

/**
 * Serialize a dashboard to a JSON string.
 */
export function exportDashboard(dashboard: Dashboard): string {
  return JSON.stringify(dashboard, null, 2);
}

/**
 * List all registered dashboards.
 */
export function listDashboards(): Dashboard[] {
  return dashboards.map((d) => ({
    id: d.id,
    name: d.name,
    widgets: d.widgets.map((w) => ({ ...w })),
    refreshIntervalMs: d.refreshIntervalMs,
  }));
}

/**
 * Clear all stored metrics (keeps dashboards).
 */
export function clearMetrics(): void {
  store.length = 0;
}

/** Clear dashboards (useful for tests). */
export function clearDashboards(): void {
  dashboards.length = 0;
  dashboardCounter = 0;
  widgetCounter = 0;
}
