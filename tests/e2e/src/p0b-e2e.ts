/**
 * P0-B E2E test — Phase 2 Identity & Access end-to-end chain.
 *
 * Per NGUYENAI_BACKEND_CONTINUOUS_DEV_PLAN_2026-07-02.md task 2.9:
 *   register → login → tenant → entitlement → sensitive action → approval → audit
 *
 * This test exercises the full chain using in-memory stores (no DB needed).
 * Production E2E would use a real Postgres + Workers deployment.
 */

import {
  hashPassword,
  verifyPassword,
  generateSessionId,
  generateCsrfToken,
  buildCookieHeader,
  getPermissionsForRoles,
  hasPermission,
  hasRole,
  type Role,
  type Permission,
  type Session,
} from '@nai/auth';

import {
  InMemoryAuditStore,
  setAuditStore,
  logAuditEvent,
  logLoginSuccess,
  logAccessDenied,
  queryAuditLog,
  countAuditEvents,
} from '@nai/audit';

import {
  InMemoryEntitlementStore,
  setEntitlementStore,
  resolveEntitlements,
  checkCommandQuota,
  checkAcademyAccess,
  checkModelTierAccess,
} from '@nai/entitlement';

import {
  InMemoryApprovalStore,
  setApprovalStore,
  requestApproval,
  approveRequest,
  markExecuted,
  checkApprovalStatus,
} from '@nai/approval';

import {
  grantRelation,
  checkRelation,
  setFgaStore,
  InMemoryFgaStore,
} from '@nai/policy-fga';

import {
  evaluatePolicy,
  checkEntitlementForAction,
  type PolicyContext,
  type ActionType,
} from '@nai/policy-engine';

import { getPlan, type PlanId } from '@nai/product-catalog';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    steps.push(`  ✓ ${msg}`);
  } else {
    failed++;
    steps.push(`  ✗ ${msg}`);
    console.error(`  ✗ ${msg}`);
  }
}

