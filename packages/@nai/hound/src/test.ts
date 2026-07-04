/**
 * @nai/hound — unit tests.
 * Run via `pnpm --filter @nai/hound test`.
 */

import {
  scanDependencies,
  parsePackageJson,
  parseLockfile,
  severityScore,
  filterBySeverity,
  generateReport,
  type Vulnerability,
  type Dependency,
  type AdvisoryDb,
} from './index.ts';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) {
    passed++;
    steps.push(`  \u2713 ${msg}`);
  } else {
    failed++;
    steps.push(`  \u2717 ${msg}`);
    console.error(`  \u2717 ${msg}`);
  }
}

async function main(): Promise<void> {
  // --- Build a test advisory DB ---
  const advisoryDb: AdvisoryDb = new Map();
  const lodashVuln: Vulnerability = {
    id: 'CVE-2021-23337',
    package: 'lodash',
    version: '4.17.20',
    severity: 'high',
    title: 'Command Injection in lodash',
    description: 'lodash vulnerable to command injection',
    patchedVersion: '4.17.21',
    url: 'https://nvd.nist.gov/vuln/detail/CVE-2021-23337',
  };
  const lodashVuln2: Vulnerability = {
    id: 'CVE-2020-8203',
    package: 'lodash',
    version: '4.17.15',
    severity: 'medium',
    title: 'Prototype Pollution in lodash',
    description: 'lodash vulnerable to prototype pollution',
    patchedVersion: '4.17.20',
  };
  const expressVuln: Vulnerability = {
    id: 'CVE-2022-24999',
    package: 'express',
    version: '4.17.0',
    severity: 'high',
    title: 'Express qs prototype pollution',
    description: 'express vulnerable via qs',
    patchedVersion: '4.17.3',
  };
  advisoryDb.set('lodash', [lodashVuln, lodashVuln2]);
  advisoryDb.set('express', [expressVuln]);

  // --- scanDependencies ---
  {
    console.log('Test: scanDependencies finds vulnerable lodash');
    const deps: Dependency[] = [
      { name: 'lodash', version: '4.17.15', type: 'prod' },
    ];
    const results = scanDependencies(deps, advisoryDb);
    assert(results.length === 2, 'lodash 4.17.15 matches both advisories');
    assert(
      results.some((r) => r.id === 'CVE-2021-23337'),
      'CVE-2021-23337 found for lodash 4.17.15',
    );
    assert(
      results.some((r) => r.id === 'CVE-2020-8203'),
      'CVE-2020-8203 found for lodash 4.17.15',
    );
  }

  {
    console.log('Test: scanDependencies with patched version');
    const deps: Dependency[] = [
      { name: 'lodash', version: '4.17.21', type: 'prod' },
    ];
    const results = scanDependencies(deps, advisoryDb);
    assert(results.length === 0, 'lodash 4.17.21 is patched, no vulns');
  }

  {
    console.log('Test: scanDependencies with no advisory');
    const deps: Dependency[] = [
      { name: 'react', version: '18.0.0', type: 'prod' },
    ];
    const results = scanDependencies(deps, advisoryDb);
    assert(results.length === 0, 'unknown package has no vulns');
  }

  {
    console.log('Test: scanDependencies multiple packages');
    const deps: Dependency[] = [
      { name: 'lodash', version: '4.17.15', type: 'prod' },
      { name: 'express', version: '4.17.0', type: 'prod' },
      { name: 'react', version: '18.0.0', type: 'prod' },
    ];
    const results = scanDependencies(deps, advisoryDb);
    assert(results.length === 3, '3 vulns found across lodash + express');
  }

  // --- parsePackageJson ---
  {
    console.log('Test: parsePackageJson');
    const content = JSON.stringify({
      dependencies: { lodash: '^4.17.15', express: '~4.17.0' },
      devDependencies: { jest: '^29.0.0' },
    });
    const deps = parsePackageJson(content);
    assert(deps.length === 3, 'parses 3 dependencies');
    assert(
      deps.filter((d) => d.type === 'prod').length === 2,
      '2 prod dependencies',
    );
    assert(
      deps.filter((d) => d.type === 'dev').length === 1,
      '1 dev dependency',
    );
    const lodash = deps.find((d) => d.name === 'lodash');
    assert(!!lodash, 'lodash dep found');
    assert(lodash?.version === '^4.17.15', 'lodash version preserved with range');
  }

  {
    console.log('Test: parsePackageJson empty');
    const deps = parsePackageJson('{}');
    assert(deps.length === 0, 'empty package.json yields no deps');
  }

  // --- parseLockfile ---
  {
    console.log('Test: parseLockfile npm v1 format');
    const content = [
      'lockfileVersion: 1',
      '',
      '"lodash@4.17.15":',
      '  version: "4.17.15"',
      '',
      '"express@4.17.0":',
      '  version: "4.17.0"',
    ].join('\n');
    const deps = parseLockfile(content);
    assert(deps.length === 2, 'parses 2 lockfile entries');
    assert(
      !!deps.find((d) => d.name === 'lodash' && d.version === '4.17.15'),
      'lodash@4.17.15 parsed from lockfile',
    );
  }

  {
    console.log('Test: parseLockfile pnpm format');
    const content = [
      'lockfileVersion: 6.0',
      '',
      'lodash@4.17.15:',
      '  resolution: ...',
      '',
      'express@4.17.0:',
      '  resolution: ...',
    ].join('\n');
    const deps = parseLockfile(content);
    assert(deps.length === 2, 'parses 2 pnpm lockfile entries');
    assert(
      !!deps.find((d) => d.name === 'express' && d.version === '4.17.0'),
      'express@4.17.0 parsed from pnpm lockfile',
    );
  }

  // --- severityScore ---
  {
    console.log('Test: severityScore');
    assert(severityScore({ ...expressVuln, severity: 'critical' }) === 10, 'critical score is 10');
    assert(severityScore({ ...expressVuln, severity: 'high' }) === 8, 'high score is 8');
    assert(severityScore({ ...expressVuln, severity: 'medium' }) === 5, 'medium score is 5');
    assert(severityScore({ ...expressVuln, severity: 'low' }) === 2, 'low score is 2');
    assert(severityScore({ ...expressVuln, severity: 'info' }) === 0, 'info score is 0');
  }

  // --- filterBySeverity ---
  {
    console.log('Test: filterBySeverity');
    const vulns: Vulnerability[] = [
      { ...lodashVuln, severity: 'critical' },
      { ...lodashVuln2, severity: 'high' },
      { ...expressVuln, severity: 'medium' },
      { ...expressVuln, severity: 'low' },
    ];
    const highOrAbove = filterBySeverity(vulns, 'high');
    assert(highOrAbove.length === 2, 'filter high+ yields 2 results');
    const mediumOrAbove = filterBySeverity(vulns, 'medium');
    assert(mediumOrAbove.length === 3, 'filter medium+ yields 3 results');
    const all = filterBySeverity(vulns, 'info');
    assert(all.length === 4, 'filter info+ yields all 4 results');
  }

  // --- generateReport ---
  {
    console.log('Test: generateReport empty');
    const report = generateReport([]);
    assert(report === 'No vulnerabilities found.', 'empty report correct');
  }

  {
    console.log('Test: generateReport with vulns');
    const vulns: Vulnerability[] = [
      lodashVuln,
      lodashVuln2,
      expressVuln,
    ];
    const report = generateReport(vulns);
    assert(report.includes('3 vulnerability(ies)'), 'report includes count');
    assert(report.includes('CVE-2021-23337'), 'report includes CVE id');
    assert(report.includes('lodash@4.17.20'), 'report includes package@version');
    assert(report.includes('patched in: 4.17.21'), 'report includes patched version');
    // High should appear before medium (sorted by severity desc)
    const highIdx = report.indexOf('HIGH');
    const mediumIdx = report.indexOf('MEDIUM');
    assert(highIdx > -1 && highIdx < mediumIdx, 'high sorted before medium');
  }

  // Print steps
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
