/**
 * @nai/otel-collector — wrapper for opentelemetry-collector
 *
 * Original source: https://github.com/open-telemetry/opentelemetry-collector
 * Language: go
 * License: Apache-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/otel-collector',
  upstream: 'https://github.com/open-telemetry/opentelemetry-collector',
  tool: 'opentelemetry-collector',
  language: 'go',
  license: 'Apache-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
