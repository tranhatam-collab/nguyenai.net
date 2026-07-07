#!/usr/bin/env node
/**
 * Security P0 BUILD/SOURCE audit.
 *
 * Verifies the 5 security P0 fixes are present in the codebase and that no
 * rendered HTML uses innerHTML with API data, no secret is committed, and
 * passkey routes are disabled.
 *
 * Usage: npx tsx tools/audit-security-p0.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', reset: '\x1b[0m' };
let errors = 0;

function check(label: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`${COLORS.green}✓${COLORS.reset} ${label}`);
  } else {
    errors++;
    console.log(`${COLORS.red}✗${COLORS.reset} ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function readFile(p: string): string {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
}

function main(): void {
  console.log('=== Security P0 audit ===\n');

  // SEC-P0-1: SQL injection — d1-store must use assertAllowedColumn, no raw toSnake in UPDATE.
  const d1store = readFile(path.join(ROOT, 'packages/@nai/scholarship/src/d1-store.ts'));
  check('SEC-P0-1: assertAllowedColumn defined', /function assertAllowedColumn/.test(d1store));
  check('SEC-P0-1: ALLOWED_COLUMNS whitelist present', /ALLOWED_COLUMNS/.test(d1store));
  check('SEC-P0-1: no raw `${toSnake(k)}` interpolation in UPDATE', !/\$\{toSnake\(k\)\} = \?/.test(d1store));

  // SEC-P0-2: passkey routes disabled (503).
  const auth = readFile(path.join(ROOT, 'apps/auth/src/index.ts'));
  const passkeyDisabled = /passkey.*disabled/i.test(auth) && /503/.test(auth);
  check('SEC-P0-2: passkey routes return 503', passkeyDisabled);
  check('SEC-P0-2: no TODO verify WebAuthn assertion signature', !/TODO: verify WebAuthn assertion signature/.test(auth));

  // SEC-P0-3: no EVIDENCE_SIGNING_KEY in wrangler.jsonc vars.
  const wrangler = readFile(path.join(ROOT, 'apps/api/wrangler.jsonc'));
  check('SEC-P0-3: no hardcoded EVIDENCE_SIGNING_KEY in wrangler.jsonc', !/EVIDENCE_SIGNING_KEY.*["'][a-z-]+["']\s*,/.test(wrangler) || !/"EVIDENCE_SIGNING_KEY"\s*:/.test(wrangler));
  check('SEC-P0-3: resolveEvidenceSigningKey helper present', /resolveEvidenceSigningKey/.test(readFile(path.join(ROOT, 'apps/api/src/index.ts'))));

  // SEC-P0-4: investor-routes requireAuth returns Response, handlers return it.
  const investor = readFile(path.join(ROOT, 'apps/api/src/investor-routes.ts'));
  check('SEC-P0-4: requireAuth returns Response on failure', /\| Response/.test(investor) && /return c\.json\(\{ error: 'unauthorized' \}, 401\)/.test(investor));
  check('SEC-P0-4: handlers return the Response (instanceof check)', /if \(session instanceof Response\) return session/.test(investor));
  check('SEC-P0-4: no bare `if (!session) return;`', !/if \(!session\) return;/.test(investor));

  // SEC-P0-5: verify.astro no innerHTML with API data.
  const verify = readFile(path.join(ROOT, 'apps/edu/src/pages/verify.astro'));
  check('SEC-P0-5: no innerHTML with API certificate data', !/result\.innerHTML\s*=\s*`[\s\S]*\$\{cert\./.test(verify) && !/result\.innerHTML\s*=\s*`[\s\S]*\$\{id\}/.test(verify));
  check('SEC-P0-5: uses textContent / DOM construction', /textContent|createElement/.test(verify));

  // Bonus: no committed secrets scan (grep for common secret patterns in source).
  const secretPattern = /(?:sk_live_|sk_test_|AKIA|ghp_|gho_|xox[baprs]-|-----BEGIN [A-Z]+ PRIVATE KEY-----)/;
  let secretHits = 0;
  function scanDir(dir: string): void {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.turbo') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scanDir(full);
      else if (/\.(ts|js|json|jsonc|astro|md)$/.test(entry.name)) {
        const c = readFile(full);
        if (secretPattern.test(c)) {
          // Ignore the audit script itself and docs that mention patterns as examples.
          if (full.endsWith('audit-security-p0.ts')) continue;
          secretHits++;
          console.log(`${COLORS.red}✗${COLORS.reset} possible committed secret in ${path.relative(ROOT, full)}`);
        }
      }
    }
  }
  scanDir(ROOT);
  check('No committed secrets detected in source', secretHits === 0, `${secretHits} possible secret(s) found`);

  console.log(`\n${errors === 0 ? COLORS.green + 'SECURITY P0 AUDIT PASSED' : COLORS.red + 'SECURITY P0 AUDIT FAILED'}${COLORS.reset}`);
  if (errors > 0) process.exit(1);
}

main();
