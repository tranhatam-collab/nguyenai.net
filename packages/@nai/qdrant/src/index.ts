/**
 * @nai/qdrant — wrapper for qdrant
 *
 * Original source: https://github.com/qdrant/qdrant
 * Language: rs
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/qdrant',
  upstream: 'https://github.com/qdrant/qdrant',
  tool: 'qdrant',
  language: 'rs',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
