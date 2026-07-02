/**
 * Show migration status.
 * Usage: DATABASE_URL=postgres://... pnpm --filter @nai/migrations migrate:status
 */

import { Client } from 'pg';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log('DATABASE_URL not set — showing local files only:');
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const f of files) console.log(`  [pending] ${f}`);
    return;
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const { rows: applied } = await client.query('SELECT filename, applied_at FROM _migrations ORDER BY id');
  const appliedMap = new Map(applied.map((r) => [r.filename, r.applied_at]));

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (appliedMap.has(f)) {
      console.log(`  [applied ${appliedMap.get(f)}] ${f}`);
    } else {
      console.log(`  [pending] ${f}`);
    }
  }

  await client.end();
}

main().catch((err) => {
  console.error('❌ Status check failed:', err);
  process.exit(1);
});
