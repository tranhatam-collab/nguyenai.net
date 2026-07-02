/**
 * @nai/llama-index — wrapper for llama_index
 *
 * Original source: https://github.com/run-llama/llama_index
 * Language: py
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/llama-index',
  upstream: 'https://github.com/run-llama/llama_index',
  tool: 'llama_index',
  language: 'py',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
