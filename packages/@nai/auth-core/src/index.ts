/**
 * @nai/auth-core — wrapper for better-auth
 *
 * Original source: https://github.com/better-auth/better-auth
 * Language: ts
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/auth-core',
  upstream: 'https://github.com/better-auth/better-auth',
  tool: 'better-auth',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
