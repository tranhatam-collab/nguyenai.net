/**
 * @nai/artisan — wrapper for openhands
 *
 * Original source: https://github.com/All-Hands-AI/OpenHands
 * Language: py
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/openhands',
  upstream: 'https://github.com/All-Hands-AI/OpenHands',
  tool: 'openhands',
  language: 'py',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
