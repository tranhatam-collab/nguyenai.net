/**
 * @nai/dify — wrapper for dify
 *
 * Original source: https://github.com/langgenius/dify
 * Language: ts
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/dify',
  upstream: 'https://github.com/langgenius/dify',
  tool: 'dify',
  language: 'ts',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
