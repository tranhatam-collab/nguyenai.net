/**
 * @nai/sentinel — wrapper for semgrep
 *
 * Original source: https://github.com/semgrep/semgrep
 * Language: py
 * License: LGPL-2.1
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/semgrep',
  upstream: 'https://github.com/semgrep/semgrep',
  tool: 'semgrep',
  language: 'py',
  license: 'LGPL-2.1',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
