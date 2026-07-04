import {
  scanForSecrets,
  scanFile,
  addPattern,
  getPatterns,
  maskSecret,
  redactSecrets,
  resetPatterns,
  type SecretPattern,
} from './index.js';

let passed = 0, failed = 0;
const steps: string[] = [];
function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  \u2713 ${msg}`); }
  else { failed++; steps.push(`  \u2717 ${msg}`); console.error(`  \u2717 ${msg}`); }
}

async function main() {
  console.log('\n@nai/seal test');
  console.log('---------------');

  // --- AWS access key ---
  {
    const code = 'aws_access_key_id = "AKIAIOSFODNN7EXAMPLE"';
    const findings = scanForSecrets(code);
    assert(findings.length >= 1, 'detects AWS access key (AKIA...)');
    assert(
      findings.some((f) => f.type === 'aws_key' && f.confidence === 'high'),
      'AWS finding has type=aws_key, confidence=high',
    );
    assert(findings[0].line === 1, 'AWS finding line is correct');
    assert(findings[0].column >= 1, 'AWS finding column is set');
    assert(
      findings[0].value.includes('AKIA'),
      'AWS finding value contains AKIA prefix',
    );
  }

  // --- GitHub token ---
  {
    const code = 'token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz1234"';
    const findings = scanForSecrets(code);
    assert(findings.some((f) => f.type === 'github_token'), 'detects GitHub token (ghp_...)');
    assert(
      findings.some((f) => f.value.startsWith('ghp_')),
      'GitHub token value starts with ghp_',
    );
  }

  // --- API key (sk-) ---
  {
    const code = 'OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz0123456789';
    const findings = scanForSecrets(code);
    assert(findings.some((f) => f.type === 'api_key'), 'detects API key (sk-...)');
    assert(
      findings.some((f) => f.value.startsWith('sk-')),
      'API key value starts with sk-',
    );
  }

  // --- API key (api_key=) ---
  {
    const code = 'api_key = "abcdef0123456789secretvalue"';
    const findings = scanForSecrets(code);
    assert(
      findings.some((f) => f.type === 'api_key'),
      'detects generic api_key= assignment',
    );
  }

  // --- Private key ---
  {
    const code = [
      '-----BEGIN RSA PRIVATE KEY-----',
      'MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz',
      '-----END RSA PRIVATE KEY-----',
    ].join('\n');
    const findings = scanForSecrets(code);
    assert(findings.some((f) => f.type === 'private_key'), 'detects PEM private key block');
  }

  // --- Password ---
  {
    const code = 'password = "supersecretpass123"';
    const findings = scanForSecrets(code);
    assert(findings.some((f) => f.type === 'password'), 'detects password= assignment');
    assert(
      findings.some((f) => f.value === 'supersecretpass123'),
      'password value extracted correctly (quotes stripped)',
    );
  }

  // --- passwd ---
  {
    const code = 'passwd=hunter2password';
    const findings = scanForSecrets(code);
    assert(findings.some((f) => f.type === 'password'), 'detects passwd= assignment');
  }

  // --- Connection string (mongodb) ---
  {
    const code = 'MONGO_URL="mongodb://admin:s3cr3t@cluster.example.net/db"';
    const findings = scanForSecrets(code);
    assert(
      findings.some((f) => f.type === 'connection_string'),
      'detects mongodb:// connection string with credentials',
    );
  }

  // --- JWT token ---
  {
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const findings = scanForSecrets(jwt);
    assert(findings.some((f) => f.type === 'token'), 'detects JWT token (eyJ...)');
    assert(
      findings.some((f) => f.value.startsWith('eyJ')),
      'JWT token value starts with eyJ',
    );
  }

  // --- scanFile attaches filename ---
  {
    const code = 'const pwd = "password=iloveyou1234"\n';
    const findings = scanFile(code, 'config.ts');
    assert(
      findings.every((f) => f.file === 'config.ts'),
      'scanFile attaches filename to findings',
    );
  }

  // --- line/column tracking across multiple lines ---
  {
    const code = 'line one\npassword = "mypassword99"\nline three';
    const findings = scanForSecrets(code);
    const pwd = findings.find((f) => f.type === 'password');
    assert(pwd !== undefined && pwd.line === 2, 'finding line is correct for multi-line input');
    assert(pwd !== undefined && pwd.column >= 1, 'finding column is set for multi-line input');
    assert(
      pwd !== undefined && pwd.context.includes('password'),
      'finding context contains the source line',
    );
  }

  // --- maskSecret ---
  {
    assert(
      maskSecret('AKIAIOSFODNN7EXAMPLE') === 'AKIA************MPLE',
      'maskSecret shows first 4 + last 4, masks middle',
    );
    assert(maskSecret('short') === '****', 'maskSecret fully masks short secrets');
    assert(maskSecret('') === '', 'maskSecret returns empty string for empty input');
    assert(
      maskSecret('12345678') === '****',
      'maskSecret masks 8-char secrets fully',
    );
    assert(
      maskSecret('123456789') === '1234****6789',
      'maskSecret handles 9-char secret (first 4 + 4 mask + last 4)',
    );
  }

  // --- redactSecrets ---
  {
    const code = 'key = "AKIAIOSFODNN7EXAMPLE"\ntoken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz1234"';
    const redacted = redactSecrets(code);
    assert(redacted.includes('[REDACTED]'), 'redactSecrets replaces secrets with [REDACTED]');
    assert(!redacted.includes('AKIA'), 'redactSecrets removes AWS key from output');
    assert(!redacted.includes('ghp_'), 'redactSecrets removes GitHub token from output');
  }

  // --- addPattern / getPatterns ---
  {
    const before = getPatterns().length;
    const custom: SecretPattern = {
      type: 'token',
      pattern: /\bX-API-TOKEN-[A-Z0-9]{20}\b/g,
      confidence: 'medium',
      description: 'custom X-API-TOKEN',
    };
    addPattern(custom);
    assert(getPatterns().length === before + 1, 'addPattern registers a custom pattern');
    const code = 'header: X-API-TOKEN-ABCDEFGHIJ1234567890';
    const findings = scanForSecrets(code);
    assert(
      findings.some((f) => f.value.startsWith('X-API-TOKEN-')),
      'custom pattern detects custom token format',
    );
    resetPatterns();
    assert(
      getPatterns().length === before,
      'resetPatterns restores built-in patterns only',
    );
  }

  // --- clean code returns no findings ---
  {
    const code = 'const x = 1 + 2;\nconsole.log("hello world");\n';
    const findings = scanForSecrets(code);
    assert(findings.length === 0, 'no findings for clean code without secrets');
  }

  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error('FATAL:', err); process.exit(1); });
