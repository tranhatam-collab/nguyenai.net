/**
 * @nai/scroll — RAG framework: document indexing, retrieval, source synthesis + citation.
 *
 * Original source: https://github.com/run-llama/llama_index (Python, MIT)
 * This package does NOT bundle the original source. It provides a
 * TypeScript-native RAG layer per Founder Build Directive Phase 3 task 3.7.
 *
 * Responsibilities:
 * - Document ingestion: chunk documents, generate embeddings (caller-provided),
 *   store in @nai/compass (knowledge collection).
 * - Retrieval: semantic search over the knowledge collection.
 * - Source synthesis: combine retrieved chunks into a cited answer.
 * - Citation: every claim in the answer links to a source chunk with evidence labels.
 *
 * Integration:
 *   @nai/compass — vector store (knowledge collection)
 *   @nai/evidence — record proof for rag_cited events (optional)
 *
 * Ethics (per AGENTS.md):
 * - Use evidence labels: verified, primary-source, secondary-source,
 *   according-to-branch-genealogy, oral-history, insufficient-evidence,
 *   disputed, cannot-conclude.
 * - Never claim AI can confirm ancestry / royal lineage / bloodline.
 */

import { upsertVector, searchVectors, ensureDefaultCollections, type SearchHit } from '@nai/compass';
import { recordEvidence } from '@nai/evidence';

// ============================================================
// Types
// ============================================================

export interface Document {
  /** Unique id within (tenant, corpus). */
  id: string;
  tenant_id: string;
  /** Source title (e.g. "Nguyen family genealogy — Hue branch"). */
  title: string;
  /** Source url or file path (for citation). */
  source: string;
  /** Source type — drives evidence label defaults. */
  sourceType: SourceType;
  /** Full text content. */
  content: string;
  /** Optional metadata (author, date, language...). */
  metadata?: Record<string, unknown>;
}

export type SourceType =
  | 'primary'
  | 'secondary'
  | 'branch-genealogy'
  | 'oral-history'
  | 'web'
  | 'unknown';

/** A chunk of a document, ready for embedding + indexing. */
export interface DocumentChunk {
  /** Stable id: `${document.id}::chunk_${index}`. */
  id: string;
  document_id: string;
  tenant_id: string;
  /** Chunk index within the document (0-based). */
  index: number;
  /** Chunk text. */
  text: string;
  /** Embedding vector (caller-provided). */
  embedding: number[];
  /** Carried-through metadata from the parent document. */
  title: string;
  source: string;
  sourceType: SourceType;
  metadata: Record<string, unknown>;
}

/** A retrieved chunk with relevance score. */
export interface RetrievedChunk extends SearchHit {
  document_id: string;
  chunk_index: number;
  text: string;
  title: string;
  source: string;
  sourceType: SourceType;
  metadata: Record<string, unknown>;
}

/** A citation in a synthesized answer. */
export interface Citation {
  /** 1-based citation number in the answer. */
  n: number;
  document_id: string;
  title: string;
  source: string;
  sourceType: SourceType;
  /** Evidence label assigned to this source. */
  evidenceLabel: EvidenceLabel;
  /** Relevance score from retrieval. */
  score: number;
}

export type EvidenceLabel =
  | 'verified'
  | 'primary-source'
  | 'secondary-source'
  | 'according-to-branch-genealogy'
  | 'oral-history'
  | 'insufficient-evidence'
  | 'disputed'
  | 'cannot-conclude';

export interface SynthesisResult {
  /** The synthesized answer text with inline [n] citations. */
  answer: string;
  /** Citations referenced in the answer. */
  citations: Citation[];
  /** The chunks retrieved for this query. */
  retrieved: RetrievedChunk[];
  /** Evidence label for the overall answer. */
  overallLabel: EvidenceLabel;
}

// ============================================================
// Chunking
// ============================================================

export interface ChunkingOpts {
  /** Target chunk size in characters (default 800). */
  chunkSize?: number;
  /** Overlap between chunks in characters (default 100). */
  overlap?: number;
}

