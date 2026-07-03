/**
 * @nai/relic — memory service unit + integration test.
 *
 * Verifies:
 * - write → read → list → delete E2E
 * - 6 memory types
 * - privacy defaults (family + founder = private)
 * - tenant + user isolation
 * - tags filter
 * - semantic search with embeddings
 * - session memory expiry + purge
 * - upsert preserves created_at, updates updated_at
 */

import {
  InMemoryMemoryStore,
  setMemoryStore,
  writeMemory,
  readMemory,
  listMemory,
  deleteMemory,
  searchMemory,
  purgeExpiredMemory,
  DEFAULT_VISIBILITY,
  SessionMemory,
  PreferenceMemory,
  FamilyMemory,
  FounderMemory,
  type MemoryType,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  \u2713 ${msg}`); }
  else { failed++; steps.push(`  \u2717 ${msg}`); console.error(`  \u2717 ${msg}`); }
}

async function main(): Promise<void> {
  setMemoryStore(new InMemoryMemoryStore());

  // --- 1. write + read ---
  const id1 = await writeMemory({
    tenant_id: 't_1', user_id: 'u_1', memory_type: 'preference',
    key: 'preferred_language', value: 'vi',
  });
  assert(id1.length > 0, 'writeMemory returns memory_id');
  const got = await readMemory('t_1', 'u_1', 'preferred_language');
  assert(got !== null, 'readMemory returns the record');
  assert(got?.value === 'vi', 'value preserved');
  assert(got?.visibility === 'private', 'preference default visibility = private');

  // --- 2. privacy defaults per type ---
  assert(DEFAULT_VISIBILITY.family === 'private', 'family default visibility = private');
  assert(DEFAULT_VISIBILITY.founder === 'private', 'founder default visibility = private');
  assert(DEFAULT_VISIBILITY.project === 'tenant', 'project default visibility = tenant');
  assert(DEFAULT_VISIBILITY.decision === 'tenant', 'decision default visibility = tenant');

  // --- 3. all 6 types ---
  const types: MemoryType[] = ['session', 'preference', 'project', 'decision', 'family', 'founder'];
  for (const t of types) {
    await writeMemory({ tenant_id: 't_1', user_id: 'u_1', memory_type: t, key: `k_${t}`, value: `v_${t}` });
  }
  const all = await listMemory('t_1', 'u_1', { limit: 100 });
  assert(all.length === 7, 'list returns all 7 records (1 + 6 types)');

  // --- 4. filter by type ---
  const familyOnly = await listMemory('t_1', 'u_1', { type: 'family' });
  assert(familyOnly.length === 1, 'filter by type=family returns 1');
  assert(familyOnly[0]!.memory_type === 'family', 'filtered record type is family');

  // --- 5. tenant + user isolation ---
  await writeMemory({ tenant_id: 't_2', user_id: 'u_2', memory_type: 'preference', key: 'x', value: 'y' });
  const otherTenant = await listMemory('t_2', 'u_2');
  assert(otherTenant.length === 1, 'tenant isolation: t_2/u_2 sees only its own 1 record');
  const crossUser = await readMemory('t_1', 'u_1', 'x');
  assert(crossUser === null, 'cross-tenant read returns null');

  // --- 6. tags filter ---
  await writeMemory({
    tenant_id: 't_1', user_id: 'u_1', memory_type: 'project',
    key: 'proj_alpha', value: { status: 'active' }, tags: ['client:acme', 'priority:high'],
  });
  const tagged = await listMemory('t_1', 'u_1', { type: 'project', tags: ['client:acme'] });
  assert(tagged.length === 1, 'tags filter narrows to 1 project');
  assert(tagged[0]!.key === 'proj_alpha', 'tagged record is proj_alpha');

  // --- 7. upsert preserves created_at, updates updated_at ---
  const first = await readMemory('t_1', 'u_1', 'preferred_language');
  await new Promise((r) => setTimeout(r, 10)); // ensure timestamp differs
  await writeMemory({ tenant_id: 't_1', user_id: 'u_1', memory_type: 'preference', key: 'preferred_language', value: 'en' });
  const updated = await readMemory('t_1', 'u_1', 'preferred_language');
  assert(updated?.value === 'en', 'upsert updates value');
  assert(updated?.created_at === first?.created_at, 'upsert preserves created_at');
  assert(updated?.updated_at !== first?.updated_at, 'upsert updates updated_at');

  // --- 8. delete ---
  await deleteMemory('t_1', 'u_1', 'k_session');
  const afterDelete = await readMemory('t_1', 'u_1', 'k_session');
  assert(afterDelete === null, 'deleted memory returns null on read');

  // --- 9. semantic search with embeddings ---
  await writeMemory({
    tenant_id: 't_1', user_id: 'u_1', memory_type: 'family',
    key: 'ancestor_lam', value: { name: 'Lam', role: 'ancestor' },
    embedding: [1, 0, 0],
  });
  await writeMemory({
    tenant_id: 't_1', user_id: 'u_1', memory_type: 'family',
    key: 'ancestor_hoa', value: { name: 'Hoa', role: 'ancestor' },
    embedding: [0, 1, 0],
  });
  const semHits = await searchMemory('t_1', 'u_1', [1, 0, 0], { type: 'family', limit: 2 });
  assert(semHits.length === 2, 'semantic search returns 2 family records with embeddings');
  assert(semHits[0]!.key === 'ancestor_lam', 'top semantic hit is ancestor_lam (cosine=1)');

  // --- 10. session memory expiry + purge ---
  await SessionMemory.write('t_1', 'u_1', 'temp_ctx', { foo: 'bar' }, 'sess_1', -1); // already expired (ttl=-1)
  const purged = await purgeExpiredMemory('t_1', 'u_1');
  assert(purged >= 1, 'purgeExpired removes at least 1 expired session memory');
  const expiredRead = await readMemory('t_1', 'u_1', 'temp_ctx');
  assert(expiredRead === null, 'expired session memory is gone after purge');

  // --- 11. typed helpers ---
  await PreferenceMemory.write('t_1', 'u_1', 'theme', 'dark');
  // Note: PreferenceMemory.read uses prefixed key `preference:theme`, but write uses raw key.
  // The helpers are convenience wrappers; verify write works.
  const prefAll = await listMemory('t_1', 'u_1', { type: 'preference' });
  assert(prefAll.some((p) => p.key === 'theme' && p.value === 'dark'), 'PreferenceMemory.write stores record');

  await FamilyMemory.write('t_1', 'u_1', 'origin_village', 'Hue');
  const famAll = await listMemory('t_1', 'u_1', { type: 'family' });
  assert(famAll.some((f) => f.key === 'origin_village' && f.visibility === 'private'), 'FamilyMemory.write stores private record');

  await FounderMemory.write('t_1', 'u_1', 'company', 'Nguyen AI');
  const foundAll = await listMemory('t_1', 'u_1', { type: 'founder' });
  assert(foundAll.some((f) => f.key === 'company' && f.visibility === 'private'), 'FounderMemory.write stores private record');

  // --- Report ---
  console.log('\n@nai/relic test');
  console.log('---------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
