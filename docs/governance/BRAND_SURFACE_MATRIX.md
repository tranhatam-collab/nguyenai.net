# Nguyen AI — Brand Surface Classification Matrix

- **Status:** BINDING — Sprint 0 Governance Lock
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`
- **Replaces:** the contradictory brand rule in `nguyenai.net/AGENTS.md` (the rule that simultaneously listed Gen1/Gen2 as the foundation and banned `Máy Tính AI` / `computer.iai.one` from all surfaces)

---

## 1. Canonical public brand

The canonical public brand for the Nguyen AI vertical is:

- **`Nguyen AI Computer`** (English / product title)
- **`Nguyen AI`** (short form, when context is unambiguous)

Vietnamese product-category wording **`Máy Tính AI`** is approved as a category term, **not** as a standalone replacement brand.

---

## 2. Approved usage patterns

### 2.1 Approved Vietnamese pattern

> `Nguyen AI Computer là Máy Tính AI đám mây chuyên biệt cho cá nhân, gia đình, founder, doanh nghiệp và cộng đồng Nguyễn toàn cầu.`

### 2.2 Approved English pattern

> `Nguyen AI Computer is a specialized cloud AI Computer for individuals, families, founders, businesses, and the global Nguyen community.`

### 2.3 Approved ecosystem disclosure pattern

> `Nguyen AI Computer runs on the Gen 1 – Gen 2 AI Computer platform of the IAI ecosystem.`

No technical domain needs to appear on the sales surface.

---

## 3. Prohibited usage

- `Máy Tính AI` standing alone as the brand label on a Nguyen AI surface
- `Chào mừng đến với Máy Tính AI.` (implies Máy Tính AI is the brand)
- Replacing `Nguyen AI Computer` with `Máy Tính AI` in product titles, app identity, or checkout
- Using `computer.iai.one` or `maytinhai.org` as the primary public-facing brand on Nguyen AI surfaces
- Calling Nguyen AI a "Gen 3" or a new engine
- Describing `maytinhai.org` as the same website or same brand as `nguyenai.net`

---

## 4. Brand Surface Classification Matrix

This matrix governs where each term may appear. `✅` = allowed, `⚠️` = allowed with restrictions noted, `❌` = prohibited.

| Context | `Nguyen AI Computer` | `Máy Tính AI` | `Gen 1` / `Gen 2` | `computer.iai.one` / `maytinhai.org` |
|---|---|---|---|---|
| Homepage hero | ✅ | ❌ as brand label | ❌ | ❌ |
| Homepage subhead / body | ✅ | ⚠️ as product category only | ❌ | ❌ |
| Product page (`/ai-computer/`) | ✅ | ⚠️ as description | ⚠️ short explanation allowed | ❌ |
| Pricing page | ✅ | ❌ | ❌ | ❌ |
| CTA buttons | ✅ | ❌ | ❌ | ❌ |
| Checkout / onboarding | ✅ | ❌ | ❌ | ❌ |
| Dashboard / console identity | ✅ | ❌ | ❌ | ❌ |
| Default SEO `<title>` | ✅ | ❌ | ❌ | ❌ |
| Default meta description | ✅ | ❌ | ❌ | ❌ |
| Default social OG / Twitter card | ✅ | ❌ | ❌ | ❌ |
| `/technology/` or `/how-it-works/` | ✅ | ⚠️ as category | ✅ | ✅ |
| Architecture docs | ✅ | ✅ | ✅ | ✅ |
| Developer docs | ✅ | ✅ | ✅ | ✅ |
| Academy lesson (explanatory) | ✅ | ⚠️ when pedagogically useful | ✅ when citing source | ✅ when citing source |
| Public investor page | ✅ | ⚠️ limited | ⚠️ high-level only | ⚠️ limited |
| Private investor data room | ✅ | ✅ | ✅ | ✅ |
| Legal / IP disclosure | ✅ | ✅ | ✅ | ✅ |
| Ads / paid media | ✅ | ❌ | ❌ | ❌ |
| Email marketing default | ✅ | ❌ | ❌ | ❌ |

---

## 5. Domain disclosure rules

### 5.1 Where `computer.iai.one` and `maytinhai.org` MAY appear

- `/technology/` or `/how-it-works/` pages
- architecture documentation
- developer documentation
- investor memorandum (private room)
- data room
- legal / IP disclosure documents
- ecosystem map pages (when clearly labeled as architecture, not marketing)

### 5.2 Where they MUST NOT appear

- homepage hero
- pricing labels
- checkout
- primary CTA
- default SEO metadata
- default social OG card
- app console primary identity
- paid ads
- onboarding screens

### 5.3 Approved public phrasing when architecture needs to be acknowledged

> `Nguyen AI Computer runs on the Gen 1 – Gen 2 AI Computer platform of the IAI ecosystem.`

This sentence may appear on `/technology/` or `/how-it-works/`. It does not require displaying the technical domains.

---

## 6. AGENTS.md replacement rule (locked)

The following block replaces the contradictory brand rule currently in `nguyenai.net/AGENTS.md`:

```
## Nguyen AI Brand and Product Category Lock
- Canonical public brand: `Nguyen AI Computer`.
- Vietnamese product-category wording `Máy Tính AI` is approved.
- `Máy Tính AI` must not be used as a standalone replacement brand for
  `Nguyen AI Computer`.
- Approved Vietnamese pattern:
  `Nguyen AI Computer là Máy Tính AI đám mây chuyên biệt...`
- `computer.iai.one` and `maytinhai.org` may appear only in architecture,
  technology, documentation, legal/IP and private investor contexts.
- They must not appear in hero copy, pricing labels, checkout, primary CTA,
  default SEO metadata or the primary app identity.
- Heritage and genealogy are specialized Super Apps, not the full product.
```

---

## 7. Remediation of the 18 existing occurrences

The audit found 18+ occurrences of `Máy Tính AI` and `computer.iai.one` in built HTML and source-of-truth docs. They are **not** to be deleted blindly. Each occurrence must be classified:

| Classification | Action |
|---|---|
| Used as product category in body copy | Keep, ensure it is not the brand label |
| Used as brand label in hero / title / CTA | Rewrite to `Nguyen AI Computer` |
| Used in architecture / technical doc | Keep |
| Used in investor private room | Keep |
| Used in SEO title / meta description | Rewrite to `Nguyen AI Computer` |
| Used on pricing / checkout | Rewrite to `Nguyen AI Computer` |

The classification must be recorded in a remediation log committed alongside the fix.

---

## 8. CI enforcement

A brand-surface scanner must be added to CI for `nguyenai.net` (and optionally the other repos). The scanner:

1. Greps built HTML and source for `Máy Tính AI`, `computer.iai.one`, `maytinhai.org`, `Gen 1`, `Gen 2`.
2. For each match, checks the surface context against this matrix.
3. Fails the build if a prohibited surface contains a banned term.

Scanner spec lives in `nguyenai.net/scripts/brand-surface-scan.mjs` (to be created in Sprint 1).

---

## 9. Conflict resolution

If this document conflicts with `AGENTS.md` in any repo, **this document wins** for brand surface decisions. `AGENTS.md` must be updated to reference this document.

---

## 10. Change log

| Date | Change | By |
|---|---|---|
| 2026-07-02 | Initial lock | Founder |
