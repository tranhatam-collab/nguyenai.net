/**
 * @nai/grype — Grype integration for Nguyen AI monorepo
 *
 * P1-E.3: Vulnerability scanner CI gate.
 * Original source: https://github.com/anchore/grype
 * License: Apache-2.0
 */

import { execSync } from 'node:child_process';

export const PACKAGE_INFO = {
  name: '@nai/grype',
  upstream: 'https://github.com/anchore/grype',
  tool: 'grype',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

export type GrypeSeverity = 'Unknown' | 'Negligible' | 'Low' | 'Medium' | 'High' | 'Critical';

export interface GrypeVulnerability {
  id: string;
  severity: GrypeSeverity;
  package: { name: string; version: string; type: string; location: string };
  artifact: { name: string; version: string; type: string };
  fix: { versions: string[]; state: string };
  description: string;
}

export interface GrypeMatch {
  vulnerability: GrypeVulnerability;
  relatedVulnerabilities: GrypeVulnerability[];
  matchDetails: unknown;
}

export interface GrypeReport {
  matches: GrypeMatch[];
  source: { target: { userInput: string; imageID: string } };
  ignoredMatches: unknown[];
}

export interface GrypeScanOptions {
  target?: string;
  failOn?: GrypeSeverity;
  outputFile?: string;
}

export function isGrypeInstalled(): boolean {
  try { execSync('grype version', { stdio: 'pipe' }); return true; } catch { return false; }
}

export function scan(opts: GrypeScanOptions = {}): GrypeReport {
  const { target = '.', failOn, outputFile } = opts;
  if (!isGrypeInstalled()) throw new Error('grype not installed — brew install grype');
  const failFlag = failOn ? `--fail-on ${failOn}` : '';
  const outputFlag = outputFile ? `--output json > ${outputFile}` : '--output json';
  try {
    const stdout = execSync(`grype ${target} ${failFlag} ${outputFlag}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    return JSON.parse(stdout) as GrypeReport;
  } catch (err) {
    const output = (err as { stdout?: string }).stdout ?? '';
    if (output) { try { return JSON.parse(output) as GrypeReport; } catch { /* */ } }
    throw new Error(`grype scan failed: ${err}`);
  }
}

export function summarizeVulns(report: GrypeReport): {
  total: number;
  bySeverity: Record<GrypeSeverity, number>;
  critical: GrypeMatch[];
} {
  const bySeverity: Record<GrypeSeverity, number> = {
    Unknown: 0, Negligible: 0, Low: 0, Medium: 0, High: 0, Critical: 0,
  };
  for (const m of report.matches) {
    bySeverity[m.vulnerability.severity] = (bySeverity[m.vulnerability.severity] ?? 0) + 1;
  }
  return {
    total: report.matches.length,
    bySeverity,
    critical: report.matches.filter((m) => m.vulnerability.severity === 'Critical'),
  };
}

export function passesCIGate(report: GrypeReport): boolean {
  return summarizeVulns(report).bySeverity.Critical === 0;
}

export function formatReport(report: GrypeReport): string {
  const s = summarizeVulns(report);
  const lines = [
    '=== Grype Vulnerability Report ===',
    `Total: ${s.total}`,
    `  Critical: ${s.bySeverity.Critical}`,
    `  High:     ${s.bySeverity.High}`,
    `  Medium:   ${s.bySeverity.Medium}`,
    `  Low:      ${s.bySeverity.Low}`,
    '',
  ];
  for (const m of report.matches) {
    const v = m.vulnerability;
    lines.push(`[${v.severity}] ${v.id} — ${v.package.name}:${v.package.version}`);
    if (v.fix.versions.length > 0) lines.push(`  Fix: ${v.fix.versions.join(', ')}`);
    lines.push('');
  }
  return lines.join('\n');
}
