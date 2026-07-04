/**
 * @nai/proof — Tests for certificate ID generation + proof store.
 */

import {
  generateCertificateId,
  verifyCertificateId,
  parseCertificateId,
  computeChecksum,
  InMemoryProofStore,
  type Proof,
} from './index.js';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ ${msg}`);
  }
}

async function testCertificateIdFormat(): Promise<void> {
  console.log('\n=== Certificate ID Format ===');

  const id = generateCertificateId('OPR', 2026, 1);
  console.log(`  Generated: ${id}`);
  assert(id.startsWith('NGAI-OPR-2026-000001-'), `ID starts with NGAI-OPR-2026-000001-: ${id}`);
  assert(id.length === 25, `ID length is 25 (NGAI-OPR-2026-000001-XXXX = 25): ${id.length}`);

  // Sequence zero-padding
  const id2 = generateCertificateId('ARC', 2026, 42);
  assert(id2.includes('-000042-'), `Sequence zero-padded to 6 digits: ${id2}`);

  // Program uppercase
  const id3 = generateCertificateId('opr', 2026, 1);
  assert(id3.startsWith('NGAI-OPR-'), `Program code uppercased: ${id3}`);
}

async function testCertificateIdVerification(): Promise<void> {
  console.log('\n=== Certificate ID Verification ===');

  const id = generateCertificateId('OPR', 2026, 1);
  assert(verifyCertificateId(id), `Valid ID passes verification: ${id}`);

  assert(!verifyCertificateId('NGAI-OPR-2026-000001-XXXX'), `Wrong checksum fails verification`);
  assert(!verifyCertificateId('INVALID'), `Malformed ID fails verification`);
  assert(!verifyCertificateId('XXXX-OPR-2026-000001-ABCD'), `Wrong prefix fails verification`);
}

async function testCertificateIdParsing(): Promise<void> {
  console.log('\n=== Certificate ID Parsing ===');

  const id = generateCertificateId('OPR', 2026, 7);
  const parsed = parseCertificateId(id);
  assert(parsed !== null, `Parsed valid ID`);
  assert(parsed?.program === 'OPR', `Program parsed: ${parsed?.program}`);
  assert(parsed?.year === 2026, `Year parsed: ${parsed?.year}`);
  assert(parsed?.sequence === 7, `Sequence parsed: ${parsed?.sequence}`);

  assert(parseCertificateId('invalid') === null, `Invalid ID returns null`);
}

async function testChecksumDeterministic(): Promise<void> {
  console.log('\n=== Checksum Determinism ===');

  const c1 = computeChecksum('OPR-2026-000001');
  const c2 = computeChecksum('OPR-2026-000001');
  assert(c1 === c2, `Same input → same checksum: ${c1}`);

  const c3 = computeChecksum('OPR-2026-000002');
  assert(c1 !== c3, `Different input → different checksum: ${c1} vs ${c3}`);

  assert(c1.length === 4, `Checksum is 4 chars: ${c1.length}`);
  assert(/^[0-9A-F]{4}$/.test(c1), `Checksum is uppercase hex: ${c1}`);
}

async function testProofStore(): Promise<void> {
  console.log('\n=== InMemoryProofStore ===');

  const store = new InMemoryProofStore();

  // Create proof
  const proofId = await store.createProof({
    proof_id: '',
    user_id: 'user-1',
    program_id: 'OPR',
    attempt_id: 'attempt-1',
    submitted_at: new Date().toISOString(),
    evidence_refs: ['ev-1'],
    rubric_scores: null,
    ai_review: null,
    human_review: null,
    certificate_id: null,
  });
  assert(proofId.length > 0, `Proof created with ID: ${proofId}`);

  // Get proof
  const proof = await store.getProof(proofId);
  assert(proof !== null, `Proof retrieved`);
  assert(proof?.status === 'submitted', `Default status is submitted: ${proof?.status}`);

  // Get proofs by user
  const userProofs = await store.getProofsByUser('user-1');
  assert(userProofs.length === 1, `User has 1 proof: ${userProofs.length}`);

  // Update status
  await store.updateProofStatus(proofId, 'under_review');
  const updated = await store.getProof(proofId);
  assert(updated?.status === 'under_review', `Status updated: ${updated?.status}`);

  // Issue certificate
  const seq = await store.getNextSequence('OPR', 2026);
  assert(seq === 1, `First sequence is 1: ${seq}`);
  const certId = await store.issueCertificate({
    user_id: 'user-1',
    program_id: 'OPR',
    proof_id: proofId,
    issued_by: 'reviewer-1',
    public_visible: true,
    user_display_name: 'Test User',
    program: 'OPR',
    year: 2026,
    sequence: seq,
  });
  assert(certId.startsWith('NGAI-OPR-2026-000001-'), `Certificate ID format correct: ${certId}`);

  // Get certificate
  const cert = await store.getCertificate(certId);
  assert(cert !== null, `Certificate retrieved`);
  assert(cert?.status === 'active', `Certificate status is active: ${cert?.status}`);

  // Revoke certificate
  await store.revokeCertificate(certId, 'Violated academic integrity policy per terms', 'admin-1');
  const revoked = await store.getCertificate(certId);
  assert(revoked?.status === 'revoked', `Certificate revoked: ${revoked?.status}`);
  assert(revoked?.revoked_reason !== null, `Revocation reason recorded`);

  // Get certificates by user
  const userCerts = await store.getCertificatesByUser('user-1');
  assert(userCerts.length === 1, `User has 1 certificate: ${userCerts.length}`);

  // Review queue
  const queue = await store.getReviewQueue();
  assert(queue.length >= 0, `Review queue returned: ${queue.length} items`);
}

async function main(): Promise<void> {
  console.log('=== @nai/proof Tests ===');

  await testCertificateIdFormat();
  await testCertificateIdVerification();
  await testCertificateIdParsing();
  await testChecksumDeterministic();
  await testProofStore();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    (globalThis as any).process?.exit?.(1);
  }
}

main().catch((err) => {
  console.error('Test runner error:', err);
  (globalThis as any).process?.exit?.(1);
});
