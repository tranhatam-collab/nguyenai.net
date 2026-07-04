/**
 * @nai/search — Semantic search index (Qdrant via @nai/compass)
 *
 * Wraps @nai/compass vector store for semantic search.
 * The caller provides embedding vectors (computed by the LLM platform).
 */

import {
  searchVectors,
  upsertVector,
  ensureDefaultCollections,
  type CollectionName,
} from '@nai/compass';
import type { SearchIndex, SearchQuery, SearchResult, IndexableDocument } from './types';

export class SemanticSearchIndex implements SearchIndex {
  private collection: CollectionName;
  private tenantId: string;

  constructor(opts?: { collection?: CollectionName; tenantId?: string }) {
    this.collection = opts?.collection ?? 'knowledge';
    this.tenantId = opts?.tenantId ?? 'public';
  }

  async index(doc: IndexableDocument): Promise<void> {
    if (!doc.vector) {
      throw new Error('vector_required_for_semantic_indexing');
    }
    await upsertVector(this.collection, doc.id, this.tenantId, doc.vector, {
      title: doc.title,
      url: doc.url,
      locale: doc.locale,
      section: doc.section,
      tags: doc.tags,
      content_excerpt: doc.content.slice(0, 500),
    });
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Semantic search requires a query vector — the caller must provide it
    // via the query.filters?.vector field (not ideal, but keeps the interface simple).
    // In production, the API endpoint computes the embedding before calling search.
    const queryVector = query.filters?.vector as unknown as number[] | undefined;
    if (!queryVector) {
      // No vector → cannot do semantic search
      return [];
    }

    const filters: Record<string, string | number | boolean> = {};
    if (query.locale && query.locale !== 'all') {
      filters.locale = query.locale;
    }
    if (query.filters?.section) {
      filters.section = query.filters.section;
    }

    const hits = await searchVectors(this.collection, queryVector, this.tenantId, {
      metadata: filters,
      limit: query.limit ?? 20,
    });

    return hits.map((hit) => ({
      id: hit.id,
      title: (hit.payload?.title as string) ?? hit.id,
      url: (hit.payload?.url as string) ?? '',
      excerpt: (hit.payload?.content_excerpt as string) ?? '',
      score: hit.score,
      source: 'semantic' as const,
      metadata: {
        locale: hit.payload?.locale,
        section: hit.payload?.section,
        tags: hit.payload?.tags,
      },
    }));
  }

  async init(): Promise<void> {
    await ensureDefaultCollections();
  }
}
