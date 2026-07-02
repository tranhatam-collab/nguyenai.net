/**
 * @nai/bulwark — wrapper for trivy
 *
 * Original source: https://github.com/aquasecurity/trivy
 * Language: go
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/trivy',
  upstream: 'https://github.com/aquasecurity/trivy',
  tool: 'trivy',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
