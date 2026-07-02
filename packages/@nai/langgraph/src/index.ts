/**
 * @nai/langgraph — wrapper for langgraph
 *
 * Original source: https://github.com/langchain-ai/langgraph
 * Language: ts
 * License: MIT
 *
 * This package does NOT bundle the original source.
 * It provides metadata and integration glue only.
 */

export const PACKAGE_INFO = {
  name: '@nai/langgraph',
  upstream: 'https://github.com/langchain-ai/langgraph',
  tool: 'langgraph',
  language: 'ts',
  license: 'MIT',
} as const;

export type PackageInfo = typeof PACKAGE_INFO;
