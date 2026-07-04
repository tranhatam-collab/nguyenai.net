/**
 * @nai/policy-fga — unit tests.
 */

import {
  InMemoryFgaStore,
  setFgaStore,
  grantRelation,
  revokeRelation,
  checkRelation,
  listUserObjects,
  checkTenantAccess,
  canCrossTenantRead,
  type Relation,
  type ObjectType,
} from './index.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

async function testBasicGrantCheck() {
  console.log('Test: basic grant + check');
  const store = new InMemoryFgaStore();
  setFgaStore(store);

  await grantRelation('user:u1', 'owner', 'organization:org1');
  const isOwner = await checkRelation('user:u1', 'owner', 'organization:org1');
  assert(isOwner === true, 'owner relation granted');

  const notOwner = await checkRelation('user:u2', 'owner', 'organization:org1');
  assert(notOwner === false, 'non-granted user is not owner');
}

async function testRevoke() {
  console.log('Test: revoke');
  const store = new InMemoryFgaStore();
  setFgaStore(store);

  await grantRelation('user:u1', 'admin', 'organization:org1');
  assert(await checkRelation('user:u1', 'admin', 'organization:org1') === true, 'admin granted');

  await revokeRelation('user:u1', 'admin', 'organization:org1');
  assert(await checkRelation('user:u1', 'admin', 'organization:org1') === false, 'admin revoked');
}

async function testListObjects() {
  console.log('Test: list objects');
  const store = new InMemoryFgaStore();
  setFgaStore(store);

  await grantRelation('user:u1', 'family-member', 'family:fam1');
  await grantRelation('user:u1', 'family-member', 'family:fam2');
  await grantRelation('user:u1', 'chapter-member', 'chapter:ch1');

  const families = await listUserObjects('user:u1', 'family-member', 'family');
  assert(families.length === 2, 'user is family-member of 2 families');
  assert(families.includes('family:fam1'), 'includes fam1');
  assert(families.includes('family:fam2'), 'includes fam2');

  const chapters = await listUserObjects('user:u1', 'chapter-member', 'chapter');
  assert(chapters.length === 1, 'user is chapter-member of 1 chapter');
}

async function testTenantIsolation() {
  console.log('Test: tenant isolation');
  const ctx1 = { user_id: 'u1', tenant_id: 't1', roles: ['USER'] };
  const ctx2 = { user_id: 'u2', tenant_id: 't2', roles: ['USER'] };
  const superAdmin = { user_id: 'u3', tenant_id: 't3', roles: ['SUPER_ADMIN'] };

  assert(checkTenantAccess(ctx1, 't1') === true, 'same tenant access allowed');
  assert(checkTenantAccess(ctx1, 't2') === false, 'cross-tenant access denied for USER');
  assert(checkTenantAccess(ctx2, 't1') === false, 'cross-tenant access denied for USER (reverse)');
  assert(checkTenantAccess(superAdmin, 't1') === true, 'SUPER_ADMIN can access any tenant');
}

async function testCrossTenantRead() {
  console.log('Test: cross-tenant read (audit)');
  const userCtx = { user_id: 'u1', tenant_id: 't1', roles: ['USER'] };
  const adminCtx = { user_id: 'u2', tenant_id: 't2', roles: ['ADMIN'] };
  const superAdminCtx = { user_id: 'u3', tenant_id: 't3', roles: ['SUPER_ADMIN'] };

  assert(canCrossTenantRead(userCtx, false) === false, 'USER cannot cross-tenant read');
  assert(canCrossTenantRead(adminCtx, true) === false, 'ADMIN cannot cross-tenant read even with audit perm');
  assert(canCrossTenantRead(superAdminCtx, true) === true, 'SUPER_ADMIN with audit perm can cross-tenant read');
  assert(canCrossTenantRead(superAdminCtx, false) === false, 'SUPER_ADMIN without audit perm cannot cross-tenant read');
}

async function testInvestorQualified() {
  console.log('Test: investor-qualified relation');
  const store = new InMemoryFgaStore();
  setFgaStore(store);

  await grantRelation('user:u1', 'investor-qualified', 'investor_room:room1');
  assert(await checkRelation('user:u1', 'investor-qualified', 'investor_room:room1') === true, 'investor-qualified granted');
  assert(await checkRelation('user:u2', 'investor-qualified', 'investor_room:room1') === false, 'non-qualified user denied');
}

async function main() {
  console.log('=== @nai/policy-fga unit tests ===\n');
  await testBasicGrantCheck();
  await testRevoke();
  await testListObjects();
  await testTenantIsolation();
  await testCrossTenantRead();
  await testInvestorQualified();
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
