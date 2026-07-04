/**
 * @nai/loom — Pipeline builder unit tests.
 */
import { Pipeline, mapStage, filterStage, reduceStage, type PipelineEvent } from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  // 1. Simple map pipeline
  const p1 = new Pipeline('p1').stage(
    mapStage('double', (n: number) => n * 2),
  );
  const r1 = await p1.run([1, 2, 3, 4, 5]);
  assert(r1.status === 'succeeded', 'map pipeline succeeds');
  assert(r1.finalOutput.length === 5, 'output has 5 items');
  assert(r1.finalOutput[0] === 2, 'first item doubled');
  assert(r1.finalOutput[4] === 10, 'last item doubled');

  // 2. Multi-stage pipeline
  const p2 = new Pipeline('p2')
    .stage(mapStage('add1', (n: number) => n + 1))
    .stage(mapStage('mul3', (n: number) => n * 3))
    .stage(filterStage('even', (n: number) => n % 2 === 0));
  const r2 = await p2.run([1, 2, 3, 4, 5]);
  assert(r2.status === 'succeeded', 'multi-stage pipeline succeeds');
  // 1→2→6, 2→3→9, 3→4→12, 4→5→15, 5→6→18 → even: 6, 12, 18
  assert(r2.finalOutput.length === 3, 'filter keeps 3 even items');
  assert(r2.finalOutput[0] === 6, 'first filtered item = 6');
  assert(r2.finalOutput[2] === 18, 'last filtered item = 18');

  // 3. Reduce stage
  const p3 = new Pipeline('p3').stage(
    reduceStage('sum', (acc: number, n: number) => acc + n, 0),
  );
  const r3 = await p3.run([1, 2, 3, 4, 5]);
  assert(r3.status === 'succeeded', 'reduce pipeline succeeds');
  assert(r3.finalOutput.length === 1, 'reduce produces 1 item');
  assert(r3.finalOutput[0] === 15, 'sum = 15');

  // 4. Batch processing
  const p4 = new Pipeline('p4').stage({
    id: 'batch_doubler',
    transform: async (items: number[]) => items.map((n) => n * 2),
    batchSize: 2,
  });
  const r4 = await p4.run([1, 2, 3, 4, 5]);
  assert(r4.status === 'succeeded', 'batch pipeline succeeds');
  assert(r4.finalOutput.length === 5, 'batch output has 5 items');
  assert(r4.finalOutput[0] === 2, 'batch first item = 2');

  // 5. Stage failure
  const p5 = new Pipeline('p5').stage({
    id: 'failer',
    transform: async () => { throw new Error('boom'); },
  });
  const r5 = await p5.run([1, 2, 3]);
  assert(r5.status === 'failed', 'failing pipeline returns failed status');
  assert(r5.stages[0]?.status === 'failed', 'failing stage marked failed');
  assert(r5.stages[0]?.error === 'boom', 'error message preserved');

  // 6. Retry on failure
  let attempts = 0;
  const p6 = new Pipeline('p6').stage({
    id: 'flaky',
    transform: async (items: number[]) => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return items.map((n) => n * 10);
    },
    retries: 3,
  });
  const r6 = await p6.run([1, 2]);
  assert(r6.status === 'succeeded', 'retry pipeline succeeds');
  assert(attempts === 3, 'flaky stage retried 3 times');
  assert(r6.finalOutput[0] === 10, 'retry output correct');

  // 7. Empty input
  const p7 = new Pipeline('p7').stage(mapStage('id', (n: number) => n));
  const r7 = await p7.run([]);
  assert(r7.status === 'succeeded', 'empty pipeline succeeds');
  assert(r7.finalOutput.length === 0, 'empty output');

  // 8. Metrics tracking
  const p8 = new Pipeline('p8')
    .stage(mapStage('s1', (n: number) => n + 1))
    .stage(filterStage('s2', (n: number) => n > 2))
    .stage(mapStage('s3', (n: number) => n * 10));
  const r8 = await p8.run([1, 2, 3, 4, 5]);
  assert(r8.stages.length === 3, '3 stages tracked');
  assert(r8.stages[0]?.metrics.itemsIn === 5, 's1 itemsIn = 5');
  assert(r8.stages[0]?.metrics.itemsOut === 5, 's1 itemsOut = 5');
  assert(r8.stages[1]?.metrics.itemsOut === 4, 's2 itemsOut = 4 (filtered)');
  assert(r8.stages[2]?.metrics.itemsIn === 4, 's3 itemsIn = 4');
  assert(r8.totalDurationMs >= 0, 'totalDurationMs tracked');

  // 9. Events
  const events: PipelineEvent[] = [];
  const p9 = new Pipeline('p9')
    .stage(mapStage('s1', (n: number) => n + 1))
    .onEvent((e) => events.push(e));
  await p9.run([1, 2]);
  assert(events.some((e) => e.type === 'pipeline_started'), 'pipeline_started event');
  assert(events.some((e) => e.type === 'stage_started'), 'stage_started event');
  assert(events.some((e) => e.type === 'stage_succeeded'), 'stage_succeeded event');
  assert(events.some((e) => e.type === 'pipeline_succeeded'), 'pipeline_succeeded event');

  // 10. Tenant context
  const p10 = new Pipeline('p10').stage(
    mapStage('tenant_check', (_n: number, ctx) => ctx.tenantId),
  );
  const r10 = await p10.run([1, 2], { tenantId: 't_999' });
  assert(r10.finalOutput[0] === 't_999', 'tenant context available in stages');

  // 11. Config
  const p11 = new Pipeline('p11').stage(
    mapStage('config_check', (n: number, ctx) => n * (ctx.config.multiplier as number ?? 1)),
  );
  const r11 = await p11.run([1, 2, 3], { config: { multiplier: 100 } });
  assert(r11.finalOutput[0] === 100, 'config available in stages');

  // Report
  console.log('\n@nai/loom test');
  console.log('---------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
