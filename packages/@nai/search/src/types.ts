/**
 * @nai/search — Types
 */

export type SearchSource = 'pagefind' | 'semantic' | 'unified';

export interface SearchResult {
  /** Unique result id. */
  id: string;
  /** Result title. */
  title: string;
  /** Result URL. */
  url: string;
  /** Snippet/excerpt with highlighted matches. */
  excerpt: string;
  /** Relevance score (0–1, higher = more relevant). */
  score: number;
  /** Source of the result. */
  source: SearchSource;
  /** Optional metadata (locale, section, tags, etc.). */
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  /** Search query text. */
  query: string;
  /** Locale filter ('vi' | 'en' | 'all'). */
  locale?: 'vi' | 'en' | 'all';
  /** Maximum number of results. */
  limit?: number;
  /** Filter by metadata fields. */
  filters?: Record<string, string>;
}

export interface SearchIndex {
  search(query: SearchQuery): Promise<SearchResult[]>;
  /** Index a document. */
  index(doc: IndexableDocument): Promise<void>;
  /** Rebuild the index from scratch. */
  rebuild?(): Promise<void>;
}

export interface IndexableDocument {
  id: string;
  title: string;
  url: string;
  content: string;
  locale: 'vi' | 'en';
  section?: string;
  tags?: string[];
  /** Optional pre-computed embedding vector for semantic search. */
  vector?: number[];
}