/** Split a document into overlapping text chunks. */
export function chunkDocument(doc: Document, opts: ChunkingOpts = {}): { index: number; text: string }[] {
  const chunkSize = opts.chunkSize ?? 800;
  const overlap = opts.overlap ?? 100;
  const chunks: { index: number; text: string }[] = [];
  const text = doc.content;
  let i = 0;
  let idx = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    const chunkText = text.slice(i, end);
    chunks.push({ index: idx, text: chunkText });
    idx++;
    if (end >= text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

// ============================================================
// Embedding interface — caller provides (no model bundled)
// ============================================================

export interface EmbedFn {
  (texts: string[]): Promise<number[][]>;
}

// ============================================================
// Indexing — ingest document into the knowledge collection
// ============================================================

export interface IndexOpts {
  tenantId: string;
  embeddingDimension?: number;
  chunking?: ChunkingOpts;
}

/**
 * Index a document: chunk → embed → upsert into the knowledge collection.
 * Returns the number of chunks indexed.
 */
export async function indexDocument(
  doc: Document,
  embedFn: EmbedFn,
  opts: IndexOpts,
): Promise<number> {
  await ensureDefaultCollections(opts.embeddingDimension ?? 1536);
  const chunks = chunkDocument(doc, opts.chunking);
  if (chunks.length === 0) return 0;

  const embeddings = await embedFn(chunks.map((c) => c.text));

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i]!;
    const chunkId = `${doc.id}::chunk_${c.index}`;
    await upsertVector('knowledge', chunkId, doc.tenant_id, embeddings[i]!, {
      document_id: doc.id,
      chunk_index: c.index,
      text: c.text,
      title: doc.title,
      source: doc.source,
      sourceType: doc.sourceType,
      metadata: doc.metadata ?? {},
    });
  }
  return chunks.length;
}

// ============================================================
// Retrieval — semantic search over the knowledge collection
// ============================================================

export interface RetrieveOpts {
  tenantId: string;
  /** Max chunks to retrieve (default 5). */
  topK?: number;
  /** Optional metadata filter (e.g. { sourceType: 'primary' }). */
  metadata?: Record<string, string | number | boolean>;
}

/** Retrieve relevant chunks for a query. */
export async function retrieve(
  query: string,
  embedFn: EmbedFn,
  opts: RetrieveOpts,
): Promise<RetrievedChunk[]> {
  const [queryVec] = await embedFn([query]);
  const hits = await searchVectors('knowledge', queryVec!, opts.tenantId, {
    metadata: opts.metadata,
    limit: opts.topK ?? 5,
  });
  return hits.map((h) => ({
    ...h,
    document_id: String(h.payload.document_id ?? ''),
    chunk_index: Number(h.payload.chunk_index ?? 0),
    text: String(h.payload.text ?? ''),
    title: String(h.payload.title ?? ''),
    source: String(h.payload.source ?? ''),
    sourceType: (h.payload.sourceType as SourceType) ?? 'unknown',
    metadata: (h.payload.metadata as Record<string, unknown>) ?? {},
  }));
}

// ============================================================
// Evidence labels — map source type to default label
// ============================================================

export function defaultLabelForSourceType(sourceType: SourceType): EvidenceLabel {
  switch (sourceType) {
    case 'primary':
      return 'primary-source';
    case 'secondary':
      return 'secondary-source';
    case 'branch-genealogy':
      return 'according-to-branch-genealogy';
    case 'oral-history':
      return 'oral-history';
    case 'web':
      return 'secondary-source';
    case 'unknown':
    default:
      return 'insufficient-evidence';
  }
}

/**
 * Determine the overall evidence label for a synthesis from its citations.
 * The weakest label wins (most uncertain).
 */
