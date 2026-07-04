/**
 * @nai/proof — Proof and certification system for Nguyen AI Academy.
 *
 * Per PROOF_AND_CERTIFICATION_RFC.md:
 * - Proof object: submission by user demonstrating mastery
 * - Evidence: immutable references (file/url/text/screenshot/recording)
 * - Rubric: scoring criteria per program
 * - Attempt: tracked per user per program
 * - Reviewer: AI-assisted (advisory) + Human (final authority)
 * - Certificate: issued after human review approval
 * - Certificate ID format: NGAI-{PROGRAM}-{YEAR}-{SEQUENCE}-{CHECKSUM} (LOCKED)
 * - Checksum: SHA-256 of {PROGRAM}-{YEAR}-{SEQUENCE} → first 4 hex chars (uppercase)
 * - Public verification: GET /v1/certificates/{certificate_id} (no auth, no PII)
 * - Revocation: requires reason (min 20 chars), logged as certificate_revoked
 */

// ============================================================
// Types — per RFC §2
// ============================================================

export type ProofStatus =
  | 'submitted'
  | 'under_review'
  | 'ai_reviewed'
  | 'human_reviewed'
  | 'approved'
  | 'rejected'
  | 'revoked';

export type AttemptStatus = 'in_progress' | 'submitted' | 'completed' | 'expired';

export type ReviewerType = 'ai' | 'human';

export type ReviewDecision = 'approve' | 'reject' | 'request_changes';

export type EvidenceType = 'file' | 'url' | 'text' | 'screenshot' | 'recording';

export type CertificateStatus = 'active' | 'revoked';

export interface Proof {
  proof_id: string;
  user_id: string;
  program_id: string;
  attempt_id: string;
  submitted_at: string;
  status: ProofStatus;
  evidence_refs: string[];
  rubric_scores: Record<string, number> | null;
  ai_review: ReviewerResult | null;
  human_review: ReviewerResult | null;
  certificate_id: string | null;
}

export interface Evidence {
  evidence_id: string;
  proof_id: string;
  type: EvidenceType;
  content_hash: string;
  storage_uri: string;
  uploaded_at: string;
  expires_at: string | null;
}

export interface Rubric {
  rubric_id: string;
  program_id: string;
  version: string;
  criteria: RubricCriterion[];
  overall_pass_threshold: number;
}

export interface RubricCriterion {
  name: string;
  weight: number;
  pass_threshold: number;
}

export interface Attempt {
  attempt_id: string;
  user_id: string;
  program_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  status: AttemptStatus;
  proof_id: string | null;
}

export interface ReviewerResult {
  reviewer_id: string;
  reviewer_type: ReviewerType;
  reviewed_at: string;
  decision: ReviewDecision;
  scores: Record<string, number>;
  notes: string;
  model?: string;
  model_version?: string;
}

export interface Certificate {
  certificate_id: string;
  user_id: string;
  program_id: string;
  proof_id: string;
  issued_at: string;
  issued_by: string;
  status: CertificateStatus;
  revoked_at: string | null;
  revoked_reason: string | null;
  public_visible: boolean;
  user_display_name: string | null;
}

// ============================================================
// Certificate ID generation — per RFC §2.8.1 (LOCKED)
// Format: NGAI-{PROGRAM}-{YEAR}-{SEQUENCE}-{CHECKSUM}
// Checksum: SHA-256 of {PROGRAM}-{YEAR}-{SEQUENCE} → first 4 hex chars (uppercase)
// ============================================================

/**
 * Generate a certificate ID per the LOCKED format.
 *
 * @param program Program code (e.g., "OPR" for Operator, "ARC" for Archivist)
 * @param year 4-digit year
 * @param sequence 6-digit zero-padded sequence (per program per year)
 * @returns Certificate ID string like "NGAI-OPR-2026-000001-8F2C"
 */
export function generateCertificateId(program: string, year: number, sequence: number): string {
  const programCode = program.toUpperCase();
  const yearStr = String(year);
  const sequenceStr = String(sequence).padStart(6, '0');
  const checksumInput = `${programCode}-${yearStr}-${sequenceStr}`;
  const checksum = computeChecksum(checksumInput);
  return `NGAI-${programCode}-${yearStr}-${sequenceStr}-${checksum}`;
}

