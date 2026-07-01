# Nguyen AI — Gen2 Integration Plan: Qdrant + LlamaIndex + Mem0

**Status:** PLANNING — Gen2 repo not accessible from this workspace
**Priority:** P0 — blocks Memory, Knowledge, and Roots Super Apps
**Target:** Gen2 product system (maytinhai.org)
**Owner:** Gen2 dev team
**Timeline:** Sprint 1-2 (parallel with app.nguyenai.net scaffold)

---

## Executive summary

Gen2 (maytinhai.org) currently lacks three P0 components required for core Nguyen AI features:

| Tool | Gap | Blocks |
|------|-----|--------|
| Qdrant + pgvector | No vector store | Memory search, Knowledge RAG, Roots matching |
| LlamaIndex | No RAG pipeline | Knowledge Super App, document Q&A, evidence retrieval |
| Mem0 | No persistent memory | Long-term Memory feature, Agent context retention |

These three tools are available in the Google Drive folder `ai-dev-stack-repos` (verified 2026-07-01). This document defines the integration plan.

---

## 1. Qdrant + pgvector integration

### 1.1 Purpose
Qdrant is a vector similarity search engine. pgvector extends PostgreSQL with vector operations. Together they provide:
- Semantic search over user documents (Data Vault)
- Agent memory retrieval (long-term context)
- Knowledge base RAG (retrieval-augmented generation)
- Roots Super App (family tree matching, record similarity)

### 1.2 Architecture

```
User Document → Embedding API (OpenAI/Voyage) → Qdrant Collection
                                                    ↓
User Query → Embedding → Qdrant Search → Top-K Results → LLM Context
```

### 1.3 Implementation steps

#### Step 1: Deploy Qdrant
- Option A: Qdrant Cloud (managed, free tier 1GB)
- Option B: Self-hosted on Cloudflare Workers (not supported — use external)
- Option C: Self-hosted on Fly.io / Railway
- **Recommended:** Qdrant Cloud for development, dedicated instance for production

#### Step 2: Add pgvector to PostgreSQL
- If using Neon PostgreSQL: pgvector is available as an extension
- If using Cloudflare D1: pgvector NOT supported — use Qdrant only
- **Recommended:** Neon PostgreSQL with pgvector for metadata + Qdrant for vectors

#### Step 3: Create Gen2 package `@iai/vector-store`
```
gen2-maytinhai-org/packages/vector-store/
├── src/
│   ├── index.ts          # exports
│   ├── qdrant-client.ts  # Qdrant connection + collection management
│   ├── embedding.ts      # Embedding API wrapper (OpenAI, Voyage, local)
│   ├── search.ts         # Semantic search with filters
│   └── types.ts          # TypeScript types
├── package.json
└── README.md
```

#### Step 4: Define collections
```typescript
// Per-user collections (data isolation)
const collections = {
  userMemory: (userId: string) => `user_${userId}_memory`,
  userVault: (userId: string) => `user_${userId}_vault`,
  userKnowledge: (userId: string) => `user_${userId}_knowledge`,
  globalRoots: 'global_roots',  // shared genealogy index
};
```

#### Step 5: API surface
```typescript
interface VectorStore {
  ingest(userId: string, collection: string, documents: Document[]): Promise<void>;
  search(userId: string, collection: string, query: string, topK: number): Promise<SearchResult[]>;
  delete(userId: string, collection: string, ids: string[]): Promise<void>;
  createCollection(userId: string, collection: string): Promise<void>;
}
```

### 1.4 Privacy considerations
- Each user gets isolated collections (no cross-user search)
- Vectors stored with metadata: { userId, source, type, createdAt, privacyLevel }
- Deletion API required for PDPD 91/2025 compliance (right to erasure)
- No embeddings of living-person data without explicit consent

---

## 2. LlamaIndex integration

### 2.1 Purpose
LlamaIndex is a data framework for connecting custom data sources to LLMs. It provides:
- Document ingestion pipelines (PDF, DOCX, images, audio transcripts)
- Chunking strategies (sentence, paragraph, semantic)
- Index construction (vector, tree, keyword, knowledge graph)
- Query engines (semantic, hybrid, sub-question, router)
- Response synthesis with citations

