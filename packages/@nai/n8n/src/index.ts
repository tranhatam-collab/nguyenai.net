/**
 * @nai/n8n — wrapper for n8n
 *
 * Original source: https://github.com/n8n-io/n8n
 * Language: ts
 * License: Sustainable Use
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/n8n',
  upstream: 'https://github.com/n8n-io/n8n',
  tool: 'n8n',
  language: 'ts',
  license: 'Sustainable Use',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
