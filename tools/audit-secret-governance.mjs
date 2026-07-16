#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const inventory = JSON.parse(read('config/secret-governance.json'));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const authSource = read('apps/auth/src/index.ts');
const authDb = read('apps/auth/src/db.ts');
const apiSource = read('apps/api/src/index.ts');
const authPackage = read('packages/@nai/auth/src/index.ts');
const authWrangler = read('apps/auth/wrangler.jsonc');
const apiWrangler = read('apps/api/wrangler.jsonc');
const deployWorkflow = read('.github/workflows/deploy.yml');
const securityWorkflow = read('.github/workflows/security.yml');

check(inventory.authModel === 'd1_opaque_session_cookie_hmac', 'Canonical auth model must remain D1 opaque session + HMAC cookie');
check(!/JWT_SECRET/.test(authSource + apiSource), 'Runtime source must not consume JWT_SECRET unless Founder approves a new auth contract');
check(/AUTH_SECRET/.test(authSource) && /AUTH_SECRET/.test(apiSource), 'AUTH_SECRET must be consumed by both auth and API Workers');
check(/signSessionCookieValue/.test(authSource), 'Auth Worker must sign the session cookie');
check(/parseSessionCookieValue/.test(authSource + apiSource), 'Auth and API must verify the signed session cookie');
check(/HMAC-SHA256/.test(authPackage), 'The session signing algorithm must be documented in @nai/auth');
check(!/Stubs for OAuth functions/.test(authSource), 'OAuth callback must not use local persistence stubs');
for (const functionName of ['findOAuthAccount', 'createOAuthAccount', 'findUserByEmailVerified']) {
  check(new RegExp(`export async function ${functionName}`).test(authDb), `D1 OAuth implementation missing: ${functionName}`);
  check(new RegExp(`\\b${functionName},`).test(authSource), `Auth Worker must import D1 OAuth implementation: ${functionName}`);
}

for (const [name, wrangler] of [['auth', authWrangler], ['api', apiWrangler]]) {
  check(wrangler.includes(inventory.productionAccountId), `${name} Worker must target the locked production account`);
  const service = inventory.services[name];
  const secretNames = [
    ...(service.requiredCore ?? []),
    ...(service.requiredOAuth ?? []),
    ...(service.emailAnyOf ?? []),
    ...(service.aiAnyOf ?? []),
    ...((service.commerceAnyCompleteGroup ?? []).flat()),
    ...(service.unusedOrForbidden ?? []),
  ];
  for (const secretName of secretNames) {
    check(!new RegExp(`"${secretName}"\\s*:`).test(wrangler), `${secretName} must not be stored in ${name} wrangler vars`);
  }
}

check(
  /github\.event_name == 'workflow_dispatch'/.test(deployWorkflow) && /inputs\.deploy_production/.test(deployWorkflow),
  'Production deploy jobs must require an explicit workflow_dispatch approval input',
);
check(
  (deployWorkflow.match(/environment: production/g) ?? []).length === 6,
  'All six production deploy jobs must use the protected production environment',
);
check(
  deployWorkflow.includes('Secret governance audit'),
  'Deploy verification job must execute the secret-governance audit',
);
check(/exit-code:\s*1/.test(securityWorkflow), 'Trivy must fail CI on HIGH/CRITICAL findings');
check(/--fail-on\s+high/.test(securityWorkflow), 'Grype must fail CI on HIGH/CRITICAL findings (--fail-on high)');

const requiredDocs = [
  'docs/deployment/SECRET_ROTATION_RUNBOOK.md',
  'docs/governance/JWT_SECRET_AND_A_TO_Z_NGUYENAI_NET_2026-07-11.md',
  'docs/governance/JWT_SECRET_A_TO_Z_QA_AUDIT_AND_REMEDIATION_PLAN_2026-07-15.md',
];
for (const file of requiredDocs) check(fs.existsSync(path.join(ROOT, file)), `Required secret governance document missing: ${file}`);

if (failures.length) {
  console.error('SECRET GOVERNANCE AUDIT FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('SECRET GOVERNANCE AUDIT PASSED');
console.log('- Auth model: D1 opaque session + AUTH_SECRET HMAC cookie');
console.log('- JWT_SECRET has no runtime consumer');
console.log('- Worker configs contain no governed secret values');
console.log('- Production deploy requires explicit manual approval input');
