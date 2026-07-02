/**
 * @nai/crewai — wrapper for crewAI
 *
 * Original source: https://github.com/crewAIInc/crewAI
 * Language: py
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/crewai',
  upstream: 'https://github.com/crewAIInc/crewAI',
  tool: 'crewAI',
  language: 'py',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
