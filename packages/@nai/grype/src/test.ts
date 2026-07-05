/**
 * @nai/grype — unit tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGE_INFO, isGrypeInstalled, summarizeVulns, passesCIGate, type GrypeReport } from './index.js';

describe('@nai/grype', () => {
  it('PACKAGE_INFO has correct tool name', () => {
    assert.equal(PACKAGE_INFO.tool, 'grype');
    assert.equal(PACKAGE_INFO.name, '@nai/grype');
  });

  it('isGrypeInstalled returns boolean', () => {
    assert.equal(typeof isGrypeInstalled(), 'boolean');
  });

  it('summarizeVulns counts by severity', () => {
    const report: GrypeReport = {
      matches: [
        { vulnerability: { id: 'CVE-1', severity: 'Critical', package: { name: 'a', version: '1', type: 'npm', location: 'pkg.json' }, artifact: { name: 'app', version: '0.1', type: 'npm' }, fix: { versions: ['1.1'], state: 'fixed' }, description: '' }, relatedVulnerabilities: [], matchDetails: {} },
        { vulnerability: { id: 'CVE-2', severity: 'High', package: { name: 'b', version: '2', type: 'npm', location: 'pkg.json' }, artifact: { name: 'app', version: '0.1', type: 'npm' }, fix: { versions: [], state: '' }, description: '' }, relatedVulnerabilities: [], matchDetails: {} },
        { vulnerability: { id: 'CVE-3', severity: 'Critical', package: { name: 'c', version: '3', type: 'npm', location: 'pkg.json' }, artifact: { name: 'app', version: '0.1', type: 'npm' }, fix: { versions: ['3.1'], state: 'fixed' }, description: '' }, relatedVulnerabilities: [], matchDetails: {} },
      ],
      source: { target: { userInput: '.', imageID: '' } },
      ignoredMatches: [],
    };
    const s = summarizeVulns(report);
    assert.equal(s.total, 3);
    assert.equal(s.bySeverity.Critical, 2);
    assert.equal(s.bySeverity.High, 1);
    assert.equal(s.critical.length, 2);
  });

  it('passesCIGate fails on Critical', () => {
    const report: GrypeReport = {
      matches: [{ vulnerability: { id: 'CVE-1', severity: 'Critical', package: { name: 'a', version: '1', type: 'npm', location: 'pkg.json' }, artifact: { name: 'app', version: '0.1', type: 'npm' }, fix: { versions: [], state: '' }, description: '' }, relatedVulnerabilities: [], matchDetails: {} }],
      source: { target: { userInput: '.', imageID: '' } },
      ignoredMatches: [],
    };
    assert.equal(passesCIGate(report), false);
  });

  it('passesCIGate passes with only High', () => {
    const report: GrypeReport = {
      matches: [{ vulnerability: { id: 'CVE-2', severity: 'High', package: { name: 'b', version: '2', type: 'npm', location: 'pkg.json' }, artifact: { name: 'app', version: '0.1', type: 'npm' }, fix: { versions: [], state: '' }, description: '' }, relatedVulnerabilities: [], matchDetails: {} }],
      source: { target: { userInput: '.', imageID: '' } },
      ignoredMatches: [],
    };
    assert.equal(passesCIGate(report), true);
  });
});

console.log('=== @nai/grype tests ===');
