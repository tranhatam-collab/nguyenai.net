import {
  recordMetric,
  getMetric,
  getSeries,
  aggregate,
  createDashboard,
  exportDashboard,
  listDashboards,
  clearMetrics,
  clearDashboards,
  type Metric,
  type MetricSeries,
  type Dashboard,
  type Widget,
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

function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

async function main(): Promise<void> {
  clearMetrics();
  clearDashboards();

  // 1. recordMetric stores a point
  recordMetric('cpu', 42, { host: 'a' });
  const cpu = getMetric('cpu');
  assert(cpu.length === 1, 'recordMetric stores one cpu point');
  assert(cpu[0].value === 42, 'stored value is 42');
  assert(cpu[0].name === 'cpu', 'stored name is cpu');
  assert(cpu[0].tags.host === 'a', 'stored tag host=a');

  // 2. tag filtering
  recordMetric('cpu', 88, { host: 'b' });
  assert(getMetric('cpu').length === 2, 'two cpu points total');
  assert(getMetric('cpu', { host: 'a' }).length === 1, 'tag filter host=a returns 1');
  assert(getMetric('cpu', { host: 'b' })[0].value === 88, 'host=b value is 88');

  // 3. timestamp defaults to now-ish
  const now = Date.now();
  recordMetric('mem', 10);
  const mem = getMetric('mem');
  assert(Math.abs(mem[0].timestamp - now) < 5000, 'default timestamp ~ now');

  // 4. aggregate sum
  recordMetric('req', 1);
  recordMetric('req', 2);
  recordMetric('req', 3);
  const reqs = getMetric('req');
  assert(aggregate(reqs, 'sum') === 6, 'aggregate sum = 6');
  assert(approx(aggregate(reqs, 'avg'), 2), 'aggregate avg = 2');
  assert(aggregate(reqs, 'min') === 1, 'aggregate min = 1');
  assert(aggregate(reqs, 'max') === 3, 'aggregate max = 3');
  assert(aggregate(reqs, 'count') === 3, 'aggregate count = 3');

  // 5. aggregate empty
  assert(aggregate([], 'sum') === 0, 'aggregate empty sum = 0');
  assert(aggregate([], 'count') === 0, 'aggregate empty count = 0');

  // 6. getSeries returns correct bucket count
  const series = getSeries('req', 1000, {}, 10);
  assert(series.name === 'req', 'series name is req');
  assert(series.points.length === 10, 'series has 10 buckets');
  assert(series.points.every((p) => typeof p.value === 'number'), 'all points numeric');

  // 7. getSeries sums values within buckets
  const seriesTotal = series.points.reduce((acc, p) => acc + p.value, 0);
  assert(seriesTotal === 6, 'series total across buckets = 6');

  // 8. createDashboard registers a dashboard
  const dash = createDashboard({
    name: 'Ops',
    widgets: [
      { id: 'w1', type: 'line', title: 'CPU', metricName: 'cpu', aggregation: 'avg' },
      { id: 'w2', type: 'gauge', title: 'Mem', metricName: 'mem', aggregation: 'max' },
    ],
    refreshIntervalMs: 2000,
  });
  assert(dash.name === 'Ops', 'dashboard name is Ops');
  assert(dash.widgets.length === 2, 'dashboard has 2 widgets');
  assert(dash.refreshIntervalMs === 2000, 'refresh interval is 2000');
  assert(dash.id.startsWith('dash-'), 'dashboard id generated');

  // 9. createDashboard auto-generates widget ids
  const dash2 = createDashboard({
    name: 'Auto',
    widgets: [{ type: 'bar', title: 'Req', metricName: 'req' }],
  });
  assert(dash2.widgets[0].id.startsWith('widget-'), 'widget id auto-generated');
  assert(dash2.widgets[0].type === 'bar', 'widget type bar preserved');

  // 10. listDashboards returns all
  const all = listDashboards();
  assert(all.length === 2, 'listDashboards returns 2');

  // 11. exportDashboard returns valid JSON
  const exported = exportDashboard(dash);
  const parsed = JSON.parse(exported) as Dashboard;
  assert(parsed.name === 'Ops', 'exported dashboard parses with name Ops');
  assert(parsed.widgets.length === 2, 'exported dashboard has 2 widgets');
  assert(parsed.widgets[0].metricName === 'cpu', 'exported widget metricName cpu');

  // 12. clearMetrics empties the store
  clearMetrics();
  assert(getMetric('cpu').length === 0, 'clearMetrics empties cpu');
  assert(getMetric('req').length === 0, 'clearMetrics empties req');

  // 13. clearMetrics keeps dashboards
  assert(listDashboards().length === 2, 'dashboards survive clearMetrics');

  // 14. default refresh interval
  const dash3 = createDashboard({ name: 'Default' });
  assert(dash3.refreshIntervalMs === 5000, 'default refresh interval is 5000');
  assert(dash3.widgets.length === 0, 'default widgets empty array');

  // 15. tags filter with multiple keys
  recordMetric('lat', 5, { region: 'us', env: 'prod' });
  recordMetric('lat', 9, { region: 'eu', env: 'prod' });
  assert(getMetric('lat', { env: 'prod' }).length === 2, 'multi-tag filter env=prod returns 2');
  assert(getMetric('lat', { env: 'prod', region: 'us' }).length === 1, 'multi-tag filter us/prod returns 1');

  // 16. MetricSeries points have timestamps within range
  const latSeries = getSeries('lat', 500, {}, 5);
  assert(latSeries.points.length === 5, 'lat series has 5 buckets');
  const firstTs = latSeries.points[0].timestamp;
  const lastTs = latSeries.points[latSeries.points.length - 1].timestamp;
  assert(lastTs > firstTs, 'series timestamps ascending');

  // 17. Widget type union enforced at runtime via createDashboard
  const validTypes: Array<Widget['type']> = ['line', 'bar', 'gauge', 'table'];
  const dash4 = createDashboard({
    name: 'Types',
    widgets: validTypes.map((t, i) => ({
      id: `t${i}`,
      type: t,
      title: t,
      metricName: 'lat',
    })),
  });
  assert(dash4.widgets.length === 4, 'all four widget types accepted');

  console.log('\n@nai/atlas test');
  console.log('----------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
