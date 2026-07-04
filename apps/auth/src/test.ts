/**
 * @nai/auth-worker — smoke test (verifies module loads + basic exports).
 */
let passed = 0, failed = 0;
const steps: string[] = [];
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  ✓ ${msg}`); }
  else { failed++; steps.push(`  ✗ ${msg}`); console.error(`  ✗ ${msg}`); }
}

async function main(): Promise<void> {
  // Auth worker is a Cloudflare Worker — we verify the source loads and
  // exports the expected handlers without throwing.
  const mod = await import('./index.ts');
  assert(typeof mod === 'object', 'auth module loads');
  assert(mod.default !== undefined || typeof mod.fetch === 'function', 'exports default handler or fetch');

  console.log('\n@nai/auth-worker test');
  console.log('----------------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
