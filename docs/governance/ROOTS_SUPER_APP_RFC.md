# Roots Super App RFC

- **Status:** BINDING — Phase 1 Governance Lock
- **Date:** 2026-07-09
- **Owner:** Founder
- **Companion to:** `AI_AGENT_TRAINING_MATRIX.md`, `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`
- **Implementation:** `apps/web/src/pages/roots/`, `packages/@nai/roots/` (Phase 2)

---

## 1. Purpose

Lock the contract for the **Nguyen Roots** Super App — the heritage, genealogy, and family history pillar of the Nguyễn AI Computer. Roots is one of the approved Super Apps (per `AGENTS.md`) and serves the global Nguyen community's heritage needs without claiming bloodline, royal descent, or shared ancestry.

This RFC defines:
- What Roots does (features)
- What Roots does NOT do (ethical boundaries)
- Data model
- Agent team integration
- Privacy defaults
- Evidence labels
- Phase rollout

---

## 2. What Roots IS

Roots is a **family history research and preservation platform** that helps users:

1. **Build family trees** — multi-generation, branch-aware, private by default
2. **Preserve family documents** — photos, letters, oral histories, certificates
3. **Research ancestry** — with evidence labels and uncertainty language
4. **Connect with branches** — discover related branches (with mutual consent)
5. **Publish founder profiles** — public only after owner approval
6. **Generate heritage narratives** — AI-assisted, evidence-cited, guard-checked

---

## 3. What Roots is NOT (ethical boundaries)

Per `AGENTS.md` Ethics and historical boundaries:

| Claim | Allowed? | Reason |
|-------|----------|--------|
| "All Nguyen people share one bloodline" | ❌ Never | False, unethical |
| "Descend from Nguyễn Bặc" | ❌ Never | Cannot verify for all Nguyen |
| "Belong to Nguyễn Phúc imperial lineage" | ❌ Never | Cannot verify for all Nguyen |
| "AI can confirm ancestry" | ❌ Never | AI cannot confirm, only suggest |
| "AI can confirm royal lineage" | ❌ Never | Same as above |
| "AI can confirm bloodline" | ❌ Never | Same as above |
| "This branch traces to region X (evidence: secondary)" | ✅ With label | Evidence-labeled |
| "Oral history says branch Y migrated from Z" | ✅ With label | Labeled as oral history |
| "Insufficient evidence to conclude" | ✅ Required | When evidence is thin |

### 3.1 Required evidence labels

Every ancestry/heritage claim in Roots output must carry one of:

| Label | Meaning |
|-------|---------|
| `verified` | Confirmed by primary source (official record) |
| `primary_source` | Cited from official record (birth, marriage, death certificate) |
| `secondary_source` | Cited from published history, scholarly work |
| `according_to_branch_genealogy` | Cited from family-held genealogy book |
| `oral_history` | Cited from oral tradition, unverified |
| `insufficient_evidence` | Not enough data to conclude |
| `disputed` | Conflicting sources |
| `cannot_conclude` | AI cannot make a determination |

### 3.2 Output guard integration

The output guard (see `OUTPUT_GUARD_POLICY.md`) checks Roots output for:
- Missing evidence labels on ancestry claims → `block`
- Claims of bloodline confirmation → `block`
- Claims of royal descent confirmation → `block`
- Claims of shared ancestry for all Nguyen → `block`

---

## 4. Data model

### 4.1 Family tree

```
FamilyTree
├── tree_id: string (unique)
├── owner_user_id: string
├── tenant_id: string
├── name: string (e.g., "Nguyễn Văn branch — Quảng Bình")
├── visibility: 'private' | 'branch_shared' | 'public'
├── created_at: string
├── updated_at: string
└── persons: Person[]
```

### 4.2 Person

```
Person
├── person_id: string
├── tree_id: string
├── full_name: string
├── birth_name: string?
├── birth_year: number?
├── death_year: number?
├── birth_place: string?
├── death_place: string?
├── gender: 'male' | 'female' | 'unknown'?
├── is_living: boolean
├── parents: person_id[]
├── children: person_id[]
├── spouse: person_id[]
├── evidence: EvidenceEntry[]
├── notes: string?
└── documents: DocumentRef[]
```

### 4.3 Evidence entry

```
EvidenceEntry
├── claim: string (e.g., "born in 1820")
├── label: EvidenceLabel
├── source_citation: string
├── source_url: string?
├── verified_by: string? (user_id of verifier)
└── added_at: string
```

### 4.4 Document

```
Document
├── doc_id: string
├── owner_user_id: string
├── tree_id: string?
├── person_id: string?
├── type: 'photo' | 'letter' | 'certificate' | 'oral_history_audio' | 'oral_history_video' | 'other'
├── title: string
├── description: string?
├── file_ref: string (R2 key)
├── visibility: 'private' | 'branch_shared' | 'public'
├── created_at: string
└── tags: string[]
```

---

## 5. Privacy defaults

Per `AGENTS.md` Privacy defaults:

| Data type | Default visibility | Can be made public? |
|-----------|-------------------|---------------------|
| Living person data | Private | ❌ Never |
| Family tree | Private | ✅ Owner can publish |
| Family documents | Private | ✅ Owner can publish |
| Founder profiles (deceased) | Private | ✅ After owner approval |
| Branch connections | Private | ✅ With mutual consent |