### 2.2 Architecture

```
Data Vault Files → LlamaIndex Ingestion → Chunks → Embeddings → Qdrant
                                                                    ↓
User Question → LlamaIndex Query Engine → Qdrant Retrieval → LLM → Response + Citations
```

### 2.3 Implementation steps

#### Step 1: Create Gen2 package `@iai/rag-sdk`
```
gen2-maytinhai-org/packages/rag-sdk/
├── src/
│   ├── index.ts              # exports
│   ├── ingestion.ts          # Document ingestion pipeline
│   ├── chunking.ts           # Chunking strategies
│   ├── query-engine.ts       # Query engine with routing
│   ├── response-synth.ts     # Response synthesis with citations
│   ├── evidence.ts           # Evidence label extraction
│   └── types.ts              # TypeScript types
├── package.json
└── README.md
```

#### Step 2: Document loaders
```typescript
// Supported file types for Data Vault
const loaders = {
  pdf: PDFReader,
  docx: DocxReader,
  txt: TextReader,
  csv: CSVReader,
  html: HTMLReader,
  image: ImageReader,        // OCR via Tesseract or cloud
  audio: AudioTranscriber,   // Whisper API
  video: VideoTranscriber,   // Whisper API + frame extraction
};
```

#### Step 3: Query engine types
```typescript
type QueryEngineType =
  | 'semantic'        // vector search
  | 'keyword'         // BM25
  | 'hybrid'          // vector + keyword
  | 'tree'            // hierarchical summarization
  | 'knowledge_graph' // entity-relationship
  | 'router';         // auto-select based on query type
```

#### Step 4: Evidence integration
LlamaIndex responses must include evidence labels per AGENTS.md:
```typescript
interface RAGResponse {
  answer: string;
  citations: Citation[];
  evidenceLabels: EvidenceLabel[];  // verified, primary, secondary, oral, insufficient, disputed, cannot_conclude
  confidence: number;
}
```

#### Step 5: Super App integration points
- **Knowledge Super App:** `rag-sdk` for document Q&A
- **Roots Super App:** `rag-sdk` for genealogy record search
- **Research Super App:** `rag-sdk` for academic paper analysis
- **Memory feature:** `rag-sdk` for memory retrieval (via Mem0)

---

## 3. Mem0 integration

### 3.1 Purpose
Mem0 is a memory layer for AI applications. It provides:
- Long-term user memory (preferences, facts, context)
- Memory deduplication and consolidation
- Memory search and retrieval
- Memory expiration and management
- Privacy controls (per-user isolation)

### 3.2 Architecture

```
User Interaction → Mem0.add(memory) → Mem0 Store (Qdrant-backed)
                                          ↓
Agent Context → Mem0.search(query) → Relevant Memories → Agent System Prompt
```

### 3.3 Implementation steps

#### Step 1: Create Gen2 package `@iai/memory-sdk`
```
gen2-maytinhai-org/packages/memory-sdk/
├── src/
│   ├── index.ts          # exports
│   ├── mem0-client.ts    # Mem0 connection + configuration
│   ├── memory-types.ts   # Memory type definitions
│   ├── retention.ts      # Memory retention policies
│   ├── privacy.ts        # Privacy controls + deletion
│   └── types.ts          # TypeScript types
├── package.json
└── README.md
```

#### Step 2: Memory types
```typescript
type MemoryType =
  | 'preference'     // user likes/dislikes
  | 'fact'           // user-stated facts
  | 'context'        // conversation context
  | 'episodic'       // specific events
  | 'semantic'       // general knowledge about user
  | 'procedural';    // how-to knowledge

interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  embedding: number[];
  metadata: {
    createdAt: number;
    lastAccessed: number;
    accessCount: number;
    privacyLevel: 'private' | 'family' | 'public';
    source: string;
  };
}
```

#### Step 3: Retention policies
```typescript
const retentionPolicies = {
  preference: { ttl: Infinity, maxItems: 1000 },
  fact: { ttl: Infinity, maxItems: 5000 },
  context: { ttl: 7 * 24 * 60 * 60 * 1000, maxItems: 100 },  // 7 days
  episodic: { ttl: 90 * 24 * 60 * 60 * 1000, maxItems: 500 },  // 90 days
  semantic: { ttl: Infinity, maxItems: 2000 },
  procedural: { ttl: Infinity, maxItems: 500 },
};
```

