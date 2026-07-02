/**
 * @nai/phoenix — wrapper for phoenix
 *
 * Original source: https://github.com/Arize-ai/phoenix
 * Language: py
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/phoenix',
  upstream: 'https://github.com/Arize-ai/phoenix',
  tool: 'phoenix',
  language: 'py',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
