/**
 * @nai/sentinel — unit tests.
 * Run via `pnpm --filter @nai/sentinel test`.
 */

import {
  scanCode,
  scanFile,
  addRule,
  getRules,
  clearCustomRules,
  formatReport,
  type ScanResult,
  type Severity,
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

function hasFinding(
  results: ScanResult[],
  ruleId: string,
  line?: number,
): boolean {
  return results.some(
    (r) => r.rule === ruleId && (line === undefined || r.line === line),
  );
}

async function main(): Promise<void> {
  // --- SQL injection ---
  {
    console.log('Test: SQL injection detection');
    const code = `const q = "SELECT * FROM users WHERE id = " + userId;`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'sql-injection'), 'detects string-concat SQL injection');
    assert(
      results[0]?.severity === 'high',
      'SQL injection severity is high',
    );
  }

  {
    console.log('Test: SQL injection via template literal');
    const code = 'const q = `SELECT * FROM users WHERE id = ${userId}`;';
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'sql-injection'), 'detects template-literal SQL injection');
  }

  {
    console.log('Test: SQL injection false positive (parameterized)');
    const code = `const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    stmt.run(userId);`;
    const results = scanCode(code, 'javascript');
    assert(
      !hasFinding(results, 'sql-injection'),
      'parameterized query is not flagged',
    );
  }

  // --- XSS ---
  {
    console.log('Test: XSS via innerHTML');
    const code = `el.innerHTML = userInput;`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'xss-reflected'), 'detects innerHTML XSS');
  }

  {
    console.log('Test: XSS via dangerouslySetInnerHTML');
    const code = `<div dangerouslySetInnerHTML={{__html: data}} />`;
    const results = scanCode(code, 'typescript');
    assert(hasFinding(results, 'xss-reflected'), 'detects dangerouslySetInnerHTML');
  }

  {
    console.log('Test: XSS false positive (innerHTML with static string)');
    const code = `el.innerHTML = "<p>hello</p>";`;
    const results = scanCode(code, 'javascript');
    // static string assignment is still flagged by our rule; verify it is NOT flagged
    // because the value is a quoted literal, not a variable.
    assert(
      !hasFinding(results, 'xss-reflected'),
      'innerHTML with static string literal is not flagged',
    );
  }

  // --- Hardcoded secrets ---
  {
    console.log('Test: hardcoded API key');
    const code = `const apiKey = "sk-1234567890abcdef1234567890abcdef";`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'hardcoded-secret'), 'detects hardcoded api key');
  }

  {
    console.log('Test: AWS access key id');
    const code = `const accessKey = "AKIAIOSFODNN7EXAMPLE";`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'hardcoded-secret'), 'detects AWS AKIA key');
  }

  {
    console.log('Test: GitHub token');
    const code = `const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'hardcoded-secret'), 'detects GitHub token');
  }

  {
    console.log('Test: hardcoded secret false positive (short value)');
    const code = `const name = "test";`;
    const results = scanCode(code, 'javascript');
    assert(!hasFinding(results, 'hardcoded-secret'), 'short non-secret value not flagged');
  }

  // --- Dangerous eval ---
  {
    console.log('Test: dangerous eval');
    const code = `eval(userInput);`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'dangerous-eval'), 'detects eval()');
    assert(results[0]?.severity === 'critical', 'eval severity is critical');
  }

  {
    console.log('Test: new Function constructor');
    const code = `new Function("return " + userInput)();`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'dangerous-eval'), 'detects new Function()');
  }

  // --- Prototype pollution ---
  {
    console.log('Test: prototype pollution __proto__');
    const code = `obj.__proto__ = malicious;`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'prototype-pollution'), 'detects __proto__ assignment');
  }

  {
    console.log('Test: prototype pollution via constructor');
    const code = `target.constructor["prototype"] = payload;`;
    const results = scanCode(code, 'javascript');
    assert(hasFinding(results, 'prototype-pollution'), 'detects constructor[prototype]');
  }

  // --- scanFile ---
  {
    console.log('Test: scanFile with filename language inference');
    const content = `eval("dangerous");\nconst x = 1;`;
    const results = scanFile(content, 'script.js');
    assert(hasFinding(results, 'dangerous-eval', 1), 'scanFile detects eval on line 1');
    assert(results[0]?.file === 'script.js', 'scanFile sets filename in result');
  }

  // --- Custom rules ---
  {
    console.log('Test: addRule custom rule');
    clearCustomRules();
    const before = getRules().length;
    addRule({
      id: 'no-console',
      severity: 'low',
      message: 'console.log usage discouraged',
      languages: ['javascript', 'typescript'],
      test: (lower) => lower.includes('console.log'),
    });
    assert(getRules().length === before + 1, 'addRule adds to registry');
    const results = scanCode('console.log("hi");', 'javascript');
    assert(hasFinding(results, 'no-console'), 'custom rule is applied during scan');
    clearCustomRules();
  }

  // --- formatReport ---
  {
    console.log('Test: formatReport empty');
    const report = formatReport([]);
    assert(report === 'No issues found.', 'empty report says no issues');
  }

  {
    console.log('Test: formatReport with results');
    const results: ScanResult[] = [
      {
        file: 'a.ts',
        line: 3,
        severity: 'high',
        rule: 'sql-injection',
        message: 'Possible SQL injection',
        confidence: 'high',
      },
      {
        file: 'b.ts',
        line: 1,
        severity: 'critical',
        rule: 'dangerous-eval',
        message: 'Dangerous eval',
        confidence: 'high',
      },
    ];
    const report = formatReport(results);
    assert(report.includes('2 issue(s)'), 'report includes issue count');
    assert(report.includes('CRITICAL'), 'report includes severity labels');
    // Critical should appear before high due to sorting.
    const critIdx = report.indexOf('CRITICAL');
    const highIdx = report.indexOf('HIGH');
    assert(critIdx < highIdx && critIdx > -1, 'critical sorted before high');
  }

  // --- Clean code produces no findings ---
  {
    console.log('Test: clean code no findings');
    const code = [
      'function add(a, b) {',
      '  return a + b;',
      '}',
      'const result = add(1, 2);',
    ].join('\n');
    const results = scanCode(code, 'typescript');
    assert(results.length === 0, 'clean code has zero findings');
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
