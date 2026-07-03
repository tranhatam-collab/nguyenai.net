/**
 * @nai/evidence — Proof record, audit trail, and evidence pack export.
 *
 * Per DATA_CLASSIFICATION_AND_RETENTION.md + Founder Build Directive Phase 3 task 3.8:
 * - Every command execution produces an evidence record (proof).
 * - Evidence records are append-only and tamper-evident
 *   (HMAC-SHA256 signature + hash chain linking records).
 * - Evidence packs can be exported as signed JSON for external verification.
 * - Integrates with @nai/audit for the audit trail.
 *
 * Storage: InMemory (dev/test) — interface swappable to D1/Postgres/R2 in prod.
 * Signing: HMAC-SHA256 with shared secret + hash chain (prev_hash).
 */

import { logAuditEvent } from '@nai/audit';

// ============================================================
// Types
// ============================================================

/** Kind of proof captured by an evidence record. */
export type ProofType =
  | 'command_executed'
  | 'command_failed'
  | 'command_cancelled'
  | 'tool_called'
  | 'tool_output_captured'
  | 'agent_decision'
  | 'approval_granted'
  | 'approval_denied'
  | 'memory_written'
  | 'memory_read'
  | 'rag_cited'
  | 'workflow_completed'
  | 'external_action_executed';

/** Severity / classification of the evidence record. */
export type EvidenceClass = 'public' | 'internal' | 'sensitive' | 'restricted';

/** A single evidence record (proof). Append-only. */
export interface EvidenceRecord {
  evidence_id: string;
  command_id: string;
  user_id: string;
  tenant_id: string;
  agent_id: string;
  proof_type: ProofType;
  classification: EvidenceClass;
  /** Arbitrary structured payload (input, output, tool calls, citations...). */
  payload: Record<string, unknown>;
  /** ISO timestamp when the proof was captured. */
  captured_at: string;
  /** Hash of the previous record in the tenant chain (genesis = 'genesis'). */
  prev_hash: string;
  /** SHA-256 hash of this record's canonical content (excludes signature). */
  record_hash: string;
  /** HMAC-SHA256 signature over record_hash. */
  signature: string;
}

/** Storage interface — swap InMemory for D1/Postgres/R2 in production. */
export interface EvidenceStore {
  append(rec: EvidenceRecord): Promise<void>;
  get(evidenceId: string): Promise<EvidenceRecord | null>;
  listForCommand(commandId: string): Promise<EvidenceRecord[]>;
  listForTenant(tenantId: string, limit?: number): Promise<EvidenceRecord[]>;
  /** Returns the most recent record hash for a tenant (for chain continuation). */
  lastHash(tenantId: string): Promise<string>;
}

/** Exported, self-describing evidence pack (signed JSON). */
export interface EvidencePack {
  pack_id: string;
  tenant_id: string;
  command_id: string | null;
  generated_at: string;
  record_count: number;
  records: EvidenceRecord[];
  /** HMAC-SHA256 over the canonical pack body (everything except pack_signature). */
  pack_hash: string;
  pack_signature: string;
  algorithm: 'hmac-sha256';
  chain_verified: boolean;
}

// ============================================================
// Crypto helpers — HMAC-SHA256 + SHA-256 (Web Crypto, Workers-compatible)
// ============================================================

const encoder = new TextEncoder();

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return bufToHex(buf);
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return bufToHex(sig);
}

function bufToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Canonical content of a record used for hashing.
 * Excludes `signature` (it is computed over this content).
 * Stable key order ensures reproducible hashes.
 */
function recordCanonicalContent(rec: Omit<EvidenceRecord, 'signature'>): string {
  return JSON.stringify({
    evidence_id: rec.evidence_id,
    command_id: rec.command_id,
    user_id: rec.user_id,
    tenant_id: rec.tenant_id,
    agent_id: rec.agent_id,
    proof_type: rec.proof_type,
    classification: rec.classification,
    payload: rec.payload,
    captured_at: rec.captured_at,
    prev_hash: rec.prev_hash,
    record_hash: rec.record_hash,
  }, Object.keys({
    evidence_id: 0,
    command_id: 0,
    user_id: 0,
    tenant_id: 0,
    agent_id: 0,
    proof_type: 0,
    classification: 0,
    payload: 0,
    captured_at: 0,
    prev_hash: 0,
    record_hash: 0,
  }).sort());
}

