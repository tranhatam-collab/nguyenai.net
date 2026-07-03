/**
 * @nai/harness — agent SDK unit + integration test.
 *
 * Verifies:
 * - tool registry: register, get, list, clear
 * - built-in tools registered (echo, web_search, memory_write, memory_read, family_record_update, external_action)
 * - executeTool: success path generates evidence
 * - executeTool: unknown tool returns error
 * - approval gate: non-sensitive tool runs without approval
 * - approval gate: sensitive tool blocks pending approval
 * - approval gate: skipApprovalCheck bypasses gate
 * - evidence record generated per tool call
 * - AgentSDK facade: call + checkApproval + listTools
 */

import {
  registerTool,
  getTool,
  listTools,
  clearTools,
  registerBuiltinTools,
  executeTool,
  checkApprovalGate,
  AgentSDK,
  type ToolCallContext,
} from './index';

import { setApprovalStore, InMemoryApprovalStore, approveRequest } from '@nai/approval';
import { setEvidenceStore, InMemoryEvidenceStore, getEvidenceForCommand } from '@nai/evidence';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  \u2713 ${msg}`); }
  else { failed++; steps.push(`  \u2717 ${msg}`); console.error(`  \u2717 ${msg}`); }
}

const SECRET = 'test-harness-secret-v1';

function makeCtx(overrides: Partial<ToolCallContext> = {}): ToolCallContext {
  return {
    command_id: 'cmd_test',
    tenant_id: 't_1',
    user_id: 'u_1',
    agent_id: 'nguyen-guide',
    evidenceSigningSecret: SECRET,
    ...overrides,
  };
}

async function main(): Promise<void> {
  // Fresh stores
  setApprovalStore(new InMemoryApprovalStore());
  setEvidenceStore(new InMemoryEvidenceStore());
  clearTools();
  registerBuiltinTools();

  // --- 1. tool registry ---
  const echo = getTool('echo');
  assert(echo !== null, 'echo tool registered');
  assert(echo?.requiresApproval === false, 'echo does not require approval');
  const familyUpdate = getTool('family_record_update');
  assert(familyUpdate?.requiresApproval === true, 'family_record_update requires approval');
  const external = getTool('external_action');
  assert(external?.requiresApproval === true, 'external_action requires approval');
  assert(external?.evidenceClass === 'restricted', 'external_action evidenceClass = restricted');
  assert(listTools().length >= 6, 'at least 6 built-in tools registered');

  // --- 2. executeTool: success path (non-sensitive) ---
  const r1 = await executeTool({
    toolName: 'echo',
    args: { message: 'hello' },
    ctx: makeCtx(),
    planRequiresApproval: 'none',
  });
  assert(r1.success === true, 'echo executeTool success');
  assert(r1.approval_pending === false, 'echo not approval-pending');
  assert(r1.evidence_id !== null, 'echo generated evidence record');
  assert(r1.approval_request_id === null, 'echo no approval request');

  // --- 3. evidence record content ---
  const evidence = await getEvidenceForCommand('cmd_test');
  assert(evidence.length >= 1, 'evidence store has >=1 record for cmd_test');
  const echoEvidence = evidence.find((e) => e.payload.tool === 'echo');
  assert(echoEvidence !== undefined, 'evidence record for echo exists');
  assert(echoEvidence?.proof_type === 'tool_called', 'evidence proof_type = tool_called');
  assert(echoEvidence?.payload.success === true, 'evidence payload success = true');

  // --- 4. executeTool: unknown tool ---
  const r2 = await executeTool({
    toolName: 'nonexistent_tool',
    args: {},
    ctx: makeCtx(),
    planRequiresApproval: 'none',
  });
  assert(r2.success === false, 'unknown tool returns success=false');
  assert(r2.error?.includes('not registered') ?? false, 'unknown tool error mentions "not registered"');
  assert(r2.evidence_id === null, 'unknown tool no evidence generated');

  // --- 5. approval gate: sensitive tool blocks ---
  const r3 = await executeTool({
    toolName: 'family_record_update',
    args: { record_id: 'rec_1', fields: { name: 'new name' } },
    ctx: makeCtx({ agent_id: 'nguyen-family-steward' }),
    planRequiresApproval: 'sensitive',
  });
  assert(r3.success === false, 'sensitive tool blocked (success=false)');
  assert(r3.approval_pending === true, 'sensitive tool approval_pending=true');
  assert(r3.approval_request_id !== null, 'sensitive tool created approval request');
  assert(r3.evidence_id === null, 'sensitive tool no evidence (blocked before execution)');

  // --- 6. approval gate: skipApprovalCheck bypasses ---
  // First approve the request from step 5
  if (r3.approval_request_id) {
    await approveRequest(r3.approval_request_id, 'u_1', 't_1', 'test approve');
  }
  const r4 = await executeTool({
    toolName: 'family_record_update',
    args: { record_id: 'rec_1', fields: { name: 'new name' } },
    ctx: makeCtx({ agent_id: 'nguyen-family-steward' }),
    planRequiresApproval: 'sensitive',
    skipApprovalCheck: true,
  });
  assert(r4.success === true, 'sensitive tool executes after skipApprovalCheck');
  assert(r4.approval_pending === false, 'skipApprovalCheck not pending');
  assert(r4.evidence_id !== null, 'sensitive tool generated evidence after approval');
  const famEvidence = (await getEvidenceForCommand('cmd_test')).find((e) => e.payload.tool === 'family_record_update');
  assert(famEvidence?.classification === 'sensitive', 'family_record_update evidence classification = sensitive');

  // --- 7. planRequiresApproval='all' triggers approval even for echo ---
  const r5 = await executeTool({
    toolName: 'echo',
    args: { x: 1 },
    ctx: makeCtx({ command_id: 'cmd_all' }),
    planRequiresApproval: 'all',
  });
  assert(r5.approval_pending === true, 'planRequiresApproval=all triggers approval for echo');
  assert(r5.approval_request_id !== null, 'plan=all created approval request');

  // --- 8. checkApprovalGate directly ---
  const gate1 = await checkApprovalGate({
    tool: echo!,
    ctx: makeCtx(),
    args: {},
    planRequiresApproval: 'none',
  });
  assert(gate1.allowed === true, 'gate: echo with none → allowed');
  assert(gate1.approval_request_id === null, 'gate: echo with none → no request');

  const gate2 = await checkApprovalGate({
    tool: external!,
    ctx: makeCtx(),
    args: { action: 'send_email' },
    planRequiresApproval: 'sensitive',
  });
  assert(gate2.allowed === false, 'gate: external with sensitive → blocked');
  assert(gate2.approval_request_id !== null, 'gate: external with sensitive → request created');

  const gate3 = await checkApprovalGate({
    tool: external!,
    ctx: makeCtx(),
    args: { action: 'send_email' },
    planRequiresApproval: 'sensitive',
    skipApprovalCheck: true,
  });
  assert(gate3.allowed === true, 'gate: external with skipApprovalCheck → allowed');

  // --- 9. AgentSDK facade ---
  setEvidenceStore(new InMemoryEvidenceStore()); // fresh for SDK test
  const sdk = new AgentSDK({ evidenceSigningSecret: SECRET, planRequiresApproval: 'sensitive' });
  assert(sdk.listTools().length >= 6, 'AgentSDK listTools returns built-in tools');

  const sdkR1 = await sdk.call('echo', { msg: 'sdk test' }, { command_id: 'cmd_sdk', tenant_id: 't_1', user_id: 'u_1', agent_id: 'nguyen-guide' });
  assert(sdkR1.success === true, 'AgentSDK.call echo success');
  assert(sdkR1.evidence_id !== null, 'AgentSDK.call echo generated evidence');

  const sdkR2 = await sdk.call('external_action', { action: 'test' }, { command_id: 'cmd_sdk2', tenant_id: 't_1', user_id: 'u_1', agent_id: 'nguyen-business-operator' });
  assert(sdkR2.approval_pending === true, 'AgentSDK.call external_action pending approval');
  assert(sdkR2.approval_request_id !== null, 'AgentSDK.call external_action has request id');

  // approve and re-execute via callAfterApproval
  if (sdkR2.approval_request_id) {
    await approveRequest(sdkR2.approval_request_id, 'u_1', 't_1', 'sdk approve');
  }
  const sdkR3 = await sdk.callAfterApproval('external_action', { action: 'test' }, { command_id: 'cmd_sdk2', tenant_id: 't_1', user_id: 'u_1', agent_id: 'nguyen-business-operator' });
  assert(sdkR3.success === true, 'AgentSDK.callAfterApproval external_action success');
  assert(sdkR3.evidence_id !== null, 'AgentSDK.callAfterApproval generated evidence');
  const extEvidence = (await getEvidenceForCommand('cmd_sdk2')).find((e) => e.payload.tool === 'external_action');
  assert(extEvidence?.classification === 'restricted', 'external_action evidence classification = restricted');

  // --- 10. tool handler error captured ---
  registerTool({
    name: 'failing_tool',
    description: 'Always throws.',
    requiresApproval: false,
    evidenceClass: 'internal',
    handler: async () => { throw new Error('handler exploded'); },
  });
  const r6 = await executeTool({
    toolName: 'failing_tool',
    args: {},
    ctx: makeCtx({ command_id: 'cmd_fail' }),
    planRequiresApproval: 'none',
  });
  assert(r6.success === false, 'failing tool returns success=false');
  assert(r6.error === 'handler exploded', 'failing tool error message captured');
  assert(r6.evidence_id !== null, 'failing tool still generated evidence (proof_type=command_failed)');
  const failEvidence = (await getEvidenceForCommand('cmd_fail')).find((e) => e.payload.tool === 'failing_tool');
  assert(failEvidence?.proof_type === 'command_failed', 'failing tool evidence proof_type = command_failed');

  // --- Report ---
  console.log('\n@nai/harness test');
  console.log('-----------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
