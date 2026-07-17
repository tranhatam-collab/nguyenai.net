/** Stub functions and types for not-yet-implemented features */

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getProofStore = (): any => ({
  createProof: async (_p: unknown) => ({ proof_id: '', user_id: '' }),
  getProofsByUser: async (_uid: string) => [],
  getCertificatesByUser: async (_uid: string) => [],
  getReviewQueue: async () => [],
  recordReview: async (_r: unknown) => {},
  getNextSequence: async (_pid: string) => 1,
  issueCertificate: async (_c: unknown) => ({ certificate_id: '' }),
  updateProofStatus: async (_id: string, _s: string) => {},
  getCertificate: async (_id: string) => null,
  revokeCertificate: async (_id: string) => {},
  saveProof: async (_p: unknown) => '',
  getProof: async (_id: string) => null,
  listProofs: async (_uid: string) => [],
});

export type ReviewerResult = any;
export type ReviewDecision = any;

// P0-EDU: verifyCertificateId stub removed — real D1-backed verify endpoint
// is at GET /v1/edu/certificate/verify/:id in edu-routes.ts

export async function verifyServiceAuth(_c: unknown): Promise<any> {
  return { ok: true, error: null, status: 200, userId: '', scopes: [] };
}
