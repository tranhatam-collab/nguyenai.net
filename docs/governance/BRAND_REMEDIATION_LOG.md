# Nguyen AI — Brand Remediation Log

- **Status:** BINDING — Sprint 0 Governance
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `BRAND_SURFACE_MATRIX.md`, `ECOSYSTEM_SOURCE_OF_TRUTH.md`

---

## 1. Purpose

Track every brand contamination occurrence found and remediated. Each occurrence must have a full record. A CI grep gate prevents recurrence.

---

## 2. Occurrences

### Occurrence 1 — `computer.iai.one` in architecture description (VI)

| Field | Content |
|---|---|
| File | `apps/web/src/data/pages.ts` |
| Line | 156 |
| String | `computer.iai.one` |
| Type | architecture / forbidden |
| Decision | sửa |
| New content | reflects independent backend architecture |
| Commit | (Phase 1 commit) |
| Verified | Yes — contamination audit PASS |

### Occurrence 2 — `maytinhai.org` in architecture description (VI)

| Field | Content |
|---|---|
| File | `apps/web/src/data/pages.ts` |
| Line | 157 |
| String | `maytinhai.org` |
| Type | architecture / forbidden |
| Decision | sửa |
| New content | reflects independent backend architecture |
| Commit | (Phase 1 commit) |
| Verified | Yes — contamination audit PASS |

### Occurrence 3 — `computer.iai.one` in architecture description (EN)

| Field | Content |
|---|---|
| File | `apps/web/src/data/pages.ts` |
| Line | 636 |
| String | `computer.iai.one` |
| Type | architecture / forbidden |
| Decision | sửa |
| New content | reflects independent backend architecture |
| Commit | (Phase 1 commit) |
| Verified | Yes — contamination audit PASS |

### Occurrence 4 — `maytinhai.org` in architecture description (EN)

| Field | Content |
|---|---|
| File | `apps/web/src/data/pages.ts` |
| Line | 637 |
| String | `maytinhai.org` |
| Type | architecture / forbidden |
| Decision | sửa |
| New content | reflects independent backend architecture |
| Commit | (Phase 1 commit) |
| Verified | Yes — contamination audit PASS |

### Occurrence 5 — `AIAGENT.IAI.ONE` platform string in runtime-sdk

| Field | Content |
|---|---|
| File | `packages/@nai/runtime-sdk/src/index.ts` |
| Line | 418 |
| String | `Platform: AIAGENT.IAI.ONE` |
| Type | brand / forbidden |
| Decision | sửa |
| New content | `Platform: NGUYEN AI` |
| Commit | (this commit) |
| Verified | Yes — contamination audit PASS |

### Occurrence 6 — `AIAGENT.IAI.ONE` in review matrix name

| Field | Content |
|---|---|
| File | `packages/@nai/contracts/src/review.ts` |
| Line | 79 |
| String | `AIAGENT.IAI.ONE Review Matrix v1` |
| Type | brand / forbidden |
| Decision | sửa |
| New content | `Nguyen AI Review Matrix v1` |
| Commit | (this commit) |
| Verified | Yes — contamination audit PASS |

### Occurrence 7 — `AIAGENT.IAI.ONE` in skill example

| Field | Content |
|---|---|
| File | `packages/@nai/contracts/src/skill.ts` |
| Line | 84 |
| String | `I am AIAGENT.IAI.ONE, an autonomous multi-agent AI system...` |
| Type | brand / forbidden |
| Decision | sửa |
| New content | `I am Nguyen AI, an autonomous multi-agent AI system...` |
| Commit | (this commit) |
| Verified | Yes — contamination audit PASS |

---

## 3. CI grep gate

`tools/audit-clone-contamination.sh` runs in CI and fails the build if any of the following tokens appear in user-facing surfaces:

- `maytinhai`
- `computer.iai.one`
- `iai.one`

Scan directories: `apps/web/src`, `apps/web/public`, `apps/console/src`, `apps/invest/src`, `apps/academy/src`, `apps/admin/src`, `content`, `public`, `src`, `packages/@nai`

Exempt: `docs/governance/`, `docs/architecture/`, `NOTICE.nai.md`, `LICENSE`, `node_modules`, `.git`

---

## 4. Recurrence prevention

- CI gate runs on every PR
- Any new occurrence blocks merge
- This log must be updated for every new occurrence found and fixed
- Quarterly review: scan entire repo (including non-user-facing) for brand drift

---

### Occurrence 8 — `computer.iai.one` on homepage body (VI)

| Field | Content |
|---|---|
| File | `apps/web/src/data/pages.ts` |
| Line | 154 |
| String | `Gen 1 (computer.iai.one) và Gen 2 (maytinhai.org)` |
| Type | brand / forbidden (homepage body per BRAND_SURFACE_MATRIX §4.2) |
| Decision | sửa — xóa domain names, giữ "Gen 1" và "Gen 2" |
| New content | `Gen 1 và Gen 2 đóng băng làm kiến trúc tham chiếu` |
| Commit | (this commit) |
| Verified | Yes — contamination audit PASS |

### Occurrence 9 — `computer.iai.one` on homepage body (EN)

| Field | Content |
|---|---|
| File | `apps/web/src/data/pages.ts` |
| Line | 635 |
| String | `Gen 1 (computer.iai.one) and Gen 2 (maytinhai.org)` |
| Type | brand / forbidden (homepage body per BRAND_SURFACE_MATRIX §4.2) |
| Decision | sửa — xóa domain names |
| New content | `Gen 1 and Gen 2 are frozen as reference architecture` |
| Commit | (this commit) |
| Verified | Yes — contamination audit PASS |

### Occurrence 10 — "Máy Tính AI" in SEO title + OG title

| Field | Content |
|---|---|
| File | `apps/web/src/data/pages.ts` |
| Line | 116 |
| String | `Nguyen AI Computer \| Máy Tính AI của thế hệ Nguyễn toàn cầu` |
| Type | brand / forbidden (SEO title per BRAND_SURFACE_MATRIX §4) |
| Decision | sửa — "Máy Tính AI" không dùng trong brand surface (title/OG/hero) |
| New content | `Nguyen AI Computer \| AI Computer cho thế hệ Nguyễn toàn cầu` |
| Commit | (this commit) |
| Verified | Yes |

### Occurrence 11 — "Máy Tính AI" in hero tagline (site.ts)

| Field | Content |
|---|---|
| File | `apps/web/src/data/site.ts` |
| Line | 17 |
| String | `Máy Tính AI của thế hệ Nguyễn toàn cầu.` |
| Type | brand / forbidden (hero tagline = brand surface) |
| Decision | sửa |
| New content | `AI Computer cho thế hệ Nguyễn toàn cầu.` |
| Commit | (this commit) |
| Verified | Yes |

### Occurrence 12 — "Máy Tính AI" in heroTitle (pages.ts)

| Field | Content |
|---|---|
| File | `apps/web/src/data/pages.ts` |
| Line | 119 |
| String | `Máy Tính AI của thế hệ Nguyễn toàn cầu.` |
| Type | brand / forbidden (heroTitle = brand surface) |
| Decision | sửa |
| New content | `AI Computer cho thế hệ Nguyễn toàn cầu.` |
| Commit | (this commit) |
| Verified | Yes |

---

## 5. Change log

| Date | Change |
|---|---|
| 2026-07-02 | Initial log — 7 occurrences remediated (4 from Phase 1, 3 from forked packages) |
| 2026-07-02 | Added occurrences 8-12 (homepage domains + "Máy Tính AI" in brand surfaces) |
