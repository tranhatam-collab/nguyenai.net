/**
 * @nai/scroll — RAG framework unit + integration test.
 *
 * Verifies:
 * - chunkDocument: produces overlapping chunks of target size
 * - indexDocument: chunks → embed → upsert into knowledge collection
 * - retrieve: semantic search returns relevant chunks
 * - defaultLabelForSourceType: maps source types to evidence labels
 * - overallLabel: weakest label wins
 * - synthesize: produces cited answer with inline [n] markers
 * - synthesize: empty chunks → insufficient-evidence
 * - ragQuery: full pipeline retrieve + synthesize
 * - evidence record generated for rag_cited event
 * - tenant isolation
 */

import {
  chunkDocument,
  indexDocument,
  retrieve,
  defaultLabelForSourceType,
  overallLabel,
  synthesize,
  ragQuery,
  type Document,
  type EmbedFn,
} from './index.ts';

import { setVectorStore, InMemoryVectorStore } from '@nai/compass';
import { setEvidenceStore, InMemoryEvidenceStore, getEvidenceForCommand } from '@nai/evidence';

let passed = 0;
let failed = 0;
const steps: string[] = [];

function assert(cond: boolean, msg: string): void {
  if (cond) { passed++; steps.push(`  \u2713 ${msg}`); }
  else { failed++; steps.push(`  \u2717 ${msg}`); console.error(`  \u2717 ${msg}`); }
}

// Deterministic mock embedding: hash text → 8-dim vector.
const mockEmbed: EmbedFn = async (texts) => {
  return texts.map((t) => {
    const vec = new Array(8).fill(0);
    for (let i = 0; i < t.length; i++) {
      vec[i % 8] = (vec[i % 8] ?? 0) + t.charCodeAt(i) % 10;
    }
    // Normalize for cosine.
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  });
};