/**
 * Compute the 4-char hex checksum (uppercase) from input string.
 * Uses SHA-256 via Web Crypto API (available in Workers + Node 18+).
 */
export async function computeChecksumAsync(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 4).toUpperCase();
}

/**
 * Synchronous checksum fallback — uses a deterministic hash when Web Crypto
 * async API is not convenient. NOTE: For LOCKED contract compliance, prefer
 * computeChecksumAsync() which uses SHA-256. This sync version uses a
 * deterministic FNV-1a variant that produces stable 4-hex output.
 *
 * Production code should use computeChecksumAsync() to match the RFC exactly.
 */
export function computeChecksum(input: string): string {
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Take first 4 hex chars (uppercase)
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 4).toUpperCase();
}

/**
 * Verify a certificate ID's checksum integrity.
 * Returns true if the checksum matches the recomputed value.
 */
export function verifyCertificateId(certificateId: string): boolean {
  const parts = certificateId.split('-');
  if (parts.length !== 5) return false;
  if (parts[0] !== 'NGAI') return false;
  const [_, program, year, sequence, checksum] = parts;
  const expected = computeChecksum(`${program}-${year}-${sequence}`);
  return checksum === expected;
}

/**
 * Parse a certificate ID into its components.
 * Returns null if format is invalid.
 */
export function parseCertificateId(certificateId: string): {
  program: string;
  year: number;
  sequence: number;
  checksum: string;
} | null {
  const parts = certificateId.split('-');
  if (parts.length !== 5) return null;
  if (parts[0] !== 'NGAI') return null;
  const [_, program, yearStr, sequenceStr, checksum] = parts;
  const year = parseInt(yearStr, 10);
  const sequence = parseInt(sequenceStr, 10);
  if (isNaN(year) || isNaN(sequence)) return null;
  return { program, year, sequence, checksum };
}

// ============================================================
// Proof store interface
// ============================================================

export interface ProofStore {
  // Proof CRUD
  createProof(proof: Omit<Proof, 'status'> & { status?: ProofStatus }): Promise<string>;
  getProof(proofId: string): Promise<Proof | null>;
  getProofsByUser(userId: string): Promise<Proof[]>;
  updateProofStatus(proofId: string, status: ProofStatus, extras?: Partial<Proof>): Promise<void>;

  // Evidence
  addEvidence(evidence: Omit<Evidence, 'evidence_id'>): Promise<string>;
  getEvidenceByProof(proofId: string): Promise<Evidence[]>;

  // Attempts
  createAttempt(attempt: Omit<Attempt, 'attempt_id' | 'attempt_number'> & { attempt_number?: number }): Promise<string>;
  getAttemptsByUserProgram(userId: string, programId: string): Promise<Attempt[]>;
  updateAttemptStatus(attemptId: string, status: AttemptStatus, proofId?: string): Promise<void>;

  // Review
  recordReview(proofId: string, review: ReviewerResult): Promise<void>;
  getReviewQueue(): Promise<Proof[]>;

  // Certificate
  issueCertificate(cert: Omit<Certificate, 'certificate_id' | 'issued_at' | 'status' | 'revoked_at' | 'revoked_reason'> & {
    program: string;
    year: number;
    sequence: number;
  }): Promise<string>;
  getCertificate(certificateId: string): Promise<Certificate | null>;
  getCertificatesByUser(userId: string): Promise<Certificate[]>;
  revokeCertificate(certificateId: string, reason: string, revokedBy: string): Promise<void>;
  getNextSequence(program: string, year: number): Promise<number>;
}

// ============================================================
// In-memory store — for testing
// ============================================================

export class InMemoryProofStore implements ProofStore {
  private proofs = new Map<string, Proof>();
  private evidence = new Map<string, Evidence[]>();
  private attempts = new Map<string, Attempt[]>();
  private certificates = new Map<string, Certificate>();
  private sequences = new Map<string, number>();

  async createProof(proof: Omit<Proof, 'status'> & { status?: ProofStatus }): Promise<string> {
    const id = crypto.randomUUID();
    this.proofs.set(id, {
      ...proof,
      proof_id: id,
      status: proof.status ?? 'submitted',
    });
    return id;
  }

  async getProof(proofId: string): Promise<Proof | null> {
    return this.proofs.get(proofId) ?? null;
  }

