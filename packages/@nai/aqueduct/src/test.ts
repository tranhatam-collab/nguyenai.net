/**
 * @nai/aqueduct — Workflow orchestrator unit tests.
 */
import {
  validateWorkflow,
  WorkflowExecutor,
  runWorkflow,
  type Workflow,
  type WorkflowStep,
  type WorkflowEvent,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  // 1. Validate workflow — valid
  const validWf: Workflow = {
    id: 'wf_1',
    name: 'test',
    steps: [
      { id: 'a', run: async () => 1 },
      { id: 'b', run: async () => 2, dependsOn: ['a'] },
      { id: 'c', run: async () => 3, dependsOn: ['a', 'b'] },
    ],
  };
  const validErrors = validateWorkflow(validWf);
  assert(validErrors.length === 0, 'valid workflow has no errors');

  // 2. Validate workflow — unknown dependency
  const invalidWf: Workflow = {
    id: 'wf_2',
    name: 'test',
    steps: [{ id: 'a', run: async () => 1, dependsOn: ['nonexistent'] }],
  };
  const invalidErrors = validateWorkflow(invalidWf);
  assert(invalidErrors.length > 0, 'invalid workflow detects unknown dep');

  // 3. Validate workflow — cycle
  const cycleWf: Workflow = {
    id: 'wf_3',
    name: 'test',
    steps: [
      { id: 'a', run: async () => 1, dependsOn: ['b'] },
      { id: 'b', run: async () => 2, dependsOn: ['a'] },
    ],
  };
  const cycleErrors = validateWorkflow(cycleWf);
  assert(cycleErrors.length > 0, 'cycle detected');

  // 4. Simple linear execution
  const exec1 = await runWorkflow(
    [
      { id: 'step1', run: async (ctx) => ctx.input },
      { id: 'step2', run: async (ctx) => (ctx.outputs['step1'] as number) * 2, dependsOn: ['step1'] },
      { id: 'step3', run: async (ctx) => (ctx.outputs['step2'] as number) + 1, dependsOn: ['step2'] },
    ],
    5,
    'linear',
  );
  assert(exec1.status === 'succeeded', 'linear workflow succeeds');
  assert(exec1.results.get('step1')?.status === 'succeeded', 'step1 succeeded');
  assert(exec1.results.get('step2')?.output === 10, 'step2 output = 10');
  assert(exec1.results.get('step3')?.output === 11, 'step3 output = 11');

  // 5. Parallel branches (fan-out)
  const exec2 = await runWorkflow(
    [
      { id: 'root', run: async () => 'start' },
      { id: 'branch_a', run: async () => 'A', dependsOn: ['root'] },
      { id: 'branch_b', run: async () => 'B', dependsOn: ['root'] },
      { id: 'join', run: async (ctx) => `${ctx.outputs['branch_a']}-${ctx.outputs['branch_b']}`, dependsOn: ['branch_a', 'branch_b'] },
    ],
    null,
    'parallel',
  );
  assert(exec2.status === 'succeeded', 'parallel workflow succeeds');
  assert(exec2.results.get('join')?.output === 'A-B', 'join combines parallel outputs');

  // 6. Conditional skip
  const exec3 = await runWorkflow(
    [
      { id: 'check', run: async () => false },
      { id: 'conditional', run: async () => 'should not run', dependsOn: ['check'], condition: (ctx) => ctx.outputs['check'] === true },
      { id: 'after', run: async () => 'ran', dependsOn: ['conditional'] },
    ],
    null,
    'conditional',
  );
  assert(exec3.status === 'succeeded', 'conditional workflow succeeds');
  assert(exec3.results.get('conditional')?.status === 'skipped', 'conditional step skipped');
  // 'after' depends on 'conditional' which was skipped (not failed), so it should run
  assert(exec3.results.get('after')?.status === 'succeeded', 'after step runs despite skipped dep');

  // 7. Retry on failure
  let attempts = 0;
  const exec4 = await runWorkflow(
    [
      {
        id: 'flaky',
        run: async () => {
          attempts++;
          if (attempts < 3) throw new Error('fail');
          return 'success';
        },
        retries: 3,
        retryDelayMs: 10,
      },
    ],
    null,
    'retry',
  );
  assert(exec4.status === 'succeeded', 'retry workflow succeeds');
  assert(exec4.results.get('flaky')?.status === 'succeeded', 'flaky step eventually succeeds');
  assert(exec4.results.get('flaky')?.attempts === 3, 'flaky step took 3 attempts');

  // 8. Permanent failure
  const exec5 = await runWorkflow(
    [
      { id: 'always_fail', run: async () => { throw new Error('always'); }, retries: 1 },
      { id: 'dependent', run: async () => 'should not run', dependsOn: ['always_fail'] },
    ],
    null,
    'failure',
  );
  assert(exec5.results.get('always_fail')?.status === 'failed', 'always_fail fails');
  assert(exec5.results.get('always_fail')?.attempts === 2, 'always_fail retried once (2 attempts)');
  assert(exec5.results.get('dependent')?.status === 'skipped', 'dependent step skipped');

  // 9. Timeout
  const exec6 = await runWorkflow(
    [
      { id: 'slow', run: async () => { await new Promise((r) => setTimeout(r, 200)); return 'done'; }, timeoutMs: 50 },
    ],
    null,
    'timeout',
  );
  assert(exec6.results.get('slow')?.status === 'failed', 'slow step times out');
  assert(exec6.results.get('slow')?.error?.includes('Timeout') === true, 'timeout error message');

  // 10. Event tracking
  const executor = new WorkflowExecutor();
  const events: WorkflowEvent[] = [];
  executor.onEvent((e) => events.push(e));
  await executor.execute(
    { id: 'wf_events', name: 'events', steps: [{ id: 's1', run: async () => 1 }] },
    null,
  );
  assert(events.some((e) => e.type === 'workflow_started'), 'workflow_started event emitted');
  assert(events.some((e) => e.type === 'step_started'), 'step_started event emitted');
  assert(events.some((e) => e.type === 'step_succeeded'), 'step_succeeded event emitted');
  assert(events.some((e) => e.type === 'workflow_succeeded'), 'workflow_succeeded event emitted');

  // 11. Tenant context
  const exec7 = await runWorkflow(
    [{ id: 't', run: async (ctx) => ctx.tenantId }],
    null,
    'tenant',
    't_123',
  );
  assert(exec7.results.get('t')?.output === 't_123', 'tenant context passed to steps');

  // Report
  console.log('\n@nai/aqueduct test');
  console.log('--------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
