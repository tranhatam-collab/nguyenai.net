/**
 * @nai/sast — Semgrep integration for Nguyen AI monorepo
 *
 * P1-E.1: Static Application Security Testing (SAST) CI gate.
 * Original source: https://github.com/returntocorp/semgrep
 * License: LGPL-2.1
 */

import { execSync } from 'node:child_process';

export const PACKAGE_INFO = {
  name: '@nai/sast',
  upstream: 'https://github.com/returntocorp/semgrep',
  tool: 'semgrep',
  language: 'ocaml',
  license: 'LGPL-2.1',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

export type SemgrepSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface SemgrepFinding {
  check_id: string;
  path: string;
  start: { line: number; col: number };
  end: { line: number; col: number };
  extra: {
    message: string;
    severity: SemgrepSeverity;
    metadata: Record<string, unknown>;
    lines: string;
  };
}

export interface SemgrepReport {
  results: SemgrepFinding[];
  errors: string[];
  paths: { scanned: string[] };
  skipped_rules: string[];
}

export interface SemgrepScanOptions {
  config?: string;
  target?: string;
  json?: boolean;
  outputFile?: string;
}

export function isSemgrepInstalled(): boolean {
  try { execSync('semgrep --version', { stdio: 'pipe' }); return true; } catch { return false; }
}

export function scan(opts: SemgrepScanOptions = {}): SemgrepReport {
  const { config = '.semgrep.yml', target = '.', json = true, outputFile } = opts;
  if (!isSemgrepInstalled()) throw new Error('semgrep not installed — pip install semgrep');
  const formatFlag = json ? '--json' : '--text';
  const outputFlag = outputFile ? `--output ${outputFile}` : '';
  try {
    const stdout = execSync(`semgrep ci --config ${config} ${formatFlag} ${outputFlag} ${target}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (json) return JSON.parse(stdout) as SemgrepReport;
    return { results: [], errors: [], paths: { scanned: [] }, skipped_rules: [] };
  } catch (err) {
    const output = (err as { stdout?: string }).stdout ?? '';
    if (output && json) { try { return JSON.parse(output) as SemgrepReport; } catch { /* */ } }
    throw new Error(`semgrep scan failed: ${err}`);
  }
}

export function summarizeFindings(report: SemgrepReport): {
  total: number;
  bySeverity: Record<SemgrepSeverity, number>;
  byRule: Record<string, number>;
} {
  const bySeverity: Record<SemgrepSeverity, number> = { ERROR: 0, WARNING: 0, INFO: 0 };
  const byRule: Record<string, number> = {};
  for (const f of report.results) {
    bySeverity[f.extra.severity] = (bySeverity[f.extra.severity] ?? 0) + 1;
    byRule[f.check_id] = (byRule[f.check_id] ?? 0) + 1;
  }
  return { total: report.results.length, bySeverity, byRule };
}

export function passesCIGate(report: SemgrepReport): boolean {
  return summarizeFindings(report).bySeverity.ERROR === 0;
}

export function formatReport(report: SemgrepReport): string {
  const s = summarizeFindings(report);
  const lines = [
    '=== Semgrep SAST Report ===',
    `Total findings: ${s.total}`,
    `  ERROR:   ${s.bySeverity.ERROR}`,
    `  WARNING: ${s.bySeverity.WARNING}`,
    `  INFO:    ${s.bySeverity.INFO}`,
    '',
  ];
  for (const f of report.results) {
    lines.push(`[${f.extra.severity}] ${f.check_id}`);
    lines.push(`  ${f.path}:${f.start.line}:${f.start.col}`);
    lines.push(`  ${f.extra.message}`);
    lines.push('');
  }
  return lines.join('\n');
}
