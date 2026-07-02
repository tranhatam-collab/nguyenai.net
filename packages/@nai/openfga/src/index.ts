/**
 * @nai/openfga — wrapper for openfga
 *
 * Original source: https://github.com/openfga/openfga
 * Language: go
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/openfga',
  upstream: 'https://github.com/openfga/openfga',
  tool: 'openfga',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
