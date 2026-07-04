/**
 * @nai/search — Pagefind static search index
 *
 * Pagefind is a static site search engine that indexes HTML at build time.
 * See https://pagefind.app/
 *
 * This module provides:
 * 1. A build helper that runs the Pagefind CLI to index a dist directory
 * 2. A client-side search interface that queries the Pagefind index
 * 3. An in-memory implementation for testing
 */

import type { SearchIndex, SearchQuery, SearchResult, IndexableDocument } from './types';

// ============================================================
// In-memory Pagefind index (for dev/test)
// ============================================================

export class InMemoryPagefindIndex implements SearchIndex {
  private docs = new Map<string, IndexableDocument>();

  async index(doc: IndexableDocument): Promise<void> {
    this.docs.set(doc.id, doc);
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const q = query.query.toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];

    const results: SearchResult[] = [];
    for (const doc of this.docs.values()) {
      if (query.locale && query.locale !== 'all' && doc.locale !== query.locale) continue;
      if (query.filters) {
        let matches = true;
        for (const [key, value] of Object.entries(query.filters)) {
          if (key === 'section' && doc.section !== value) matches = false;
          if (key === 'tag' && !doc.tags?.includes(value)) matches = false;
        }
        if (!matches) continue;
      }

      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      let score = 0;
      let excerpt = '';

      for (const term of terms) {
        if (titleLower.includes(term)) score += 3;
        const contentIdx = contentLower.indexOf(term);
        if (contentIdx >= 0) {
          score += 1;
          if (!excerpt) {
            const start = Math.max(0, contentIdx - 50);
            const end = Math.min(doc.content.length, contentIdx + term.length + 50);
            excerpt = doc.content.slice(start, end);
          }
        }
      }

      if (score > 0) {
        results.push({
          id: doc.id,
          title: doc.title,
          url: doc.url,
          excerpt: excerpt || doc.content.slice(0, 150),
          score: score / (terms.length * 4),
          source: 'pagefind',
          metadata: {
            locale: doc.locale,
            section: doc.section,
            tags: doc.tags,
          },
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, query.limit ?? 20);
  }
}

// ============================================================
// Pagefind CLI build helper
// ============================================================

/**
 * Build a Pagefind index for a static site.
 * Runs: npx pagefind --site <distDir> --output-subdir pagefind
 *
 * This should be called as a post-build step in the Astro build pipeline.
 * In production, use the actual Pagefind CLI. In dev/test, use InMemoryPagefindIndex.
 */
export interface PagefindBuildOptions {
  /** Path to the built static site (e.g., 'apps/web/dist'). */
  siteDir: string;
  /** Output subdirectory within the site (default: 'pagefind'). */
  outputSubdir?: string;
  /** Optional glob of files to index (default: all HTML files). */
  glob?: string;
  /** Verbose output. */
  verbose?: boolean;
}

/**
 * Generate the Pagefind build command string.
 * The caller (e.g., a build script) should execute this command.
 */
export function pagefindBuildCommand(opts: PagefindBuildOptions): string {
  const parts = ['npx', 'pagefind', '--site', opts.siteDir];
  if (opts.outputSubdir) {
    parts.push('--output-subdir', opts.outputSubdir);
  } else {
    parts.push('--output-subdir', 'pagefind');
  }
  if (opts.glob) {
    parts.push('--glob', opts.glob);
  }
  if (opts.verbose) {
    parts.push('--verbose');
  }
  return parts.join(' ');
}

// ============================================================
// Client-side Pagefind search (browser)
// ============================================================

/**
 * Client-side Pagefind search interface.
 * In the browser, Pagefind provides a JS API via `window.pagefind`.
 * This wrapper loads the Pagefind search module and queries it.
 *
 * Usage in Astro/React:
 *   const searcher = new PagefindClient('/pagefind/');
 *   const results = await searcher.search({ query: 'AI Computer', locale: 'vi' });
 */
export class PagefindClient implements SearchIndex {
  private basePath: string;
  private pagefind: any = null;

  constructor(basePath = '/pagefind/') {
    this.basePath = basePath;
  }

  private async loadPagefind(): Promise<any> {
    if (this.pagefind) return this.pagefind;
    // In the browser, dynamically import the Pagefind search module
    if (typeof window !== 'undefined') {
      try {
        const mod = await import(/* @vite-ignore */ `${this.basePath}pagefind.js`);
        this.pagefind = mod;
      } catch {
        // Pagefind not yet built — return empty results
        this.pagefind = null;
      }
    }
    return this.pagefind;
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const pf = await this.loadPagefind();
    if (!pf) return [];

    const searchOpts: any = {};
    if (query.filters) {
      searchOpts.filters = query.filters;
    }
    if (query.limit) {
      searchOpts.limit = query.limit;
    }

    const raw = await pf.search(query.query, searchOpts);
    const results: SearchResult[] = [];

    for (const hit of raw?.results ?? []) {
      const data = await hit.data();
      let excerpt = data?.excerpt ?? '';
      // Strip HTML tags from excerpt
      excerpt = excerpt.replace(/<[^>]*>/g, '');
      results.push({
        id: hit.id,
        title: data?.meta?.title ?? hit.id,
        url: data?.url ?? hit.url,
        excerpt,
        score: hit.score ?? 0,
        source: 'pagefind',
        metadata: {
          locale: data?.meta?.locale,
          section: data?.meta?.section,
        },
      });
    }

    // Filter by locale if specified
    const filtered = query.locale && query.locale !== 'all'
      ? results.filter((r) => r.metadata?.locale === query.locale)
      : results;

    return filtered;
  }

  async index(_doc: IndexableDocument): Promise<void> {
    // Pagefind indexes at build time, not at runtime
    throw new Error('pagefind_indexes_at_build_time_use_index_method_on_build');
  }
}
