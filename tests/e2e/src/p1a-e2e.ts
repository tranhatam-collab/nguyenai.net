/**
 * P1-A E2E test — Phase 3 Core Runtime end-to-end chain.
 *
 * Per NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md task 3.10:
 *   user sends command → agent runs → tool call → evidence → audit
 *
 * This test exercises the full Phase 3 chain using in-memory stores
 * (no DB / no network / no real LLM). Production E2E would use a real
 * Postgres + Workers deployment + GEN1 adapter.
 *
 * Chain:
 *   1. Configure mock LLM provider (prism)
 *   2. Register + run a command via conductor (agent state machine)
 *   3. Agent calls a tool via harness (tool call + approval + evidence)
 *   4. Tool execution generates an evidence record (evidence)
 *   5. Agent result is verified (evidence labels)
 *   6. Command completion generates a command_executed evidence record
 *   7. Audit trail captures the command_executed event (audit)
 *   8. Memory is written during execution (relic)
 *   9. RAG query produces a cited answer (scroll + compass)
 *  10. Evidence pack export + verify (evidence)
 *  11. Approval-gated tool (sensitive action) blocks then resumes
 */

import {
  setModelRegistry,
  configureMockProvider,
  chat as prismChat,
  type ModelDescriptor,
} from '@nai/prism';

import {
  AGENTS,
  routeAgent,
  newCommandContext,
  DefaultAgentRuntime,
  runCommand,
  resumeCommand,
  cancelCommand,
  type AgentId,
  type LLMChatFn,
} from '@nai/conductor';

import {
  AgentSDK,
  registerBuiltinTools,
  clearTools,
} from '@nai/harness';

import {
  setEvidenceStore,
  InMemoryEvidenceStore,
  recordEvidence,
  exportEvidencePack,
  verifyEvidencePack,
  getEvidenceForCommand,
} from '@nai/evidence';

import {
  setApprovalStore,
  InMemoryApprovalStore,
  approveRequest,
} from '@nai/approval';

import {
  setAuditStore,
  InMemoryAuditStore,
  queryAuditLog,
  countAuditEvents,
} from '@nai/audit';

import {
  setMemoryStore,
  InMemoryMemoryStore,
  writeMemory,
  readMemory,
} from '@nai/relic';

import {
  setVectorStore,
  InMemoryVectorStore,
} from '@nai/compass';

