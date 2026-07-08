/**
 * P1-B E2E Test — Product & Billing End-to-End
 *
 * Tests the full chain: product catalog → plan management → billing → subscription lifecycle
 * → tally (LLM cost) → covenant (vault) → keystone (backup)
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
import { getPlan, getAllPlans, getPlanEntitlements } from '@nai/product-catalog';
import { computeVat, generateInvoice } from '@nai/billing';
import {
  InMemoryEntitlementStore,
  InMemorySubscriptionStore,
  setEntitlementStore,
  setSubscriptionStore,
  upgradePlan,
  downgradePlan,
  cancelPlan,
  createSubscription,
  scheduleCancellation,
} from '@nai/entitlement';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  // P1-B.1: Product catalog
  const plans = getAllPlans();
  assert(plans.length === 9, 'catalog has 9 plans');
  const startPlan = getPlan('nguyen-start');
  assert(startPlan !== undefined, 'Start plan exists');
  assert(startPlan!.price_vnd === 0, 'Start plan is free');
  const entitlements = getPlanEntitlements('nguyen-start');
  assert(entitlements['machine.plan'] === 'free', 'Start plan entitlement is free');

  // P1-B.2: Plan management
  const entStore = new InMemoryEntitlementStore();
  setEntitlementStore(entStore);
  const upgradeResult = await upgradePlan('u1', 't1', 'nguyen-start', 'nguyen-personal');
  assert(upgradeResult.success === true, 'plan upgrade succeeds');
  assert(upgradeResult.new_plan_id === 'nguyen-personal', 'upgraded to personal');
  const downgradeResult = await downgradePlan('u1', 't1', 'nguyen-personal', 'nguyen-start');
  assert(downgradeResult.success === true, 'plan downgrade succeeds');
  const cancelResult = await cancelPlan('u1', 't1', 'nguyen-personal');
  assert(cancelResult.success === true, 'plan cancel succeeds');
  assert(cancelResult.new_plan_id === 'start', 'canceled to start');

  // P1-B.3: Billing integration
  const vat = computeVat(299000, 'VND', true);
  assert(vat.vat_amount === 29900, 'VAT 10% computed correctly');
  assert(vat.issuing_entity === 'KASAN_JSC', 'Kasan JSC issues for VN customers');
  const invoice = generateInvoice(
    {
      payment_id: 'pay-123',
      gateway: 'stripe',
      gateway_payment_id: 'gw_pay_123',
      user_id: 'u1',
      tenant_id: 't1',
      price_id: 'personal',
      amount: 299000,
      currency: 'VND',
      status: 'paid',
      paid_at: new Date().toISOString(),
      raw: {},
    },
    true
  );
  assert(invoice.invoice_id.startsWith('INV-'), 'invoice ID format correct');
  assert(invoice.vat_amount === 29900, 'invoice VAT correct');

  // P1-B.4: Subscription lifecycle
  const subStore = new InMemorySubscriptionStore();
  setSubscriptionStore(subStore);
  const subId = await createSubscription(
    'u1',
    't1',
    'nguyen-personal',
    'stripe',
    'sub_123',
    new Date('2026-07-01'),
    new Date('2026-08-01')
  );
  assert(subId !== undefined, 'subscription created');
  const scheduled = await scheduleCancellation('u1', 't1');
  assert(scheduled === true, 'cancellation scheduled');

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
  const content = await generateContent({ content: 'Test content about AI', format: 'text', variables: { topic: 'AI' } });
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
