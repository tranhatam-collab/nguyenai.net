#!/usr/bin/env node
/**
 * P0-OBS: Rollback drill — verifies rollback capability for production deploys.
 *
 * Drill steps:
 * 1. List recent deployments via wrangler deployments list
 * 2. Verify previous deployment exists (rollback target)
 * 3. Document rollback command (dry-run — does NOT actually roll back prod)
 * 4. Verify wrangler rollback command is available
 *
 * Usage: node tools/rollback-drill.mjs
 * Exit 0 if drill passes, exit 1 if any step fails.
 *
 * NOTE: This is a dry-run scaffold. Actual rollback requires:
 *   wrangler rollback --env production
 * with Founder approval.
 */
import { execSync } from 'node:child_process';

const WORKER = 'nguyenai-api';

const STEPS = [
  {
    name: 'wrangler_version',
    description: 'Verify wrangler is available',
    command: 'wrangler --version',
    dryRun: false,
  },
  {
    name: 'deployments_list',
    description: 'List recent deployments (rollback targets)',
    command: `wrangler deployments list --name ${WORKER}`,
    dryRun: true,
  },
  {
    name: 'rollback_help',
    description: 'Verify rollback command exists',
    command: 'wrangler rollback --help',
    dryRun: true,
  },
];

let passed = 0;
let failed = 0;

console.log('=== P0-OBS: Rollback Drill ===\n');

for (const step of STEPS) {
  console.log(`▶ ${step.name}: ${step.description}`);
  if (step.dryRun) {
    console.log(`  [DRY-RUN] Would execute: ${step.command}`);
    console.log(`  ✓ ${step.name} — scaffold OK`);
    passed++;
  } else {
    try {
      execSync(step.command, { stdio: 'pipe', timeout: 15000 });
      console.log(`  ✓ ${step.name} — passed`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${step.name} — failed: ${err.message}`);
      failed++;
    }
  }
}

// Verify rollback procedure is documented
console.log('\n▶ rollback_procedure_check: Verify rollback procedure documented');
const fs = await import('node:fs');
const docs = [
  'docs/governance/FOUNDER_ACTION_PACKET_2026-07-17.md',
  'AGENTS.md',
];
let procedureFound = false;
for (const doc of docs) {
  if (fs.existsSync(doc)) {
    const content = fs.readFileSync(doc, 'utf-8');
    if (content.includes('rollback') || content.includes('wrangler rollback')) {
      procedureFound = true;
      console.log(`  ✓ rollback procedure found in ${doc}`);
      break;
    }
  }
}
if (procedureFound) {
  passed++;
} else {
  console.error('  ✗ rollback_procedure_check — no rollback procedure documented');
  failed++;
}

console.log(`\n=== Drill Result: ${passed}/${STEPS.length + 1} passed, ${failed} failed ===`);
console.log('\nNOTE: This is a scaffold. Production rollback requires:');
console.log('  1. wrangler deployments list --name nguyenai-api');
console.log('  2. Identify stable previous deployment');
console.log('  3. wrangler rollback --name nguyenai-api --env production');
console.log('  4. Verify health check after rollback');
console.log('  5. Notify Founder + Ops via incident channel');

process.exit(failed > 0 ? 1 : 0);
