import {
  logCall,
  getCalls,
  getStats,
  setCostTable,
  calculateCost,
  clearLog,
  exportCsv,
  exportJson,
  getCostTable,
  type LlmCallRecord,
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
  clearLog();

  // 1. Cost calculation with default table
  const cost1 = calculateCost('gpt-4o', 1000, 500);
  // 1000/1000 * 0.0025 + 500/1000 * 0.01 = 0.0025 + 0.005 = 0.0075
  assert(approx(cost1, 0.0075), 'calculateCost gpt-4o 1000in/500out = 0.0075');

  // 2. Cost calculation for unknown model returns 0
  const costUnknown = calculateCost('unknown-model', 1000, 1000);
  assert(costUnknown === 0, 'calculateCost unknown model returns 0');

  // 3. setCostTable changes pricing
  setCostTable({ 'custom-model': { inputPer1k: 0.001, outputPer1k: 0.002 } });
  const costCustom = calculateCost('custom-model', 2000, 1000);
  // 2000/1000 * 0.001 + 1000/1000 * 0.002 = 0.002 + 0.002 = 0.004
  assert(approx(costCustom, 0.004), 'calculateCost custom model after setCostTable = 0.004');

  // 4. getCostTable reflects updated table
  const table = getCostTable();
  assert(table['custom-model'] !== undefined && table['gpt-4o'] === undefined, 'getCostTable reflects only custom table after setCostTable');

  // Restore default table for subsequent tests
  setCostTable({
    'gpt-4o': { inputPer1k: 0.0025, outputPer1k: 0.01 },
    'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  });

  // 5. logCall adds a record
  const rec1 = logCall({
    model: 'gpt-4o',
    prompt: 'Hello',
    response: 'Hi there',
    tokensIn: 10,
    tokensOut: 5,
    latencyMs: 200,
  });
  assert(rec1.id.startsWith('call_'), 'logCall returns record with generated id');
  assert(rec1.cost > 0, 'logCall auto-computes cost when not provided');
  assert(rec1.timestamp > 0, 'logCall auto-sets timestamp');

  // 6. logCall with explicit cost
  const rec2 = logCall({
    id: 'manual-id-1',
    model: 'gpt-4o-mini',
    prompt: 'Test prompt',
    response: 'Test response',
    tokensIn: 100,
    tokensOut: 50,
    latencyMs: 150,
    cost: 0.999,
    timestamp: 1000,
  });
  assert(rec2.id === 'manual-id-1', 'logCall preserves explicit id');
  assert(approx(rec2.cost, 0.999), 'logCall preserves explicit cost');

  // 7. logCall with tenantId and metadata
  const rec3 = logCall({
    model: 'gpt-4o',
    prompt: 'Tenant call',
    response: 'Response',
    tokensIn: 500,
    tokensOut: 200,
    latencyMs: 500,
    tenantId: 'tenant-A',
    metadata: { source: 'test' },
  });
  assert(rec3.tenantId === 'tenant-A', 'logCall preserves tenantId');
  assert(rec3.metadata?.source === 'test', 'logCall preserves metadata');

  // 8. getCalls with no filter returns all
  const allCalls = getCalls();
  assert(allCalls.length === 3, 'getCalls() returns all 3 logged calls');

  // 9. getCalls filter by model
  const gpt4oCalls = getCalls({ model: 'gpt-4o' });
  assert(gpt4oCalls.length === 2, 'getCalls filter model=gpt-4o returns 2');

  // 10. getCalls filter by tenantId
  const tenantCalls = getCalls({ tenantId: 'tenant-A' });
  assert(tenantCalls.length === 1, 'getCalls filter tenantId=tenant-A returns 1');

  // 11. getCalls filter by time range
  const timeFiltered = getCalls({ startTime: 500, endTime: 1500 });
  assert(timeFiltered.length === 1 && timeFiltered[0]?.id === 'manual-id-1', 'getCalls time range filter returns rec2');

  // 12. getStats overall
  const stats = getStats();
  assert(stats.totalCalls === 3, 'getStats totalCalls = 3');
  assert(stats.totalTokensIn === 610, 'getStats totalTokensIn = 610');
  assert(stats.totalTokensOut === 255, 'getStats totalTokensOut = 255');
  assert(stats.avgLatencyMs === Math.round((200 + 150 + 500) / 3), 'getStats avgLatencyMs correct');

  // 13. getStats for specific tenant
  const tenantStats = getStats('tenant-A');
  assert(tenantStats.totalCalls === 1, 'getStats tenant-A totalCalls = 1');
  assert(tenantStats.totalTokensIn === 500, 'getStats tenant-A totalTokensIn = 500');

  // 14. getStats empty
  clearLog();
  const emptyStats = getStats();
  assert(emptyStats.totalCalls === 0 && emptyStats.totalCost === 0 && emptyStats.avgLatencyMs === 0, 'getStats on empty log returns zeros');

  // 15. exportCsv format
  logCall({
    model: 'gpt-4o',
    prompt: 'CSV test, with comma',
    response: 'Response "quoted"',
    tokensIn: 10,
    tokensOut: 5,
    latencyMs: 100,
    tenantId: 't1',
  });
  const csv = exportCsv();
  assert(csv.split('\n').length === 2, 'exportCsv has header + 1 data row');
  assert(csv.includes('id,model,prompt,response'), 'exportCsv has correct header');

  // 16. exportJson format
  const json = exportJson();
  const parsed: LlmCallRecord[] = JSON.parse(json);
  assert(parsed.length === 1, 'exportJson parses to 1 record');
  assert(parsed[0]?.model === 'gpt-4o', 'exportJson record has correct model');

  // 17. clearLog empties everything
  clearLog();
  assert(getCalls().length === 0, 'clearLog empties the log');

  // Print results
  console.log('\n@nai/tally tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
