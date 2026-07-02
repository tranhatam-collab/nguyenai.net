/**
 * @nai/mcp-sdk — wrapper for sdk-typescript
 *
 * Original source: https://github.com/modelcontextprotocol/typescript-sdk
 * Language: ts
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/mcp-sdk',
  upstream: 'https://github.com/modelcontextprotocol/typescript-sdk',
  tool: 'sdk-typescript',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
