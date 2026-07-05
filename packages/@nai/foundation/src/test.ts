import { PACKAGE_INFO } from './index';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

console.log(`\n=== ${PACKAGE_INFO.name} smoke test ===`);

assert(typeof PACKAGE_INFO.name === 'string', 'PACKAGE_INFO.name is string');
assert(typeof PACKAGE_INFO.upstream === 'string', 'PACKAGE_INFO.upstream is string');
assert(PACKAGE_INFO.upstream.startsWith('https://'), 'PACKAGE_INFO.upstream is https URL');
assert(typeof PACKAGE_INFO.license === 'string', 'PACKAGE_INFO.license is string');

console.log(`\nPassed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error('❌ TESTS FAILED');
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED');
}
