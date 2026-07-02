/**
 * Migration validator — checks SQL syntax structure without needing a live DB.
 * Run via `pnpm --filter @nai/migrations test`.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..');

let errors: string[] = [];

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  errors.push('No migration files found');
}

for (const file of files) {
  const content = readFileSync(join(migrationsDir, file), 'utf-8');

  // Check BEGIN/COMMIT wrapping
  if (!content.includes('BEGIN;') || !content.includes('COMMIT;')) {
    errors.push(`${file}: must be wrapped in BEGIN; ... COMMIT;`);
  }

  // Check for forbidden patterns
  if (/\bDROP\s+TABLE\s+(?!IF\s+EXISTS)/i.test(content)) {
    errors.push(`${file}: DROP TABLE without IF EXISTS is forbidden`);
  }

  // Check audit_log has append-only triggers
  if (file === '001_identity_access.sql') {
    if (!content.includes('prevent_audit_modify')) {
      errors.push(`${file}: audit_log must have append-only trigger`);
    }
    if (!content.includes('no_update_audit') || !content.includes('no_delete_audit')) {
      errors.push(`${file}: audit_log must have no_update and no_delete triggers`);
    }
  }

  // Check for required tables per RFC
  const requiredTables = [
    'users', 'organizations', 'memberships', 'sessions',
    'entitlements', 'audit_log', 'oauth_accounts', 'mfa_factors',
    'api_keys', 'approvals', 'usage_events'
  ];
  for (const table of requiredTables) {
    if (!new RegExp(`CREATE TABLE(?:\\s+IF NOT EXISTS)?\\s+${table}\\b`, 'i').test(content)) {
      errors.push(`${file}: missing required table "${table}"`);
    }
  }

  // Check roles match RFC §3
  const requiredRoles = [
    'USER', 'MEMBER', 'STUDENT', 'FOUNDER', 'BUSINESS_MEMBER',
    'CHAPTER_MEMBER', 'INVESTOR_APPLICANT', 'QUALIFIED_INVESTOR',
    'DATA_ROOM_MEMBER', 'REVIEWER', 'OPERATOR', 'ADMIN', 'SUPER_ADMIN'
  ];
  for (const role of requiredRoles) {
    if (!content.includes(`'${role}'`)) {
      errors.push(`${file}: missing required role "${role}" in memberships CHECK`);
    }
  }
}

if (errors.length > 0) {
  console.error('❌ Migration validation FAILED:');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
} else {
  console.log(`✅ Migration validation PASSED — ${files.length} file(s), all required tables and roles present, audit_log append-only enforced`);
}
