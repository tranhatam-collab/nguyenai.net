/**
 * @nai/gitleaks — wrapper for gitleaks
 *
 * Original source: https://github.com/gitleaks/gitleaks
 * Language: go
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/gitleaks',
  upstream: 'https://github.com/gitleaks/gitleaks',
  tool: 'gitleaks',
  language: 'go',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
