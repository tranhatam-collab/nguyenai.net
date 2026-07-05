/**
 * @nai/bulwark — Trivy integration for Nguyen AI monorepo
 *
 * P1-E.2: Image/filesystem vulnerability scanner.
 * Original source: https://github.com/aquasecurity/trivy
 * License: Apache-2.0
 */

import { execSync } from 'node:child_process';

export const PACKAGE_INFO = {
  name: '@nai/bulwark',
  upstream: 'https://github.com/aquasecurity/trivy',
  tool: 'trivy',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

export type TrivyScanType = 'fs' | 'image' | 'repo';
export type TrivySeverity = 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TrivyVulnerability {
  VulnerabilityID: string;
  PkgName: string;
  InstalledVersion: string;
  FixedVersion: string | null;
  Severity: TrivySeverity;
  Title: string;
  Description: string;
  References: string[];
}

export interface TrivyScanResult {
  Target: string;
  Class: string;
  Type: string;
  Vulnerabilities: TrivyVulnerability[];
}

export interface TrivyReport {
  SchemaVersion: number;
  CreatedAt: string;
  Results: TrivyScanResult[];
}

export interface TrivyScanOptions {
  scanType?: TrivyScanType;
  target?: string;
  severity?: TrivySeverity[];
  ignoreUnfixed?: boolean;
  format?: 'json' | 'table' | 'sarif';
  outputFile?: string;
}

export function isTrivyInstalled(): boolean {
  try { execSync('trivy --version', { stdio: 'pipe' }); return true; } catch { return false; }
}

export function scan(opts: TrivyScanOptions = {}): TrivyReport {
  const { scanType = 'fs', target = '.', severity = ['HIGH', 'CRITICAL'], ignoreUnfixed = true, format = 'json', outputFile } = opts;
  if (!isTrivyInstalled()) throw new Error('trivy not installed — brew install trivy');
  const severityFlag = severity.join(',');
  const ignoreFlag = ignoreUnfixed ? '--ignore-unfixed' : '';
  const outputFlag = outputFile ? `--output ${outputFile}` : '';
  const cmd = `trivy ${scanType} --format ${format} --severity ${severityFlag} ${ignoreFlag} ${outputFlag} ${target}`;
  try {
    const stdout = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (format === 'json') return JSON.parse(stdout) as TrivyReport;
    return { SchemaVersion: 0, CreatedAt: new Date().toISOString(), Results: [] };
  } catch (err) {
    const output = (err as { stdout?: string }).stdout ?? '';
    if (output && format === 'json') { try { return JSON.parse(output) as TrivyReport; } catch { /* */ } }
    throw new Error(`trivy scan failed: ${err}`);
  }
}

export function summarizeReport(report: TrivyReport): {
  total: number;
  bySeverity: Record<TrivySeverity, number>;
  byTarget: Record<string, number>;
} {
  const bySeverity: Record<TrivySeverity, number> = { UNKNOWN: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const byTarget: Record<string, number> = {};
  for (const r of report.Results) {
    const vulns = r.Vulnerabilities ?? [];
    byTarget[r.Target] = vulns.length;
    for (const v of vulns) bySeverity[v.Severity] = (bySeverity[v.Severity] ?? 0) + 1;
  }
  return { total: Object.values(bySeverity).reduce((a, b) => a + b, 0), bySeverity, byTarget };
}

export function passesCIGate(report: TrivyReport): boolean {
  return summarizeReport(report).bySeverity.CRITICAL === 0;
}

export function formatReport(report: TrivyReport): string {
  const s = summarizeReport(report);
  const lines = [
    '=== Trivy Scan Report ===',
    `Total: ${s.total}`,
    `  CRITICAL: ${s.bySeverity.CRITICAL}`,
    `  HIGH:     ${s.bySeverity.HIGH}`,
    `  MEDIUM:   ${s.bySeverity.MEDIUM}`,
    `  LOW:      ${s.bySeverity.LOW}`,
    '',
  ];
  for (const r of report.Results) {
    const vulns = r.Vulnerabilities ?? [];
    if (vulns.length === 0) continue;
    lines.push(`--- ${r.Target} (${vulns.length}) ---`);
    for (const v of vulns) {
      lines.push(`  [${v.Severity}] ${v.VulnerabilityID} ${v.PkgName}:${v.InstalledVersion}`);
      if (v.FixedVersion) lines.push(`    Fix: ${v.FixedVersion}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
