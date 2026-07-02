/**
 * @nai/skyvern — wrapper for skyvern
 *
 * Original source: https://github.com/Skyvern-AI/skyvern
 * Language: py
 * License: AGPL-3.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/skyvern',
  upstream: 'https://github.com/Skyvern-AI/skyvern',
  tool: 'skyvern',
  language: 'py',
  license: 'AGPL-3.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
