/**
 * @nai/crew — Crew runtime tests
 */

import {
  createCrew,
  assignAgent,
  executeCrew,
  CrewRuntime,
} from './index';

async function runTests() {
  console.log('@nai/crew tests\n');

  let passed = 0;
  let failed = 0;

  // Test 1: createCrew
  try {
    console.log('Test 1: createCrew...');
    const crew = createCrew({
      name: 'Test Crew',
      description: 'Test crew description',
    });

    if (
      crew.id.match(/^crew-\d+-[a-z0-9]+$/) &&
      crew.name === 'Test Crew' &&
      crew.description === 'Test crew description' &&
      crew.agents.length === 0 &&
      crew.tasks.length === 0
    ) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 2: assignAgent
  try {
    console.log('Test 2: assignAgent...');
    const crew = createCrew({
      name: 'Test Crew',
      description: 'Test crew',
    });

    const updated = assignAgent(crew, {
      name: 'Test Agent',
      role: 'researcher',
      description: 'Test agent description',
      capabilities: ['web_search', 'data_extraction'],
    });

    if (
      updated.agents.length === 1 &&
      updated.agents[0].name === 'Test Agent' &&
      updated.agents[0].role === 'researcher'
    ) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 3: executeCrew - single agent
  try {
    console.log('Test 3: executeCrew - single agent...');
    const crew = createCrew({
      name: 'Test Crew',
      description: 'Test crew',
    });

    const withAgent = assignAgent(crew, {
      id: 'agent-1',
      name: 'Test Agent',
      role: 'researcher',
      description: 'Test agent',
      capabilities: ['web_search'],
    });

    const result = await executeCrew(withAgent, {
      task: 'Test task',
      context: {},
    });

    if (
      result.crewId === withAgent.id &&
      result.status === 'completed' &&
      result.startedAt &&
      result.completedAt
    ) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 4: executeCrew - multiple agents
  try {
    console.log('Test 4: executeCrew - multiple agents...');
    const crew = createCrew({
      name: 'Test Crew',
      description: 'Test crew',
    });

    const withAgent1 = assignAgent(crew, {
      id: 'agent-1',
      name: 'Agent 1',
      role: 'researcher',
      description: 'Agent 1',
      capabilities: ['web_search'],
    });

    const withAgent2 = assignAgent(withAgent1, {
      id: 'agent-2',
      name: 'Agent 2',
      role: 'verifier',
      description: 'Agent 2',
      capabilities: ['verification'],
    });

    const result = await executeCrew(withAgent2, {
      task: 'Test task',
      context: {},
    });

    if (result.status === 'completed') {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 5: CrewRuntime
  try {
    console.log('Test 5: CrewRuntime...');
    const runtime = new CrewRuntime();
    const crew = createCrew({
      name: 'Test Crew',
      description: 'Test crew',
    });

    const withAgent = assignAgent(crew, {
      id: 'agent-1',
      name: 'Test Agent',
      role: 'researcher',
      description: 'Test agent',
      capabilities: ['web_search'],
    });

    runtime.registerCrew(withAgent);
    const retrieved = runtime.getCrew(crew.id);

    if (retrieved && retrieved.id === crew.id) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Summary
  console.log('========================================');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
      role: 'verifier',
      description: 'Agent 2',
      capabilities: ['verification'],
    });

    const result = await executeCrew(withAgent2, {
      task: 'Test task',
      context: {},
    });

    if (result.status === 'completed') {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 5: CrewRuntime
  try {
    console.log('Test 5: CrewRuntime...');
    const runtime = new CrewRuntime();
    const crew = createCrew({
      name: 'Test Crew',
      description: 'Test crew',
    });

    const withAgent = assignAgent(crew, {
      id: 'agent-1',
      name: 'Test Agent',
      role: 'researcher',
      description: 'Test agent',
      capabilities: ['web_search'],
    });

    runtime.registerCrew(withAgent);
    const retrieved = runtime.getCrew(crew.id);

    if (retrieved && retrieved.id === crew.id) {
      console.log('✅ PASS\n');
      passed++;
    } else {
      console.log('❌ FAIL\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Summary
  console.log('========================================');
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});

    it('should handle crew execution with context', async () => {
      const crew = createCrew({
        name: 'Test Crew',
        description: 'Test crew',
      });

      const withAgent = assignAgent(crew, {
        id: 'agent-1',
        name: 'Test Agent',
        role: 'researcher',
        description: 'Test agent',
        capabilities: ['web_search'],
      });

      const result = await executeCrew(withAgent, {
        task: 'Test task',
        context: { input: 'test data' },
      });

      expect(result.status).toBe('completed');
    });
  });

  describe('CrewRuntime', () => {
    it('should create a crew runtime instance', () => {
      const runtime = new CrewRuntime();
      expect(runtime).toBeDefined();
    });

    it('should register a crew', () => {
      const runtime = new CrewRuntime();
      const crew = createCrew({
        name: 'Test Crew',
        description: 'Test crew',
      });

      runtime.registerCrew(crew);
      const retrieved = runtime.getCrew(crew.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(crew.id);
    });

    it('should execute a registered crew', async () => {
      const runtime = new CrewRuntime();
      const crew = createCrew({
        name: 'Test Crew',
        description: 'Test crew',
      });

      const withAgent = assignAgent(crew, {
        id: 'agent-1',
        name: 'Test Agent',
        role: 'researcher',
        description: 'Test agent',
        capabilities: ['web_search'],
      });

      runtime.registerCrew(withAgent);
      const result = await runtime.executeCrew(crew.id, {
        task: 'Test task',
        context: {},
      });

      expect(result.status).toBe('completed');
    });
  });
});
    ];
    runtime.createCrew('Crew 1', 'Desc', agents);
    runtime.createCrew('Crew 2', 'Desc', agents);
    const crews = runtime.listCrews();
    assert.equal(crews.length, 2);
  });

  it('createFounderSuiteCrew creates predefined crew', () => {
    const runtime = new CrewRuntime();
    const crew = createFounderSuiteCrew(runtime);
    assert.equal(crew.name, 'Founder Suite');
    assert.equal(crew.agents.length, 3);
    assert.ok(crew.agents.some((a) => a.role === 'founder'));
    assert.ok(crew.agents.some((a) => a.role === 'business_operator'));
    assert.ok(crew.agents.some((a) => a.role === 'researcher'));
  });

  it('createBusinessPackCrew creates predefined crew', () => {
    const runtime = new CrewRuntime();
    const crew = createBusinessPackCrew(runtime);
    assert.equal(crew.name, 'Business Pack');
    assert.equal(crew.agents.length, 3);
    assert.ok(crew.agents.some((a) => a.role === 'business_operator'));
    assert.ok(crew.agents.some((a) => a.role === 'global_connector'));
    assert.ok(crew.agents.some((a) => a.role === 'sales'));
  });

  it('Founder Suite crew can execute tasks', async () => {
    const runtime = new CrewRuntime();
    const crew = createFounderSuiteCrew(runtime);
    runtime.addTask(crew.id, 'Strategic decision');
    const execution = await runtime.executeCrew(crew.id);
    assert.equal(execution.status, 'completed');
  });

  it('Business Pack crew can execute tasks', async () => {
    const runtime = new CrewRuntime();
    const crew = createBusinessPackCrew(runtime);
    runtime.addTask(crew.id, 'Sales outreach');
    const execution = await runtime.executeCrew(crew.id);
    assert.equal(execution.status, 'completed');
  });
});

console.log('=== @nai/crew tests ===');
