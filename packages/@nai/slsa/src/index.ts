/**
 * @nai/slsa — wrapper for slsa
 *
 * Original source: https://github.com/slsa-framework/slsa-github-generator
 * Language: ts
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/slsa',
  upstream: 'https://github.com/slsa-framework/slsa-github-generator',
  tool: 'slsa',
  language: 'ts',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
