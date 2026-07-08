/**
 * P1-B E2E Test — Product & Billing End-to-End
 *
 * Tests the full chain: tally (LLM cost) → covenant (vault) → keystone (backup)
 * → Super Apps → Nguyen Apps.
 *
 * Uses the same assert pattern as P0-B E2E for consistency.
 */
import { logCall, getStats } from '@nai/tally';
import { generateCertificateId } from '@nai/proof';
import { createBackup } from '@nai/keystone';
import { runWorkflow } from '@nai/aqueduct';
import { createAgent } from '@nai/ensemble';
import { generateContent } from '@nai/artisan';
import { NguyenRoots, NguyenMemory, NguyenKnowledge } from '@nai/nguyen-tools';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  // P1-B.5: LLM cost tracking
  logCall({
    model: 'gpt-4',
    prompt: '',
    response: '',
    tokensIn: 1000,
    tokensOut: 500,
    latencyMs: 0,
    tenantId: 'tenant-1',
    metadata: { userId: 'user-1' },
  });
  const stats = getStats('tenant-1');
  assert(stats.totalCalls === 1, 'tally logged 1 call');

  // P1-B.6: Vault crypto
  const certId = generateCertificateId('OPR', 2026, 1);
  assert(certId.match(/^NGAI-OPR-2026-000001-[A-F0-9]{4}$/) !== null, 'certificate ID format correct');

  // P1-B.7: Backup
  const backup = await createBackup('tenant-1', { data: 'test' });
  assert(backup !== undefined, 'backup created');

  // P1-B.8.1: Workflow
  const wfExec = await runWorkflow(
    [
      { id: 'step1', run: async () => 'A' },
      { id: 'step2', run: async () => 'B', dependsOn: ['step1'] },
    ],
    null,
    'test',
  );
  assert(wfExec.status === 'succeeded', 'workflow succeeded');
  assert(wfExec.results.get('step2')?.output === 'B', 'step2 output is B');

  // P1-B.8.4: Crew
  const crew = createAgent('test-crew', 'Test Crew', 'coordinator', async () => 'result');
  assert(crew !== undefined, 'crew agent created');

  // P1-B.8.5: Content
  const content = await generateContent({ templateId: 'blog-post', format: 'text', variables: { topic: 'AI' } });
  assert(content !== undefined, 'content generated');
  assert(content.content.length > 0, 'content not empty');

  // P1-B.9: Nguyen Tools — instantiate classes
  const roots = new NguyenRoots('tenant-1');
  const memory = new NguyenMemory('tenant-1');
  const knowledge = new NguyenKnowledge();
  assert(roots !== undefined, 'NguyenRoots instantiated');
  assert(memory !== undefined, 'NguyenMemory instantiated');
  assert(knowledge !== undefined, 'NguyenKnowledge instantiated');

  console.log('\n=== P1-B E2E Test ===');
  console.log('----------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
