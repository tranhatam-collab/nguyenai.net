/**
 * @nai/conveyor — wrapper for argo-cd
 *
 * Original source: https://github.com/argoproj/argo-cd
 * Language: go
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/argo-cd',
  upstream: 'https://github.com/argoproj/argo-cd',
  tool: 'argo-cd',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
