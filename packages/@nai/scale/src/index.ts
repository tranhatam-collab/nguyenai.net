/**
 * @nai/scale — wrapper for deepeval
 *
 * Original source: https://github.com/confident-ai/deepeval
 * Language: py
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/deepeval',
  upstream: 'https://github.com/confident-ai/deepeval',
  tool: 'deepeval',
  language: 'py',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
