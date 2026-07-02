/**
 * @nai/forge — wrapper for promptfoo
 *
 * Original source: https://github.com/promptfoo/promptfoo
 * Language: ts
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/promptfoo',
  upstream: 'https://github.com/promptfoo/promptfoo',
  tool: 'promptfoo',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
