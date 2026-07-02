/**
 * @nai/loki — wrapper for loki
 *
 * Original source: https://github.com/grafana/loki
 * Language: go
 * License: AGPL-3.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/loki',
  upstream: 'https://github.com/grafana/loki',
  tool: 'loki',
  language: 'go',
  license: 'AGPL-3.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
