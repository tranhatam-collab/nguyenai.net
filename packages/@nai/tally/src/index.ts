/**
 * @nai/tally — wrapper for helicone
 *
 * Original source: https://github.com/Helicone/helicone
 * Language: ts
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/helicone',
  upstream: 'https://github.com/Helicone/helicone',
  tool: 'helicone',
  language: 'ts',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
