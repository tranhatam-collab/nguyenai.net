/**
 * @nai/mcp-servers-catalog — wrapper for awesome-mcp-servers
 *
 * Original source: https://github.com/wong2/awesome-mcp-servers
 * Language: md
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/mcp-servers-catalog',
  upstream: 'https://github.com/wong2/awesome-mcp-servers',
  tool: 'awesome-mcp-servers',
  language: 'md',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
