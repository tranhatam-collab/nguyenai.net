/**
 * @nai/compass — Vector store for semantic search, evidence retrieval, knowledge base.
 *
 * Original source: https://github.com/qdrant/qdrant (Rust, Apache-2.0)
 * This package does NOT bundle the original source. It provides a
 * TypeScript-native interface + InMemory implementation swappable for
 * Qdrant Cloud / Qdrant dedicated in production.
 *
 * Per Founder Build Directive Phase 3 task 3.6:
 * - 3 collections: evidence, knowledge, memory
 * - upsert → search E2E
 * - Tenant-isolated (every record scoped to tenant_id)
 *
 * Storage: InMemory (dev/test) — interface swappable to Qdrant in prod.
 * Embeddings: caller provides vectors (the LLM platform / RAG layer computes them).
 *   This keeps the vector store pure and testable without an embedding model.
 */

// ============================================================
// Types
// ============================================================

/** The three canonical NAI vector collections. */
export type CollectionName = 'evidence' | 'knowledge' | 'memory';

/** A point stored in a vector collection. */
export interface VectorPoint {
  /** Stable unique id within (collection, tenant). */
  id: string;
  tenant_id: string;
  /** Dense embedding vector. Dimension must match the collection config. */
  vector: number[];
  /** Arbitrary metadata payload (filterable). */
  payload: Record<string, unknown>;
}

/** A search hit. */
export interface SearchHit {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

/** Filter clause for metadata. */
export interface SearchFilter {
  tenant_id: string;
  /** Optional exact-match metadata filters, e.g. { agent_id: 'nguyen-guide' }. */
  metadata?: Record<string, string | number | boolean>;
  /** Limit number of results. */
  limit?: number;
}

/** Collection configuration. */
export interface CollectionConfig {
  name: CollectionName;
  /** Vector dimension (e.g. 1536 for OpenAI text-embedding-3-small). */
  dimension: number;
  /** Distance metric. */
  distance: 'cosine' | 'dot' | 'euclidean';
}

/** Storage interface — swap InMemory for Qdrant client in production. */
export interface VectorStore {
  /** Create a collection if it does not exist. */
  ensureCollection(cfg: CollectionConfig): Promise<void>;
  /** Upsert a point. */
  upsert(collection: CollectionName, point: VectorPoint): Promise<void>;
  /** Upsert many points. */
  upsertBatch(collection: CollectionName, points: VectorPoint[]): Promise<void>;
  /** Get a point by id. */
  get(collection: CollectionName, tenantId: string, id: string): Promise<VectorPoint | null>;
  /** Delete a point by id. */
  delete(collection: CollectionName, tenantId: string, id: string): Promise<void>;
  /** Search by vector + filter. */
  search(collection: CollectionName, queryVector: number[], filter: SearchFilter): Promise<SearchHit[]>;
  /** Count points in a collection for a tenant. */
  count(collection: CollectionName, tenantId: string): Promise<number>;
}

// ============================================================
// Distance metrics
// ============================================================

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function dotProduct(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += a[i]! * b[i]!;
  return d;
}

function euclidean(a: number[], b: number[]): number {
  // Return similarity (higher = closer), so negate distance.
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i]! - b[i]!;
    sum += diff * diff;
  }
  return -Math.sqrt(sum);
}

function scoreBy(a: number[], b: number[], distance: 'cosine' | 'dot' | 'euclidean'): number {
  switch (distance) {
    case 'cosine':
      return cosine(a, b);
    case 'dot':
      return dotProduct(a, b);
    case 'euclidean':
      return euclidean(a, b);
  }
}

// ============================================================
// In-memory store
// ============================================================

interface InternalPoint extends VectorPoint {
  _dim: number;
}

export class InMemoryVectorStore implements VectorStore {
  private collections = new Map<CollectionName, CollectionConfig>();
  private points = new Map<CollectionName, Map<string, InternalPoint>>();

  async ensureCollection(cfg: CollectionConfig): Promise<void> {
    if (!this.collections.has(cfg.name)) {
      this.collections.set(cfg.name, cfg);
      this.points.set(cfg.name, new Map());
    }
  }

  private key(tenantId: string, id: string): string {
    return `${tenantId}::${id}`;
  }

