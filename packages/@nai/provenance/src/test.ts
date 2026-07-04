/**
 * @nai/provenance — unit tests.
 * Run via `pnpm --filter @nai/provenance test`.
 */

import {
  generateSbom,
  addComponent,
  findComponent,
  listComponents,
  exportSbomJson,
  exportSbomSpdx,
  exportSbomCycloneDx,
  validateSbom,
  compareSboms,
  uuid,
  type SbomComponent,
  type Sbom,
} from './index.ts';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    steps.push(`  ✓ ${msg}`);
  } else {
    failed++;
    steps.push(`  ✗ ${msg}`);
    console.error(`  ✗ ${msg}`);
  }
}

async function main() {
  console.log('\n@nai/provenance test');
  console.log('--------------------');

  // --- Fixtures ---
  const compA: SbomComponent = {
    name: 'lodash',
    version: '4.17.21',
    type: 'library',
    license: 'MIT',
    supplier: 'Lodash',
    checksum: 'abcdef0123456789',
  };
  const compB: SbomComponent = {
    name: 'react',
    version: '18.2.0',
    type: 'framework',
    license: 'MIT',
  };
  const compC: SbomComponent = {
    name: 'my-app',
    version: '1.0.0',
    type: 'application',
    license: 'Apache-2.0',
  };

  // --- 1. UUID generation ---
  const id1 = uuid();
  const id2 = uuid();
  assert(id1 !== id2, 'uuid() produces unique identifiers');
  assert(/^[0-9a-f-]{36}$/.test(id1), 'uuid() returns a 36-char UUID string');

  // --- 2. generateSbom ---
  const sbom = generateSbom('my-app', '1.0.0', [compA, compB]);
  assert(typeof sbom.id === 'string' && sbom.id.length > 0, 'generateSbom sets a non-empty id');
  assert(sbom.name === 'my-app', 'generateSbom preserves the name');
  assert(sbom.version === '1.0.0', 'generateSbom preserves the version');
  assert(sbom.components.length === 2, 'generateSbom includes all provided components');
  assert(sbom.generator === '@nai/provenance', 'generateSbom sets the generator');
  assert(/\d{4}-\d{2}-\d{2}T/.test(sbom.generatedAt), 'generateSbom sets an ISO generatedAt timestamp');

  // --- 3. Immutability of generateSbom input ---
  const originalInput: SbomComponent[] = [{ ...compA }];
  const sbomFromInput = generateSbom('x', '0.0.1', originalInput);
  originalInput[0].name = 'mutated';
  assert(sbomFromInput.components[0].name === 'lodash', 'generateSbom does not mutate caller arrays');

  // --- 4. addComponent ---
  const sbomWithC = addComponent(sbom, compC);
  assert(sbomWithC.components.length === 3, 'addComponent appends a component');
  assert(sbom.components.length === 2, 'addComponent does not mutate the original SBOM');
  assert(sbomWithC.components[2].name === 'my-app', 'addComponent preserves the added component name');

  // --- 5. findComponent ---
  const found = findComponent(sbom, 'react');
  const notFound = findComponent(sbom, 'nonexistent');
  assert(found !== null && found.name === 'react', 'findComponent returns the matching component');
  assert(notFound === null, 'findComponent returns null when no match exists');

  // --- 6. listComponents ---
  const listed = listComponents(sbom);
  assert(listed.length === 2, 'listComponents returns all components');
  listed[0].name = 'tampered';
  assert(sbom.components[0].name === 'lodash', 'listComponents returns a defensive copy');

  // --- 7. exportSbomJson ---
  const json = exportSbomJson(sbom);
  const parsed = JSON.parse(json) as Sbom;
  assert(parsed.name === 'my-app', 'exportSbomJson produces valid JSON with the SBOM name');
  assert(parsed.components.length === 2, 'exportSbomJson preserves all components');

  // --- 8. exportSbomSpdx ---
  const spdx = exportSbomSpdx(sbom);
  assert(spdx.includes('SPDXVersion: SPDX-2.3'), 'exportSbomSpdx emits the SPDX 2.3 version header');
  assert(spdx.includes('PackageName: lodash'), 'exportSbomSpdx includes component names');
  assert(spdx.includes('PackageLicenseConcluded: MIT'), 'exportSbomSpdx includes license info');
  assert(spdx.includes('SPDXRef-DOCUMENT'), 'exportSbomSpdx includes the document SPDXID');

  // --- 9. exportSbomCycloneDx ---
  const cdx = exportSbomCycloneDx(sbom);
  const cdxParsed = JSON.parse(cdx) as { bomFormat: string; specVersion: string; components: unknown[] };
  assert(cdxParsed.bomFormat === 'CycloneDX', 'exportSbomCycloneDx sets bomFormat to CycloneDX');
  assert(cdxParsed.specVersion === '1.5', 'exportSbomCycloneDx targets spec version 1.5');
  assert(Array.isArray(cdxParsed.components) && cdxParsed.components.length === 2, 'exportSbomCycloneDx includes all components');

  // --- 10. validateSbom — valid case ---
  const validErrors = validateSbom(sbom);
  assert(validErrors.length === 0, 'validateSbom returns no errors for a valid SBOM');

  // --- 11. validateSbom — invalid cases ---
  const badSbom: Sbom = {
    id: '',
    name: '',
    version: '',
    components: [
      { name: 'dup', version: '1.0.0', type: 'library', license: 'MIT' },
      { name: 'dup', version: '2.0.0', type: 'library', license: 'MIT' },
      { name: 'bad', version: '', type: ('invalid' as unknown) as SbomComponent['type'], license: '' },
    ],
    generatedAt: '',
    generator: '',
  };
  const badErrors = validateSbom(badSbom);
  assert(badErrors.length > 0, 'validateSbom reports errors for an invalid SBOM');
  assert(badErrors.some((e) => e.includes('id')), 'validateSbom flags a missing id');
  assert(badErrors.some((e) => e.toLowerCase().includes('duplicate')), 'validateSbom flags duplicate component names');
  assert(badErrors.some((e) => e.includes('invalid type')), 'validateSbom flags an invalid component type');

  // --- 12. compareSboms — added / removed / changed ---
  const sbomA = generateSbom('app', '1.0.0', [
    { name: 'kept', version: '1.0.0', type: 'library', license: 'MIT' },
    { name: 'removed', version: '1.0.0', type: 'library', license: 'MIT' },
    { name: 'changed', version: '1.0.0', type: 'library', license: 'MIT' },
  ]);
  const sbomB = generateSbom('app', '2.0.0', [
    { name: 'kept', version: '1.0.0', type: 'library', license: 'MIT' },
    { name: 'added', version: '2.0.0', type: 'framework', license: 'Apache-2.0' },
    { name: 'changed', version: '2.0.0', type: 'library', license: 'MIT' },
  ]);
  const diff = compareSboms(sbomA, sbomB);
  assert(diff.added.length === 1 && diff.added[0].name === 'added', 'compareSboms detects added components');
  assert(diff.removed.length === 1 && diff.removed[0].name === 'removed', 'compareSboms detects removed components');
  assert(diff.changed.length === 1 && diff.changed[0].name === 'changed', 'compareSboms detects changed components');
  assert(diff.changed[0].from.version === '1.0.0' && diff.changed[0].to.version === '2.0.0', 'compareSboms records from/to versions for changed components');

  // --- 13. compareSboms — identical SBOMs ---
  const identical = compareSboms(sbomA, sbomA);
  assert(identical.added.length === 0 && identical.removed.length === 0 && identical.changed.length === 0, 'compareSboms reports no diff for identical SBOMs');

  // --- 14. SPDX includes supplier when present ---
  const spdxWithSupplier = exportSbomSpdx(sbom);
  assert(spdxWithSupplier.includes('PackageSupplier: Organization: Lodash'), 'exportSbomSpdx includes supplier when provided');

  // --- 15. CycloneDX includes checksum hashes when present ---
  const cdxWithChecksum = JSON.parse(exportSbomCycloneDx(sbom)) as {
    components: { name: string; hashes?: { alg: string; content: string }[] }[];
  };
  const lodashCdx = cdxWithChecksum.components.find((c) => c.name === 'lodash');
  assert(
    !!lodashCdx && Array.isArray(lodashCdx.hashes) && lodashCdx.hashes[0].alg === 'SHA-256',
    'exportSbomCycloneDx includes SHA-256 hashes when a checksum is provided',
  );

  // --- 16. addComponent does not mutate the added component ---
  const toAdd: SbomComponent = { name: 'fresh', version: '0.1.0', type: 'module', license: 'BSD-2-Clause' };
  const sbomFresh = addComponent(sbom, toAdd);
  toAdd.version = '9.9.9';
  assert(sbomFresh.components[sbomFresh.components.length - 1].version === '0.1.0', 'addComponent copies the component defensively');

  // --- Output ---
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