/** Canonical body of a pack used for pack_hash (excludes pack_hash + pack_signature). */
function packCanonicalBody(pack: Omit<EvidencePack, 'pack_hash' | 'pack_signature'>): string {
  return JSON.stringify(pack, Object.keys({
    pack_id: 0,
    tenant_id: 0,
    command_id: 0,
    generated_at: 0,
    record_count: 0,
    records: 0,
    algorithm: 0,
    chain_verified: 0,
  }).sort());
}

// ============================================================
// In-memory store
// ============================================================

export class InMemoryEvidenceStore implements EvidenceStore {
  private records = new Map<string, EvidenceRecord>();
  private byCommand = new Map<string, string[]>();
  private byTenant = new Map<string, string[]>();

  async append(rec: EvidenceRecord): Promise<void> {
    this.records.set(rec.evidence_id, rec);
    pushIndex(this.byCommand, rec.command_id, rec.evidence_id);
    pushIndex(this.byTenant, rec.tenant_id, rec.evidence_id);
  }

  async get(evidenceId: string): Promise<EvidenceRecord | null> {
    return this.records.get(evidenceId) ?? null;
  }

  async listForCommand(commandId: string): Promise<EvidenceRecord[]> {
    const ids = this.byCommand.get(commandId) ?? [];
    return ids.map((id) => this.records.get(id)!).filter(Boolean);
  }

  async listForTenant(tenantId: string, limit = 100): Promise<EvidenceRecord[]> {
    const ids = this.byTenant.get(tenantId) ?? [];
    return ids
      .slice(-limit)
      .map((id) => this.records.get(id)!)
      .filter(Boolean);
  }

  async lastHash(tenantId: string): Promise<string> {
    const ids = this.byTenant.get(tenantId) ?? [];
    if (ids.length === 0) return 'genesis';
    const last = this.records.get(ids[ids.length - 1]!);
    return last ? last.record_hash : 'genesis';
  }
}

function pushIndex(idx: Map<string, string[]>, key: string, value: string): void {
  const arr = idx.get(key);
  if (arr) arr.push(value);
  else idx.set(key, [value]);
}

// ============================================================
// Store singleton (process-wide default)
// ============================================================

let defaultStore: EvidenceStore = new InMemoryEvidenceStore();

export function setEvidenceStore(store: EvidenceStore): void {
  defaultStore = store;
}

export function getEvidenceStore(): EvidenceStore {
  return defaultStore;
}

// ============================================================
// Core API — record + export + verify
// ============================================================

export interface RecordEvidenceInput {
  command_id: string;
  user_id: string;
  tenant_id: string;
  agent_id: string;
  proof_type: ProofType;
  classification?: EvidenceClass;
  payload: Record<string, unknown>;
}

/**
 * Capture a proof record. Computes hash chain + HMAC signature,
 * persists to the store, and emits an audit event.
 *
 * Returns the persisted record (including signature).
 */
export async function recordEvidence(
  input: RecordEvidenceInput,
  signingSecret: string,
): Promise<EvidenceRecord> {
  const store = getEvidenceStore();
  const evidenceId = crypto.randomUUID();
  const capturedAt = new Date().toISOString();
  const prevHash = await store.lastHash(input.tenant_id);

  // record_hash covers identity + content + chain link (excludes signature).
  const partial: Omit<EvidenceRecord, 'signature'> = {
    evidence_id: evidenceId,
    command_id: input.command_id,
    user_id: input.user_id,
    tenant_id: input.tenant_id,
    agent_id: input.agent_id,
    proof_type: input.proof_type,
    classification: input.classification ?? 'internal',
    payload: input.payload,
    captured_at: capturedAt,
    prev_hash: prevHash,
    record_hash: '', // placeholder, computed below
  };

  // record_hash = SHA-256(canonical content without record_hash + without signature)
  const hashInput = JSON.stringify({
    evidence_id: partial.evidence_id,
    command_id: partial.command_id,
    user_id: partial.user_id,
    tenant_id: partial.tenant_id,
    agent_id: partial.agent_id,
    proof_type: partial.proof_type,
    classification: partial.classification,
    payload: partial.payload,
    captured_at: partial.captured_at,
    prev_hash: partial.prev_hash,
  });
  partial.record_hash = await sha256(hashInput);

  const signature = await hmacSha256(signingSecret, partial.record_hash);

  const record: EvidenceRecord = { ...partial, signature };
  await store.append(record);

  // Mirror to audit trail (per integration requirement).
  await logAuditEvent({
    event_type: 'tool_called', // closest existing audit type; evidence has its own store
    user_id: input.user_id,
    tenant_id: input.tenant_id,
    session_id: null,
    actor_ip: null,
    user_agent: null,
    target: `evidence:${record.evidence_id}`,
    result: 'success',
    metadata: {
      evidence_id: record.evidence_id,
      command_id: input.command_id,
      agent_id: input.agent_id,
      proof_type: input.proof_type,
      classification: record.classification,
      record_hash: record.record_hash,
    },
  });

  return record;
}

