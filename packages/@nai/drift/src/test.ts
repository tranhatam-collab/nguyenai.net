import {
  PACKAGE_INFO,
  detectDrift,
  detectDriftMulti,
  getDriftReport,
  listDriftReports,
  listDriftAlerts,
  getDriftSummary,
  onDriftAlert,
  clearAlertHandlers,
  clearDriftData,
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
  clearDriftData();
  clearAlertHandlers();

  // Smoke
  assert(PACKAGE_INFO.name === '@nai/phoenix', 'PACKAGE_INFO.name is @nai/phoenix');
  assert(PACKAGE_INFO.upstream.startsWith('https://'), 'PACKAGE_INFO.upstream is https URL');

  // ============================================================
  // detectDrift — no drift
  // ============================================================

  // 1. No drift when values are similar
  const noDrift = detectDrift({
    tenant_id: 't1',
    metric: 'accuracy',
    baseline: { values: [0.9, 0.91, 0.89, 0.9, 0.92], window: { start: 1000, end: 2000 } },
    current: { values: [0.9, 0.91, 0.89, 0.9, 0.92], window: { start: 2000, end: 3000 } },
  });
  assert(noDrift.has_drift === false, 'no drift when values identical');
  assert(noDrift.severity === 'none', 'severity is none when no drift');
  assert(noDrift.metrics.length === 1, 'report has 1 metric');
  assert(noDrift.metrics[0]?.delta === 0, 'delta is 0 for identical values');

  // 2. Report has correct windows
  assert(noDrift.baseline_window.sample_count === 5, 'baseline sample_count = 5');
  assert(noDrift.current_window.sample_count === 5, 'current sample_count = 5');
  assert(noDrift.baseline_window.start === 1000, 'baseline window start preserved');
  assert(noDrift.current_window.end === 3000, 'current window end preserved');

  // ============================================================
  // detectDrift — with drift
  // ============================================================

  // 3. Drift detected when significant change
  const drifted = detectDrift({
    tenant_id: 't1',
    metric: 'latency_ms',
    baseline: { values: [100, 110, 105, 95, 100], window: { start: 1000, end: 2000 } },
    current: { values: [200, 210, 205, 195, 200], window: { start: 2000, end: 3000 } },
  });
  assert(drifted.has_drift === true, 'drift detected when 2x increase');
  assert(drifted.severity === 'high', 'severity is high for 100% increase');
  assert(drifted.metrics[0]?.delta > 90, 'delta > 90 for 2x latency');
  assert(drifted.metrics[0]?.delta_pct >= 0.5, 'delta_pct >= 0.5 for high severity');

  // 4. Alert generated for drift
  const alerts = listDriftAlerts('t1');
  assert(alerts.length === 1, '1 alert generated for drift');
  assert(alerts[0]?.severity === 'high', 'alert severity is high');
  assert(alerts[0]?.metric === 'latency_ms', 'alert metric is latency_ms');
  assert(alerts[0]?.message.includes('latency_ms'), 'alert message contains metric name');

  // 5. Alert handler called
  let handlerCalled = false;
  let receivedAlert: typeof alerts[0] | null = null;
  onDriftAlert((alert) => {
    handlerCalled = true;
    receivedAlert = alert;
  });
  detectDrift({
    tenant_id: 't1',
    metric: 'error_rate',
    baseline: { values: [0.01, 0.02, 0.01, 0.01, 0.02], window: { start: 1000, end: 2000 } },
    current: { values: [0.1, 0.12, 0.11, 0.1, 0.12], window: { start: 2000, end: 3000 } },
  });
  assert(handlerCalled, 'alert handler called on drift');
  assert(receivedAlert?.metric === 'error_rate', 'handler received correct alert');

  // ============================================================
  // Severity levels
  // ============================================================

  // 6. Medium severity
  clearDriftData();
  const medium = detectDrift({
    tenant_id: 't2',
    metric: 'token_count',
    baseline: { values: [100, 100, 100, 100, 100], window: { start: 1000, end: 2000 } },
    current: { values: [135, 130, 140, 132, 138], window: { start: 2000, end: 3000 } },
  });
  assert(medium.has_drift === true, 'medium drift detected');
  assert(medium.severity === 'medium', 'severity is medium for ~35% change');

  // 7. Low severity
  clearDriftData();
  const low = detectDrift({
    tenant_id: 't2',
    metric: 'cost_usd',
    baseline: { values: [0.5, 0.5, 0.5, 0.5, 0.5], window: { start: 1000, end: 2000 } },
    current: { values: [0.625, 0.61, 0.64, 0.62, 0.63], window: { start: 2000, end: 3000 } },
  });
  assert(low.has_drift === true, 'low drift detected');
  assert(low.severity === 'low', 'severity is low for ~25% change');

  // 8. No drift when below threshold
  clearDriftData();
  const belowThreshold = detectDrift({
    tenant_id: 't2',
    metric: 'accuracy',
    baseline: { values: [0.9, 0.9, 0.9, 0.9, 0.9], window: { start: 1000, end: 2000 } },
    current: { values: [0.91, 0.9, 0.91, 0.9, 0.91], window: { start: 2000, end: 3000 } },
  });
  assert(belowThreshold.has_drift === false, 'no drift for ~1% change');

  // 9. No drift when insufficient samples
  clearDriftData();
  const insufficient = detectDrift({
    tenant_id: 't2',
    metric: 'accuracy',
    baseline: { values: [0.9, 0.9, 0.9, 0.9, 0.9], window: { start: 1000, end: 2000 } },
    current: { values: [0.5], window: { start: 2000, end: 3000 } },
  });
  assert(insufficient.has_drift === false, 'no drift with insufficient samples');

  // ============================================================
  // detectDriftMulti
  // ============================================================

  // 10. Multi-metric drift detection
  clearDriftData();
  const multiReports = detectDriftMulti({
    tenant_id: 't3',
    metrics: [
      { name: 'accuracy', baseline: [0.9, 0.9, 0.9, 0.9, 0.9], current: [0.9, 0.91, 0.89, 0.9, 0.91] },
      { name: 'latency', baseline: [100, 100, 100, 100, 100], current: [200, 210, 205, 195, 200] },
    ],
    baseline_window: { start: 1000, end: 2000 },
    current_window: { start: 2000, end: 3000 },
  });
  assert(multiReports.length === 2, 'detectDriftMulti returns 2 reports');
  assert(multiReports[0]?.has_drift === false, 'accuracy no drift');
  assert(multiReports[1]?.has_drift === true, 'latency drifted');

  // ============================================================
  // Querying
  // ============================================================

  // 11. getDriftReport
  const fetched = getDriftReport(multiReports[1]!.report_id);
  assert(fetched !== null, 'getDriftReport returns report');
  assert(getDriftReport('nonexistent') === null, 'getDriftReport returns null for unknown');

  // 12. listDriftReports
  const t3Reports = listDriftReports('t3');
  assert(t3Reports.length === 2, 'listDriftReports returns 2 for t3');

  // 13. listDriftAlerts
  const t3Alerts = listDriftAlerts('t3');
  assert(t3Alerts.length === 1, 'listDriftAlerts returns 1 for t3');

  // 14. getDriftSummary
  const summary = getDriftSummary('t3');
  assert(summary.total_reports === 2, 'summary total_reports = 2');
  assert(summary.drifted_reports === 1, 'summary drifted_reports = 1');
  assert(summary.total_alerts === 1, 'summary total_alerts = 1');
  assert(summary.by_metric['latency']?.drifted === 1, 'summary by_metric latency drifted = 1');
  assert(summary.by_metric['accuracy']?.drifted === 0, 'summary by_metric accuracy drifted = 0');

  // 15. clearDriftData
  clearDriftData();
  assert(listDriftReports('t3').length === 0, 'clearDriftData empties reports');
  assert(listDriftAlerts('t3').length === 0, 'clearDriftData empties alerts');

  // Print results
  console.log('\n@nai/drift tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
