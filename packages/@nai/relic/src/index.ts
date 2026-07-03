/**
 * @nai/relic — Long-term memory layer for the Nguyen AI Computer.
 *
 * Original source: https://github.com/mem0ai/mem0 (Python, Apache-2.0)
 * This package does NOT bundle the original source. It provides a
 * TypeScript-native memory service with 6 memory types per the Founder
 * Build Directive Phase 3 task 3.5.
 *
 * 6 memory types:
 *   session    — ephemeral, per-session working memory (cleared on logout)
 *   preference — user preferences (language, theme, defaults)
 *   project    — project-scoped facts and notes
 *   decision   — recorded decisions + rationale
 *   family     — Nguyen family / genealogy facts (private by default)
 *   founder    — founder profile + business context
 *
 * Storage: InMemory (dev/test) — interface swappable to Postgres / KV / mem0 in prod.
 * Privacy: family + founder memories are private by default per AGENTS.md privacy rules.
 * Tenant isolation: every memory is scoped to (tenant_id, user_id).
 */

// ============================================================
// Types
// ============================================================

export type MemoryType =
  | 'session'
  | 'preference'
  | 'project'
  | 'decision'
  | 'family'
  | 'founder';

export type MemoryVisibility = 'private' | 'tenant' | 'public';

export interface MemoryRecord {
  memory_id: string;
  tenant_id: string;
  user_id: string;
  memory_type: MemoryType;
  /** Human-readable key (e.g. "preferred_language", "ancestor:lam", "decision:pricing_v2"). */
  key: string;
  /** Structured or string value. */
  value: unknown;
  visibility: MemoryVisibility;
  /** Optional tags for filtering. */
  tags: string[];
  /** Optional embedding vector for semantic search (uses @nai/compass if provided). */
  embedding?: number[];
  /** ISO timestamps. */
  created_at: string;
  updated_at: string;
  /** ISO timestamp when the memory expires (session memories only). */
  expires_at: string | null;
}

export interface MemoryStore {
  write(rec: Omit<MemoryRecord, 'memory_id' | 'created_at' | 'updated_at'>): Promise<string>;
  read(tenantId: string, userId: string, key: string): Promise<MemoryRecord | null>;
  list(tenantId: string, userId: string, opts?: { type?: MemoryType; tags?: string[]; limit?: number }): Promise<MemoryRecord[]>;
  delete(tenantId: string, userId: string, key: string): Promise<void>;
  /** Search by semantic vector (optional — only if embeddings are stored). */
  search(tenantId: string, userId: string, queryVector: number[], opts?: { type?: MemoryType; limit?: number }): Promise<MemoryRecord[]>;
  /** Purge expired session memories. */
  purgeExpired(tenantId: string, userId: string): Promise<number>;
}

// ============================================================
// In-memory store
// ============================================================

export class InMemoryMemoryStore implements MemoryStore {
  private records = new Map<string, MemoryRecord>();
  private keyOf(tenantId: string, userId: string, key: string): string {
    return `${tenantId}::${userId}::${key}`;
  }

  async write(rec: Omit<MemoryRecord, 'memory_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const k = this.keyOf(rec.tenant_id, rec.user_id, rec.key);
    // Preserve created_at if updating an existing record.
    const existing = this.records.get(k);
    const record: MemoryRecord = {
      ...rec,
      memory_id: existing?.memory_id ?? id,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };
    this.records.set(k, record);
    return record.memory_id;
  }

  async read(tenantId: string, userId: string, key: string): Promise<MemoryRecord | null> {
    return this.records.get(this.keyOf(tenantId, userId, key)) ?? null;
  }

  async list(tenantId: string, userId: string, opts?: { type?: MemoryType; tags?: string[]; limit?: number }): Promise<MemoryRecord[]> {
    const out: MemoryRecord[] = [];
    for (const r of this.records.values()) {
      if (r.tenant_id !== tenantId || r.user_id !== userId) continue;
      if (opts?.type && r.memory_type !== opts.type) continue;
      if (opts?.tags && opts.tags.length > 0) {
        const hasAll = opts.tags.every((t) => r.tags.includes(t));
        if (!hasAll) continue;
      }
      out.push(r);
    }
    out.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return out.slice(0, opts?.limit ?? 100);
  }

  async delete(tenantId: string, userId: string, key: string): Promise<void> {
    this.records.delete(this.keyOf(tenantId, userId, key));
  }

