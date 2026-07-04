/**
 * @nai/sentinel — Static analysis security tool.
 *
 * Detects security vulnerabilities in source code via pattern-based rules.
 * Supports SQL injection, XSS, hardcoded secrets, dangerous eval, and
 * prototype pollution detection, plus custom user-supplied rules.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type Confidence = 'certain' | 'high' | 'medium' | 'low';

export interface ScanResult {
  file: string;
  line: number;
  severity: Severity;
  rule: string;
  message: string;
  confidence: Confidence;
}

export interface Rule {
  id: string;
  severity: Severity;
  message: string;
  /** Languages this rule applies to; empty means all languages. */
  languages: string[];
  /**
   * Test function receives the lowercased line text and the original line.
   * Return true if the line matches the rule.
   */
  test: (lineLower: string, line: string) => boolean;
  /** Optional confidence override; defaults to 'high'. */
  confidence?: Confidence;
}

// ---------------------------------------------------------------------------
// Built-in rules
// ---------------------------------------------------------------------------

const sqlInjectionRule: Rule = {
  id: 'sql-injection',
  severity: 'high',
  message: 'Possible SQL injection: user input concatenated into query',
  languages: [],
  confidence: 'high',
  test: (lower) => {
    // Skip comments that are not executable SQL-in-code contexts.
    const hasSqlKeyword =
      /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bwhere\b|\bfrom\b|\bdrop\b)/.test(
        lower,
      );
    if (!hasSqlKeyword) return false;
    // Detect string concatenation with variables near SQL keywords.
    const concatPattern =
      /(`[^`]*\$\{|["'][^"']*\s*\+\s*\w+|"\s*\+\s*\w+|\$\w+[^;]*\b(select|insert|update|delete|where|from|drop)\b)/;
    return concatPattern.test(lower);
  },
};

const xssRule: Rule = {
  id: 'xss-reflected',
  severity: 'high',
  message: 'Possible XSS: unescaped output rendered to DOM',
  languages: [],
  confidence: 'medium',
  test: (lower) => {
    // innerHTML assignment with a variable or template expression.
    // Use [a-z_$`] to only flag non-literal assignments (not quoted strings).
    if (/innerhtml\s*=\s*[a-z_$`]/.test(lower)) return true;
    // dangerouslySetInnerHTML (React).
    if (/dangerouslysetinnerhtml/.test(lower)) return true;
    // document.write with a variable.
    if (/document\.write\s*\(/.test(lower)) return true;
    // v-html (Vue).
    if (/v-html\s*=/.test(lower)) return true;
    return false;
  },
};

const hardcodedSecretRule: Rule = {
  id: 'hardcoded-secret',
  severity: 'high',
  message: 'Hardcoded secret detected in source',
  languages: [],
  confidence: 'medium',
  test: (lower) => {
    // Assignment of a long string literal to a secret-ish variable.
    const assignMatch =
      /(api[_-]?key|secret|password|passwd|token|private[_-]?key|access[_-]?key)\s*[:=]\s*["'][A-Za-z0-9+/=_\-]{16,}["']/;
    if (assignMatch.test(lower)) return true;
    // AWS access key id pattern AKIA...
    if (/AKIA[0-9A-Z]{16}/.test(lower)) return true;
    // GitHub token pattern
    if (/gh[pousr]_[A-Za-z0-9]{36}/.test(lower)) return true;
    return false;
  },
};

const dangerousEvalRule: Rule = {
  id: 'dangerous-eval',
  severity: 'critical',
  message: 'Dangerous eval usage: code execution from dynamic input',
  languages: [],
  confidence: 'high',
  test: (lower) => {
    if (/\beval\s*\(/.test(lower)) return true;
    if (/new\s+function\s*\(/.test(lower)) return true;
    if (/settimeout\s*\(\s*["'`]/.test(lower)) return true;
    if (/setinterval\s*\(\s*["'`]/.test(lower)) return true;
    return false;
  },
};

const prototypePollutionRule: Rule = {
  id: 'prototype-pollution',
  severity: 'high',
  message: 'Possible prototype pollution: unsafe object merge or __proto__ assignment',
  languages: [],
  confidence: 'medium',
  test: (lower) => {
    if (/__proto__/.test(lower)) return true;
    if (/constructor\s*\[\s*['"]prototype['"]\s*\]/.test(lower)) return true;
    // Object.assign into a prototype.
    if (/object\.assign\s*\(\s*\w*\.prototype/.test(lower)) return true;
    // Recursive merge patterns that don't guard __proto__.
    if (/merge\s*\(/.test(lower) && /target\[key\]/.test(lower)) return true;
    return false;
  },
};

const defaultRules: Rule[] = [
  sqlInjectionRule,
  xssRule,
  hardcodedSecretRule,
  dangerousEvalRule,
  prototypePollutionRule,
];

// ---------------------------------------------------------------------------
// Rule registry
// ---------------------------------------------------------------------------

const customRules: Rule[] = [];

export function addRule(rule: Rule): void {
  customRules.push(rule);
}

export function getRules(): Rule[] {
  return [...defaultRules, ...customRules];
}

export function clearCustomRules(): void {
  customRules.length = 0;
}

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

function languageFromFilename(filename: string): string {
  const ext = filename.split('.').pop() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    java: 'java',
    kt: 'kotlin',
    php: 'php',
    cs: 'csharp',
    rs: 'rust',
    sql: 'sql',
    html: 'html',
    vue: 'html',
    svelte: 'html',
  };
  return map[ext.toLowerCase()] ?? ext.toLowerCase() ?? 'unknown';
}

function isCommentLine(line: string, language: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;
  if (language === 'python' && trimmed.startsWith('#')) return true;
  if (language === 'sql' && trimmed.startsWith('--')) return true;
  return false;
}

function runRules(
  code: string,
  file: string,
  language: string,
  rules: Rule[],
): ScanResult[] {
  const results: ScanResult[] = [];
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim().length === 0) continue;
    const lower = line.toLowerCase();
    for (const rule of rules) {
      // Language filter: empty languages means all.
      if (
        rule.languages.length > 0 &&
        !rule.languages.includes(language)
      ) {
        continue;
      }
      if (rule.test(lower, line)) {
        // Reduce false positives: skip pure comment lines for most rules.
        if (
          isCommentLine(line, language) &&
          rule.id !== 'hardcoded-secret'
        ) {
          continue;
        }
        results.push({
          file,
          line: i + 1,
          severity: rule.severity,
          rule: rule.id,
          message: rule.message,
          confidence: rule.confidence ?? 'high',
        });
      }
    }
  }
  return results;
}

export function scanCode(code: string, language: string): ScanResult[] {
  return runRules(code, '<code>', language, getRules());
}

export function scanFile(content: string, filename: string): ScanResult[] {
  const language = languageFromFilename(filename);
  return runRules(content, filename, language, getRules());
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

const severityOrder: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function formatReport(results: ScanResult[]): string {
  if (results.length === 0) {
    return 'No issues found.';
  }
  const sorted = [...results].sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    if (sev !== 0) return sev;
    return a.line - b.line;
  });
  const counts: Record<string, number> = {};
  for (const r of sorted) {
    counts[r.severity] = (counts[r.severity] ?? 0) + 1;
  }
  const summary = Object.entries(counts)
    .map(([sev, n]) => `${sev}: ${n}`)
    .join(', ');
  const lines: string[] = [];
  lines.push(`Sentinel Security Report`);
  lines.push(`${results.length} issue(s) found (${summary})`);
  lines.push('');
  for (const r of sorted) {
    lines.push(
      `  [${r.severity.toUpperCase()}] ${r.file}:${r.line} — ${r.rule}`,
    );
    lines.push(`    ${r.message}`);
    lines.push(`    confidence: ${r.confidence}`);
  }
  return lines.join('\n');
}
