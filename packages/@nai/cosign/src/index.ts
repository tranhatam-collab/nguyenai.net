/**
 * @nai/cosign — wrapper for cosign
 *
 * Original source: https://github.com/sigstore/cosign
 * Language: go
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/cosign',
  upstream: 'https://github.com/sigstore/cosign',
  tool: 'cosign',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