#### Step 4: Agent integration
```typescript
// Before each agent execution, inject relevant memories
async function buildAgentContext(userId: string, query: string): Promise<string> {
  const memories = await mem0.search(userId, query, { topK: 10 });
  return memories.map(m => `[${m.type}] ${m.content}`).join('\n');
}
```

#### Step 5: Privacy + PDPD compliance
- All memories isolated per userId
- `deleteAll(userId)` — full memory erasure (right to be forgotten)
- `deleteByType(userId, type)` — selective deletion
- `exportAll(userId)` — data portability (right to access)
- No memory sharing between users
- Living-person data requires explicit consent before storage

---

## 4. Integration sequence

### Sprint 1 (Week 1-2)
1. Deploy Qdrant Cloud (free tier)
2. Create `@iai/vector-store` package
3. Create `@iai/memory-sdk` package (Mem0 + Qdrant)
4. Write integration tests

### Sprint 2 (Week 3-4)
5. Create `@iai/rag-sdk` package (LlamaIndex + Qdrant)
6. Integrate `@iai/memory-sdk` into Agent execution pipeline
7. Integrate `@iai/rag-sdk` into Knowledge Super App
8. Wire up Data Vault ingestion to `@iai/rag-sdk`

### Sprint 3 (Week 5-6)
9. Integrate Roots Super App with `@iai/rag-sdk` + `@iai/vector-store`
10. Add evidence labeling to RAG responses
11. Privacy controls audit
12. Performance benchmarking

---

## 5. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| qdrant-client | ^1.9.0 | Qdrant vector DB client |
| pgvector | ^0.3.0 | PostgreSQL vector extension |
| llamaindex | ^0.11.0 | RAG framework |
| mem0ai | ^0.0.20 | Memory layer |
| openai | ^4.60.0 | Embedding API |
| @neondatabase/serverless | ^0.9.0 | Neon PostgreSQL client |

---

## 6. Risk mitigation

| Risk | Mitigation |
|------|------------|
| Qdrant Cloud free tier limits (1GB) | Monitor usage, upgrade to paid tier before 80% capacity |
| Embedding API costs | Use smaller models (text-embedding-3-small) for non-critical, large for critical |
| LlamaIndex bundle size | Tree-shake unused components, use server-side only |
| Mem0 maturity | Wrap in `@iai/memory-sdk` abstraction for easy replacement |
| PDPD compliance | Per-user isolation, deletion API, audit log, DPIA before launch |

---

## 7. Success criteria

- [ ] Qdrant deployed and accessible from Gen2
- [ ] `@iai/vector-store` package published internally
- [ ] `@iai/memory-sdk` package published internally
- [ ] `@iai/rag-sdk` package published internally
- [ ] Agent execution includes memory context from Mem0
- [ ] Knowledge Super App can ingest and query documents
- [ ] Data Vault files are automatically indexed on upload
- [ ] Roots Super App can search genealogy records semantically
- [ ] All responses include evidence labels
- [ ] PDPD deletion API works end-to-end
- [ ] Integration tests pass
- [ ] Performance: search < 200ms p95

---

## 8. P1-P2 tools (after P0)

| Tool | Priority | Sprint | Action |
|------|----------|--------|--------|
| Langfuse | P1 | 3 | Add to `@iai/providers` for LLM tracing |
| Temporal | P1 | 3 | Replace in-memory-store for durable workflows |
| OpenFGA | P2 | 4 | Migrate RBAC to fine-grained authorization |
| Better Auth | P2 | 4 | Replace custom auth-sdk for SSO + passkeys |
| MCP servers | P3 | 5 | Expose tool registry via MCP |
| n8n | P3 | 5 | Deploy for end-user visual automation |

---

_Generated 2026-07-02 by Devin. Status: planning document. Gen2 repo (gen2-maytinhai-org) not accessible from this workspace — Gen2 dev team to execute._