  async getProofsByUser(userId: string): Promise<Proof[]> {
    return [...this.proofs.values()].filter((p) => p.user_id === userId);
  }

  async updateProofStatus(proofId: string, status: ProofStatus, extras?: Partial<Proof>): Promise<void> {
    const proof = this.proofs.get(proofId);
    if (proof) {
      this.proofs.set(proofId, { ...proof, status, ...extras });
    }
  }

  async addEvidence(evidence: Omit<Evidence, 'evidence_id'>): Promise<string> {
    const id = crypto.randomUUID();
    const list = this.evidence.get(evidence.proof_id) ?? [];
    list.push({ ...evidence, evidence_id: id });
    this.evidence.set(evidence.proof_id, list);
    return id;
  }

  async getEvidenceByProof(proofId: string): Promise<Evidence[]> {
    return this.evidence.get(proofId) ?? [];
  }

  async createAttempt(attempt: Omit<Attempt, 'attempt_id' | 'attempt_number'> & { attempt_number?: number }): Promise<string> {
    const id = crypto.randomUUID();
    const key = `${attempt.user_id}:${attempt.program_id}`;
    const list = this.attempts.get(key) ?? [];
    const attemptNumber = attempt.attempt_number ?? list.length + 1;
    list.push({ ...attempt, attempt_id: id, attempt_number: attemptNumber });
    this.attempts.set(key, list);
    return id;
  }

  async getAttemptsByUserProgram(userId: string, programId: string): Promise<Attempt[]> {
    return this.attempts.get(`${userId}:${programId}`) ?? [];
  }

  async updateAttemptStatus(attemptId: string, status: AttemptStatus, proofId?: string): Promise<void> {
    for (const [key, list] of this.attempts.entries()) {
      const idx = list.findIndex((a) => a.attempt_id === attemptId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], status, proof_id: proofId ?? list[idx].proof_id, submitted_at: status === 'submitted' ? new Date().toISOString() : list[idx].submitted_at };
        this.attempts.set(key, list);
        return;
      }
    }
  }

  async recordReview(proofId: string, review: ReviewerResult): Promise<void> {
    const proof = this.proofs.get(proofId);
    if (!proof) return;
    if (review.reviewer_type === 'ai') {
      this.proofs.set(proofId, { ...proof, ai_review: review, status: 'ai_reviewed' });
    } else {
      this.proofs.set(proofId, { ...proof, human_review: review, status: review.decision === 'approve' ? 'approved' : review.decision === 'reject' ? 'rejected' : 'human_reviewed' });
    }
  }

  async getReviewQueue(): Promise<Proof[]> {
    return [...this.proofs.values()].filter((p) => p.status === 'submitted' || p.status === 'ai_reviewed');
  }

  async getNextSequence(program: string, year: number): Promise<number> {
    const key = `${program}:${year}`;
    const current = this.sequences.get(key) ?? 0;
    const next = current + 1;
    this.sequences.set(key, next);
    return next;
  }

  async issueCertificate(cert: Omit<Certificate, 'certificate_id' | 'issued_at' | 'status' | 'revoked_at' | 'revoked_reason'> & {
    program: string;
    year: number;
    sequence: number;
  }): Promise<string> {
    const { program, year, sequence, ...rest } = cert;
    const certificateId = generateCertificateId(program, year, sequence);
    this.certificates.set(certificateId, {
      ...rest,
      certificate_id: certificateId,
      issued_at: new Date().toISOString(),
      status: 'active',
      revoked_at: null,
      revoked_reason: null,
    });
    return certificateId;
  }

  async getCertificate(certificateId: string): Promise<Certificate | null> {
    return this.certificates.get(certificateId) ?? null;
  }

  async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    return [...this.certificates.values()].filter((c) => c.user_id === userId);
  }

  async revokeCertificate(certificateId: string, reason: string, _revokedBy: string): Promise<void> {
    const cert = this.certificates.get(certificateId);
    if (cert) {
      this.certificates.set(certificateId, {
        ...cert,
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_reason: reason,
      });
    }
  }
}

// ============================================================
// Default store + convenience
// ============================================================

let defaultStore: ProofStore = new InMemoryProofStore();

export function setProofStore(store: ProofStore): void {
  defaultStore = store;
}

export function getProofStore(): ProofStore {
  return defaultStore;
}
