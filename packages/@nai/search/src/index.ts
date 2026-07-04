/**
 * @nai/search — Public API
 *
 * Search package for Nguyen AI — Pagefind (static) + Qdrant (semantic).
 */

export type { SearchSource, SearchResult, SearchQuery, SearchIndex, IndexableDocument } from './types';

export { InMemoryPagefindIndex, PagefindClient, pagefindBuildCommand } from './pagefind';
export type { PagefindBuildOptions } from './pagefind';
export { SemanticSearchIndex } from './semantic';
export { UnifiedSearch } from './unified';
