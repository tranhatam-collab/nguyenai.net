#!/usr/bin/env node
/**
 * AI Provider Source Audit — verifies all AI model invocations go through
 * aiagent.iai.one (AI Provider Gateway). Direct vendor keys/URLs are BANNED.
 *
 * Scope: apps/, packages/@nai/*, tools/, config/
 * Per AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => { try { return fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch { return ''; } };
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

// Direct vendor URL patterns (BANNED in runtime + tools)
const VENDOR_URL_RE = /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|api\.groq\.com|api\.cerebras\.ai|api\.deepseek\.com|api\.mistral\.ai|texttospeech\.googleapis\.com/;
// Direct vendor key names (BANNED in runtime + tools + scripts)
const VENDOR_KEY_RE = /\bOPENAI_API_KEY\b|\bANTHROPIC_API_KEY\b|\bGOOGLE_AI_API_KEY\b|\bGROQ_API_KEY\b|\bDEEPSEEK_API_KEY\b|\bCEREBRAS_API_KEY\b|\bMISTRAL_API_KEY\b/;

// ============================================================
// 1. Governance docs exist
// ============================================================
const decision = read('docs/governance/AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md');
const plan = read('docs/governance/AI_PROVIDER_TWO_TEAM_BUILD_PLAN_2026-07-16.md');
check(/aiagent\.iai\.one/.test(decision), 'Single-source decision must name aiagent.iai.one');
check(/AI_PROVIDER_API_KEY/.test(decision), 'Provider credential contract is missing');
check(/Team A/.test(plan) && /Team B/.test(plan), 'Two-team build plan is missing');

// ============================================================
// 2. Secret inventory
// ============================================================
const inventory = JSON.parse(read('config/secret-governance.json'));
check(inventory.services.api.aiProviderGateway?.apiKeySecret === 'AI_PROVIDER_API_KEY', 'Inventory must use AI_PROVIDER_API_KEY');

// ============================================================
// 3. API runtime
// ============================================================
const api = read('apps/api/src/index.ts');
const wrangler = read('apps/api/wrangler.jsonc');
check(!/AI_PROVIDER_API_KEY/.test(wrangler), 'Provider API key must not be stored in wrangler vars');
check(/AI_PROVIDER_GATEWAY_URL/.test(api), 'AI provider gateway is not wired into API runtime');
check(/AI_PROVIDER_API_KEY/.test(api), 'AI_PROVIDER_API_KEY is not declared in API runtime');
check(!/configureDirectProvider/.test(api), 'configureDirectProvider still exists in API runtime');
check(!/OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY/.test(api), 'Direct vendor key names in API runtime');

// ============================================================
// 4. @nai/prism — no direct vendor provider
// ============================================================
const prism = read('packages/@nai/prism/src/index.ts');
check(!/configureDirectProvider/.test(prism), 'configureDirectProvider still exists in @nai/prism');
check(!/DirectLLMProvider/.test(prism), 'DirectLLMProvider class still exists in @nai/prism');
check(!VENDOR_URL_RE.test(prism), 'Direct vendor URLs still exist in @nai/prism');

// ============================================================
// 5. @nai/gateway-sdk — no direct vendor URLs
// ============================================================
const gatewaySdk = read('packages/@nai/gateway-sdk/src/index.ts');
check(!VENDOR_URL_RE.test(gatewaySdk), 'Direct vendor URLs still exist in @nai/gateway-sdk');

// ============================================================
// 6. @nai/contracts — no direct vendor URLs in tool definitions
// ============================================================
const contracts = read('packages/@nai/contracts/src/tool.ts');
check(!VENDOR_URL_RE.test(contracts), 'Direct vendor URLs still exist in @nai/contracts tool definitions');

// ============================================================
// 7. Tools — no direct vendor keys or URLs in operational scripts
// ============================================================
const testModels = read('tools/test-models.mjs');
// Allow vendor key names in comments/error messages that say BANNED
const testModelsLines = testModels.split('\n').filter((l) => !/BANNED|removed|superseded|deprecated|no longer/i.test(l)).join('\n');
check(!VENDOR_KEY_RE.test(testModelsLines), 'Direct vendor key names in tools/test-models.mjs (non-BANNED context)');
check(!VENDOR_URL_RE.test(testModels), 'Direct vendor URLs in tools/test-models.mjs');

const setSecrets = read('tools/set-wrangler-secrets.sh');
const setSecretsLines = setSecrets.split('\n').filter((l) => !/BANNED|removed|superseded|deprecated|no longer/i.test(l)).join('\n');
check(!VENDOR_KEY_RE.test(setSecretsLines), 'Direct vendor key instructions in tools/set-wrangler-secrets.sh (non-BANNED context)');

// ============================================================
// 8. Scan all .ts/.mjs/.sh files in apps/ and packages/@nai/ for vendor URLs
// ============================================================
function scanDir(dir, label) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return;
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(fullDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.astro') continue;
      scanDir(path.join(dir, entry.name), label);
    } else if (/\.(ts|mjs|sh)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Skip comments and audit tools (this file)
      if (entry.name === 'audit-ai-provider-source.mjs') continue;
      // Check for vendor URLs — allow in comments that say "BANNED" or "removed"
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (VENDOR_URL_RE.test(line)) {
          // Allow if line is a comment mentioning BANNED/removed/superseded
          if (/BANNED|removed|superseded|deprecated|no longer/i.test(line)) continue;
          check(false, `Direct vendor URL in ${dir}/${entry.name}:${i + 1}: ${line.trim().slice(0, 100)}`);
        }
      }
    }
  }
}

scanDir('apps', 'apps');
scanDir('packages/@nai', 'packages');

// ============================================================
// Report
// ============================================================
if (failures.length) {
  console.error('AI PROVIDER SOURCE AUDIT FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('AI PROVIDER SOURCE AUDIT PASSED');
console.log('  Scope: apps/, packages/@nai/*, tools/, config/');
console.log('  Checks: governance docs, secret inventory, API runtime, @nai/prism,');
console.log('          @nai/gateway-sdk, @nai/contracts, tools/, recursive scan');
