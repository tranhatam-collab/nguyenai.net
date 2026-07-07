/**
 * P1-C E2E Test — Full P1-C chain integration
 *
 * Tests the complete P1-C automation chain:
 * - P1-C.1: Workflow engine (aqueduct) — scheduling + triggering
 * - P1-C.2: Browser agent (scout) — allowlist + denylist
 * - P1-C.4: Crew runtime (crew)
 * - P1-C.5: Pipeline (pipeline)
 * - P1-C.6: Approval gate integration
 */

import { WorkflowEngine, Workflow, WorkflowStep, StepStatus } from '../aqueduct/src/index.js';
import { fetchPage, createCrawlSession, crawlStep } from '../scout/src/index.js';
import { createCrew, assignAgent, executeCrew } from '../crew/src/index.js';
import { createPipeline, addStage, executePipeline } from '../pipeline/src/index.js';

async function runE2ETests() {
  console.log('P1-C E2E — Full Automation Chain Tests\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Workflow with Approval Gate
  try {
    console.log('Test 1: Workflow with Approval Gate...');
    const workflowEngine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'test-workflow-approval',
      name: 'Test Workflow with Approval',
      steps: [
        {
          id: 'step1',
          run: async (ctx) => {
            ctx.outputs['step1'] = 'completed';
            return 'step1 result';
          },
          requireApproval: true,
          userId: 'test-user',
        },
      ],
    };

    const execution = await workflowEngine.execute(workflow, {
      input: {},
      outputs: {},
      state: {},
      tenantId: 'test-tenant',
    });

    const stepResult = execution.results.get('step1');
    if (stepResult?.status === 'failed' && stepResult?.error?.includes('Approval required')) {
      console.log('✅ PASS: Workflow step with approval requirement\n');
      passed++;
    } else {
      console.log('❌ FAIL: Workflow step should fail with approval required\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 2: Browser Agent with Denylist
  try {
    console.log('Test 2: Browser Agent with Denylist...');
    const result = await fetchPage('https://example.com', {
      denylist: ['*.example.com'],
    });

    if (result.status === 403 && result.error === 'URL blocked by allowlist/denylist') {
      console.log('✅ PASS: Browser agent blocks denylist URLs\n');
      passed++;
    } else {
      console.log('❌ FAIL: Browser agent should block denylist URLs\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 3: Browser Agent with Allowlist
  try {
    console.log('Test 3: Browser Agent with Allowlist...');
    const result = await fetchPage('https://example.com', {
      allowlist: ['*.example.com'],
    });

    if (result.error !== 'URL blocked by allowlist/denylist') {
      console.log('✅ PASS: Browser agent allows allowlist URLs\n');
      passed++;
    } else {
      console.log('❌ FAIL: Browser agent should allow allowlist URLs\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 4: Crew Runtime
  try {
    console.log('Test 4: Crew Runtime...');
    const crew = createCrew({
      id: 'test-crew',
      name: 'Test Crew',
      description: 'Test crew for E2E',
    });

    assignAgent(crew, {
      id: 'agent-1',
      name: 'Test Agent',
      role: 'researcher',
      capabilities: ['web_search', 'data_extraction'],
    });

    const result = await executeCrew(crew, {
      task: 'Test task',
      context: {},
    });

    if (result && result.status === 'completed') {
      console.log('✅ PASS: Crew runtime executed\n');
      passed++;
    } else {
      console.log('❌ FAIL: Crew runtime should complete\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 5: Pipeline Execution
  try {
    console.log('Test 6: Pipeline Execution...');
    const pipeline = createPipeline({
      id: 'test-pipeline',
      name: 'Test Pipeline',
      description: 'Test pipeline for E2E',
    });

    addStage(pipeline, {
      id: 'stage1',
      name: 'Research Stage',
      executor: async (input) => {
        return { researchData: 'mock research data' };
      },
    });

    addStage(pipeline, {
      id: 'stage2',
      name: 'Evidence Stage',
      executor: async (input) => {
        return { evidence: 'mock evidence' };
      },
      dependsOn: ['stage1'],
    });

    const result = await executePipeline(pipeline, {
      query: 'test query',
    });

    if (result && result.status === 'completed' && result.stages.length === 2) {
      console.log('✅ PASS: Pipeline executed with 2 stages\n');
      passed++;
    } else {
      console.log('❌ FAIL: Pipeline should complete with 2 stages\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 6: Full Chain Integration
  try {
    console.log('Test 6: Full Chain Integration (workflow + browser + crew + pipeline)...');
    const workflowEngine = new WorkflowEngine();

    // Step 1: Browser fetch with allowlist
    const browserResult = await fetchPage('https://example.com', {
      allowlist: ['*.example.com'],
    });

    if (browserResult.error === 'URL blocked by allowlist/denylist') {
      throw new Error('Browser fetch blocked by allowlist');
    }

    // Step 2: Crew execution
    const crew = createCrew({
      id: 'full-chain-crew',
      name: 'Full Chain Crew',
      description: 'Crew for full chain test',
    });

    assignAgent(crew, {
      id: 'agent-browser',
      name: 'Browser Agent',
      role: 'browser_automation',
      capabilities: ['fetch', 'crawl'],
    });

    const crewResult = await executeCrew(crew, {
      task: 'Analyze browser result',
      context: { browserResult },
    });

    if (crewResult.status !== 'completed') {
      throw new Error('Crew execution failed');
    }

    // Step 3: Pipeline execution
    const pipeline = createPipeline({
      id: 'full-chain-pipeline',
      name: 'Full Chain Pipeline',
      description: 'Pipeline for full chain test',
    });

    addStage(pipeline, {
      id: 'research',
      name: 'Research',
      executor: async (input) => {
        return { data: 'research data' };
      },
    });

    addStage(pipeline, {
      id: 'evidence',
      name: 'Evidence',
      executor: async (input) => {
        return { evidence: 'evidence data' };
      },
      dependsOn: ['research'],
    });

    const pipelineResult = await executePipeline(pipeline, {
      query: 'test',
    });

    if (pipelineResult.status !== 'completed') {
      throw new Error('Pipeline execution failed');
    }

    // Step 4: Workflow orchestration
    const workflow: Workflow = {
      id: 'full-chain-workflow',
      name: 'Full Chain Workflow',
      steps: [
        {
          id: 'browser',
          run: async (ctx) => {
            const result = await fetchPage('https://example.com', {
              allowlist: ['*.example.com'],
            });
            ctx.outputs['browser'] = result;
            return result;
          },
        },
        {
          id: 'crew',
          dependsOn: ['browser'],
          run: async (ctx) => {
            const crew = createCrew({
              id: 'workflow-crew',
              name: 'Workflow Crew',
              description: 'Crew in workflow',
            });

            assignAgent(crew, {
              id: 'agent',
              name: 'Agent',
              role: 'executor',
              capabilities: ['execute'],
            });

            const result = await executeCrew(crew, {
              task: 'Execute task',
              context: { browser: ctx.outputs['browser'] },
            });

            ctx.outputs['crew'] = result;
            return result;
          },
        },
        {
          id: 'pipeline',
          dependsOn: ['crew'],
          run: async (ctx) => {
            const pipeline = createPipeline({
              id: 'workflow-pipeline',
              name: 'Workflow Pipeline',
              description: 'Pipeline in workflow',
            });

            addStage(pipeline, {
              id: 'stage',
              name: 'Stage',
              executor: async (input) => {
                return { data: 'stage data' };
              },
            });

            const result = await executePipeline(pipeline, {
              query: 'test',
            });

            ctx.outputs['pipeline'] = result;
            return result;
          },
        },
      ],
    };

    const workflowExecution = await workflowEngine.execute(workflow, {
      input: {},
      outputs: {},
      state: {},
      tenantId: 'test-tenant',
    });

    if (workflowExecution.status === 'succeeded' && workflowExecution.results.size === 3) {
      console.log('✅ PASS: Full chain integration completed\n');
      passed++;
    } else {
      console.log('❌ FAIL: Full chain should complete with 3 steps\n');
      failed++;
    }
  } catch (err) {
    console.log(`❌ FAIL: ${String(err)}\n`);
    failed++;
  }

  // Test 7: Workflow without approval
  try {
    console.log('Test 8: Workflow without approval requirement...');
    const workflowEngine = new WorkflowEngine();
    const workflow: Workflow = {
      id: 'no-approval-workflow',
      name: 'No Approval Workflow',
      steps: [
        {
          id: 'step1',
          run: async (ctx) => {
            ctx.outputs['step1'] = 'completed';
            return 'step1 result';
          },
        },
      ],
    };

    const execution = await workflowEngine.execute(workflow, {
      input: {},
      outputs: {},
      state: {},
      tenantId: 'test-tenant',
    });

    const stepResult = execution.results.get('step1');
    if (stepResult?.status === 'succeeded' && stepResult?.output === 'step1 result') {
      console.log('✅ PASS: Workflow executes without approval when not required\n');
      passed++;
    } else {
      console.log('❌ FAIL: Workflow should execute without approval\n');
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

runE2ETests().catch((err) => {
  console.error('E2E test runner error:', err);
  process.exit(1);
});