async function main() {
  console.log('=== P0-B E2E: register → login → tenant → entitlement → sensitive action → approval → audit ===\n');

  // Initialize stores
  const auditStore = new InMemoryAuditStore();
  const entStore = new InMemoryEntitlementStore();
  const approvalStore = new InMemoryApprovalStore();
  const fgaStore = new InMemoryFgaStore();
  setAuditStore(auditStore);
  setEntitlementStore(entStore);
  setApprovalStore(approvalStore);
  setFgaStore(fgaStore);

  // ============================================================
  // Step 1: Register — create user with email/password
  // ============================================================
  console.log('Step 1: Register');
  const email = 'founder@nguyenai.net';
  const password = 'SecurePass123!';
  const passwordHash = await hashPassword(password);
  assert(passwordHash.startsWith('pbkdf2:'), 'password hashed with PBKDF2');

  const userId = crypto.randomUUID();
  const tenantId = crypto.randomUUID();
  const orgId = crypto.randomUUID();

  // ============================================================
  // Step 2: Login — verify password, create session
  // ============================================================
  console.log('Step 2: Login');
  const passwordValid = await verifyPassword(password, passwordHash);
  assert(passwordValid === true, 'password verifies on login');

  const sessionId = generateSessionId();
  const csrfToken = generateCsrfToken();
  const roles: Role[] = ['USER', 'FOUNDER'];
  const permissions = getPermissionsForRoles(roles);

  const session: Session = {
    session_id: sessionId,
    user_id: userId,
    tenant_id: tenantId,
    plan_id: 'nguyen-start',
    audience: 'app.nguyenai.net',
    issuer: 'auth.nguyenai.net',
    roles,
    permissions,
    device: { ua: 'test-browser' },
    ip_address: '127.0.0.1',
    user_agent: 'test',
    csrf_token: csrfToken,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    rotated_at: null,
    revoked_at: null,
  };

  const cookie = buildCookieHeader('nguyenai_session', sessionId);
  assert(cookie.includes('HttpOnly'), 'session cookie is HttpOnly');
  assert(cookie.includes('Secure'), 'session cookie is Secure');
  assert(cookie.includes('SameSite=Lax'), 'session cookie is SameSite=Lax');

  await logLoginSuccess(userId, sessionId, '127.0.0.1', 'test');
  const loginEvents = await queryAuditLog({ event_type: 'login_success' });
  assert(loginEvents.length === 1, 'login_success audited');

  // ============================================================
  // Step 3: Tenant — create org, assign membership, FGA relations
  // ============================================================
  console.log('Step 3: Tenant');
  await grantRelation(`user:${userId}`, 'owner', `organization:${orgId}`);
  const isOwner = await checkRelation(`user:${userId}`, 'owner', `organization:${orgId}`);
  assert(isOwner === true, 'user is owner of organization');

  // ============================================================
  // Step 4: Entitlement — resolve Founder plan entitlements
  // ============================================================
  console.log('Step 4: Entitlement');
  const planId: PlanId = 'nguyen-founder';
  const plan = getPlan(planId);
  assert(plan?.id === 'nguyen-founder', 'plan loaded from catalog');

  const ent = await resolveEntitlements(userId, tenantId, planId);
  assert(ent.machine.plan === 'founder', 'entitlement plan is founder');
  assert(ent.machine.model_tier === 'pro', 'entitlement model tier is pro');
  assert(ent.machine.command_quota === 1000, 'entitlement command quota is 1000');
  assert(ent.academy.pass === true, 'academy.pass is true (Founder includes Academy Pass per D-015)');

  // Check command quota
  const quotaCheck = await checkCommandQuota(userId, tenantId, planId);
  assert(quotaCheck.allowed === true, 'command quota allows operation');
  assert(quotaCheck.remaining === 1000, '1000 commands remaining');

  // Check model tier access
  const tierCheck = await checkModelTierAccess(userId, tenantId, planId, 'pro');
  assert(tierCheck.allowed === true, 'founder can access pro models');

  // Academy access without pass
  const academyAccess = await checkAcademyAccess(userId, tenantId, planId);
  assert(academyAccess.canLearn === true, 'can learn free intro without pass');
  assert(academyAccess.canSubmit === true, 'can submit with Academy Pass (Founder includes pass per D-015)');

  // ============================================================
  // Step 5: Sensitive action — policy evaluation
  // ============================================================
  console.log('Step 5: Sensitive action');
  const policyCtx: PolicyContext = {
    user_id: userId,
    tenant_id: tenantId,
    roles: roles as string[],
    permissions: permissions as string[],
    entitlements: ent,
    approval_gate: 'sensitive',
    audience: 'app.nguyenai.net',
  };

  // Non-sensitive action — should pass without approval
  const opDecision = evaluatePolicy(policyCtx, 'machine:operate');
  assert(opDecision.allow === true, 'machine:operate allowed');
  assert(opDecision.requires_approval === false, 'machine:operate does not require approval');

  // Sensitive action — should require approval
  const deleteDecision = evaluatePolicy(policyCtx, 'memory:delete');
  assert(deleteDecision.allow === true, 'memory:delete allowed by permission');
  assert(deleteDecision.requires_approval === true, 'memory:delete requires approval');

  // Entitlement check for academy submit
  const academyCheck = checkEntitlementForAction(policyCtx, 'academy:submit');
  assert(academyCheck.allowed === true, 'academy:submit allowed with pass (Founder includes Academy Pass per D-015)');

  // ============================================================
  // Step 6: Approval — request → approve → execute
  // ============================================================
  console.log('Step 6: Approval');
  const approvalId = await requestApproval({
    user_id: userId,
    tenant_id: tenantId,
    action: 'memory:delete',
    resource: 'memory:mem-123',
    requested_by: userId,
    reason: 'cleaning up outdated memory',
  });
  assert(typeof approvalId === 'string', 'approval request created');

  const pendingStatus = await checkApprovalStatus(approvalId);
  assert(pendingStatus === 'pending', 'approval is pending');

  // Admin approves
  const adminId = crypto.randomUUID();
  await approveRequest(approvalId, adminId, tenantId, 'verified safe');
  const approvedStatus = await checkApprovalStatus(approvalId);
  assert(approvedStatus === 'approved', 'approval is approved');

  // Execute
  await markExecuted(approvalId);
  const executedStatus = await checkApprovalStatus(approvalId);
  assert(executedStatus === 'executed', 'approval is executed');

  // ============================================================
  // Step 7: Audit — verify full chain audited
  // ============================================================
  console.log('Step 7: Audit');
  const allEvents = await queryAuditLog({});
  const totalEvents = await countAuditEvents({});
  assert(totalEvents >= 4, `at least 4 audit events (login, approval_requested, approval_granted, executed), got ${totalEvents}`);

  const loginCount = await countAuditEvents({ event_type: 'login_success' });
  assert(loginCount === 1, '1 login_success event');

  const requestCount = await countAuditEvents({ event_type: 'approval_requested' });
  assert(requestCount === 1, '1 approval_requested event');

  const grantCount = await countAuditEvents({ event_type: 'approval_granted' });
  assert(grantCount === 1, '1 approval_granted event');

  const execCount = await countAuditEvents({ event_type: 'sensitive_action_executed' });
  assert(execCount === 1, '1 sensitive_action_executed event');

  // Verify audit is append-only (no update/delete methods on store)
  assert(typeof (auditStore as unknown as { update?: unknown }).update === 'undefined', 'audit store has no update method');
  assert(typeof (auditStore as unknown as { delete?: unknown }).delete === 'undefined', 'audit store has no delete method');

  // ============================================================
  // Step 8: Access denied — verify denied events audited
  // ============================================================
  console.log('Step 8: Access denied');
  await logAccessDenied(userId, sessionId, '/v1/audit', 'missing SUPER_ADMIN role');
  const deniedCount = await countAuditEvents({ event_type: 'access_denied' });
  assert(deniedCount === 1, '1 access_denied event');

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n--- Step results ---');
  for (const step of steps) console.log(step);
  console.log(`\n=== P0-B E2E: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    console.error('❌ P0-B E2E FAILED');
    process.exit(1);
  } else {
    console.log('✅ P0-B E2E PASSED — full chain verified');
  }
}

main();
main();
