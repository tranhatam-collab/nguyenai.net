/**
 * @nai/mcp-servers — wrapper for servers
 *
 * Original source: https://github.com/modelcontextprotocol/servers
 * Language: ts
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/mcp-servers',
  upstream: 'https://github.com/modelcontextprotocol/servers',
  tool: 'servers',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
