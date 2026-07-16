#!/usr/bin/env node
/**
 * Live model test script — tests AI models via AI Provider Gateway.
 *
 * Per AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16: all model invocations
 * go through aiagent.iai.one. Direct vendor keys (OPENAI_API_KEY, etc.) are BANNED.
 *
 * Usage:
 *   node tools/test-models.mjs                         # test all models via gateway
 *   node tools/test-models.mjs --model=nguyen-iris-7   # test specific model
 *   node tools/test-models.mjs --verbose               # verbose output
 *
 * Required env vars:
 *   AI_PROVIDER_API_KEY — gateway credential (from Team A)
 *   AI_PROVIDER_GATEWAY_URL — override default (https://aiagent.iai.one)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const modelsPath = resolve(__dirname, '../packages/product-catalog/models.json');
const models = JSON.parse(readFileSync(modelsPath, 'utf8'));

const args = processArgs(process.argv.slice(2));
const TEST_PROMPT = 'Xin chào, bạn là AI Assistant của Nguyen AI Computer. Hãy trả lời ngắn gọn: bạn là model nào?';

const GATEWAY_URL = process.env.AI_PROVIDER_GATEWAY_URL ?? 'https://aiagent.iai.one';
const GATEWAY_KEY = process.env.AI_PROVIDER_API_KEY ?? '';

function processArgs(argv) {
  const opts = { model: null, verbose: false };
  for (const arg of argv) {
    if (arg.startsWith('--model=')) opts.model = arg.slice(8);
    else if (arg.startsWith('--provider=')) {
      console.error('ERROR: --provider is no longer supported. All models go through the gateway.');
      process.exit(1);
    } else if (arg === '--verbose' || arg === '-v') opts.verbose = true;
  }
  return opts;
}

if (!GATEWAY_KEY) {
  console.error('ERROR: AI_PROVIDER_API_KEY is not set.');
  console.error('Get the gateway credential from Team A (aiagent.iai.one).');
  console.error('Direct vendor keys (OPENAI_API_KEY, etc.) are BANNED per AI_PROVIDER_SINGLE_SOURCE_DECISION.');
  process.exit(1);
}

async function callGateway(model, messages) {
  const resp = await fetch(`${GATEWAY_URL}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GATEWAY_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 256,
      temperature: 0.7,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return { ok: false, status: resp.status, error: text };
  }
  const data = await resp.json();
  return { ok: true, data };
}

async function main() {
  const toTest = args.model
    ? models.filter((m) => m.id === args.model)
    : models;

  if (toTest.length === 0) {
    console.error(`No models found${args.model ? ` matching "${args.model}"` : ''}.`);
    process.exit(1);
  }

  console.log(`Testing ${toTest.length} model(s) via ${GATEWAY_URL}`);
  console.log('---');

  let pass = 0;
  let fail = 0;

  for (const model of toTest) {
    process.stdout.write(`${model.id.padEnd(30)} `);
    try {
      const result = await callGateway(model.providerModel ?? model.id, [
        { role: 'user', content: TEST_PROMPT },
      ]);
      if (result.ok) {
        const content = result.data.content ?? result.data.message ?? '';
        const usage = result.data.usage ?? {};
        console.log('PASS');
        if (args.verbose) {
          console.log(`  Response: ${content.slice(0, 120)}`);
          console.log(`  Usage: ${JSON.stringify(usage)}`);
        }
        pass++;
      } else {
        console.log(`FAIL (${result.status})`);
        if (args.verbose) console.log(`  Error: ${result.error?.slice(0, 200)}`);
        fail++;
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      fail++;
    }
  }

  console.log('---');
  console.log(`Results: ${pass} pass, ${fail} fail out of ${toTest.length}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