export function overallLabel(labels: EvidenceLabel[]): EvidenceLabel {
  const order: EvidenceLabel[] = [
    'verified',
    'primary-source',
    'secondary-source',
    'according-to-branch-genealogy',
    'oral-history',
    'insufficient-evidence',
    'disputed',
    'cannot-conclude',
  ];
  let worstIdx = 0;
  for (const label of labels) {
    const idx = order.indexOf(label);
    if (idx > worstIdx) worstIdx = idx;
  }
  return order[worstIdx]!;
}

// ============================================================
// Synthesis — combine retrieved chunks into a cited answer
// ============================================================

export interface SynthesizeOpts {
  tenantId: string;
  userId: string;
  commandId: string;
  agentId: string;
  /** Signing secret for evidence records (if recording rag_cited proof). */
  evidenceSigningSecret?: string;
}

/**
 * Synthesize a cited answer from retrieved chunks.
 *
 * This implementation produces a structured answer with inline [n] citations
 * and a citations list. In production, the LLM (via @nai/prism) would generate
 * the prose; here we produce a deterministic, citation-grounded summary so the
 * RAG pipeline is testable without an LLM.
 */
export async function synthesize(
  query: string,
  chunks: RetrievedChunk[],
  opts: SynthesizeOpts,
): Promise<SynthesisResult> {
  if (chunks.length === 0) {
    return {
      answer: `No sources found for query: "${query}". [insufficient-evidence]`,
      citations: [],
      retrieved: [],
      overallLabel: 'insufficient-evidence',
    };
  }

  const citations: Citation[] = chunks.map((c, i) => ({
    n: i + 1,
    document_id: c.document_id,
    title: c.title,
    source: c.source,
    sourceType: c.sourceType,
    evidenceLabel: defaultLabelForSourceType(c.sourceType),
    score: c.score,
  }));

  // Build a deterministic answer: summarize each chunk with a citation marker.
  const parts: string[] = [`Query: ${query}\n`];
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i]!;
    const snippet = c.text.slice(0, 200).replace(/\s+/g, ' ').trim();
    parts.push(`[${i + 1}] ${c.title} (${c.sourceType}): ${snippet}...`);
  }
  parts.push('');
  parts.push('Citations:');
  for (const cit of citations) {
    parts.push(`  [${cit.n}] ${cit.title} — ${cit.source} (${cit.evidenceLabel})`);
  }

  const labels = citations.map((c) => c.evidenceLabel);
  const overall = overallLabel(labels);
  parts.push('');
  parts.push(`Overall evidence: ${overall}`);

  const answer = parts.join('\n');

  // Record evidence for the RAG citation event (optional).
  if (opts.evidenceSigningSecret) {
    try {
      await recordEvidence({
        command_id: opts.commandId,
        user_id: opts.userId,
        tenant_id: opts.tenantId,
        agent_id: opts.agentId,
        proof_type: 'rag_cited',
        classification: 'internal',
        payload: {
          query,
          chunk_count: chunks.length,
          citations,
          overall_label: overall,
        },
      }, opts.evidenceSigningSecret);
    } catch {
      // Evidence failure should not mask the synthesis result.
    }
  }

  return {
    answer,
    citations,
    retrieved: chunks,
    overallLabel: overall,
  };
}

// ============================================================
// High-level RAG query — retrieve + synthesize in one call
// ============================================================

export interface RagQueryOpts {
  tenantId: string;
  userId: string;
  commandId: string;
  agentId: string;
  topK?: number;
  metadata?: Record<string, string | number | boolean>;
  evidenceSigningSecret?: string;
}

/** Full RAG pipeline: retrieve chunks → synthesize cited answer. */
export async function ragQuery(
  query: string,
  embedFn: EmbedFn,
  opts: RagQueryOpts,
): Promise<SynthesisResult> {
  const chunks = await retrieve(query, embedFn, {
    tenantId: opts.tenantId,
    topK: opts.topK,
    metadata: opts.metadata,
  });
  return synthesize(query, chunks, {
    tenantId: opts.tenantId,
    userId: opts.userId,
    commandId: opts.commandId,
    agentId: opts.agentId,
    evidenceSigningSecret: opts.evidenceSigningSecret,
  });
}
