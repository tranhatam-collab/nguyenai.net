# Governance Checklist — Sprint 0 Lock

**Date:** 2026-07-08  
**Project:** nguyenai.net  
**Purpose:** Founder approval to open Sprint 0 governance lock

---

## Overview

This checklist provides the governance requirements for opening Sprint 0 governance lock. Sprint 0 is the initial sprint where the project establishes governance, processes, and decision-making frameworks.

**Prerequisites:**
- ✅ External Services Setup Checklist completed
- ✅ Deployment Checklist completed
- ✅ All services deployed and verified
- ✅ All audits passing (audit:all)

---

## Part 1: Sprint 0 Governance Lock Status

### Current Status

**Sprint 0 Governance Lock:** ⚠️ OPEN (Founder approval required)

**Governance Documents Status:**

| Document | Status | Location |
|----------|--------|----------|
| ECOSYSTEM_SOURCE_OF_TRUTH.md | ✅ BINDING | docs/governance/ |
| BRAND_SURFACE_MATRIX.md | ✅ BINDING | docs/governance/ |
| PRODUCT_BOUNDARY_CONTRACT.md | ✅ BINDING | docs/governance/ |
| IDENTITY_AND_TENANCY_RFC.md | ✅ BINDING | docs/governance/ |
| ENTITLEMENT_MODEL.md | ✅ BINDING | docs/governance/ |
| DATA_CLASSIFICATION_AND_RETENTION.md | ✅ BINDING | docs/governance/ |
| INVESTOR_ACCESS_POLICY.md | ✅ BINDING | docs/governance/ |
| NGUYEN_AI_FOUNDER_VERDICT_2026-07-02.md | ✅ BINDING | docs/governance/ |
| NGUYEN_AI_ECOSYSTEM_AUDIT_4_REPOS_2026-07-02.md | ✅ BINDING | docs/governance/ |
| QA_AUDIT_TOTAL_PLAN_2026-07-02.md | ✅ BINDING | docs/governance/ |
| PRODUCT_CATALOG_9x9.md | ✅ BINDING | docs/governance/ |
| DEV_TEAM_INTEGRATION_PLAN.md | ✅ BINDING | docs/governance/ |
| DEV_EXECUTION_CHECKLIST.md | ✅ BINDING | docs/governance/ |
| DEV_WORK_ITEMS_P0_P1.md | ✅ BINDING | docs/governance/ |
| RELEASE_EVIDENCE_PACK_2026-07-02.md | ✅ BINDING | docs/governance/ |
| FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md | ✅ BINDING | docs/governance/ |
| NGUYENAI_NET_INDEPENDENCE_PLAN_2026-07-08.md | ✅ BINDING | docs/governance/ |
| GOVERNANCE_DECISION_LOG.md | ✅ BINDING | docs/governance/ |

---

## Part 2: Founder Approval Required

### Decision QD-2026-07-08-01 (Independence Lock)

**Status:** ✅ COMPLETED 2026-07-08

**Decision:** nguyenai.net độc lập hoàn toàn khỏi Gen1/Gen2

**Evidence:**
- [x] `audit:independence` created and added to CI
- [x] 3 legacy repos archived
- [x] Old gateway replaced by independent gateway
- [x] `/v1/chat` routed through direct LLM provider
- [x] `LEGACY_BRIDGE_ENABLED=false` by default
- [x] `GEN1_GATEWAY_URL` removed from wrangler.jsonc
- [x] 13 Gen1/Gen2 violations removed
- [x] `src/` legacy root site quarantined
- [x] Governance decision log updated

### Decision QD-2026-07-08-02 (Sprint 0 Governance Lock)

**Status:** ⚠️ PENDING Founder approval

**Decision:** Open Sprint 0 governance lock

**Required Actions:**
- [ ] Founder reviews all governance documents
- [ ] Founder approves Sprint 0 governance lock
- [ ] Founder signs/approves governance decision log
- [ ] Governance decision log updated with QD-2026-07-08-02

---

## Part 3: Governance Framework Verification

### 3.1 Source of Truth Verification

- [ ] Verify all governance docs exist in `docs/governance/`
- [ ] Verify all docs are marked as BINDING
- [ ] Verify all docs are consistent with each other
- [ ] Verify no conflicts between docs

