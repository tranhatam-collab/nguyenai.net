/**
 * @nai/langfuse — wrapper for langfuse
 *
 * Original source: https://github.com/langfuse/langfuse
 * Language: ts
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/langfuse',
  upstream: 'https://github.com/langfuse/langfuse',
  tool: 'langfuse',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
