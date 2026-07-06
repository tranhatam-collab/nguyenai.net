#!/usr/bin/env node
/**
 * Live model test script — tests AI models via provider APIs.
 *
 * Usage:
 *   node tools/test-models.mjs                    # test all free-tier models
 *   node tools/test-models.mjs --provider=groq    # test specific provider
 *   node tools/test-models.mjs --model=nguyen-iris-7  # test specific model
 *
 * Required env vars (for paid providers):
 *   OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, GROQ_API_KEY,
 *   DEEPSEEK_API_KEY, CEREBRAS_API_KEY
 *
 * Free-tier providers (no key needed for basic test):
 *   - cloudflare-workers-ai (requires Cloudflare account token)
 *   - google (free tier available)
 *   - groq (free tier available)
 *   - cerebras (free tier available)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const modelsPath = resolve(__dirname, '../packages/product-catalog/models.json');
const models = JSON.parse(readFileSync(modelsPath, 'utf8'));

const args = processArgs(process.argv.slice(2));
const TEST_PROMPT = 'Xin chào, bạn là AI Assistant của Nguyen AI Computer. Hãy trả lời ngắn gọn: bạn là model nào?';

function processArgs(argv) {
  const opts = { provider: null, model: null, verbose: false };
  for (const arg of argv) {
    if (arg.startsWith('--provider=')) opts.provider = arg.slice(11);
    else if (arg.startsWith('--model=')) opts.model = arg.slice(8);
    else if (arg === '--verbose' || arg === '-v') opts.verbose = true;
  }
  return opts;
}

function getApiKey(provider) {
  const envMap = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_API_KEY',
    groq: 'GROQ_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    cerebras: 'CEREBRAS_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    together: 'TOGETHER_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    cohere: 'COHERE_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY',
    xai: 'XAI_API_KEY',
    fireworks: 'FIREWORKS_API_KEY',
    'cloudflare-workers-ai': 'CLOUDFLARE_OAUTH_TOKEN',
  };
  const envVar = envMap[provider];
  if (!envVar) return null;
  // For Cloudflare, try env var first, then wrangler config
  if (provider === 'cloudflare-workers-ai') {
    const envKey = process.env[envVar];
    if (envKey) return envKey;
    try {
      const configPath = `${process.env.HOME}/.wrangler/config/default.toml`;
      const config = readFileSync(configPath, 'utf8');
      const match = config.match(/oauth_token = "(.*)"/);
      return match ? match[1] : null;
    } catch { return null; }
  }
  return process.env[envVar] ?? null;
}

function getProviderBaseUrl(provider) {
  const urls = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    google: 'https://generativelanguage.googleapis.com/v1beta',
    groq: 'https://api.groq.com/openai/v1',
    deepseek: 'https://api.deepseek.com/v1',
    cerebras: 'https://api.cerebras.ai/v1',
    mistral: 'https://api.mistral.ai/v1',
    together: 'https://api.together.xyz/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    cohere: 'https://api.cohere.ai/v1',
    perplexity: 'https://api.perplexity.ai',
    xai: 'https://api.x.ai/v1',
    fireworks: 'https://api.fireworks.ai/inference/v1',
    'cloudflare-workers-ai': `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID ?? 'f3f9e76222dcb488d5e303e29e8ba192'}/ai/run`,
  };
  return urls[provider] ?? null;
}

async function testModel(model) {
  const { id, displayName, provider, providerModel, freeTier } = model;
  const apiKey = getApiKey(provider);
  const baseUrl = getProviderBaseUrl(provider);

  if (!apiKey && !freeTier) {
    return { id, displayName, provider, status: 'skip', reason: 'no API key (paid provider)' };
  }
  if (!baseUrl) {
    return { id, displayName, provider, status: 'skip', reason: 'unknown provider' };
  }

  const startTime = Date.now();
  try {
    let response;
    if (provider === 'google') {
      // Google Gemini API
      const url = `${baseUrl}/models/${providerModel}:generateContent?key=${apiKey}`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: TEST_PROMPT }] }],
          generationConfig: { maxOutputTokens: 100 },
        }),
        signal: AbortSignal.timeout(15000),
      });
    } else if (provider === 'anthropic') {
      // Anthropic Claude API
      response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: providerModel,
          max_tokens: 100,
          messages: [{ role: 'user', content: TEST_PROMPT }],
        }),
        signal: AbortSignal.timeout(15000),
      });
    } else {
      // OpenAI-compatible API (OpenAI, Groq, DeepSeek, Cerebras, Together, OpenRouter, etc.)
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: providerModel,
          messages: [{ role: 'user', content: TEST_PROMPT }],
          max_tokens: 100,
        }),
        signal: AbortSignal.timeout(15000),
      });
    }

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      return {
        id, displayName, provider, status: 'fail',
        httpStatus: response.status, elapsed,
        error: errText.slice(0, 200),
      };
    }

    const data = await response.json();
    let output = '';
    if (provider === 'google') {
      output = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    } else if (provider === 'anthropic') {
      output = data.content?.[0]?.text ?? '';
    } else {
      output = data.choices?.[0]?.message?.content ?? '';
    }

    return {
      id, displayName, provider, status: 'pass',
      elapsed, output: output.slice(0, 100),
    };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    return {
      id, displayName, provider, status: 'error',
      elapsed, error: err.message?.slice(0, 200),
    };
  }
}

async function main() {
  let testModels = models;
  if (args.provider) {
    testModels = testModels.filter((m) => m.provider === args.provider);
  }
  if (args.model) {
    testModels = testModels.filter((m) => m.id === args.model);
  }

  console.log(`\n=== Nguyen AI Model Live Test ===`);
  console.log(`Models to test: ${testModels.length}`);
  console.log(`Prompt: "${TEST_PROMPT}"\n`);

  const results = [];
  for (const model of testModels) {
    process.stdout.write(`Testing ${model.id} (${model.provider}/${model.providerModel})... `);
    const result = await testModel(model);
    results.push(result);
    console.log(`${result.status.toUpperCase()} ${result.elapsed ?? ''}ms${result.error ? ' — ' + result.error : ''}`);
    if (args.verbose && result.output) {
      console.log(`  Output: ${result.output}`);
    }
  }

  console.log(`\n=== Summary ===`);
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const skipped = results.filter((r) => r.status === 'skip').length;
  console.log(`PASS: ${passed} | FAIL: ${failed} | ERROR: ${errors} | SKIP: ${skipped} | TOTAL: ${results.length}`);

  if (failed > 0 || errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
