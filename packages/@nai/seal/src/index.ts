/**
 * @nai/seal — Secret scanner
 *
 * Detects hardcoded secrets in source code (API keys, passwords, tokens,
 * private keys, connection strings, AWS keys, GitHub tokens, JWTs).
 * Provides masking and redaction helpers to keep secrets out of logs.
 */

export type SecretType =
  | 'api_key'
  | 'password'
  | 'token'
  | 'private_key'
  | 'connection_string'
  | 'aws_key'
  | 'github_token';

export type Confidence = 'high' | 'medium' | 'low';

export interface SecretFinding {
  file: string;
  line: number;
  column: number;
  type: SecretType;
  value: string;
  confidence: Confidence;
  context: string;
}

export interface SecretPattern {
  type: SecretType;
  pattern: RegExp;
  confidence: Confidence;
  description: string;
}

/**
 * Built-in secret detection patterns.
 */
const builtinPatterns: SecretPattern[] = [
  {
    type: 'aws_key',
    pattern: /\b(AKIA[0-9A-Z]{16})\b/g,
    confidence: 'high',
    description: 'AWS access key ID',
  },
  {
    type: 'aws_key',
    pattern: /\b(AKIA[0-9A-Z]{16})[\/+][A-Za-z0-9/+=]{40}\b/g,
    confidence: 'high',
    description: 'AWS access key + secret pair',
  },
  {
    type: 'github_token',
    pattern: /\b(ghp_[A-Za-z0-9]{36,})\b/g,
    confidence: 'high',
    description: 'GitHub personal access token',
  },
  {
    type: 'github_token',
    pattern: /\b(gho_[A-Za-z0-9]{36,})\b/g,
    confidence: 'high',
    description: 'GitHub OAuth token',
  },
  {
    type: 'github_token',
    pattern: /\b(ghs_[A-Za-z0-9]{36,})\b/g,
    confidence: 'high',
    description: 'GitHub app token',
  },
  {
    type: 'api_key',
    pattern: /\b(sk-[A-Za-z0-9]{20,})\b/g,
    confidence: 'high',
    description: 'OpenAI / Stripe-style API key (sk-...)',
  },
  {
    type: 'api_key',
    pattern: /\b(api[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}['"]?)/gi,
    confidence: 'medium',
    description: 'Generic api_key assignment',
  },
  {
    type: 'private_key',
    pattern: /-----BEGIN[A-Z ]*PRIVATE KEY-----[\s\S]*?-----END[A-Z ]*PRIVATE KEY-----/g,
    confidence: 'high',
    description: 'PEM private key block',
  },
  {
    type: 'password',
    pattern: /\b(password\s*[:=]\s*['"]?[^\s'"]{4,}['"]?)/gi,
    confidence: 'medium',
    description: 'Password assignment',
  },
  {
    type: 'password',
    pattern: /\b(passwd\s*[:=]\s*['"]?[^\s'"]{4,}['"]?)/gi,
    confidence: 'medium',
    description: 'passwd assignment',
  },
  {
    type: 'connection_string',
    pattern: /\b(mongodb(?:\+srv)?:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+)/gi,
    confidence: 'high',
    description: 'MongoDB connection string with credentials',
  },
  {
    type: 'connection_string',
    pattern: /\b(postgres(?:ql)?:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+)/gi,
    confidence: 'high',
    description: 'PostgreSQL connection string with credentials',
  },
  {
    type: 'connection_string',
    pattern: /\b(mysql:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+)/gi,
    confidence: 'high',
    description: 'MySQL connection string with credentials',
  },
  {
    type: 'token',
    pattern: /\b(eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
    confidence: 'high',
    description: 'JWT token',
  },
];

/** Mutable registry of patterns (built-ins + custom). */
const patterns: SecretPattern[] = [...builtinPatterns];

/**
 * Add a custom secret pattern to the registry.
 */
export function addPattern(pattern: SecretPattern): void {
  patterns.push(pattern);
}

/**
 * Return the current list of registered patterns (built-ins + custom).
 */
export function getPatterns(): SecretPattern[] {
  return [...patterns];
}

/**
 * Reset the pattern registry to only the built-in patterns.
 * Mainly useful for tests.
 */
export function resetPatterns(): void {
  patterns.length = 0;
  patterns.push(...builtinPatterns);
}

/**
 * Extract the "secret value" portion from a matched assignment-style string.
 * For `password=secret123` returns `secret123`; for bare tokens returns the
 * whole match.
 */
function extractSecretValue(raw: string): string {
  const eqIdx = raw.search(/[:=]/);
  if (eqIdx === -1) return raw;
  let rest = raw.slice(eqIdx + 1).trim();
  if ((rest.startsWith('"') && rest.endsWith('"')) ||
      (rest.startsWith("'") && rest.endsWith("'"))) {
    rest = rest.slice(1, -1);
  }
  return rest;
}

/**
 * True if a pattern can match across multiple lines (contains \s\S, [\s\S],
 * or the `s` (dotAll) flag).
 */
function isMultiline(p: SecretPattern): boolean {
  return /\\s\\S|\[\\s\\S\]/.test(p.pattern.source) || p.pattern.dotAll;
}

/**
 * Compute the 1-based line/column for a character offset in `text`.
 */
function offsetToLineCol(text: string, offset: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') { line++; col = 1; }
    else col++;
  }
  return { line, column: col };
}

/**
 * Scan a single line for single-line secrets, pushing findings into `out`.
 */
function scanLine(
  line: string,
  lineNum: number,
  file: string,
  out: SecretFinding[],
): void {
  for (const p of patterns) {
    if (isMultiline(p)) continue;
    // Reset lastIndex because we reuse the shared pattern objects.
    p.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.pattern.exec(line)) !== null) {
      const fullMatch = m[0];
      const value = extractSecretValue(fullMatch);
      if (!value) continue;
      out.push({
        file,
        line: lineNum,
        column: m.index + 1,
        type: p.type,
        value,
        confidence: p.confidence,
        context: line.trim(),
      });
      if (m.index === p.pattern.lastIndex) p.pattern.lastIndex++;
    }
  }
}

