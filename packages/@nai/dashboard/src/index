/**
 * @nai/dashboard — Dashboard: system + business KPI (grafana rebrand)
 *
 * Provides dashboard panels, KPI definitions, data sources,
 * and snapshot rendering.
 *
 * P1-D.9: Dashboard — system + business KPI
 */

export const PACKAGE_INFO = {
  name: '@nai/grafana',
  upstream: 'https://github.com/grafana/grafana',
  tool: 'grafana',
  language: 'ts',
  license: 'AGPL-3.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

// ============================================================
// Panel types
// ============================================================

export type PanelType = 'stat' | 'timeseries' | 'table' | 'gauge' | 'bar' | 'pie';

export interface DashboardPanel {
  id: string;
  title: string;
  type: PanelType;
  query: string;
  unit?: string;
  thresholds?: { value: number; color: string }[];
  description?: string;
  grid_pos?: { x: number; y: number; w: number; h: number };
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  panels: DashboardPanel[];
  refresh_interval_ms: number;
  time_range: { from: string; to: string };
  created_at: number;
  updated_at: number;
}

// ============================================================
// KPI definitions
// ============================================================

export type KPICategory = 'system' | 'business' | 'security' | 'user';

export interface KPIDefinition {
  id: string;
  name: string;
  category: KPICategory;
  description: string;
  unit: string;
  target?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  query: string;
}

export interface KPIValue {
  kpi_id: string;
  value: number;
  timestamp: number;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
}

const dashboards = new Map<string, Dashboard>();
const kpiDefinitions = new Map<string, KPIDefinition>();
const kpiValues: KPIValue[] = [];

// ============================================================
// Dashboard management
// ============================================================

/** Create a new dashboard. */
export function createDashboard(opts: {
  name: string;
  description?: string;
  tags?: string[];
  panels?: DashboardPanel[];
  refresh_interval_ms?: number;
  time_range?: { from: string; to: string };
}): Dashboard {
  const now = Date.now();
  const dashboard: Dashboard = {
    id: generateId(16),
    name: opts.name,
    description: opts.description,
    tags: opts.tags ?? [],
    panels: opts.panels ?? [],
    refresh_interval_ms: opts.refresh_interval_ms ?? 30000,
    time_range: opts.time_range ?? { from: 'now-1h', to: 'now' },
    created_at: now,
    updated_at: now,
  };
  dashboards.set(dashboard.id, dashboard);
  return dashboard;
}

/** Get a dashboard by ID. */
export function getDashboard(id: string): Dashboard | null {
  return dashboards.get(id) ?? null;
}

/** List all dashboards. */
export function listDashboards(): Dashboard[] {
  return Array.from(dashboards.values());
}

/** Add a panel to a dashboard. */
export function addPanel(dashboardId: string, panel: Omit<DashboardPanel, 'id'>): DashboardPanel {
  const dashboard = dashboards.get(dashboardId);
  if (!dashboard) throw new Error(`Dashboard ${dashboardId} not found`);
  const fullPanel: DashboardPanel = { ...panel, id: generateId(12) };
  dashboard.panels.push(fullPanel);
  dashboard.updated_at = Date.now();
  return fullPanel;
}

/** Remove a panel from a dashboard. */
export function removePanel(dashboardId: string, panelId: string): boolean {
  const dashboard = dashboards.get(dashboardId);
  if (!dashboard) return false;
  const idx = dashboard.panels.findIndex((p) => p.id === panelId);
  if (idx < 0) return false;
  dashboard.panels.splice(idx, 1);
  dashboard.updated_at = Date.now();
  return true;
}

/** List dashboards by tag. */
export function listDashboardsByTag(tag: string): Dashboard[] {
  return listDashboards().filter((d) => d.tags.includes(tag));
}

// ============================================================
// KPI management
// ============================================================

/** Register a KPI definition. */
export function registerKPI(kpi: KPIDefinition): void {
  kpiDefinitions.set(kpi.id, kpi);
}

/** Get a KPI definition. */
export function getKPI(id: string): KPIDefinition | null {
  return kpiDefinitions.get(id) ?? null;
}

/** List all KPIs. */
export function listKPIs(): KPIDefinition[] {
  return Array.from(kpiDefinitions.values());
}

/** List KPIs by category. */
export function listKPIsByCategory(category: KPICategory): KPIDefinition[] {
  return listKPIs().filter((k) => k.category === category);
}

/** Record a KPI value. */
export function recordKPIValue(kpiId: string, value: number): KPIValue {
  const kpi = kpiDefinitions.get(kpiId);
  let status: KPIValue['status'] = 'unknown';
  if (kpi) {
    if (kpi.critical_threshold !== undefined && value >= kpi.critical_threshold) {
      status = 'critical';
    } else if (kpi.warning_threshold !== undefined && value >= kpi.warning_threshold) {
      status = 'warning';
    } else {
      status = 'ok';
    }
  }
  const kpiValue: KPIValue = {
    kpi_id: kpiId,
    value,
    timestamp: Date.now(),
    status,
  };
  kpiValues.push(kpiValue);
  return kpiValue;
}

/** Get latest KPI value. */
export function getLatestKPIValue(kpiId: string): KPIValue | null {
  const values = kpiValues.filter((v) => v.kpi_id === kpiId);
  if (values.length === 0) return null;
  return values[values.length - 1]!;
}

/** Get KPI values in a time range. */
export function getKPIValues(kpiId: string, startTime?: number, endTime?: number): KPIValue[] {
  let results = kpiValues.filter((v) => v.kpi_id === kpiId);
  if (startTime) results = results.filter((v) => v.timestamp >= startTime);
  if (endTime) results = results.filter((v) => v.timestamp <= endTime);
  return results.sort((a, b) => a.timestamp - b.timestamp);
}

/** Get KPI summary for all KPIs. */
export function getKPISummary(): { kpi: KPIDefinition; latest: KPIValue | null }[] {
  return listKPIs().map((kpi) => ({ kpi, latest: getLatestKPIValue(kpi.id) }));
}

// ============================================================
// Default dashboards + KPIs
// ============================================================

/** Create default system dashboard. */
export function createSystemDashboard(): Dashboard {
  return createDashboard({
    name: 'System Overview',
    description: 'System health and performance metrics',
    tags: ['system', 'overview'],
    refresh_interval_ms: 10000,
    panels: [
      { id: generateId(12), title: 'CPU Usage', type: 'gauge', query: 'cpu_usage', unit: '%', thresholds: [{ value: 80, color: 'orange' }, { value: 90, color: 'red' }] },
      { id: generateId(12), title: 'Memory Usage', type: 'gauge', query: 'memory_usage', unit: '%' },
      { id: generateId(12), title: 'Request Latency', type: 'timeseries', query: 'request_latency_ms', unit: 'ms' },
      { id: generateId(12), title: 'Error Rate', type: 'stat', query: 'error_rate', unit: '%', thresholds: [{ value: 1, color: 'orange' }, { value: 5, color: 'red' }] },
    ],
  });
}

/** Create default business dashboard. */
export function createBusinessDashboard(): Dashboard {
  return createDashboard({
    name: 'Business Overview',
    description: 'Business KPIs and revenue metrics',
    tags: ['business', 'overview'],
    refresh_interval_ms: 60000,
    panels: [
      { id: generateId(12), title: 'Active Users', type: 'stat', query: 'active_users' },
      { id: generateId(12), title: 'Revenue (VND)', type: 'timeseries', query: 'revenue_vnd', unit: 'VND' },
      { id: generateId(12), title: 'Subscriptions', type: 'bar', query: 'subscriptions_count' },
      { id: generateId(12), title: 'Commands Today', type: 'stat', query: 'commands_today' },
    ],
  });
}

/** Register default KPIs. */
export function registerDefaultKPIs(): void {
  registerKPI({
    id: 'cpu_usage',
    name: 'CPU Usage',
    category: 'system',
    description: 'Average CPU usage across all instances',
    unit: '%',
    warning_threshold: 80,
    critical_threshold: 90,
    query: 'avg(cpu_usage)',
  });
  registerKPI({
    id: 'memory_usage',
    name: 'Memory Usage',
    category: 'system',
    description: 'Average memory usage',
    unit: '%',
    warning_threshold: 80,
    critical_threshold: 90,
    query: 'avg(memory_usage)',
  });
  registerKPI({
    id: 'error_rate',
    name: 'Error Rate',
    category: 'system',
    description: 'Percentage of requests returning errors',
    unit: '%',
    warning_threshold: 1,
    critical_threshold: 5,
    query: 'rate(errors[5m]) / rate(requests[5m]) * 100',
  });
  registerKPI({
    id: 'active_users',
    name: 'Active Users',
    category: 'business',
    description: 'Daily active users',
    unit: 'users',
    target: 1000,
    query: 'count(active_users)',
  });
  registerKPI({
    id: 'revenue_vnd',
    name: 'Revenue (VND)',
    category: 'business',
    description: 'Total revenue in VND',
    unit: 'VND',
    target: 100000000,
    query: 'sum(revenue_vnd)',
  });
  registerKPI({
    id: 'commands_today',
    name: 'Commands Today',
    category: 'user',
    description: 'Total AI commands executed today',
    unit: 'commands',
    target: 10000,
    query: 'sum(commands_today)',
  });
}

/** Clear all data (for testing). */
export function clearDashboardData(): void {
  dashboards.clear();
  kpiDefinitions.clear();
  kpiValues.length = 0;
}

// ============================================================
// Helpers
// ============================================================

function generateId(length: number): string {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * 16)];
  }
  return id;
}