async function main(): Promise<void> {
  setVectorStore(new InMemoryVectorStore());
  setEvidenceStore(new InMemoryEvidenceStore());

  // --- 1. chunkDocument ---
  const doc: Document = {
    id: 'doc_1',
    tenant_id: 't_1',
    title: 'Nguyen Family History — Hue Branch',
    source: 'archive://hue-branch.pdf',
    sourceType: 'branch-genealogy',
    content: 'A'.repeat(2000),
  };
  const chunks = chunkDocument(doc, { chunkSize: 800, overlap: 100 });
  assert(chunks.length > 1, 'chunkDocument produces multiple chunks for 2000-char doc');
  assert(chunks[0]!.text.length === 800, 'first chunk is 800 chars');
  assert(chunks[1]!.index === 1, 'second chunk index = 1');
  // overlap: chunk 1 starts at 700 (800 - 100)
  assert(chunks[1]!.text[0] === 'A', 'overlap chunk content is from same doc');

  // --- 2. indexDocument ---
  const indexed = await indexDocument(doc, mockEmbed, { tenantId: 't_1', embeddingDimension: 8 });
  assert(indexed === chunks.length, 'indexDocument returns chunk count');
  // Verify chunks are in the vector store via retrieve
  const retrieved = await retrieve('A'.repeat(100), mockEmbed, { tenantId: 't_1', topK: 3 });
  assert(retrieved.length > 0, 'retrieve returns chunks after indexing');
  assert(retrieved[0]!.document_id === 'doc_1', 'retrieved chunk has document_id');
  assert(retrieved[0]!.title === doc.title, 'retrieved chunk carries title');
  assert(retrieved[0]!.sourceType === 'branch-genealogy', 'retrieved chunk carries sourceType');

  // --- 3. defaultLabelForSourceType ---
  assert(defaultLabelForSourceType('primary') === 'primary-source', 'primary → primary-source');
  assert(defaultLabelForSourceType('secondary') === 'secondary-source', 'secondary → secondary-source');
  assert(defaultLabelForSourceType('branch-genealogy') === 'according-to-branch-genealogy', 'branch-genealogy → according-to-branch-genealogy');
  assert(defaultLabelForSourceType('oral-history') === 'oral-history', 'oral-history → oral-history');
  assert(defaultLabelForSourceType('web') === 'secondary-source', 'web → secondary-source');
  assert(defaultLabelForSourceType('unknown') === 'insufficient-evidence', 'unknown → insufficient-evidence');

  // --- 4. overallLabel ---
  assert(overallLabel(['verified', 'primary-source']) === 'primary-source', 'overall: weakest of verified+primary = primary-source');
  assert(overallLabel(['primary-source', 'insufficient-evidence']) === 'insufficient-evidence', 'overall: weakest wins (insufficient)');
  assert(overallLabel(['cannot-conclude']) === 'cannot-conclude', 'overall: single cannot-conclude');
  assert(overallLabel([]) === 'verified', 'overall: empty defaults to verified (index 0)');

  // --- 5. synthesize with chunks ---
  const synChunks = retrieved.slice(0, 2);
  const result = await synthesize('tell me about Nguyen family', synChunks, {
    tenantId: 't_1',
    userId: 'u_1',
    commandId: 'cmd_rag_1',
    agentId: 'nguyen-researcher',
    evidenceSigningSecret: 'test-secret',
  });
  assert(result.answer.includes('Query:'), 'synthesize answer includes Query:');
  assert(result.answer.includes('[1]'), 'synthesize answer has inline [1] citation');
  assert(result.citations.length === synChunks.length, 'citations count = chunks count');
  assert(result.citations[0]!.n === 1, 'first citation n=1');
  assert(result.citations[0]!.evidenceLabel === 'according-to-branch-genealogy', 'citation label from sourceType');
  assert(result.overallLabel === 'according-to-branch-genealogy', 'overall label from citations');

  // --- 6. synthesize with empty chunks ---
  const empty = await synthesize('nothing', [], {
    tenantId: 't_1', userId: 'u_1', commandId: 'cmd_empty', agentId: 'nguyen-researcher',
  });
  assert(empty.answer.includes('No sources found'), 'empty synthesize → "No sources found"');
  assert(empty.citations.length === 0, 'empty synthesize → 0 citations');
  assert(empty.overallLabel === 'insufficient-evidence', 'empty synthesize → insufficient-evidence');

  // --- 7. evidence record for rag_cited ---
  const evidence = await getEvidenceForCommand('cmd_rag_1');
  assert(evidence.length >= 1, 'evidence record generated for rag_cited');
  const ragEvidence = evidence.find((e) => e.proof_type === 'rag_cited');
  assert(ragEvidence !== undefined, 'rag_cited evidence proof_type exists');
  assert(ragEvidence?.payload.chunk_count === synChunks.length, 'rag_cited evidence has chunk_count');

  // --- 8. ragQuery full pipeline ---
  const fullResult = await ragQuery('family history Hue', mockEmbed, {
    tenantId: 't_1',
    userId: 'u_1',
    commandId: 'cmd_rag_2',
    agentId: 'nguyen-researcher',
    topK: 3,
    evidenceSigningSecret: 'test-secret',
  });
  assert(fullResult.retrieved.length > 0, 'ragQuery retrieved chunks');
  assert(fullResult.citations.length > 0, 'ragQuery produced citations');
  assert(fullResult.answer.length > 0, 'ragQuery produced answer');

  // --- 9. tenant isolation ---
  const otherTenant = await retrieve('family', mockEmbed, { tenantId: 't_other' });
  assert(otherTenant.length === 0, 'tenant isolation: other tenant retrieves 0 chunks');

  // --- 10. metadata filter in retrieve ---
  // Index a second doc with sourceType='primary'
  const doc2: Document = {
    id: 'doc_2',
    tenant_id: 't_1',
    title: 'Imperial Edict',
    source: 'archive://edict.txt',
    sourceType: 'primary',
    content: 'B'.repeat(1000),
  };
  await indexDocument(doc2, mockEmbed, { tenantId: 't_1', embeddingDimension: 8 });
  const primaryOnly = await retrieve('B'.repeat(50), mockEmbed, {
    tenantId: 't_1',
    metadata: { sourceType: 'primary' },
  });
  assert(primaryOnly.length > 0, 'metadata filter returns primary chunks');
  assert(primaryOnly.every((c) => c.sourceType === 'primary'), 'all filtered chunks are primary');

  // --- Report ---
  console.log('\n@nai/scroll test');
  console.log('----------------');
  for (const s of steps) console.log(s);
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
