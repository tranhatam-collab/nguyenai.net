#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

const decision = read('docs/governance/AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md');
const plan = read('docs/governance/AI_PROVIDER_TWO_TEAM_BUILD_PLAN_2026-07-16.md');
const api = read('apps/api/src/index.ts');
const prism = read('packages/@nai/prism/src/index.ts');
const wrangler = read('apps/api/wrangler.jsonc');
const inventory = JSON.parse(read('config/secret-governance.json'));

check(/aiagent\.iai\.one/.test(decision), 'Single-source decision must name aiagent.iai.one');
check(/AI_PROVIDER_API_KEY/.test(decision), 'Provider credential contract is missing');
check(/Team A/.test(plan) && /Team B/.test(plan), 'Two-team build plan is missing');
check(inventory.services.api.aiProviderGateway?.apiKeySecret === 'AI_PROVIDER_API_KEY', 'Inventory must use AI_PROVIDER_API_KEY');
check(!/AI_PROVIDER_API_KEY/.test(wrangler), 'Provider API key must not be stored in wrangler vars');
check(!/OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_AI_API_KEY/.test(api + prism), 'Direct vendor provider path still exists in Nguyen AI runtime');
check(/AI_PROVIDER_GATEWAY_URL/.test(api), 'AI provider gateway is not wired into API runtime');
check(/AI_PROVIDER_API_KEY/.test(api), 'AI_PROVIDER_API_KEY is not declared in API runtime');
check(!/configureDirectProvider/.test(api), 'Direct provider configuration still exists in API runtime');

if (failures.length) {
  console.error('AI PROVIDER SOURCE AUDIT FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('AI PROVIDER SOURCE AUDIT PASSED');