### 5.1 Living person protection

- `is_living = true` persons are NEVER included in public views
- Public family trees redact living persons (show "private" placeholder)
- API routes return 403 for living-person data without owner auth
- Output guard blocks any output containing living-person data without owner consent

### 5.2 Branch connection consent

When two branches discover a potential connection:
1. Both branch owners must consent
2. Connection is recorded with both consent timestamps
3. Either owner can revoke (connection becomes hidden, not deleted)
4. Audit event `branch_connection_consent` logged

---

## 6. Agent team integration

Roots integrates with the approved Agent team (per `AGENTS.md`):

| Agent | Role in Roots |
|-------|---------------|
| **Nguyen Researcher** | Searches historical records, suggests evidence sources |
| **Nguyen Archivist** | Organizes documents, tags, categorizes |
| **Nguyen Verifier** | Checks evidence labels, flags missing labels |
| **Nguyen Family Steward** | Manages family tree, suggests connections |
| **Nguyen Guide** | User-facing assistant for Roots navigation |

### 6.1 Agent invocation

All Roots agent invocations go through the training gateway (see `AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`):

```typescript
const result = await invokeThroughTrainingGateway({
  user_id,
  tenant_id,
  session_id,
  agent: 'nguyen-researcher',
  model_tier: 'standard',
  messages: [...],
  language: 'vi',
  data_classification: 'confidential', // family data is confidential
});
```

### 6.2 Roots-specific guard checks

In addition to the 4 standard guard checks, Roots output is checked for:
- Evidence label presence on ancestry claims
- Living person data leakage
- Bloodline/royal descent confirmation claims

These are implemented as Roots-specific policy checks in `@nai/model-policy` (Phase 2).

---

## 7. Heritage narrative generation

### 7.1 What it does

AI-assisted generation of family heritage narratives:
- User provides family tree + documents
- AI generates a narrative with evidence citations
- Narrative includes uncertainty language where evidence is thin
- Output passes through output guard before delivery

### 7.2 Narrative structure

```
[Branch name] traces its origins to [region], according to [evidence label].
The earliest documented ancestor is [name], born [year] ([evidence label]).
Oral history suggests migration from [place] to [place] in [century] ([oral_history]).
[Insufficient evidence] to determine connection to [other branch].
```

### 7.3 Narrative guard

- Every ancestry claim must have an evidence label
- Every region/year claim must have a source
- "Cannot conclude" must appear when evidence is insufficient
- Narrative is stored with version history (user can regenerate)

---

## 8. Phase rollout

### Phase 1 (current — Governance Lock)

- This RFC document
- Data model defined
- Privacy defaults locked
- Ethical boundaries locked
- Agent roles assigned

### Phase 2 (Implementation)

- `packages/@nai/roots/` package created
- Family tree CRUD API (`/v1/roots/trees`, `/v1/roots/persons`)
- Document upload API (`/v1/roots/documents`)
- R2 storage for documents
- D1 database for trees, persons, evidence
- Roots UI in `apps/web/src/pages/roots/`
- Agent integration (Researcher, Archivist, Verifier, Family Steward)

### Phase 3 (Advanced)

- Branch connection discovery (consent-based)
- Heritage narrative generation
- Public founder profiles (with owner approval workflow)
- Roots-specific output guard checks
- Multi-language narrative generation (VI/EN)

### Phase 4 (Scale)

- Cross-tree search (consent-based)
- Historical record database integration
- DNA-informed ancestry (with explicit consent, opt-in only)
- Roots API for third-party genealogy tools

---

## 9. API surface (Phase 2 preview)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/roots/trees` | GET | List user's family trees |
| `/v1/roots/trees` | POST | Create family tree |
| `/v1/roots/trees/:id` | GET | Get tree (with persons) |
| `/v1/roots/trees/:id` | PUT | Update tree metadata |
| `/v1/roots/trees/:id` | DELETE | Delete tree (soft delete) |
| `/v1/roots/persons` | POST | Add person to tree |
| `/v1/roots/persons/:id` | GET | Get person (with evidence) |
| `/v1/roots/persons/:id` | PUT | Update person |
| `/v1/roots/persons/:id/evidence` | POST | Add evidence entry |
| `/v1/roots/documents` | POST | Upload document (R2) |
| `/v1/roots/documents/:id` | GET | Get document metadata |
| `/v1/roots/narratives/generate` | POST | Generate heritage narrative (via training gateway) |
| `/v1/roots/branches/connect` | POST | Request branch connection (consent) |

All endpoints require authentication. All invocations go through training gateway. All output passes output guard.

---

## 10. Violations

| Violation | Severity |
|-----------|----------|
| Roots output without evidence labels | Critical |
| Roots output claiming bloodline confirmation | Critical |
| Roots output claiming royal descent | Critical |
| Living person data in public view | Critical |
| Family tree visible without owner auth | High |
| Branch connection without mutual consent | High |
| Roots agent bypassing training gateway | Critical (per `NO_DIRECT_MODEL_CALL_POLICY.md`) |

---

## 11. Amendment

Changes to ethical boundaries (§3) require Founder approval. Changes to privacy defaults (§5) require Founder approval. Changes to evidence labels (§3.1) require Founder approval + security review. New Roots features require Founder approval before implementation.