/**
 * Scan the full text for multiline patterns, pushing findings into `out`.
 */
function scanMultiline(text: string, file: string, out: SecretFinding[]): void {
  for (const p of patterns) {
    if (!isMultiline(p)) continue;
    p.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.pattern.exec(text)) !== null) {
      const fullMatch = m[0];
      const value = extractSecretValue(fullMatch);
      if (!value) continue;
      const { line, column } = offsetToLineCol(text, m.index);
      const firstLine = fullMatch.split('\n')[0].trim();
      out.push({
        file,
        line,
        column,
        type: p.type,
        value,
        confidence: p.confidence,
        context: firstLine,
      });
      if (m.index === p.pattern.lastIndex) p.pattern.lastIndex++;
    }
  }
}

/**
 * Scan source code for secrets. Returns findings with line/column positions.
 */
export function scanForSecrets(code: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    scanLine(lines[i], i + 1, '<string>', findings);
  }
  scanMultiline(code, '<string>', findings);
  return findings;
}

/**
 * Scan file content for secrets. `filename` is attached to each finding.
 */
export function scanFile(content: string, filename: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    scanLine(lines[i], i + 1, filename, findings);
  }
  scanMultiline(content, filename, findings);
  return findings;
}

/**
 * Mask a secret value: show the first 4 and last 4 characters, replacing
 * the middle with asterisks. Short secrets (<= 8 chars) are fully masked
 * except for a fixed-length mask to avoid leaking length info.
 */
export function maskSecret(value: string): string {
  if (typeof value !== 'string' || value.length === 0) return '';
  if (value.length <= 8) {
    return '*'.repeat(Math.min(value.length, 4));
  }
  const head = value.slice(0, 4);
  const tail = value.slice(-4);
  const middle = '*'.repeat(Math.max(value.length - 8, 4));
  return `${head}${middle}${tail}`;
}

/**
 * Redact all secrets found in `code`, replacing each with the literal
 * string `[REDACTED]`. Returns the redacted source.
 */
export function redactSecrets(code: string): string {
  let out = code;
  for (const p of patterns) {
    p.pattern.lastIndex = 0;
    out = out.replace(p.pattern, '[REDACTED]');
  }
  return out;
}

export const PACKAGE_INFO = {
  name: '@nai/seal',
  description: 'Secret scanner — detects hardcoded secrets in source code.',
  language: 'typescript',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;

// ============================================================
// P1-E.4: Gitleaks integration for CI secret scanning
// ============================================================

import { execSync as _execSync } from 'node:child_process';

export function isGitleaksInstalled(): boolean {
  try { _execSync('gitleaks version', { stdio: 'pipe' }); return true; } catch { return false; }
}

export function runGitleaksScan(opts: {
  configPath?: string;
  basePath?: string;
  verbose?: boolean;
} = {}): { passed: boolean; findings: number; output: string } {
  const { configPath = '.gitleaks.toml', basePath = '.', verbose = true } = opts;
  if (!isGitleaksInstalled()) throw new Error('gitleaks not installed — brew install gitleaks');
  const verboseFlag = verbose ? '--verbose' : '';
  const configFlag = configPath ? `--config ${configPath}` : '';
  try {
    const stdout = _execSync(`gitleaks detect ${configFlag} ${verboseFlag} --no-banner`, { encoding: 'utf-8', cwd: basePath, stdio: ['pipe', 'pipe', 'pipe'] });
    return { passed: true, findings: 0, output: stdout };
  } catch (err) {
    const output = (err as { stdout?: string; stderr?: string }).stdout ?? '';
    const stderr = (err as { stdout?: string; stderr?: string }).stderr ?? '';
    const combined = `${output}\n${stderr}`;
    const findings = (combined.match(/leak found/gi) || []).length;
    return { passed: false, findings: findings || 1, output: combined };
  }
}

export function passesSecretScanGate(opts?: { configPath?: string; basePath?: string }): boolean {
  return runGitleaksScan(opts).passed;
}

