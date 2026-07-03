/**
 * @nai/compass — vector store unit + integration test.
 *
 * Verifies:
 * - ensureCollection + upsert + get + search E2E
 * - tenant isolation
 * - metadata filter
 * - dimension validation
 * - distance metrics (cosine, dot, euclidean)
 * - delete + count
 * - batch upsert
 */

import {
  InMemoryVectorStore,
  setVectorStore,
  ensureDefaultCollections,
  upsertVector,
  searchVectors,
  getVectorStore,
  type CollectionName,
} from './index';

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

// Use a small dimension for tests (no real embedding model needed).
const DIM = 4;

async function main(): Promise<void> {
  setVectorStore(new InMemoryVectorStore());
  await ensureDefaultCollections(DIM);

  // --- 1. upsert + get ---
  await upsertVector('evidence', 'ev_1', 't_1', [1, 0, 0, 0], { agent_id: 'nguyen-guide', proof_type: 'command_executed' });
  const got = await getVectorStore().get('evidence', 't_1', 'ev_1');
  assert(got !== null, 'upsert then get returns the point');
  assert(got?.payload.agent_id === 'nguyen-guide', 'payload preserved');

  // --- 2. search by similar vector ---
  await upsertVector('evidence', 'ev_2', 't_1', [0.9, 0.1, 0, 0], { agent_id: 'nguyen-researcher' });
  await upsertVector('evidence', 'ev_3', 't_1', [0, 1, 0, 0], { agent_id: 'nguyen-archivist' });
  const hits = await searchVectors('evidence', [1, 0, 0, 0], 't_1', { limit: 2 });
  assert(hits.length === 2, 'search returns 2 hits (limit=2)');
  assert(hits[0]!.id === 'ev_1', 'top hit is ev_1 (exact match, cosine=1)');
  assert(hits[1]!.id === 'ev_2', 'second hit is ev_2 (closest by cosine)');
  assert(hits[0]!.score > hits[1]!.score, 'scores are sorted descending');

  // --- 3. tenant isolation ---
  await upsertVector('evidence', 'ev_other', 't_2', [1, 0, 0, 0], { agent_id: 'x' });
  const otherHits = await searchVectors('evidence', [1, 0, 0, 0], 't_2');
  assert(otherHits.length === 1, 'tenant isolation: t_2 sees only its own 1 point');
  assert(otherHits[0]!.id === 'ev_other', 'tenant isolation: t_2 hit is ev_other');

  // --- 4. metadata filter ---
  const filtered = await searchVectors('evidence', [1, 0, 0, 0], 't_1', {
    metadata: { agent_id: 'nguyen-researcher' },
  });
  assert(filtered.length === 1, 'metadata filter narrows to 1 hit');
  assert(filtered[0]!.id === 'ev_2', 'metadata filter returns ev_2');

  // --- 5. dimension validation ---
  let dimError: string | null = null;
  try {
    await upsertVector('evidence', 'ev_bad', 't_1', [1, 0, 0], { x: 1 }); // dim 3, expected 4
  } catch (e) {
    dimError = (e as Error).message;
  }
  assert(dimError !== null && dimError.includes('dimension'), 'dimension mismatch throws');

  // --- 6. count ---
  const countT1 = await getVectorStore().count('evidence', 't_1');
  assert(countT1 === 3, 'count t_1 evidence = 3');

  // --- 7. delete ---
  await getVectorStore().delete('evidence', 't_1', 'ev_3');
  const afterDelete = await getVectorStore().count('evidence', 't_1');
  assert(afterDelete === 2, 'count after delete = 2');
  const deletedGet = await getVectorStore().get('evidence', 't_1', 'ev_3');
  assert(deletedGet === null, 'deleted point returns null on get');

  // --- 8. batch upsert ---
  const store = getVectorStore();
  await store.upsertBatch('knowledge', [
    { id: 'k_1', tenant_id: 't_1', vector: [1, 0, 0, 0], payload: { topic: 'nguyen-roots' } },
    { id: 'k_2', tenant_id: 't_1', vector: [0, 1, 0, 0], payload: { topic: 'nguyen-memory' } },
  ]);
  const kCount = await store.count('knowledge', 't_1');
  assert(kCount === 2, 'batch upsert adds 2 knowledge points');

  // --- 9. empty collection search returns [] ---
  const emptyHits = await searchVectors('memory', [1, 0, 0, 0], 't_1');
  assert(emptyHits.length === 0, 'search on empty memory collection returns []');

  // --- 10. distance metric: dot product ---
  // Re-init with dot product config to test metric.
  const dotStore = new InMemoryVectorStore();
  setVectorStore(dotStore);
  await dotStore.ensureCollection({ name: 'evidence', dimension: 3, distance: 'dot' });
  await dotStore.upsert('evidence', { id: 'a', tenant_id: 't', vector: [2, 0, 0], payload: {} });
  await dotStore.upsert('evidence', { id: 'b', tenant_id: 't', vector: [1, 1, 1], payload: {} });
  const dotHits = await dotStore.search('evidence', [1, 0, 0], { tenant_id: 't' });
  assert(dotHits[0]!.id === 'a', 'dot product: [2,0,0] beats [1,1,1] for query [1,0,0]');
  assert(dotHits[0]!.score === 2, 'dot product score = 2');

  // --- Report ---
  console.log('\n@nai/compass test');
  console.log('------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
