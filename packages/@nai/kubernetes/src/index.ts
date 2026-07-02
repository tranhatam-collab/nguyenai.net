/**
 * @nai/kubernetes — wrapper for kubernetes
 *
 * Original source: https://github.com/kubernetes/kubernetes
 * Language: go
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/kubernetes',
  upstream: 'https://github.com/kubernetes/kubernetes',
  tool: 'kubernetes',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
