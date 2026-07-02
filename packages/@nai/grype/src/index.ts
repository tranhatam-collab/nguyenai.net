/**
 * @nai/grype — wrapper for grype
 *
 * Original source: https://github.com/anchore/grype
 * Language: go
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/grype',
  upstream: 'https://github.com/anchore/grype',
  tool: 'grype',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
