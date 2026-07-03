# @nai/evidence

Proof record, audit trail, and evidence pack export for the Nguyen AI Computer runtime.

Per `DATA_CLASSIFICATION_AND_RETENTION.md` and the Founder Build Directive Phase 3 task 3.8:

- Every command execution produces an **evidence record** (proof).
- Evidence records are **append-only** and **tamper-evident** (HMAC-SHA256 signed + hash chain).
- Evidence packs can be exported as signed JSON for external verification.
- Integrates with `@nai/audit` for the audit trail.

## Storage

- **InMemory** (default for dev/test) — `InMemoryEvidenceStore`.
- **Interface** (`EvidenceStore`) — swap to D1 / Postgres / R2 in production.

## Signing

- HMAC-SHA256 with a shared secret (`EVIDENCE_SIGNING_KEY`).
- Each record carries `prev_hash` (hash of the previous record) forming a tamper-evident chain.
- `verifyEvidencePack()` re-computes the chain + signature for external verification.

## Usage

```ts
import { InMemoryEvidenceStore, setEvidenceStore, recordEvidence, exportEvidencePack, verifyEvidencePack } from '@nai/evidence';

setEvidenceStore(new InMemoryEvidenceStore());
const rec = await recordEvidence({
  command_id: 'cmd_123',
  user_id: 'u_1',
  tenant_id: 't_1',
  agent_id: 'nguyen-guide',
  proof_type: 'command_executed',
  payload: { input: '...', output: '...', tool_calls: [] },
}, 'shared-secret');

const pack = await exportEvidencePack('t_1', 'shared-secret');
const ok = verifyEvidencePack(pack, 'shared-secret');
```
