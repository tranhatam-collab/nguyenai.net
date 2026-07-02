/**
 * @nai/opa — wrapper for opa
 *
 * Original source: https://github.com/open-policy-agent/opa
 * Language: go
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/opa',
  upstream: 'https://github.com/open-policy-agent/opa',
  tool: 'opa',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
