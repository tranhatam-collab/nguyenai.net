/**
 * @nai/haystack — wrapper for haystack
 *
 * Original source: https://github.com/deepset-ai/haystack
 * Language: py
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/haystack',
  upstream: 'https://github.com/deepset-ai/haystack',
  tool: 'haystack',
  language: 'py',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
