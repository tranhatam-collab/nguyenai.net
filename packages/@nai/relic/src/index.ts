/**
 * @nai/relic — wrapper for mem0
 *
 * Original source: https://github.com/mem0ai/mem0
 * Language: py
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/mem0',
  upstream: 'https://github.com/mem0ai/mem0',
  tool: 'mem0',
  language: 'py',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
