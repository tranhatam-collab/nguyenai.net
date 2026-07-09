# Public Tech Disclosure Boundary

- **Status:** BINDING — Phase 1 Governance Lock
- **Date:** 2026-07-09
- **Owner:** Founder
- **Companion to:** `MODEL_PROVIDER_ABSTRACTION_POLICY.md`, `NO_DIRECT_MODEL_CALL_POLICY.md`

---

## 1. Purpose

Define what technical information about AI Nguyễn may be disclosed publicly (in docs, blogs, GitHub, investor materials, marketing) versus what must remain confidential. This protects the platform's competitive moat while enabling transparency for trust and compliance.

---

## 2. Disclosure principle

**Default to transparency on architecture, default to confidentiality on implementation details.**

- Architecture (what we do) → public
- Implementation (how we do it specifically) → confidential
- Provider names → public (we are provider-agnostic, not provider-secretive)
- Provider routing logic → confidential
- Policy checks → public (users should know what we check)
- Policy check internals → confidential

---

## 3. Public disclosure — ALLOWED

### 3.1 Architecture

| Topic | Allowed to disclose |
|-------|---------------------|
| Training gateway concept | Yes — "every AI invocation goes through a training gateway" |
| 8-step pipeline | Yes — high-level steps (policy check, invocation, guard, receipt) |
| Output guard existence | Yes — "all model output passes an output guard" |
| Model abstraction layer | Yes — "we support multiple providers and can switch" |
| Fallback chain concept | Yes — "we have automatic fallback between providers" |
| Receipt system | Yes — "every invocation generates a verifiable receipt" |
| Audit trail | Yes — "all invocations are logged for compliance" |

### 3.2 Provider names

| Topic | Allowed to disclose |
|-------|---------------------|
| Which providers we use | Yes — "we use OpenAI, Anthropic, Google, and open-source models" |
| Which models per tier | Yes — "free tier uses Llama, pro tier uses Claude" |
| Provider health status | Yes — aggregate health (healthy/degraded) |
| Provider-specific incidents | No — see §4.2 |

### 3.3 User-facing features

| Topic | Allowed to disclose |
|-------|---------------------|
| AI Nguyễn capabilities | Yes — what the AI can do |
| Tier system | Yes — free/standard/pro/business/enterprise |
| Vietnamese language support | Yes |
| Receipt verification | Yes — users can verify their receipts |
| Audit log access | Yes — users can access their own audit logs |

### 3.4 Compliance

| Topic | Allowed to disclose |
|-------|---------------------|
| GDPR compliance approach | Yes |
| Data classification scheme | Yes — public/internal/confidential/restricted |
| Retention policy | Yes — summary |
| User data rights | Yes |

---

## 4. Confidential — NOT ALLOWED publicly

### 4.1 Implementation details

| Topic | NOT allowed to disclose |
|-------|-------------------------|
| Specific fallback chain order | No — which model falls back to which |
| Circuit breaker thresholds | No — "5 consecutive failures" |
| Health check schedule | No — "every 60 seconds" |
| Rate limit values | No — specific RPS per tier |
| Cost per provider | No — actual API costs |
| Margin per tier | No — pricing vs cost |
| Prompt templates | No — system prompts and templates |
| Policy check algorithms | No — specific regex/logic for safety checks |
| Output guard internals | No — specific block/modify logic |

### 4.2 Provider-specific

| Topic | NOT allowed to disclose |
|-------|-------------------------|
| Provider-specific incidents | No — "OpenAI was down at 3pm" (without provider consent) |
| Provider-specific latency | No — "OpenAI responds in 240ms" |
| Provider-specific error rates | No |
| Provider API keys, endpoints | No — obviously |
| Provider contract terms | No |

### 4.3 Security

| Topic | NOT allowed to disclose |
|-------|-------------------------|
| Audit script logic | No — `audit-independence.sh` internals |
| CI gate specifics | No — what the CI checks for |
| Secret management approach | No — specific tools and locations |
| Incident response procedures | No — step-by-step |
| Vulnerability details | No — until patched + 90 days |

### 4.4 Business

| Topic | NOT allowed to disclose |
|-------|-------------------------|
| User counts | No — until investor disclosure approved |
| Revenue | No — until investor disclosure approved |
| Cost structure | No |
| Internal roadmap dates | No — use quarters, not specific dates |
| Internal team structure | No |

---

## 5. Disclosure channels

### 5.1 Public channels

| Channel | Content |
|---------|---------|
| `nguyenai.net` website | User-facing features, tier system, capabilities |
| GitHub (public repos) | Architecture docs, open-source packages |
| Blog | Architecture posts, lessons learned (no implementation details) |
| Investor deck | Architecture + business metrics (approved by Founder) |
| Customer docs | User-facing API docs, integration guides |
| Compliance docs | GDPR, data classification, retention |

### 5.2 Confidential channels

| Channel | Content |
|---------|---------|
| Internal wiki | Everything |
| `docs/governance/` | All policy documents (repo is private) |
| Founder-only docs | Cost, margin, roadmap |
| Investor private docs | Financials (NDA required) |
| Admin dashboard | Health, incidents, costs |

---

## 6. GitHub disclosure rules

### 6.1 Public repos

- `nguyenai.net` (if public): architecture docs only, no implementation secrets
- Open-source packages (`@nai/*` if published): public API, no internal logic

### 6.2 Private repos

- `nguyenai-api-gateway`: all implementation
- `nguyenai-console`: all implementation
- `nguyenai-invest`: all implementation
- `docs/governance/`: all policies

### 6.3 Commit messages

Commit messages must NOT contain:
- Provider API keys
- Internal URLs (admin dashboards, internal APIs)
- User data
- Cost figures
- Incident details (use incident ID, not description)

---

## 7. Blog post review

Before publishing a blog post about AI Nguyễn technical architecture:

1. Author drafts post
2. Founder reviews for disclosure boundary violations
3. Any §4 content is removed or generalized
4. Approved version published

Examples of generalization:
- ❌ "We fall back from GPT-4o to Claude-3.5-Sonnet after 5 failures"
- ✅ "We have automatic fallback between multiple providers"

- ❌ "Our output guard blocks 12 categories of unsafe content"
- ✅ "Our output guard checks identity, language, safety, and data classification"

---

## 8. Investor disclosure

Investor materials may include:
- Architecture overview (§3.1)
- Provider names (§3.2)
- User counts and revenue (Founder-approved only)
- Tier system and pricing
- Roadmap (quarterly, not specific dates)

Investor materials must NOT include:
- Implementation details (§4.1)
- Provider-specific performance (§4.2)
- Security internals (§4.3)
- Cost structure (§4.4) — unless NDA signed

---

## 9. Violations

| Violation | Severity |
|-----------|----------|
| Publishing §4 content publicly | Critical |
| Committing secrets to public repo | Critical |
| Blog post not reviewed by Founder | High |
| Investor deck includes §4 content without NDA | High |
| Disclosing provider-specific incidents | High |

---

## 10. Amendment

Adding new topics to §3 (public) requires Founder approval. Adding new topics to §4 (confidential) may be done by any team member with notification to Founder. Moving a topic from §3 to §4 (restricting) requires Founder approval. Moving from §4 to §3 (opening) requires Founder approval + security review.
