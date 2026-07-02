/**
 * @nai/atlas — wrapper for grafana
 *
 * Original source: https://github.com/grafana/grafana
 * Language: ts
 * License: AGPL-3.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/grafana',
  upstream: 'https://github.com/grafana/grafana',
  tool: 'grafana',
  language: 'ts',
  license: 'AGPL-3.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