  async search(tenantId: string, userId: string, queryVector: number[], opts?: { type?: MemoryType; limit?: number }): Promise<MemoryRecord[]> {
    const candidates: MemoryRecord[] = [];
    for (const r of this.records.values()) {
      if (r.tenant_id !== tenantId || r.user_id !== userId) continue;
      if (!r.embedding) continue;
      if (opts?.type && r.memory_type !== opts.type) continue;
      candidates.push(r);
    }
    // cosine similarity
    const scored = candidates.map((r) => ({
      rec: r,
      score: cosine(queryVector, r.embedding!),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, opts?.limit ?? 10).map((s) => s.rec);
  }

  async purgeExpired(tenantId: string, userId: string): Promise<number> {
    const now = Date.now();
    let n = 0;
    for (const [k, r] of this.records.entries()) {
      if (r.tenant_id !== tenantId || r.user_id !== userId) continue;
      if (r.expires_at && Date.parse(r.expires_at) < now) {
        this.records.delete(k);
        n++;
      }
    }
    return n;
  }
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ============================================================
// Store singleton
// ============================================================

let defaultStore: MemoryStore = new InMemoryMemoryStore();

export function setMemoryStore(store: MemoryStore): void {
  defaultStore = store;
}

export function getMemoryStore(): MemoryStore {
  return defaultStore;
}

// ============================================================
// High-level API — typed helpers for each memory type
// ============================================================

/** Default visibility per memory type (privacy defaults from AGENTS.md). */
export const DEFAULT_VISIBILITY: Record<MemoryType, MemoryVisibility> = {
  session: 'private',
  preference: 'private',
  project: 'tenant',
  decision: 'tenant',
  family: 'private',   // family data is private by default
  founder: 'private',  // founder profile is private by default
};

export interface WriteMemoryInput {
  tenant_id: string;
  user_id: string;
  memory_type: MemoryType;
  key: string;
  value: unknown;
  visibility?: MemoryVisibility;
  tags?: string[];
  embedding?: number[];
  expires_at?: string | null;
}

/** Write (upsert) a memory record. Returns the memory_id. */
export async function writeMemory(input: WriteMemoryInput): Promise<string> {
  return defaultStore.write({
    tenant_id: input.tenant_id,
    user_id: input.user_id,
    memory_type: input.memory_type,
    key: input.key,
    value: input.value,
    visibility: input.visibility ?? DEFAULT_VISIBILITY[input.memory_type],
    tags: input.tags ?? [],
    embedding: input.embedding,
    expires_at: input.expires_at ?? null,
  });
}

/** Read a memory record by key. */
export async function readMemory(tenantId: string, userId: string, key: string): Promise<MemoryRecord | null> {
  return defaultStore.read(tenantId, userId, key);
}

/** List memories, optionally filtered by type / tags. */
export async function listMemory(
  tenantId: string,
  userId: string,
  opts?: { type?: MemoryType; tags?: string[]; limit?: number },
): Promise<MemoryRecord[]> {
  return defaultStore.list(tenantId, userId, opts);
}

/** Delete a memory record. */
export async function deleteMemory(tenantId: string, userId: string, key: string): Promise<void> {
  return defaultStore.delete(tenantId, userId, key);
}

/** Semantic search over memories that have embeddings. */
export async function searchMemory(
  tenantId: string,
  userId: string,
  queryVector: number[],
  opts?: { type?: MemoryType; limit?: number },
): Promise<MemoryRecord[]> {
  return defaultStore.search(tenantId, userId, queryVector, opts);
}

/** Purge expired session memories. Returns count purged. */
export async function purgeExpiredMemory(tenantId: string, userId: string): Promise<number> {
  return defaultStore.purgeExpired(tenantId, userId);
}

// ============================================================
// Convenience: typed helpers per memory type
// ============================================================

export const SessionMemory = {
  write: (tenantId: string, userId: string, key: string, value: unknown, sessionId: string, ttlSeconds = 3600) =>
    writeMemory({
      tenant_id: tenantId, user_id: userId, memory_type: 'session', key, value,
      tags: [`session:${sessionId}`],
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    }),
  list: (tenantId: string, userId: string, sessionId: string) =>
    listMemory(tenantId, userId, { type: 'session', tags: [`session:${sessionId}`], limit: 100 }),
};

export const PreferenceMemory = {
  write: (tenantId: string, userId: string, key: string, value: unknown) =>
    writeMemory({ tenant_id: tenantId, user_id: userId, memory_type: 'preference', key, value }),
  read: (tenantId: string, userId: string, key: string) =>
    readMemory(tenantId, userId, `preference:${key}`),
};

export const FamilyMemory = {
  write: (tenantId: string, userId: string, key: string, value: unknown, tags: string[] = []) =>
    writeMemory({ tenant_id: tenantId, user_id: userId, memory_type: 'family', key, value, tags }),
  read: (tenantId: string, userId: string, key: string) =>
    readMemory(tenantId, userId, `family:${key}`),
};

export const FounderMemory = {
  write: (tenantId: string, userId: string, key: string, value: unknown, tags: string[] = []) =>
    writeMemory({ tenant_id: tenantId, user_id: userId, memory_type: 'founder', key, value, tags }),
  read: (tenantId: string, userId: string, key: string) =>
    readMemory(tenantId, userId, `founder:${key}`),
};
