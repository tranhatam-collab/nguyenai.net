/**
 * @nai/conductor — agent graph unit + integration test.
 *
 * Verifies:
 * - 9 NAI Agents defined with correct ids, names, roles
 * - routeAgent dispatches by keyword hints
 * - isAgentEnabled respects plan entitlement
 * - state machine: valid + invalid transitions
 * - newCommandContext initializes correctly
 * - DefaultAgentRuntime: plan → execute → verify → done
 * - approval_required pause + resumeCommand + cancelCommand
 * - inferEvidenceLabels heuristic
 * - runCommand end-to-end with mock LLM
 */

import {
  AGENTS,
  ALL_AGENT_IDS,
  getAgent,
  listAgents,
  routeAgent,
  isAgentEnabled,
  canTransition,
  transition,
  newCommandContext,
  DefaultAgentRuntime,
  inferEvidenceLabels,
  runCommand,
  resumeCommand,
  cancelCommand,
  type AgentId,
  type CommandContext,
  type LLMChatFn,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  \u2713 ${msg}`); }
  else { failed++; steps.push(`  \u2717 ${msg}`); console.error(`  \u2717 ${msg}`); }
}

async function main(): Promise<void> {
  // --- 1. 9 agents defined ---
  assert(ALL_AGENT_IDS.length === 9, '9 NAI agents defined');
  const expectedIds: AgentId[] = [
    'nguyen-guide', 'nguyen-researcher', 'nguyen-archivist', 'nguyen-verifier',
    'nguyen-family-steward', 'nguyen-founder', 'nguyen-business-operator',
    'nguyen-global-connector', 'nguyen-guardian',
  ];
  for (const id of expectedIds) {
    assert(ALL_AGENT_IDS.includes(id), `agent ${id} present`);
  }
  const guide = getAgent('nguyen-guide');
  assert(guide.name === 'Nguyen Guide', 'guide name correct');
  assert(guide.nameVi === 'Nguyễn Hướng Dẫn', 'guide nameVi correct');
  assert(listAgents().length === 9, 'listAgents returns 9');

  // --- 2. routeAgent ---
  const allAgents = ALL_AGENT_IDS;
  assert(routeAgent('help me get started', allAgents) === 'nguyen-guide', 'route help → guide');
  assert(routeAgent('research the Nguyen surname origin', allAgents) === 'nguyen-researcher', 'route research → researcher');
  assert(routeAgent('find my family tree ancestors', allAgents) === 'nguyen-family-steward', 'route family tree → family-steward');
  assert(routeAgent('verify this historical source', allAgents) === 'nguyen-verifier', 'route verify → verifier');
  assert(routeAgent('archive this document', allAgents) === 'nguyen-archivist', 'route archive → archivist');
  assert(routeAgent('help me with founder strategy', allAgents) === 'nguyen-founder', 'route founder strategy → founder');
  assert(routeAgent('analyze my business finance', allAgents) === 'nguyen-business-operator', 'route business finance → business-operator');
  assert(routeAgent('connect me to the global network', allAgents) === 'nguyen-global-connector', 'route network → global-connector');
  assert(routeAgent('check safety and privacy', allAgents) === 'nguyen-guardian', 'route safety → guardian');
  // Vietnamese keywords
  assert(routeAgent('tìm gia phả gia đình', allAgents) === 'nguyen-family-steward', 'route Vietnamese gia phả → family-steward');
  assert(routeAgent('nghiên cứu nguồn gốc', allAgents) === 'nguyen-researcher', 'route Vietnamese nghiên cứu → researcher');

  // --- 3. isAgentEnabled ---
  const freeAgents: AgentId[] = ['nguyen-guide', 'nguyen-guardian'];
  assert(isAgentEnabled('nguyen-guide', freeAgents) === true, 'guide enabled in free plan');
  assert(isAgentEnabled('nguyen-researcher', freeAgents) === false, 'researcher NOT enabled in free plan');

  // --- 4. state machine transitions ---
  assert(canTransition('init', 'plan') === true, 'init → plan valid');
  assert(canTransition('plan', 'execute') === true, 'plan → execute valid');
  assert(canTransition('plan', 'approval_required') === true, 'plan → approval_required valid');
  assert(canTransition('approval_required', 'execute') === true, 'approval_required → execute valid');
  assert(canTransition('approval_required', 'cancelled') === true, 'approval_required → cancelled valid');
  assert(canTransition('execute', 'verify') === true, 'execute → verify valid');
  assert(canTransition('verify', 'done') === true, 'verify → done valid');
  assert(canTransition('init', 'done') === false, 'init → done invalid');
  assert(canTransition('done', 'init') === false, 'done → init invalid');
  assert(canTransition('execute', 'plan') === false, 'execute → plan invalid (no backward)');

  // --- 5. transition throws on invalid ---
  let transitionError: string | null = null;
  try {
    const ctx = newCommandContext({
      command_id: 'c1', tenant_id: 't1', user_id: 'u1', input: 'test',
      plan_id: 'nguyen-start', model_tier: 'free', agent_id: 'nguyen-guide',
      agents_enabled: ['nguyen-guide'], approval_required: 'none',
    });
    transition(ctx, 'done'); // invalid: init → done
  } catch (e) {
    transitionError = (e as Error).message;
  }
  assert(transitionError !== null && transitionError.includes('Invalid state transition'), 'invalid transition throws');

  // --- 6. newCommandContext ---
  const ctx0 = newCommandContext({
    command_id: 'c1', tenant_id: 't1', user_id: 'u1', input: 'hello',
    plan_id: 'nguyen-start', model_tier: 'free', agent_id: 'nguyen-guide',
    agents_enabled: ['nguyen-guide'], approval_required: 'none',
  });
  assert(ctx0.state === 'init', 'new context state = init');
  assert(ctx0.transitions.length === 1, 'new context has 1 transition (init)');
  assert(ctx0.plan === null, 'new context plan = null');
  assert(ctx0.output === null, 'new context output = null');

  // --- 7. DefaultAgentRuntime: full run, no approval ---
  const mockChat: LLMChatFn = async (opts) => {
    return `[${opts.agentId}] Plan: 1) greet 2) respond. Output: Hello! I am ${opts.agentId}. Evidence: verified primary source.`;
  };
  const runtime = new DefaultAgentRuntime(mockChat);
  const ctx1 = newCommandContext({
    command_id: 'c2', tenant_id: 't1', user_id: 'u1', input: 'greet me',
    plan_id: 'nguyen-start', model_tier: 'free', agent_id: 'nguyen-guide',
    agents_enabled: ['nguyen-guide'], approval_required: 'none',
  });
  const result1 = await runCommand(ctx1, runtime);
  assert(result1.success === true, 'runCommand succeeds (no approval)');
  assert(result1.context.state === 'done', 'final state = done');
  assert(result1.context.plan !== null, 'plan was produced');
  assert(result1.context.output !== null, 'output was produced');
  assert(result1.context.output !== null && result1.context.output.includes('nguyen-guide'), 'output from guide agent');
  assert(result1.context.evidence_labels.length > 0, 'evidence labels assigned');
  assert(result1.context.evidence_labels.includes('verified'), 'verified label inferred');
  assert(result1.context.evidence_labels.includes('primary-source'), 'primary-source label inferred');
  // transitions: init → plan → execute → verify → done
  assert(result1.context.transitions.length === 5, '5 transitions: init, plan, execute, verify, done');

  // --- 8. approval_required pause + resume ---
  const ctx2 = newCommandContext({
    command_id: 'c3', tenant_id: 't1', user_id: 'u1', input: 'add family member',
    plan_id: 'nguyen-family', model_tier: 'standard', agent_id: 'nguyen-family-steward',
    agents_enabled: ['nguyen-guide', 'nguyen-family-steward'], approval_required: 'sensitive',
  });
  // family-steward.alwaysRequiresApproval = true
  const result2 = await runCommand(ctx2, runtime);
  assert(result2.success === false, 'runCommand pauses at approval_required (success=false)');
  assert(result2.context.state === 'approval_required', 'state = approval_required');
  assert(result2.context.plan !== null, 'plan was produced before pause');

  // resume after approval
  const resumed = await resumeCommand(result2.context, runtime);
  assert(resumed.success === true, 'resumeCommand succeeds after approval');
  assert(resumed.context.state === 'done', 'resumed final state = done');
  assert(resumed.context.output !== null, 'resumed output produced');

  // --- 9. cancel from approval_required ---
  const ctx3 = newCommandContext({
    command_id: 'c4', tenant_id: 't1', user_id: 'u1', input: 'business finance action',
    plan_id: 'nguyen-business', model_tier: 'pro', agent_id: 'nguyen-business-operator',
    agents_enabled: ['nguyen-guide', 'nguyen-business-operator'], approval_required: 'sensitive',
  });
  const result3 = await runCommand(ctx3, runtime);
  assert(result3.context.state === 'approval_required', 'business-operator pauses at approval');
  const cancelled = cancelCommand(result3.context);
  assert(cancelled.state === 'cancelled', 'cancelCommand → cancelled');

  // --- 10. approval_required='all' triggers approval even for guide ---
  const ctx4 = newCommandContext({
    command_id: 'c5', tenant_id: 't1', user_id: 'u1', input: 'help me',
    plan_id: 'nguyen-start', model_tier: 'free', agent_id: 'nguyen-guide',
    agents_enabled: ['nguyen-guide'], approval_required: 'all',
  });
  const result4 = await runCommand(ctx4, runtime);
  assert(result4.context.state === 'approval_required', 'approval_required=all triggers approval for guide');

  // --- 11. inferEvidenceLabels ---
  assert(inferEvidenceLabels('this is verified').includes('verified'), 'infer verified');
  assert(inferEvidenceLabels('oral history says').includes('oral-history'), 'infer oral-history');
  assert(inferEvidenceLabels('cannot conclude here').includes('cannot-conclude'), 'infer cannot-conclude');
  assert(inferEvidenceLabels('no labels here')[0] === 'insufficient-evidence', 'default label = insufficient-evidence');

  // --- 12. failed state on runtime error ---
  const errorChat: LLMChatFn = async () => { throw new Error('LLM down'); };
  const errorRuntime = new DefaultAgentRuntime(errorChat);
  const ctx5 = newCommandContext({
    command_id: 'c6', tenant_id: 't1', user_id: 'u1', input: 'test',
    plan_id: 'nguyen-start', model_tier: 'free', agent_id: 'nguyen-guide',
    agents_enabled: ['nguyen-guide'], approval_required: 'none',
  });
  const result5 = await runCommand(ctx5, errorRuntime);
  assert(result5.success === false, 'runtime error → success=false');
  assert(result5.context.state === 'failed', 'runtime error → state=failed');
  assert(result5.context.error?.includes('LLM down') ?? false, 'runtime error message preserved');

  // --- Report ---
  console.log('\n@nai/conductor test');
  console.log('------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