/**
 * Export an evidence pack for a tenant (optionally filtered to one command).
 * The pack is self-describing and signed; external parties can verify it
 * with `verifyEvidencePack()` and the shared secret.
 */
export async function exportEvidencePack(
  tenantId: string,
  signingSecret: string,
  commandId?: string,
): Promise<EvidencePack> {
  const store = getEvidenceStore();
  const records = commandId
    ? await store.listForCommand(commandId)
    : await store.listForTenant(tenantId, 1000);

  const chainVerified = await verifyChain(records);
  const packId = crypto.randomUUID();
  const generatedAt = new Date().toISOString();

  const packBody: Omit<EvidencePack, 'pack_signature'> = {
    pack_id: packId,
    tenant_id: tenantId,
    command_id: commandId ?? null,
    generated_at: generatedAt,
    record_count: records.length,
    records,
    pack_hash: '',
    algorithm: 'hmac-sha256',
    chain_verified: chainVerified,
  };
  // pack_hash covers body excluding pack_hash + pack_signature
  const { pack_hash: _ph, ...bodyForHash } = packBody;
  packBody.pack_hash = await sha256(packCanonicalBody(bodyForHash));
  const packSignature = await hmacSha256(signingSecret, packBody.pack_hash);

  return { ...packBody, pack_signature: packSignature };
}

/**
 * Verify an evidence pack externally:
 * 1. Re-compute pack_hash and compare.
 * 2. Re-compute pack_signature and compare.
 * 3. Verify the internal hash chain.
 *
 * Returns true only if all three checks pass.
 */
export async function verifyEvidencePack(
  pack: EvidencePack,
  signingSecret: string,
): Promise<boolean> {
  try {
    // 1. pack_hash (covers body excluding pack_hash + pack_signature)
    const { pack_signature: _sig, pack_hash: _ph, ...body } = pack;
    const expectedPackHash = await sha256(packCanonicalBody(body));
    if (expectedPackHash !== pack.pack_hash) return false;

    // 2. pack_signature
    const expectedSig = await hmacSha256(signingSecret, pack.pack_hash);
    if (expectedSig !== pack.pack_signature) return false;

    // 3. chain + per-record signatures
    return await verifyChain(pack.records, signingSecret);
  } catch {
    return false;
  }
}

/**
 * Verify the internal hash chain of a list of records.
 * - First record's prev_hash must be 'genesis'.
 * - Each record's prev_hash must equal the previous record's record_hash.
 * - Each record_hash must recompute correctly.
 * - Each signature must recompute correctly (if secret provided).
 */
export async function verifyChain(
  records: EvidenceRecord[],
  signingSecret?: string,
): Promise<boolean> {
  for (let i = 0; i < records.length; i++) {
    const rec = records[i]!;
    const expectedPrev = i === 0 ? 'genesis' : records[i - 1]!.record_hash;
    if (rec.prev_hash !== expectedPrev) return false;

    // recompute record_hash
    const hashInput = JSON.stringify({
      evidence_id: rec.evidence_id,
      command_id: rec.command_id,
      user_id: rec.user_id,
      tenant_id: rec.tenant_id,
      agent_id: rec.agent_id,
      proof_type: rec.proof_type,
      classification: rec.classification,
      payload: rec.payload,
      captured_at: rec.captured_at,
      prev_hash: rec.prev_hash,
    });
    const recomputedHash = await sha256(hashInput);
    if (recomputedHash !== rec.record_hash) return false;

    if (signingSecret) {
      const recomputedSig = await hmacSha256(signingSecret, rec.record_hash);
      if (recomputedSig !== rec.signature) return false;
    }
  }
  return true;
}

/** Convenience: fetch records for a command (read path for UI / audit). */
export async function getEvidenceForCommand(commandId: string): Promise<EvidenceRecord[]> {
  return getEvidenceStore().listForCommand(commandId);
}

/** Convenience: fetch recent records for a tenant. */
export async function getEvidenceForTenant(tenantId: string, limit = 100): Promise<EvidenceRecord[]> {
  return getEvidenceStore().listForTenant(tenantId, limit);
}
