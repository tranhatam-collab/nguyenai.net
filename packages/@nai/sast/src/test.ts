/**
 * @nai/sast — unit tests
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGE_INFO, isSemgrepInstalled, summarizeFindings, passesCIGate, type SemgrepReport } from './index.js';

describe('@nai/sast', () => {
  it('PACKAGE_INFO has correct tool name', () => {
    assert.equal(PACKAGE_INFO.tool, 'semgrep');
    assert.equal(PACKAGE_INFO.name, '@nai/sast');
  });

  it('isSemgrepInstalled returns boolean', () => {
    assert.equal(typeof isSemgrepInstalled(), 'boolean');
  });

  it('summarizeFindings counts by severity', () => {
    const report: SemgrepReport = {
      results: [
        { check_id: 'no-eval', path: 'a.ts', start: { line: 1, col: 1 }, end: { line: 1, col: 10 }, extra: { message: 'eval', severity: 'ERROR', metadata: {}, lines: 'eval(x)' } },
        { check_id: 'no-eval', path: 'b.ts', start: { line: 2, col: 1 }, end: { line: 2, col: 10 }, extra: { message: 'eval', severity: 'ERROR', metadata: {}, lines: 'eval(y)' } },
        { check_id: 'no-cors', path: 'c.ts', start: { line: 3, col: 1 }, end: { line: 3, col: 10 }, extra: { message: 'cors', severity: 'WARNING', metadata: {}, lines: 'cors(*)' } },
      ],
      errors: [], paths: { scanned: ['a.ts', 'b.ts', 'c.ts'] }, skipped_rules: [],
    };
    const s = summarizeFindings(report);
    assert.equal(s.total, 3);
    assert.equal(s.bySeverity.ERROR, 2);
    assert.equal(s.bySeverity.WARNING, 1);
    assert.equal(s.byRule['no-eval'], 2);
  });

  it('passesCIGate fails on ERROR', () => {
    const report: SemgrepReport = {
      results: [{ check_id: 'x', path: 'a', start: { line: 1, col: 1 }, end: { line: 1, col: 1 }, extra: { message: '', severity: 'ERROR', metadata: {}, lines: '' } }],
      errors: [], paths: { scanned: [] }, skipped_rules: [],
    };
    assert.equal(passesCIGate(report), false);
  });

  it('passesCIGate passes with only WARNING', () => {
    const report: SemgrepReport = {
      results: [{ check_id: 'x', path: 'a', start: { line: 1, col: 1 }, end: { line: 1, col: 1 }, extra: { message: '', severity: 'WARNING', metadata: {}, lines: '' } }],
      errors: [], paths: { scanned: [] }, skipped_rules: [],
    };
    assert.equal(passesCIGate(report), true);
  });
});

console.log('=== @nai/sast tests ===');
