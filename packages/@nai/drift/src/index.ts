/**
 * @nai/drift — Drift monitor (phoenix rebrand)
 *
 * Detects drift in LLM outputs: distribution drift, performance drift,
 * and semantic drift. Compares current window against a baseline.
 *
 * P1-D.4: Drift monitor — drift detection + alert
 */

export const PACKAGE_INFO = {
  name: '@nai/phoenix',
  upstream: 'https://github.com/Arize-ai/phoenix',
  tool: 'phoenix',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

// ============================================================
// Drift metrics
// ============================================================

export interface DriftMetric {
  name: string;
  baseline_value: number;
  current_value: number;
  delta: number;
  delta_pct: number;
  threshold: number;
  is_drifted: boolean;
}

export interface DriftReport {
  report_id: string;
  tenant_id: string;
  metric: string;
  baseline_window: { start: number; end: number; sample_count: number };
  current_window: { start: number; end: number; sample_count: number };
  metrics: DriftMetric[];
  has_drift: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  created_at: number;
}

export interface DriftAlert {
  alert_id: string;
  report_id: string;
  tenant_id: string;
  metric: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  created_at: number;
}

// ============================================================
// Drift detector
// ============================================================

export interface DriftDetectorConfig {
  /** Threshold for relative change to flag as drift (e.g., 0.2 = 20%). */
  threshold_pct: number;
  /** Minimum absolute delta to flag as drift. */
  min_absolute_delta: number;
  /** Minimum samples in current window to evaluate. */
  min_sample_count: number;
}

const DEFAULT_CONFIG: DriftDetectorConfig = {
  threshold_pct: 0.2,
  min_absolute_delta: 0.05,
  min_sample_count: 5,
};

const reports = new Map<string, DriftReport>();
const alerts: DriftAlert[] = [];
let alertHandlers: ((alert: DriftAlert) => void)[] = [];

/** Register an alert handler. */
export function onDriftAlert(handler: (alert: DriftAlert) => void): void {
  alertHandlers.push(handler);
}

/** Clear alert handlers (for testing). */
export function clearAlertHandlers(): void {
  alertHandlers = [];
}

/** Detect drift between a baseline and current window. */
export function detectDrift(opts: {
  tenant_id: string;
  metric: string;
  baseline: { values: number[]; window: { start: number; end: number } };
  current: { values: number[]; window: { start: number; end: number } };
  config?: Partial<DriftDetectorConfig>;
}): DriftReport {
  const config = { ...DEFAULT_CONFIG, ...opts.config };
  const baselineMean = mean(opts.baseline.values);
  const currentMean = mean(opts.current.values);
  const delta = currentMean - baselineMean;
  const deltaPct = baselineMean !== 0 ? delta / Math.abs(baselineMean) : 0;
  const isDrifted =
    opts.current.values.length >= config.min_sample_count &&
    Math.abs(deltaPct) >= config.threshold_pct &&
    Math.abs(delta) >= config.min_absolute_delta;

  const metric: DriftMetric = {
    name: opts.metric,
    baseline_value: Math.round(baselineMean * 1e6) / 1e6,
    current_value: Math.round(currentMean * 1e6) / 1e6,
    delta: Math.round(delta * 1e6) / 1e6,
    delta_pct: Math.round(deltaPct * 1e4) / 1e4,
    threshold: config.threshold_pct,
    is_drifted: isDrifted,
  };

  let severity: 'none' | 'low' | 'medium' | 'high' = 'none';
  if (isDrifted) {
    const absPct = Math.abs(deltaPct);
    if (absPct >= 0.5) severity = 'high';
    else if (absPct >= 0.3) severity = 'medium';
    else severity = 'low';
  }

  const report: DriftReport = {
    report_id: generateId(16),
    tenant_id: opts.tenant_id,
    metric: opts.metric,
    baseline_window: {
      start: opts.baseline.window.start,
      end: opts.baseline.window.end,
      sample_count: opts.baseline.values.length,
    },
    current_window: {
      start: opts.current.window.start,
      end: opts.current.window.end,
      sample_count: opts.current.values.length,
    },
    metrics: [metric],
    has_drift: isDrifted,
    severity,
    created_at: Date.now(),
  };

  reports.set(report.report_id, report);

  // Fire alert if drifted
  if (isDrifted) {
    const alert: DriftAlert = {
      alert_id: generateId(16),
      report_id: report.report_id,
      tenant_id: opts.tenant_id,
      metric: opts.metric,
      severity: severity as 'low' | 'medium' | 'high',
      message: `Drift detected for ${opts.metric}: ${metric.delta_pct > 0 ? '+' : ''}${(metric.delta_pct * 100).toFixed(1)}% (baseline=${metric.baseline_value}, current=${metric.current_value})`,
      created_at: Date.now(),
    };
    alerts.push(alert);
    for (const handler of alertHandlers) handler(alert);
  }

  return report;
}

/** Detect drift across multiple metrics at once. */
export function detectDriftMulti(opts: {
  tenant_id: string;
  metrics: { name: string; baseline: number[]; current: number[] }[];
  baseline_window: { start: number; end: number };
  current_window: { start: number; end: number };
  config?: Partial<DriftDetectorConfig>;
}): DriftReport[] {
  return opts.metrics.map((m) =>
    detectDrift({
      tenant_id: opts.tenant_id,
      metric: m.name,
      baseline: { values: m.baseline, window: opts.baseline_window },
      current: { values: m.current, window: opts.current_window },
      config: opts.config,
    }),
  );
}

/** Get a drift report by ID. */
export function getDriftReport(reportId: string): DriftReport | null {
  return reports.get(reportId) ?? null;
}

/** List drift reports for a tenant. */
export function listDriftReports(tenantId: string): DriftReport[] {
  return Array.from(reports.values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => b.created_at - a.created_at);
}

/** List drift alerts for a tenant. */
export function listDriftAlerts(tenantId: string): DriftAlert[] {
  return alerts.filter((a) => a.tenant_id === tenantId).sort((a, b) => b.created_at - a.created_at);
}

/** Get drift summary for a tenant. */
export function getDriftSummary(tenantId: string): {
  total_reports: number;
  drifted_reports: number;
  total_alerts: number;
  high_severity_alerts: number;
  by_metric: Record<string, { reports: number; drifted: number }>;
} {
  const tenantReports = listDriftReports(tenantId);
  const tenantAlerts = listDriftAlerts(tenantId);
  const byMetric: Record<string, { reports: number; drifted: number }> = {};
  for (const r of tenantReports) {
    if (!byMetric[r.metric]) byMetric[r.metric] = { reports: 0, drifted: 0 };
    byMetric[r.metric]!.reports++;
    if (r.has_drift) byMetric[r.metric]!.drifted++;
  }
  return {
    total_reports: tenantReports.length,
    drifted_reports: tenantReports.filter((r) => r.has_drift).length,
    total_alerts: tenantAlerts.length,
    high_severity_alerts: tenantAlerts.filter((a) => a.severity === 'high').length,
    by_metric: byMetric,
  };
}

/** Clear all reports and alerts (for testing). */
export function clearDriftData(): void {
  reports.clear();
  alerts.length = 0;
}

// ============================================================
// Helpers
// ============================================================

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function generateId(length: number): string {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}
