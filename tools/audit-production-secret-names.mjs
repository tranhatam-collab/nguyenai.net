#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/secret-governance.json'), 'utf8'));
const failures = [];

function listSecretNames(serviceName, service) {
  const result = spawnSync('pnpm', ['exec', 'wrangler', 'secret', 'list'], {
    cwd: path.join(ROOT, service.directory),
    encoding: 'utf8',
    env: {
      ...process.env,
      CLOUDFLARE_ACCOUNT_ID: inventory.productionAccountId,
      WRANGLER_LOG_PATH: path.join(os.tmpdir(), `nguyenai-wrangler-${serviceName}.log`),
    },
  });
  if (result.status !== 0) {
    failures.push(`${serviceName}: unable to list production secret names`);
    return new Set();
  }
  try {
    return new Set(JSON.parse(result.stdout).map((item) => item.name));
  } catch {
    failures.push(`${serviceName}: Wrangler returned invalid JSON`);
    return new Set();
  }
}

function requireAll(serviceName, names, required, label) {
  const missing = required.filter((name) => !names.has(name));
  if (missing.length) failures.push(`${serviceName} ${label}: missing ${missing.join(', ')}`);
}

function requireAny(serviceName, names, choices, label) {
  if (!choices.some((name) => names.has(name))) failures.push(`${serviceName} ${label}: none of ${choices.join(', ')} is configured`);
}

for (const [serviceName, service] of Object.entries(inventory.services)) {
  const names = listSecretNames(serviceName, service);
  requireAll(serviceName, names, service.requiredCore ?? [], 'core');
  requireAll(serviceName, names, service.requiredOAuth ?? [], 'OAuth');
  requireAny(serviceName, names, service.emailAnyOf ?? [], 'email');
  if (service.aiAnyOf) requireAny(serviceName, names, service.aiAnyOf, 'AI provider');
  if (service.commerceAnyCompleteGroup) {
    const complete = service.commerceAnyCompleteGroup.some((group) => group.every((name) => names.has(name)));
    if (!complete) failures.push(`${serviceName} commerce: no complete payment secret group is configured`);
  }
  for (const forbidden of service.unusedOrForbidden ?? []) {
    if (names.has(forbidden)) failures.push(`${serviceName}: unused/forbidden secret ${forbidden} is still configured`);
  }
  console.log(`${serviceName}: ${[...names].sort().join(', ') || '(none)'}`);
}

if (failures.length) {
  console.error('\nPRODUCTION SECRET-NAME AUDIT FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nPRODUCTION SECRET-NAME AUDIT PASSED');