### 3.2 Brand Naming Lock Verification

- [ ] Run: `pnpm run audit:brand-naming-lock`
- [ ] Verify: 0 violations
- [ ] Verify: All brand names follow FOUNDER BRAND NAMING LOCK

### 3.3 Independence Lock Verification

- [ ] Run: `pnpm run audit:independence`
- [ ] Verify: 0 violations
- [ ] Verify: No Gen1/Gen2 references in public content
- [ ] Verify: `LEGACY_BRIDGE_ENABLED=false` in config

### 3.4 Language Purity Verification

- [ ] Run: `pnpm run audit:language:pure`
- [ ] Verify: 0 forbidden terms found
- [ ] Verify: All Vietnamese content follows glossary

### 3.5 All Audits Verification

- [ ] Run: `pnpm run audit:all`
- [ ] Verify: All 12 critical categories pass
- [ ] Verify: Build passes (89/89 tasks)
- [ ] Verify: Typecheck passes (139/139)

---

## Part 4: Decision-Making Framework

### 4.1 Founder Decision Log

- [ ] Verify `docs/governance/GOVERNANCE_DECISION_LOG.md` exists
- [ ] Verify: QD-2026-07-08-01 (Independence Lock) documented
- [ ] Verify: Decision format is consistent
- [ ] Verify: Decision rationale is clear

### 4.2 Decision Process

**Founder Decision Process:**
- [ ] Founder decision requires written rationale
- [ ] Founder decision requires evidence
- [ ] Founder decision requires impact assessment
- [ ] Founder decision is documented in decision log
- [ ] Founder decision is BINDING (overrides prior docs)

**Team Decision Process:**
- [ ] Team decisions require consensus
- [ ] Team decisions are documented in decision log
- [ ] Team decisions are subject to Founder review
- [ ] Team decisions can be overridden by Founder

### 4.3 Change Management

**Code Changes:**
- [ ] All code changes require PR review
- [ ] All code changes require CI pass
- [ ] All code changes require audit pass
- [ ] Breaking changes require Founder approval

**Governance Changes:**
- [ ] All governance changes require Founder approval
- [ ] All governance changes require decision log entry
- [ ] All governance changes require impact assessment
- [ ] All governance changes are BINDING

---

## Part 5: Sprint 0 Deliverables

### 5.1 Code Quality

- [ ] Typecheck: 139/139 PASS
- [ ] Build: 89/89 PASS
- [ ] Lint: All PASS
- [ ] Tests: All PASS

### 5.2 QA Audits

- [ ] Brand naming lock: 0 violations
- [ ] Independence lock: 0 violations
- [ ] Language purity: 0 violations
- [ ] Accessibility (critical): 0 violations
- [ ] Clone contamination: 0 violations
- [ ] Language boundary: 0 violations
- [ ] Email language: 0 violations
- [ ] Hreflang: 54/54 pages
- [ ] I18n keys: consistent
- [ ] Language switcher: 54/54 pages
- [ ] Public claims: 0 violations
- [ ] SEO bilingual: 54/54 pages
- [ ] Form language: 0 violations

### 5.3 Automation

- [ ] CI/CD pipeline: All audits integrated
- [ ] Auto-fail build if audit fails
- [ ] Go-live status checker: Active
- [ ] Root scripts: All configured

### 5.4 Documentation

- [ ] Governance docs: All BINDING
- [ ] Brand docs: All BINDING
- [ ] Strategy docs: All LOCKED
- [ ] Technical docs: All current

---

## Part 6: Sprint 0 Post-Lock Requirements

### 6.1 Sprint Planning

- [ ] Sprint 1 planning completed
- [ ] Sprint 1 backlog prioritized
- [ ] Sprint 1 goals defined
- [ ] Sprint 1 timeline defined

### 6.2 Team Onboarding

- [ ] Team members reviewed AGENTS.md
- [ ] Team members reviewed governance docs
- [ ] Team members reviewed brand lock
- [ ] Team members reviewed independence lock

### 6.3 Process Documentation

- [ ] Development process documented
- [ ] Code review process documented
- [ ] Deployment process documented
- [ ] Incident response process documented

---

## Part 7: Founder Approval Checklist

### Pre-Approval Verification

- [ ] All governance docs reviewed
- [ ] All audits passing
- [ ] All services deployed
- [ ] All documentation complete

