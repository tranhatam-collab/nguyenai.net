/**
 * @nai/opik — wrapper for opik
 *
 * Original source: https://github.com/comet-ml/opik
 * Language: py
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/opik',
  upstream: 'https://github.com/comet-ml/opik',
  tool: 'opik',
  language: 'py',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
