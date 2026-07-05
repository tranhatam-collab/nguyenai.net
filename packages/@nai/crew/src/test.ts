import {
  createCrew,
  assignAgent,
  executeCrew,
  CrewRuntime,
  createFounderSuiteCrew,
  createBusinessPackCrew,
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
  // Smoke
  assert(typeof createCrew === 'function', 'createCrew is function');
  assert(typeof assignAgent === 'function', 'assignAgent is function');
  assert(typeof executeCrew === 'function', 'executeCrew is function');
  assert(typeof CrewRuntime === 'function', 'CrewRuntime is class');

  // ============================================================
  // Standalone crew functions
  // ============================================================

  const crew = createCrew({
    name: 'Test Crew',
    description: 'A test crew',
  });
  assert(crew.id.length > 0, 'createCrew generates id');
  assert(crew.name === 'Test Crew', 'createCrew sets name');
  assert(crew.agents.length === 0, 'createCrew starts with no agents');

  const crewWithAgent = assignAgent(crew, {
    name: 'Agent 1',
    role: 'researcher',
    description: 'Research agent',
    capabilities: ['search', 'analyze'],
  });
  assert(crewWithAgent.agents.length === 1, 'assignAgent adds agent');
  assert(crewWithAgent.agents[0]?.name === 'Agent 1', 'agent has correct name');

  const execution = await executeCrew(crewWithAgent, {
    task: 'Research topic X',
    context: { topic: 'X' },
  });
  assert(execution.status === 'completed', 'executeCrew completes');
  assert(execution.results.size === 1, 'executeCrew produces results');

  // ============================================================
  // CrewRuntime class
  // ============================================================

  const runtime = new CrewRuntime();
  const runtimeCrew = runtime.createCrew(
    'Runtime Crew',
    'A crew managed by runtime',
    [
      { id: 'agent1', name: 'Agent 1', role: 'researcher', description: 'Research', capabilities: ['search'] },
      { id: 'agent2', name: 'Agent 2', role: 'writer', description: 'Writer', capabilities: ['write'] },
    ]
  );
  assert(runtimeCrew.agents.length === 2, 'runtime.createCrew adds agents');

  const fetched = runtime.getCrew(runtimeCrew.id);
  assert(fetched !== undefined, 'runtime.getCrew returns crew');
  assert(runtime.getCrew('nonexistent') === undefined, 'runtime.getCrew returns undefined for unknown');

  const task = runtime.addTask(runtimeCrew.id, 'Write report');
  assert(task.status === 'pending', 'addTask creates pending task');
  assert(runtimeCrew.tasks.length === 1, 'addTask adds task to crew');

  runtime.assignTask(runtimeCrew.id, task.id, 'agent1');
  assert(task.assignedTo === 'agent1', 'assignTask assigns agent to task');

  const execResult = await runtime.executeCrew(runtimeCrew.id);
  assert(execResult.status === 'completed', 'runtime.executeCrew completes');
  assert(execResult.results.size === 1, 'runtime.executeCrew produces results');

  // ============================================================
  // Preset crews
  // ============================================================

  const founderCrew = createFounderSuiteCrew(runtime);
  assert(founderCrew.name === 'Founder Suite', 'createFounderSuiteCrew creates correct crew');
  assert(founderCrew.agents.length === 3, 'founder crew has 3 agents');

  const businessCrew = createBusinessPackCrew(runtime);
  assert(businessCrew.name === 'Business Pack', 'createBusinessPackCrew creates correct crew');
  assert(businessCrew.agents.length === 3, 'business crew has 3 agents');

  // ============================================================
  // Context management
  // ============================================================

  runtime.updateContext(runtimeCrew.id, 'key1', 'value1');
  const contextValue = runtime.getContext(runtimeCrew.id, 'key1');
  assert(contextValue === 'value1', 'updateContext + getContext work');

  const fullContext = runtime.getContext(runtimeCrew.id);
  assert(typeof fullContext === 'object' && fullContext !== null, 'getContext returns full context');

  // ============================================================
  // List and delete
  // ============================================================

  const allCrews = runtime.listCrews();
  assert(allCrews.length >= 3, 'listCrews returns crews');

  runtime.deleteCrew(runtimeCrew.id);
  assert(runtime.getCrew(runtimeCrew.id) === undefined, 'deleteCrew removes crew');

  // Print results
  console.log('\n@nai/crew tests:');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
