/**
 * @nai/terraform — wrapper for terraform
 *
 * Original source: https://github.com/hashicorp/terraform
 * Language: go
 * License: MPL-2.0
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/terraform',
  upstream: 'https://github.com/hashicorp/terraform',
  tool: 'terraform',
  language: 'go',
  license: 'MPL-2.0',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