  private validateDim(collection: CollectionName, vec: number[]): CollectionConfig {
    const cfg = this.collections.get(collection);
    if (!cfg) throw new Error(`Collection "${collection}" not initialized — call ensureCollection first`);
    if (vec.length !== cfg.dimension) {
      throw new Error(`Vector dimension mismatch: expected ${cfg.dimension}, got ${vec.length}`);
    }
    return cfg;
  }

  async upsert(collection: CollectionName, point: VectorPoint): Promise<void> {
    const cfg = this.validateDim(collection, point.vector);
    const store = this.points.get(collection)!;
    store.set(this.key(point.tenant_id, point.id), { ...point, _dim: cfg.dimension });
  }

  async upsertBatch(collection: CollectionName, points: VectorPoint[]): Promise<void> {
    for (const p of points) await this.upsert(collection, p);
  }

  async get(collection: CollectionName, tenantId: string, id: string): Promise<VectorPoint | null> {
    const store = this.points.get(collection);
    if (!store) return null;
    const p = store.get(this.key(tenantId, id));
    if (!p) return null;
    const { _dim, ...rest } = p;
    return rest;
  }

  async delete(collection: CollectionName, tenantId: string, id: string): Promise<void> {
    const store = this.points.get(collection);
    if (!store) return;
    store.delete(this.key(tenantId, id));
  }

  async search(collection: CollectionName, queryVector: number[], filter: SearchFilter): Promise<SearchHit[]> {
    const cfg = this.collections.get(collection);
    if (!cfg) return [];
    this.validateDim(collection, queryVector);
    const store = this.points.get(collection)!;
    const results: SearchHit[] = [];
    for (const p of store.values()) {
      if (p.tenant_id !== filter.tenant_id) continue;
      if (filter.metadata) {
        let match = true;
        for (const [k, v] of Object.entries(filter.metadata)) {
          if (p.payload[k] !== v) { match = false; break; }
        }
        if (!match) continue;
      }
      results.push({
        id: p.id,
        score: scoreBy(queryVector, p.vector, cfg.distance),
        payload: p.payload,
      });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, filter.limit ?? 10);
  }

  async count(collection: CollectionName, tenantId: string): Promise<number> {
    const store = this.points.get(collection);
    if (!store) return 0;
    let n = 0;
    for (const p of store.values()) if (p.tenant_id === tenantId) n++;
    return n;
  }
}

// ============================================================
// Store singleton
// ============================================================

let defaultStore: VectorStore = new InMemoryVectorStore();

export function setVectorStore(store: VectorStore): void {
  defaultStore = store;
}

export function getVectorStore(): VectorStore {
  return defaultStore;
}

// ============================================================
// Convenience: default collections + high-level API
// ============================================================

/** Default dimension for NAI collections (OpenAI text-embedding-3-small). */
export const DEFAULT_DIMENSION = 1536;

/** Default collection configs. */
export const DEFAULT_COLLECTIONS: CollectionConfig[] = [
  { name: 'evidence', dimension: DEFAULT_DIMENSION, distance: 'cosine' },
  { name: 'knowledge', dimension: DEFAULT_DIMENSION, distance: 'cosine' },
  { name: 'memory', dimension: DEFAULT_DIMENSION, distance: 'cosine' },
];

/** Ensure all default collections exist. */
export async function ensureDefaultCollections(dimension = DEFAULT_DIMENSION): Promise<void> {
  for (const cfg of DEFAULT_COLLECTIONS) {
    await defaultStore.ensureCollection({ ...cfg, dimension });
  }
}

/** Convenience upsert. */
export async function upsertVector(
  collection: CollectionName,
  id: string,
  tenantId: string,
  vector: number[],
  payload: Record<string, unknown>,
): Promise<void> {
  await defaultStore.upsert(collection, { id, tenant_id: tenantId, vector, payload });
}

/** Convenience search. */
export async function searchVectors(
  collection: CollectionName,
  queryVector: number[],
  tenantId: string,
  opts?: { metadata?: Record<string, string | number | boolean>; limit?: number },
): Promise<SearchHit[]> {
  return defaultStore.search(collection, queryVector, {
    tenant_id: tenantId,
    metadata: opts?.metadata,
    limit: opts?.limit,
  });
}
