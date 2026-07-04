/**
 * @nai/search — Unified search (Pagefind + Semantic)
 *
 * Combines static site search (Pagefind) and semantic search (Qdrant)
 * into a single interface. Results are merged and re-ranked.
 */

import type { SearchIndex, SearchQuery, SearchResult } from './types';

export class UnifiedSearch implements SearchIndex {
  private indexes: SearchIndex[];

  constructor(indexes: SearchIndex[]) {
    this.indexes = indexes;
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Query all indexes in parallel
    const allResults = await Promise.all(
      this.indexes.map((idx) => idx.search(query).catch(() => [])),
    );

    // Flatten and merge
    const merged: SearchResult[] = [];
    for (const results of allResults) {
      merged.push(...results);
    }

    // Deduplicate by URL (prefer higher score)
    const byUrl = new Map<string, SearchResult>();
    for (const result of merged) {
      const existing = byUrl.get(result.url);
      if (!existing || result.score > existing.score) {
        byUrl.set(result.url, result);
      }
    }

    // Sort by score (descending)
    const sorted = Array.from(byUrl.values()).sort((a, b) => b.score - a.score);

    // Apply limit
    return sorted.slice(0, query.limit ?? 20);
  }

  async index(doc: import('./types').IndexableDocument): Promise<void> {
    // Index into all indexes that support it
    await Promise.all(
      this.indexes.map((idx) => idx.index(doc).catch(() => {})),
    );
  }
}
