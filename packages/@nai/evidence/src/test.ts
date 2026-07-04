/**
 * @nai/evidence — unit + integration test.
 *
 * Verifies:
 * - recordEvidence produces a signed, chained record.
 * - exportEvidencePack produces a signed pack.
 * - verifyEvidencePack passes on a clean pack.
 * - Tampering (mutating payload, record_hash, signature, chain link) is detected.
 * - Multiple records form a valid chain.
 */

import {
  InMemoryEvidenceStore,
  setEvidenceStore,
  recordEvidence,
  exportEvidencePack,
  verifyEvidencePack,
  verifyChain,
  getEvidenceForCommand,
  getEvidenceForTenant,
  type EvidenceRecord,
} from './index.ts';

const SECRET = 'test-evidence-secret-v1';

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
  // Fresh store per run
  setEvidenceStore(new InMemoryEvidenceStore());

  // --- 1. Record a single piece of evidence ---
  const rec1 = await recordEvidence({
    command_id: 'cmd_001',
    user_id: 'u_1',
    tenant_id: 't_1',
    agent_id: 'nguyen-guide',
    proof_type: 'command_executed',
    payload: { input: 'hello', output: 'hi there', tool_calls: [] },
  }, SECRET);

  assert(rec1.evidence_id.length > 0, 'recordEvidence returns an evidence_id');
  assert(rec1.record_hash.length === 64, 'record_hash is a 64-char SHA-256 hex');
  assert(rec1.signature.length === 64, 'signature is a 64-char HMAC-SHA256 hex');
  assert(rec1.prev_hash === 'genesis', 'first record prev_hash === "genesis"');
  assert(rec1.captured_at.length > 0, 'captured_at is set');

  // --- 2. Record a second piece of evidence (chain continues) ---
  const rec2 = await recordEvidence({
    command_id: 'cmd_001',
    user_id: 'u_1',
    tenant_id: 't_1',
    agent_id: 'nguyen-researcher',
    proof_type: 'tool_called',
    payload: { tool: 'web_search', query: 'nguyen genealogy' },
  }, SECRET);

  assert(rec2.prev_hash === rec1.record_hash, 'second record prev_hash === first record_hash (chain)');

  // --- 3. Verify chain on clean records ---
  const cleanChain = await verifyChain([rec1, rec2], SECRET);
  assert(cleanChain === true, 'verifyChain passes on clean 2-record chain');

  // --- 4. Tamper detection: mutate payload ---
  const tamperedPayload: EvidenceRecord = { ...rec2, payload: { ...rec2.payload, output: 'forged' } };
  const tamperedChainPayload = await verifyChain([rec1, tamperedPayload], SECRET);
  assert(tamperedChainPayload === false, 'tampering payload is detected (record_hash mismatch)');

  // --- 5. Tamper detection: mutate record_hash ---
  const tamperedHash: EvidenceRecord = { ...rec2, record_hash: 'a'.repeat(64) };
  const tamperedChainHash = await verifyChain([rec1, tamperedHash], SECRET);
  assert(tamperedChainHash === false, 'tampering record_hash is detected');

  // --- 6. Tamper detection: mutate signature ---
  const tamperedSig: EvidenceRecord = { ...rec2, signature: 'b'.repeat(64) };
  const tamperedChainSig = await verifyChain([rec1, tamperedSig], SECRET);
  assert(tamperedChainSig === false, 'tampering signature is detected');

  // --- 7. Tamper detection: break chain link ---
  const brokenLink: EvidenceRecord = { ...rec2, prev_hash: 'c'.repeat(64) };
  const brokenChain = await verifyChain([rec1, brokenLink], SECRET);
  assert(brokenChain === false, 'breaking chain link (prev_hash) is detected');

  // --- 8. Export pack for a command ---
  const pack = await exportEvidencePack('t_1', SECRET, 'cmd_001');
  assert(pack.pack_id.length > 0, 'exportEvidencePack returns pack_id');
  assert(pack.record_count === 2, 'pack contains 2 records for cmd_001');
  assert(pack.algorithm === 'hmac-sha256', 'pack algorithm is hmac-sha256');
  assert(pack.pack_hash.length === 64, 'pack_hash is 64-char hex');
  assert(pack.pack_signature.length === 64, 'pack_signature is 64-char hex');
  assert(pack.chain_verified === true, 'pack chain_verified === true on clean pack');

  // --- 9. Verify clean pack ---
  const verifiedPack = await verifyEvidencePack(pack, SECRET);
  assert(verifiedPack === true, 'verifyEvidencePack passes on clean pack');

  // --- 10. Tamper pack: wrong secret ---
  const wrongSecret = await verifyEvidencePack(pack, 'wrong-secret');
  assert(wrongSecret === false, 'verifyEvidencePack fails with wrong secret');

  // --- 11. Tamper pack: mutate a record inside pack ---
  const tamperedPack = {
    ...pack,
    records: [{ ...pack.records[0]!, payload: { forged: true } }, pack.records[1]!],
  };
  const tamperedPackVerify = await verifyEvidencePack(tamperedPack, SECRET);
  assert(tamperedPackVerify === false, 'verifyEvidencePack detects mutated record inside pack');

  // --- 12. Tenant-wide pack (no command filter) ---
  // Add a third record under a different command to test tenant filter.
  await recordEvidence({
    command_id: 'cmd_002',
    user_id: 'u_1',
    tenant_id: 't_1',
    agent_id: 'nguyen-archivist',
    proof_type: 'memory_written',
    payload: { memory_type: 'family', key: 'ancestor_lam' },
  }, SECRET);

  const tenantPack = await exportEvidencePack('t_1', SECRET);
  assert(tenantPack.record_count === 3, 'tenant pack contains all 3 records');
  assert(tenantPack.command_id === null, 'tenant pack has command_id === null');
  const tenantPackVerified = await verifyEvidencePack(tenantPack, SECRET);
  assert(tenantPackVerified === true, 'tenant pack verifies clean');

  // --- 13. Read helpers ---
  const forCmd = await getEvidenceForCommand('cmd_001');
  assert(forCmd.length === 2, 'getEvidenceForCommand returns 2 for cmd_001');
  const forTenant = await getEvidenceForTenant('t_1');
  assert(forTenant.length === 3, 'getEvidenceForTenant returns 3 for t_1');

  // --- 14. Tenant isolation ---
  const otherTenant = await getEvidenceForTenant('t_other');
  assert(otherTenant.length === 0, 'tenant isolation: other tenant sees 0 records');

  // --- Report ---
  console.log('\n@nai/evidence test');
  console.log('------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
