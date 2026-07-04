/**
 * @nai/hound — Dependency vulnerability scanner.
 *
 * Scans package dependencies against an advisory database to find
 * known vulnerabilities. Provides parsing of package.json and lockfiles,
 * severity scoring, filtering, and report generation.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Vulnerability {
  id: string;
  package: string;
  version: string;
  severity: Severity;
  title: string;
  description: string;
  patchedVersion?: string;
  url?: string;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'prod' | 'dev';
}

export type AdvisoryDb = Map<string, Vulnerability[]>;

// ---------------------------------------------------------------------------
// Version comparison
// ---------------------------------------------------------------------------

/**
 * Parse a semver-ish string into comparable components.
 * Strips leading ^, ~, >, >=, <, <=, = and pre-release suffixes.
 */
function parseVersion(v: string): number[] {
  const cleaned = v.replace(/^[~^>=<\s]+/, '').split('-')[0] ?? '';
  const parts = cleaned.split('.');
  const nums: number[] = [];
  for (let i = 0; i < 3; i++) {
    nums.push(parseInt(parts[i] ?? '0', 10) || 0);
  }
  return nums;
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i]! < pb[i]!) return -1;
    if (pa[i]! > pb[i]!) return 1;
  }
  return 0;
}

/**
 * Check if `version` is less than `patchedVersion`.
 * Handles ranges in patchedVersion like ">=1.2.3".
 */
function isVulnerable(version: string, patchedVersion?: string): boolean {
  if (!patchedVersion) return true;
  const cleaned = patchedVersion.replace(/^[~^>=<\s]+/, '');
  return compareVersions(version, cleaned) < 0;
}

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

export function scanDependencies(
  deps: Dependency[],
  advisoryDb: AdvisoryDb,
): Vulnerability[] {
  const results: Vulnerability[] = [];
  for (const dep of deps) {
    const advisories = advisoryDb.get(dep.name);
    if (!advisories) continue;
    for (const adv of advisories) {
      // If the advisory specifies a patched version, only report if the
      // dep version is below it. Otherwise report all matching.
      if (isVulnerable(dep.version, adv.patchedVersion)) {
        results.push({
          ...adv,
          version: dep.version,
        });
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parsePackageJson(content: string): Dependency[] {
  const pkg = JSON.parse(content) as Record<string, unknown>;
  const deps: Dependency[] = [];

  const dependencies = pkg['dependencies'] as Record<string, string> | undefined;
  if (dependencies && typeof dependencies === 'object') {
    for (const [name, version] of Object.entries(dependencies)) {
      deps.push({ name, version, type: 'prod' });
    }
  }

  const devDependencies = pkg['devDependencies'] as
    | Record<string, string>
    | undefined;
  if (devDependencies && typeof devDependencies === 'object') {
    for (const [name, version] of Object.entries(devDependencies)) {
      deps.push({ name, version, type: 'dev' });
    }
  }

  return deps;
}

export function parseLockfile(content: string): Dependency[] {
  const deps: Dependency[] = [];
  const lines = content.split('\n');
  // Supports npm v1 lockfile format and pnpm lockfile format.
  // npm v1: "package@version":
  // pnpm: package@version: or package@version:
  for (const line of lines) {
    const trimmed = line.trim();
    // npm v1 lockfile: "name@version":
    const npmMatch = trimmed.match(/^"([^"]+)@([^"]+)":\s*$/);
    if (npmMatch) {
      const [, name, version] = npmMatch;
      deps.push({ name: name!, version: version!, type: 'prod' });
      continue;
    }
    // pnpm lockfile: name@version:
    const pnpmMatch = trimmed.match(/^([a-z][\w./-]*)@([^:]+):\s*$/);
    if (pnpmMatch) {
      const [, name, version] = pnpmMatch;
      // Skip meta entries like /name@version
      if (!name!.startsWith('/')) {
        deps.push({ name: name!, version: version!, type: 'prod' });
      }
    }
  }
  return deps;
}

// ---------------------------------------------------------------------------
// Severity scoring and filtering
// ---------------------------------------------------------------------------

const severityScores: Record<Severity, number> = {
  critical: 10,
  high: 8,
  medium: 5,
  low: 2,
  info: 0,
};

export function severityScore(vuln: Vulnerability): number {
  return severityScores[vuln.severity] ?? 0;
}

const severityRank: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export function filterBySeverity(
  vulns: Vulnerability[],
  minSeverity: Severity,
): Vulnerability[] {
  const minRank = severityRank[minSeverity];
  return vulns.filter((v) => (severityRank[v.severity] ?? 0) >= minRank);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export function generateReport(vulns: Vulnerability[]): string {
  if (vulns.length === 0) {
    return 'No vulnerabilities found.';
  }
  const counts: Record<string, number> = {};
  for (const v of vulns) {
    counts[v.severity] = (counts[v.severity] ?? 0) + 1;
  }
  const summary = Object.entries(counts)
    .map(([sev, n]) => `${sev}: ${n}`)
    .join(', ');

  const lines: string[] = [];
  lines.push(`Hound Vulnerability Report`);
  lines.push(`${vulns.length} vulnerability(ies) found (${summary})`);
  lines.push('');

  // Sort by severity descending
  const sorted = [...vulns].sort(
    (a, b) => severityRank[b.severity] - severityRank[a.severity],
  );

  for (const v of sorted) {
    lines.push(`  [${v.severity.toUpperCase()}] ${v.package}@${v.version}`);
    lines.push(`    ${v.title}`);
    lines.push(`    id: ${v.id}`);
    if (v.patchedVersion) {
      lines.push(`    patched in: ${v.patchedVersion}`);
    }
    if (v.url) {
      lines.push(`    url: ${v.url}`);
    }
  }
  return lines.join('\n');
}
