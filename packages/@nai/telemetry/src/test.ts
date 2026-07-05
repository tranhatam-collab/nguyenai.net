import {
  PACKAGE_INFO,
  registerMetric,
  getMetricDescriptor,
  incrementCounter,
  getCounter,
  setGauge,
  getGauge,
  recordHistogram,
  getHistogramStats,
  ConsoleExporter,
  InMemoryExporter,
  OTLPExporter,
  setExporter,
  exportTelemetry,
  getMetricRecords,
  getHistogramRecords,
  clearTelemetry,
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
  clearTelemetry();

  // Smoke
  assert(PACKAGE_INFO.name === '@nai/opentelemetry', 'PACKAGE_INFO.name is @nai/opentelemetry');
  assert(PACKAGE_INFO.upstream.startsWith('https://'), 'PACKAGE_INFO.upstream is https URL');

  // ============================================================
  // Metric descriptors
  // ============================================================

  registerMetric({ name: 'commands_total', type: 'counter', description: 'Total commands' });
  registerMetric({ name: 'active_users', type: 'gauge', description: 'Active users' });
  registerMetric({ name: 'request_latency_ms', type: 'histogram', unit: 'ms' });

  assert(getMetricDescriptor('commands_total')?.type === 'counter', 'descriptor type counter');
  assert(getMetricDescriptor('active_users')?.type === 'gauge', 'descriptor type gauge');
  assert(getMetricDescriptor('request_latency_ms')?.unit === 'ms', 'descriptor unit ms');
  assert(getMetricDescriptor('unknown') === null, 'unknown metric returns null');

  // ============================================================
  // Counters
  // ============================================================

  incrementCounter('commands_total');
  assert(getCounter('commands_total') === 1, 'counter incremented by 1');

  incrementCounter('commands_total', 5);
  assert(getCounter('commands_total') === 6, 'counter incremented by 5 → 6');

  incrementCounter('commands_total', 1, { agent: 'nguyen-guide' });
  assert(getCounter('commands_total', { agent: 'nguyen-guide' }) === 1, 'counter with attributes');
  assert(getCounter('commands_total') === 6, 'counter without attributes unchanged');

  incrementCounter('errors_total', 3);
  assert(getCounter('errors_total') === 3, 'separate counter tracks independently');
  assert(getCounter('nonexistent') === 0, 'nonexistent counter returns 0');

  // ============================================================
  // Gauges
  // ============================================================

  setGauge('active_users', 42);
  assert(getGauge('active_users') === 42, 'gauge set to 42');

  setGauge('active_users', 50);
  assert(getGauge('active_users') === 50, 'gauge updated to 50');

  setGauge('active_users', 10, { tenant: 't1' });
  assert(getGauge('active_users', { tenant: 't1' }) === 10, 'gauge with attributes');
  assert(getGauge('active_users') === 50, 'gauge without attributes unchanged');

  assert(getGauge('nonexistent') === 0, 'nonexistent gauge returns 0');

  // ============================================================
  // Histograms
  // ============================================================

  recordHistogram('request_latency_ms', 50);
  recordHistogram('request_latency_ms', 100);
  recordHistogram('request_latency_ms', 200);

  const histStats = getHistogramStats('request_latency_ms');
  assert(histStats !== null, 'histogram stats returned');
  assert(histStats?.count === 3, 'histogram count = 3');
  assert(histStats?.sum === 350, 'histogram sum = 350');
  assert(histStats?.min === 50, 'histogram min = 50');
  assert(histStats?.max === 200, 'histogram max = 200');
  assert(histStats?.avg === 350 / 3, 'histogram avg = 116.67');

  // Histogram with attributes
  recordHistogram('request_latency_ms', 500, { endpoint: '/api/command' });
  const attrStats = getHistogramStats('request_latency_ms', { endpoint: '/api/command' });
  assert(attrStats?.count === 1, 'histogram with attrs count = 1');
  assert(attrStats?.max === 500, 'histogram with attrs max = 500');

  // Nonexistent histogram
  assert(getHistogramStats('nonexistent') === null, 'nonexistent histogram returns null');

  // ============================================================
  // Exporters
  // ============================================================

  // InMemoryExporter
  const memExporter = new InMemoryExporter();
  setExporter(memExporter);
  exportTelemetry();
  assert(memExporter.exportedMetrics.length > 0, 'InMemoryExporter received metrics');
  assert(memExporter.exportedHistograms.length > 0, 'InMemoryExporter received histograms');

  // ConsoleExporter
  const consoleExporter = new ConsoleExporter();
  assert(consoleExporter.type === 'console', 'ConsoleExporter type is console');

  // OTLPExporter
  const otlpExporter = new OTLPExporter('http://localhost:4318');
  assert(otlpExporter.type === 'otlp', 'OTLPExporter type is otlp');
  assert(otlpExporter.endpoint === 'http://localhost:4318', 'OTLPExporter endpoint set');

  // ============================================================
  // Records
  // ============================================================

  const records = getMetricRecords();
  assert(records.length > 0, 'getMetricRecords returns records');
  assert(records.some((r) => r.name === 'commands_total' && r.type === 'counter'), 'records include counter');
  assert(records.some((r) => r.name === 'active_users' && r.type === 'gauge'), 'records include gauge');

  const histRecords = getHistogramRecords();
  assert(histRecords.length > 0, 'getHistogramRecords returns records');
  assert(histRecords[0]?.buckets.length > 0, 'histogram records have buckets');

  // ============================================================
  // Clear
  // ============================================================

  clearTelemetry();
  assert(getCounter('commands_total') === 0, 'clearTelemetry resets counters');
  assert(getGauge('active_users') === 0, 'clearTelemetry resets gauges');
  assert(getMetricRecords().length === 0, 'clearTelemetry resets metric records');
  assert(getHistogramRecords().length === 0, 'clearTelemetry resets histogram records');

  // Print results
  console.log('\n@nai/telemetry tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
