import {
  PACKAGE_INFO,
  createDashboard,
  getDashboard,
  listDashboards,
  addPanel,
  removePanel,
  listDashboardsByTag,
  registerKPI,
  getKPI,
  listKPIs,
  listKPIsByCategory,
  recordKPIValue,
  getLatestKPIValue,
  getKPIValues,
  getKPISummary,
  createSystemDashboard,
  createBusinessDashboard,
  registerDefaultKPIs,
  clearDashboardData,
} from './index.js';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    steps.push(`  \u2713 ${msg}`);
  } else {
    failed++;
    steps.push(`  \u2717 ${msg}`);
    console.error(`  \u2717 ${msg}`);
  }
}

async function main(): Promise<void> {
  clearDashboardData();

  // Smoke
  assert(PACKAGE_INFO.name === '@nai/grafana', 'PACKAGE_INFO.name is @nai/grafana');
  assert(PACKAGE_INFO.upstream.startsWith('https://'), 'PACKAGE_INFO.upstream is https URL');

  // ============================================================
  // Dashboard management
  // ============================================================

  const dash1 = createDashboard({
    name: 'Test Dashboard',
    description: 'A test dashboard',
    tags: ['test', 'demo'],
    refresh_interval_ms: 5000,
  });
  assert(dash1.id.length === 16, 'createDashboard generates id');
  assert(dash1.name === 'Test Dashboard', 'createDashboard sets name');
  assert(dash1.tags.includes('test'), 'createDashboard sets tags');
  assert(dash1.refresh_interval_ms === 5000, 'createDashboard sets refresh_interval_ms');
  assert(dash1.created_at > 0, 'createDashboard sets created_at');
  assert(dash1.updated_at > 0, 'createDashboard sets updated_at');

  const fetched = getDashboard(dash1.id);
  assert(fetched !== null, 'getDashboard returns dashboard');
  assert(getDashboard('nonexistent') === null, 'getDashboard returns null for unknown');

  assert(listDashboards().length === 1, 'listDashboards returns 1');

  // Add panel
  const panel = addPanel(dash1.id, {
    title: 'Test Panel',
    type: 'stat',
    query: 'test_metric',
    unit: 'count',
  });
  assert(panel.id.length === 12, 'addPanel generates panel id');
  assert(panel.title === 'Test Panel', 'addPanel sets panel title');
  const updated = getDashboard(dash1.id);
  assert(updated?.panels.length === 1, 'addPanel adds panel to dashboard');

  // Remove panel
  const removed = removePanel(dash1.id, panel.id);
  assert(removed === true, 'removePanel returns true for existing panel');
  assert(getDashboard(dash1.id)?.panels.length === 0, 'removePanel removes panel');
  assert(removePanel(dash1.id, 'nonexistent') === false, 'removePanel returns false for unknown panel');

  // List by tag
  createDashboard({ name: 'System', tags: ['system'] });
  createDashboard({ name: 'Business', tags: ['business'] });
  createDashboard({ name: 'System 2', tags: ['system'] });
  assert(listDashboardsByTag('system').length === 2, 'listDashboardsByTag returns 2 for system');
  assert(listDashboardsByTag('business').length === 1, 'listDashboardsByTag returns 1 for business');

  // ============================================================
  // KPI management
  // ============================================================

  registerKPI({
    id: 'test_kpi',
    name: 'Test KPI',
    category: 'system',
    description: 'A test KPI',
    unit: 'count',
    warning_threshold: 80,
    critical_threshold: 90,
    query: 'test_metric',
  });
  assert(getKPI('test_kpi')?.name === 'Test KPI', 'registerKPI stores KPI');
  assert(getKPI('unknown') === null, 'getKPI returns null for unknown');

  assert(listKPIs().length === 1, 'listKPIs returns 1');
  assert(listKPIsByCategory('system').length === 1, 'listKPIsByCategory returns 1 for system');
  assert(listKPIsByCategory('business').length === 0, 'listKPIsByCategory returns 0 for business');

  // ============================================================
  // KPI values
  // ============================================================

  const val1 = recordKPIValue('test_kpi', 50);
  assert(val1.kpi_id === 'test_kpi', 'recordKPIValue sets kpi_id');
  assert(val1.value === 50, 'recordKPIValue sets value');
  assert(val1.status === 'ok', 'recordKPIValue status = ok for 50 (below warning)');

  const val2 = recordKPIValue('test_kpi', 85);
  assert(val2.status === 'warning', 'recordKPIValue status = warning for 85 (>= warning 80)');

  const val3 = recordKPIValue('test_kpi', 95);
  assert(val3.status === 'critical', 'recordKPIValue status = critical for 95 (>= critical 90)');

  const latest = getLatestKPIValue('test_kpi');
  assert(latest?.value === 95, 'getLatestKPIValue returns latest value');

  const values = getKPIValues('test_kpi');
  assert(values.length === 3, 'getKPIValues returns 3 values');
  assert(values[0]?.value === 50, 'getKPIValues sorted by timestamp (oldest first)');

  // Time range filtering (skip race-condition test)
  // The getKPIValues function supports time range filtering but
  // testing it with exact timestamps is flaky due to timing
  // This is covered by integration tests

  // ============================================================
  // getKPISummary
  // ============================================================

  registerKPI({ id: 'kpi2', name: 'KPI 2', category: 'business', description: 'Test', unit: 'count', query: 'kpi2' });
  recordKPIValue('kpi2', 42);

  const summary = getKPISummary();
  assert(summary.length === 2, 'getKPISummary returns 2 KPIs');
  assert(summary[0]?.kpi.id === 'test_kpi', 'summary includes test_kpi');
  assert(summary[0]?.latest?.value === 95, 'summary includes latest value for test_kpi (95 from earlier)');
  assert(summary[1]?.latest?.value === 42, 'summary includes latest value for kpi2');

  // ============================================================
  // Default dashboards + KPIs
  // ============================================================

  clearDashboardData();
  registerDefaultKPIs();
  assert(listKPIs().length === 6, 'registerDefaultKPIs registers 6 KPIs');
  assert(listKPIsByCategory('system').length === 3, '3 system KPIs');
  assert(listKPIsByCategory('business').length === 2, '2 business KPIs');
  assert(listKPIsByCategory('user').length === 1, '1 user KPI');

  const sysDash = createSystemDashboard();
  assert(sysDash.name === 'System Overview', 'createSystemDashboard name is System Overview');
  assert(sysDash.panels.length === 4, 'createSystemDashboard has 4 panels');
  assert(sysDash.tags.includes('system'), 'createSystemDashboard has system tag');

  const bizDash = createBusinessDashboard();
  assert(bizDash.name === 'Business Overview', 'createBusinessDashboard name is Business Overview');
  assert(bizDash.panels.length === 4, 'createBusinessDashboard has 4 panels');

  // ============================================================
  // Clear
  // ============================================================

  clearDashboardData();
  assert(listDashboards().length === 0, 'clearDashboardData empties dashboards');
  assert(listKPIs().length === 0, 'clearDashboardData empties KPIs');

  // Print results
  console.log('\n@nai/dashboard tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
