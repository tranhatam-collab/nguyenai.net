/**
 * @nai/scout — wrapper for browser-use
 *
 * Original source: https://github.com/browser-use/browser-use
 * Language: py
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/browser-use',
  upstream: 'https://github.com/browser-use/browser-use',
  tool: 'browser-use',
  language: 'py',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