### Approval Steps

- [ ] Founder reviews Sprint 0 governance lock request
- [ ] Founder approves Sprint 0 governance lock
- [ ] Founder signs/approves governance decision log
- [ ] Governance decision log updated with QD-2026-07-08-02
- [ ] Sprint 0 governance lock marked as OPEN

### Post-Approval Actions

- [ ] Update MASTER_PROJECT_PLAN with Sprint 0 lock status
- [ ] Update AGENTS.md with Sprint 0 governance lock status
- [ ] Notify team of Sprint 0 governance lock opening
- [ ] Begin Sprint 1 planning

---

## Part 8: Risk Assessment

### 8.1 Governance Risks

**Risk:** Founder decision log not maintained
- [ ] Mitigation: Auto-reminder to update decision log
- [ ] Mitigation: CI gate for decision log updates

**Risk:** Brand naming violations introduced
- [ ] Mitigation: CI gate for brand naming audit
- [ ] Mitigation: Team training on brand lock

**Risk:** Independence lock violations introduced
- [ ] Mitigation: CI gate for independence audit
- [ ] Mitigation: Team training on independence lock

### 8.2 Operational Risks

**Risk:** CI/CD pipeline failures
- [ ] Mitigation: Monitoring and alerting
- [ ] Mitigation: Rollback procedures documented

**Risk:** Audit failures blocking deployment
- [ ] Mitigation: Audit run locally before commit
- [ ] Mitigation: Audit run in PR before merge

---

## Part 9: Monitoring and Reporting

### 9.1 Governance Metrics

- [ ] Decision log update frequency tracked
- [ ] Audit failure rate tracked
- [ ] CI/CD success rate tracked
- [ ] Deployment success rate tracked

### 9.2 Reporting

- [ ] Weekly governance report to Founder
- [ ] Monthly audit summary to Founder
- [ ] Quarterly governance review with Founder
- [ ] Annual governance audit

---

## Part 10: Continuous Improvement

### 10.1 Feedback Loop

- [ ] Team feedback on governance process
- [ ] Founder feedback on decision process
- [ ] Audit feedback on audit effectiveness
- [ ] Continuous improvement of governance framework

### 10.2 Governance Updates

- [ ] Governance docs reviewed quarterly
- [ ] Brand lock reviewed annually
- [ ] Independence lock reviewed annually
- [ ] Decision log reviewed annually

---

## Troubleshooting

### Governance Issues

**Problem:** Decision log not updated
- [ ] Verify decision log file exists
- [ ] Verify decision log format is correct
- [ ] Verify team has write access
- [ ] Verify CI gate for decision log updates

**Problem:** Audit failures
- [ ] Check audit logs for specific violations
- [ ] Fix violations locally
- [ ] Re-run audit locally
- [ ] Commit fix and re-run CI

**Problem:** Brand naming violations
- [ ] Check brand naming audit output
- [ ] Replace banned names with approved names
- [ ] Re-run brand naming audit
- [ ] Commit fix and re-run CI

---

## Security Notes

- **Founder decisions are BINDING** — cannot be overridden by team
- **Governance docs are BINDING** — cannot be modified without Founder approval
- **Brand lock is BINDING** — cannot be modified without Founder approval
- **Independence lock is BINDING** — cannot be modified without Founder approval
- **All changes require documentation** — decision log must be updated
- **All changes require evidence** — rationale must be provided

---

## Next Steps

After completing this checklist:

1. Founder approves Sprint 0 governance lock
2. Governance decision log updated with QD-2026-07-08-02
3. Sprint 0 governance lock marked as OPEN
4. Sprint 1 planning begins
5. Team onboarding continues

---

## Appendix: Decision Log Template

```
# QD-YYYY-MM-DD-XX: [Decision Title]

**Date:** YYYY-MM-DD
**Decision Maker:** [Founder Name]
**Decision Type:** [Founder Decision / Team Decision]

## Rationale

[Why this decision was made]

## Evidence

[Supporting evidence for this decision]

## Impact

[Impact of this decision]

## Implementation

[How this decision will be implemented]

## Overrides

[Prior decisions this decision overrides, if any]

## Status

[OPEN / CLOSED]
```

---

Generated with [Devin](https://devin.ai)

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
