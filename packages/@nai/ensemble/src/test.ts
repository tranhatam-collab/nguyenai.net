/**
 * @nai/ensemble — Multi-agent crew orchestration unit tests.
 */
import {
  CrewExecutor,
  createAgent,
  tallyVotes,
  type Crew,
  type Task,
  type CrewEvent,
  type Vote,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

function makeTask(id: string, description: string, opts: Partial<Task> = {}): Task {
  return {
    id,
    description,
    requiredRole: opts.requiredRole,
    assignedAgentId: opts.assignedAgentId,
    dependsOn: opts.dependsOn,
    input: opts.input,
    priority: opts.priority,
    status: 'pending',
  };
}

async function main(): Promise<void> {
  // 1. Simple crew — one agent, one task
  const crew1: Crew = {
    id: 'crew_1',
    name: 'Simple Crew',
    agents: [
      createAgent('a1', 'Worker', 'executor', async (task) => `done: ${task.description}`),
    ],
    tasks: [makeTask('t1', 'Do something')],
  };

  const executor1 = new CrewExecutor();
  const r1 = await executor1.execute(crew1);
  assert(r1.status === 'succeeded', 'simple crew succeeds');
  assert(r1.taskResults.get('t1')?.status === 'completed', 'task completed');
  assert(r1.taskResults.get('t1')?.result === 'done: Do something', 'task result correct');
  assert(r1.taskResults.get('t1')?.assignedTo === 'a1', 'task assigned to a1');

  // 2. Role-based assignment
  const crew2: Crew = {
    id: 'crew_2',
    name: 'Role Crew',
    agents: [
      createAgent('researcher1', 'Researcher', 'researcher', async (task) => `research: ${task.description}`),
      createAgent('writer1', 'Writer', 'writer', async (task) => `write: ${task.description}`),
    ],
    tasks: [
      makeTask('research_task', 'Find info', { requiredRole: 'researcher' }),
      makeTask('write_task', 'Write report', { requiredRole: 'writer' }),
    ],
  };

  const r2 = await new CrewExecutor().execute(crew2);
  assert(r2.status === 'succeeded', 'role crew succeeds');
  assert(r2.taskResults.get('research_task')?.assignedTo === 'researcher1', 'research task → researcher');
  assert(r2.taskResults.get('write_task')?.assignedTo === 'writer1', 'write task → writer');

  // 3. Task dependencies (sequential)
  const crew3: Crew = {
    id: 'crew_3',
    name: 'Sequential Crew',
    agents: [
      createAgent('a1', 'Worker', 'executor', async (task, ctx) => {
        if (task.id === 't2') {
          const prev = ctx.taskOutputs['t1'];
          return `step2 after ${prev}`;
        }
        return `done: ${task.description}`;
      }),
    ],
    tasks: [
      makeTask('t1', 'First step'),
      makeTask('t2', 'Second step', { dependsOn: ['t1'] }),
    ],
  };

  const r3 = await new CrewExecutor().execute(crew3);
  assert(r3.status === 'succeeded', 'sequential crew succeeds');
  assert(r3.taskResults.get('t2')?.result === 'step2 after done: First step', 't2 uses t1 output');

  // 4. Parallel tasks
  const crew4: Crew = {
    id: 'crew_4',
    name: 'Parallel Crew',
    agents: [
      createAgent('a1', 'Worker 1', 'executor', async () => 'result_a'),
      createAgent('a2', 'Worker 2', 'executor', async () => 'result_b'),
    ],
    tasks: [
      makeTask('t1', 'Task A', { assignedAgentId: 'a1' }),
      makeTask('t2', 'Task B', { assignedAgentId: 'a2' }),
    ],
  };

  const r4 = await new CrewExecutor().execute(crew4);
  assert(r4.status === 'succeeded', 'parallel crew succeeds');
  assert(r4.taskResults.get('t1')?.result === 'result_a', 't1 result correct');
  assert(r4.taskResults.get('t2')?.result === 'result_b', 't2 result correct');

  // 5. Task failure
  const crew5: Crew = {
    id: 'crew_5',
    name: 'Failing Crew',
    agents: [
      createAgent('a1', 'Worker', 'executor', async () => { throw new Error('boom'); }),
    ],
    tasks: [makeTask('t1', 'Failing task')],
  };

  const r5 = await new CrewExecutor().execute(crew5);
  assert(r5.status === 'failed', 'failing crew returns failed status');
  assert(r5.taskResults.get('t1')?.status === 'failed', 'task marked failed');
  assert(r5.taskResults.get('t1')?.error === 'boom', 'error message preserved');

  // 6. Dependency failure cascades
  const crew6: Crew = {
    id: 'crew_6',
    name: 'Cascade Crew',
    agents: [
      createAgent('a1', 'Worker', 'executor', async () => { throw new Error('fail'); }),
    ],
    tasks: [
      makeTask('t1', 'Failing'),
      makeTask('t2', 'Dependent', { dependsOn: ['t1'] }),
    ],
  };

  const r6 = await new CrewExecutor().execute(crew6);
  assert(r6.status === 'failed', 'cascade crew fails');
  assert(r6.taskResults.get('t1')?.status === 'failed', 't1 failed');
  assert(r6.taskResults.get('t2')?.status === 'failed', 't2 failed due to dep');
  assert(r6.taskResults.get('t2')?.error === 'Dependency failed', 't2 error is dependency');

  // 7. No agent for role
  const crew7: Crew = {
    id: 'crew_7',
    name: 'No Agent Crew',
    agents: [createAgent('a1', 'Writer', 'writer', async () => 'write')],
    tasks: [makeTask('t1', 'Research', { requiredRole: 'researcher' })],
  };

  const r7 = await new CrewExecutor().execute(crew7);
  assert(r7.status === 'failed', 'no agent crew fails');
  assert(r7.taskResults.get('t1')?.error?.includes('No agent') === true, 'no agent error message');

  // 8. canHandle filter
  const crew8: Crew = {
    id: 'crew_8',
    name: 'CanHandle Crew',
    agents: [
      createAgent('a1', 'Picky Worker', 'executor', async () => 'handled', {
        canHandle: (task) => task.description.includes('special'),
      }),
      createAgent('a2', 'General Worker', 'executor', async () => 'general'),
    ],
    tasks: [
      makeTask('t1', 'special task'),
      makeTask('t2', 'normal task'),
    ],
  };

  const r8 = await new CrewExecutor().execute(crew8);
  assert(r8.status === 'succeeded', 'canHandle crew succeeds');
  assert(r8.taskResults.get('t1')?.assignedTo === 'a1', 'special task → picky agent');
  assert(r8.taskResults.get('t2')?.assignedTo === 'a2', 'normal task → general agent');

  // 9. Priority ordering
  const executionOrder: string[] = [];
  const crew9: Crew = {
    id: 'crew_9',
    name: 'Priority Crew',
    agents: [
      createAgent('a1', 'Worker', 'executor', async (task) => {
        executionOrder.push(task.id);
        return task.id;
      }),
    ],
    tasks: [
      makeTask('low', 'Low priority', { priority: 1 }),
      makeTask('high', 'High priority', { priority: 10 }),
      makeTask('medium', 'Medium priority', { priority: 5 }),
    ],
  };

  const r9 = await new CrewExecutor().execute(crew9);
  assert(r9.status === 'succeeded', 'priority crew succeeds');
  // All tasks execute in parallel, so order may vary — just check all completed
  assert(executionOrder.length === 3, 'all 3 tasks executed');

  // 10. Events
  const events: CrewEvent[] = [];
  const crew10: Crew = {
    id: 'crew_10',
    name: 'Event Crew',
    agents: [createAgent('a1', 'Worker', 'executor', async () => 'ok')],
    tasks: [makeTask('t1', 'Task')],
  };
  const executor10 = new CrewExecutor();
  executor10.onEvent((e) => events.push(e));
  await executor10.execute(crew10);
  assert(events.some((e) => e.type === 'crew_started'), 'crew_started event');
  assert(events.some((e) => e.type === 'task_assigned'), 'task_assigned event');
  assert(events.some((e) => e.type === 'task_completed'), 'task_completed event');
  assert(events.some((e) => e.type === 'crew_completed'), 'crew_completed event');

  // 11. Tenant context
  const crew11: Crew = {
    id: 'crew_11',
    name: 'Tenant Crew',
    agents: [createAgent('a1', 'Worker', 'executor', async (_task, ctx) => ctx.tenantId)],
    tasks: [makeTask('t1', 'Check tenant')],
  };
  const r11 = await new CrewExecutor().execute(crew11, 't_123');
  assert(r11.taskResults.get('t1')?.result === 't_123', 'tenant context passed to agents');
  assert(r11.context.tenantId === 't_123', 'crew context has tenantId');

  // 12. Consensus voting — unanimous
  const votes1: Vote[] = [
    { agentId: 'a1', vote: 'yes' },
    { agentId: 'a2', vote: 'yes' },
    { agentId: 'a3', vote: 'yes' },
  ];
  const consensus1 = tallyVotes(votes1);
  assert(consensus1.decision === 'yes', 'unanimous decision = yes');
  assert(consensus1.agreement === 1, 'unanimous agreement = 1');

  // 13. Consensus voting — majority
  const votes2: Vote[] = [
    { agentId: 'a1', vote: 'approve' },
    { agentId: 'a2', vote: 'reject' },
    { agentId: 'a3', vote: 'approve' },
  ];
  const consensus2 = tallyVotes(votes2);
  assert(consensus2.decision === 'approve', 'majority decision = approve');
  assert(consensus2.agreement === 2 / 3, 'majority agreement = 2/3');

  // 14. Consensus voting — tie
  const votes3: Vote[] = [
    { agentId: 'a1', vote: 'A' },
    { agentId: 'a2', vote: 'B' },
  ];
  const consensus3 = tallyVotes(votes3);
  // First max wins in our implementation
  assert(consensus3.decision === 'A' || consensus3.decision === 'B', 'tie returns one decision');
  assert(consensus3.agreement === 0.5, 'tie agreement = 0.5');

  // 15. Consensus voting — empty
  const consensus4 = tallyVotes([]);
  assert(consensus4.decision === null, 'empty votes → null decision');
  assert(consensus4.agreement === 0, 'empty votes → 0 agreement');

  // 16. Partial success
  const crew16: Crew = {
    id: 'crew_16',
    name: 'Partial Crew',
    agents: [
      createAgent('a1', 'Good Worker', 'executor', async () => 'ok'),
      createAgent('a2', 'Bad Worker', 'executor', async () => { throw new Error('fail'); }),
    ],
    tasks: [
      makeTask('t1', 'Good task', { assignedAgentId: 'a1' }),
      makeTask('t2', 'Bad task', { assignedAgentId: 'a2' }),
    ],
  };
  const r16 = await new CrewExecutor().execute(crew16);
  assert(r16.status === 'partial', 'partial crew returns partial status');
  assert(r16.taskResults.get('t1')?.status === 'completed', 't1 completed');
  assert(r16.taskResults.get('t2')?.status === 'failed', 't2 failed');

  // Report
  console.log('\n@nai/ensemble test');
  console.log('-------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