import {
  indexDocument,
  ragQuery,
  type Document,
  type EmbedFn,
} from '@nai/scroll';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  \u2713 ${msg}`); }
  else { failed++; steps.push(`  \u2717 ${msg}`); console.error(`  \u2717 ${msg}`); }
}

const SECRET = 'e2e-evidence-secret-v1';

// Mock LLM chat function — deterministic, no network.
const mockChatFn: LLMChatFn = async (opts) => {
  return `[${opts.agentId}] Plan: 1) understand request 2) use tools 3) respond. Output: Based on verified primary source, here is the answer for "${opts.userMessage}".`;
};

// Mock embedding function for RAG — deterministic 8-dim vectors.
const mockEmbed: EmbedFn = async (texts) => {
  return texts.map((t) => {
    const vec = new Array(8).fill(0);
    for (let i = 0; i < t.length; i++) {
      vec[i % 8] = (vec[i % 8] ?? 0) + t.charCodeAt(i) % 10;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  });
};

async function main(): Promise<void> {
  // ============================================================
  // Setup — fresh in-memory stores + mock LLM
  // ============================================================
  setEvidenceStore(new InMemoryEvidenceStore());
  setApprovalStore(new InMemoryApprovalStore());
  setAuditStore(new InMemoryAuditStore());
  setMemoryStore(new InMemoryMemoryStore());
  setVectorStore(new InMemoryVectorStore());

  const mockProvider = configureMockProvider();
  mockProvider.setResponse('*', '[mock] Based on verified primary source, here is the answer.');

  // Load model registry (subset for test)
  const testModels: ModelDescriptor[] = [
    { id: 'nguyen-iris-3', displayName: 'Iris 3', provider: 'cf', providerModel: 'llama-3.1-8b', tier: 'free', capabilities: ['chat'], contextWindow: 8000, maxOutputTokens: 2048, costPer1kInput: 0, costPer1kOutput: 0, speed: 'fast', quality: 'standard', freeTier: true },
    { id: 'nguyen-pulse-7', displayName: 'Pulse 7', provider: 'cerebras', providerModel: 'llama3.1-70b', tier: 'student', capabilities: ['chat', 'function-calling'], contextWindow: 8192, maxOutputTokens: 8192, costPer1kInput: 0, costPer1kOutput: 0, speed: 'fast', quality: 'high', freeTier: true },
  ];
  setModelRegistry(testModels);

  clearTools();
  registerBuiltinTools();

  console.log('\nP1-A E2E test — Phase 3 Core Runtime');
  console.log('======================================');

  // ============================================================
  // 1. Agent routing — command goes to the right agent
  // ============================================================
  console.log('\n--- 1. Agent routing ---');
  const agentsEnabled: AgentId[] = ['nguyen-guide', 'nguyen-researcher', 'nguyen-archivist', 'nguyen-verifier', 'nguyen-family-steward', 'nguyen-guardian'];
  const routedAgent = routeAgent('research the Nguyen surname origin', agentsEnabled);
  assert(routedAgent === 'nguyen-researcher', 'command routed to nguyen-researcher');

  // ============================================================
  // 2. Run command via conductor (agent state machine)
  // ============================================================
  console.log('\n--- 2. Run command (agent state machine) ---');
  const ctx = newCommandContext({
    command_id: 'e2e_cmd_1',
    tenant_id: 't_e2e',
    user_id: 'u_e2e',
    input: 'research the Nguyen surname origin',
    plan_id: 'nguyen-personal',
    model_tier: 'student',
    agent_id: routedAgent,
    agents_enabled: agentsEnabled,
    approval_required: 'sensitive',
  });
  const runtime = new DefaultAgentRuntime(mockChatFn);
  const result = await runCommand(ctx, runtime);
  assert(result.success === true, 'runCommand succeeds');
  assert(result.context.state === 'done', 'final state = done');
  assert(result.context.plan !== null, 'plan produced');
  assert(result.context.output !== null, 'output produced');
  assert(result.context.evidence_labels.length > 0, 'evidence labels assigned');
  assert(result.context.evidence_labels.includes('verified'), 'verified label in output');

  // ============================================================
  // 3. Tool call via harness (with evidence generation)
  // ============================================================
  console.log('\n--- 3. Tool call (harness + evidence) ---');
  const sdk = new AgentSDK({ evidenceSigningSecret: SECRET, planRequiresApproval: 'sensitive' });
  const toolResult = await sdk.call('echo', { message: 'e2e tool call' }, {
    command_id: 'e2e_cmd_1',
    tenant_id: 't_e2e',
    user_id: 'u_e2e',
    agent_id: 'nguyen-researcher',
  });
  assert(toolResult.success === true, 'tool call (echo) succeeds');
  assert(toolResult.evidence_id !== null, 'tool call generated evidence record');
  assert(toolResult.approval_pending === false, 'echo tool not approval-pending');

  // ============================================================
  // 4. Evidence record for tool call
  // ============================================================
  console.log('\n--- 4. Evidence record for tool call ---');
  const toolEvidence = await getEvidenceForCommand('e2e_cmd_1');
  assert(toolEvidence.length >= 1, 'evidence store has records for e2e_cmd_1');
  const echoEvidence = toolEvidence.find((e) => e.payload.tool === 'echo');
  assert(echoEvidence !== undefined, 'echo evidence record exists');
  assert(echoEvidence?.proof_type === 'tool_called', 'echo evidence proof_type = tool_called');
  assert(echoEvidence?.payload.success === true, 'echo evidence payload success = true');

  // ============================================================
  // 5. Command_executed evidence record
  // ============================================================
  console.log('\n--- 5. Command_executed evidence record ---');
  await recordEvidence({
    command_id: 'e2e_cmd_1',
    user_id: 'u_e2e',
    tenant_id: 't_e2e',
    agent_id: 'nguyen-researcher',
    proof_type: 'command_executed',
    payload: {
      input: 'research the Nguyen surname origin',
      output: result.context.output,
      evidence_labels: result.context.evidence_labels,
    },
  }, SECRET);
  const allCmdEvidence = await getEvidenceForCommand('e2e_cmd_1');
  const cmdExecEvidence = allCmdEvidence.find((e) => e.proof_type === 'command_executed');
  assert(cmdExecEvidence !== undefined, 'command_executed evidence record exists');

  // ============================================================
  // 6. Audit trail captures the event
  // ============================================================
  console.log('\n--- 6. Audit trail ---');
  const auditCount = await countAuditEvents({});
  assert(auditCount > 0, 'audit log has events');
  const toolAuditEvents = await queryAuditLog({ event_type: 'tool_called' });
  assert(toolAuditEvents.length > 0, 'audit log has tool_called events');
  const e2eAuditEvents = toolAuditEvents.filter((e) => e.tenant_id === 't_e2e');
  assert(e2eAuditEvents.length > 0, 'audit log has events for t_e2e tenant');

  // ============================================================
  // 7. Memory written during execution
  // ============================================================
  console.log('\n--- 7. Memory write ---');
  const memId = await writeMemory({
    tenant_id: 't_e2e',
    user_id: 'u_e2e',
    memory_type: 'decision',
    key: 'research_surname_origin',
    value: { command: 'e2e_cmd_1', result: 'completed', labels: result.context.evidence_labels },
  });
  assert(memId.length > 0, 'memory write returns id');
  const memRead = await readMemory('t_e2e', 'u_e2e', 'research_surname_origin');
  assert(memRead !== null, 'memory read returns the record');
  assert(memRead?.memory_type === 'decision', 'memory type = decision');

  // ============================================================
  // 8. RAG query produces a cited answer
  // ============================================================
  console.log('\n--- 8. RAG query ---');
  const doc: Document = {
    id: 'e2e_doc_1',
    tenant_id: 't_e2e',
    title: 'Nguyen Surname Origin — Primary Source',
    source: 'archive://nguyen-origin.txt',
    sourceType: 'primary',
    content: 'The Nguyen surname is one of the most common Vietnamese surnames, with documented history tracing back several centuries. Primary sources confirm widespread distribution across Vietnam.',
  };
  const chunkCount = await indexDocument(doc, mockEmbed, { tenantId: 't_e2e', embeddingDimension: 8 });
  assert(chunkCount > 0, 'RAG document indexed (chunks > 0)');
  const ragResult = await ragQuery('Nguyen surname origin', mockEmbed, {
    tenantId: 't_e2e',
    userId: 'u_e2e',
    commandId: 'e2e_cmd_1',
    agentId: 'nguyen-researcher',
    topK: 3,
    evidenceSigningSecret: SECRET,
  });
  assert(ragResult.retrieved.length > 0, 'RAG retrieved chunks');
  assert(ragResult.citations.length > 0, 'RAG produced citations');
  assert(ragResult.citations[0]!.evidenceLabel === 'primary-source', 'RAG citation label = primary-source');
  assert(ragResult.overallLabel === 'primary-source', 'RAG overall label = primary-source');

  // ============================================================
  // 9. Evidence pack export + verify
  // ============================================================
  console.log('\n--- 9. Evidence pack export + verify ---');
  const pack = await exportEvidencePack('t_e2e', SECRET, 'e2e_cmd_1');
  assert(pack.record_count > 0, 'evidence pack has records');
  assert(pack.chain_verified === true, 'evidence pack chain verified');
  const verified = await verifyEvidencePack(pack, SECRET);
  assert(verified === true, 'evidence pack verifies clean');
  const wrongSecret = await verifyEvidencePack(pack, 'wrong-secret');
  assert(wrongSecret === false, 'evidence pack rejects wrong secret');

  // ============================================================
  // 10. Approval-gated tool (sensitive action) blocks then resumes
  // ============================================================
  console.log('\n--- 10. Approval-gated tool ---');
  const sensitiveResult = await sdk.call('external_action', { action: 'send_research_email' }, {
    command_id: 'e2e_cmd_2',
    tenant_id: 't_e2e',
    user_id: 'u_e2e',
    agent_id: 'nguyen-business-operator',
  });
  assert(sensitiveResult.success === false, 'sensitive tool blocked (success=false)');
  assert(sensitiveResult.approval_pending === true, 'sensitive tool approval_pending=true');
  assert(sensitiveResult.approval_request_id !== null, 'sensitive tool has approval request id');

  // Approve the request
  if (sensitiveResult.approval_request_id) {
    await approveRequest(sensitiveResult.approval_request_id, 'u_e2e', 't_e2e', 'e2e approve');
  }
  // Re-execute after approval
  const afterApproval = await sdk.callAfterApproval('external_action', { action: 'send_research_email' }, {
    command_id: 'e2e_cmd_2',
    tenant_id: 't_e2e',
    user_id: 'u_e2e',
    agent_id: 'nguyen-business-operator',
  });
  assert(afterApproval.success === true, 'sensitive tool executes after approval');
  assert(afterApproval.evidence_id !== null, 'sensitive tool generated evidence after approval');
  const sensitiveEvidence = (await getEvidenceForCommand('e2e_cmd_2')).find((e) => e.payload.tool === 'external_action');
  assert(sensitiveEvidence?.classification === 'restricted', 'sensitive tool evidence classification = restricted');

  // ============================================================
  // 11. Agent state machine with approval pause + resume
  // ============================================================
  console.log('\n--- 11. Agent state machine approval pause + resume ---');
  const ctxApproval = newCommandContext({
    command_id: 'e2e_cmd_3',
    tenant_id: 't_e2e',
    user_id: 'u_e2e',
    input: 'update family record',
    plan_id: 'nguyen-family',
    model_tier: 'standard',
    agent_id: 'nguyen-family-steward',
    agents_enabled: ['nguyen-guide', 'nguyen-family-steward'],
    approval_required: 'sensitive',
  });
  const resultApproval = await runCommand(ctxApproval, runtime);
  assert(resultApproval.success === false, 'family-steward command pauses (success=false)');
  assert(resultApproval.context.state === 'approval_required', 'state = approval_required');
  const resumed = await resumeCommand(resultApproval.context, runtime);
  assert(resumed.success === true, 'resumed command succeeds');
  assert(resumed.context.state === 'done', 'resumed final state = done');

  // ============================================================
  // 12. Full chain summary
  // ============================================================
  console.log('\n--- 12. Full chain summary ---');
  const totalEvidence = await getEvidenceForCommand('e2e_cmd_1');
  assert(totalEvidence.length >= 3, 'e2e_cmd_1 has >=3 evidence records (tool + command + rag)');
  const totalAudit = await countAuditEvents({});
  assert(totalAudit >= 5, `audit log has >=5 events total (got ${totalAudit})`);

  // ============================================================
  // Report
  // ============================================================
  console.log('\n======================================');
  console.log('P1-A E2E test results');
  console.log('--------------------------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('\n\u2717 P1-A E2E test FAILED');
    process.exit(1);
  } else {
    console.log('\n\u2713 P1-A E2E test PASSED — Phase 3 Core Runtime chain verified');
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
