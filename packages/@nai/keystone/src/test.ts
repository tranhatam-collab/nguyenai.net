/**
 * @nai/keystone — Backup service unit tests.
 */
import {
  setBackupStore,
  InMemoryBackupStore,
  setRetentionPolicy,
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  verifyBackup,
  purgeExpired,
  enforceRetention,
} from './index';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  setBackupStore(new InMemoryBackupStore());
  setRetentionPolicy({ maxBackups: 100 });

  // 1. Create backup
  const data = { user: 'u_1', records: [1, 2, 3] };
  const rec = await createBackup('t_1', data, { type: 'full' });
  assert(rec.tenant_id === 't_1', 'createBackup sets tenant_id');
  assert(rec.type === 'full', 'createBackup sets type=full');
  assert(rec.checksum.length > 0, 'createBackup computes checksum');
  assert(rec.size_bytes > 0, 'createBackup sets size_bytes');
  assert(rec.backup_id.length > 0, 'createBackup generates backup_id');

  // 2. Restore backup
  const restored = await restoreBackup(rec.backup_id);
  assert(restored !== null, 'restoreBackup returns data');
  assert((restored as { user: string }).user === 'u_1', 'restored data matches original');

  // 3. List backups
  const list = await listBackups('t_1');
  assert(list.length === 1, 'listBackups returns 1 for t_1');

  // 4. Verify backup
  const valid = await verifyBackup(rec.backup_id);
  assert(valid === true, 'verifyBackup returns true for intact backup');

  // 5. Tenant isolation
  await createBackup('t_2', { x: 1 });
  const t1List = await listBackups('t_1');
  assert(t1List.length === 1, 't_1 list does not include t_2 backups');
  const t2List = await listBackups('t_2');
  assert(t2List.length === 1, 't_2 list has its own backup');

  // 6. Delete backup
  const deleted = await deleteBackup(rec.backup_id);
  assert(deleted === true, 'deleteBackup returns true');
  const afterDelete = await listBackups('t_1');
  assert(afterDelete.length === 0, 'backup deleted from list');
  const restoreDeleted = await restoreBackup(rec.backup_id);
  assert(restoreDeleted === null, 'restore deleted backup returns null');

  // 7. Retention policy (enforceRetention runs inside createBackup)
  setRetentionPolicy({ maxBackups: 2 });
  await createBackup('t_3', { n: 1 });
  await createBackup('t_3', { n: 2 });
  await createBackup('t_3', { n: 3 }); // triggers enforceRetention internally
  const t3List = await listBackups('t_3');
  assert(t3List.length === 2, 't_3 has 2 backups after auto-retention');
  const manualPurge = await enforceRetention('t_3');
  assert(manualPurge === 0, 'enforceRetention returns 0 when already within limit');

  // 8. Purge expired (maxAgeMs passed as arg)
  await createBackup('t_4', { x: 1 });
  await new Promise((r) => setTimeout(r, 50));
  const expiredCount = await purgeExpired(10);
  assert(expiredCount >= 1, 'purgeExpired removes old backups');
  const t4List = await listBackups('t_4');
  assert(t4List.length === 0, 't_4 empty after purge');

  // 9. Multiple backups for same tenant
  setBackupStore(new InMemoryBackupStore());
  setRetentionPolicy({ maxBackups: 100 });
  for (let i = 0; i < 5; i++) {
    await createBackup('t_5', { i });
  }
  const t5List = await listBackups('t_5');
  assert(t5List.length === 5, 't_5 has 5 backups');
  assert(t5List[0]!.created_at >= t5List[4]!.created_at, 'listBackups sorted newest first');

  // 10. Verify missing backup
  const missingVerify = await verifyBackup('nonexistent');
  assert(missingVerify === false, 'verifyBackup returns false for missing backup');

  // Report
  console.log('\n@nai/keystone test');
  console.log('--------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
