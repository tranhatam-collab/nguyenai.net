# Nguyen AI — Pricing Catalog Ownership

- **Status:** BINDING — Sprint 0 Governance
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `ENTITLEMENT_MODEL.md`, `PRODUCT_BOUNDARY_CONTRACT.md`

---

## 1. Decision

Product catalog ownership is **NOT** granted long-term to the `nguyenai.net` repository.

### 1.1 Logical owner

**Gen 2 Product Authority** owns:
- plan definitions
- pricing
- entitlement mapping
- billing rules
- usage rules

### 1.2 Package name

The shared catalog package is:

```
@iai/product-catalog
```

This name reflects Gen 2 Product Authority. It is NOT `@nguyenai/product-catalog` because Nguyen AI provides vertical configuration into the catalog, not full ownership.

### 1.3 Physical location (transitional)

- **Temporary physical location:** `nguyenai.net` repository (`packages/product-catalog/`)
- **Logical owner:** Gen 2 Product Authority
- **Migration required before production release**

The package must be extracted to a Gen 2-owned repository or shared registry before production. The current location is transitional only.

---

## 2. Consumption rules

Other repos must consume the catalog via:

1. **Package registry** (preferred — published `@iai/product-catalog` npm package), OR
2. **Workspace dependency** within the monorepo (during transition), OR
3. **Versioned artifact** (tarball with checksum)

**Copying catalog files by hand is forbidden.** Any repo that duplicates `plans.json` or `entitlements.json` is a defect.

---

## 3. Versioning

The catalog must have:

- A semantic version (`MAJOR.MINOR.PATCH`)
- A drift test that verifies `plans.json` ↔ `entitlements.json` ↔ `ENTITLEMENT_MODEL.md` are consistent
- A changelog entry per modification

Current version: `0.1.0` (transitional, pre-extraction)

---

## 4. Drift test

A CI gate must verify:

1. Every plan id in `plans.json` has a matching entry in `entitlements.json`
2. Every plan id in `entitlements.json` has a matching entry in `plans.json`
3. Every plan in `ENTITLEMENT_MODEL.md` §3 table matches `plans.json`
4. `academy.preview` fields are present and match `ENTITLEMENT_MODEL.md` §4.1
5. No orphan plans (in JSON but not in doc) or ghost plans (in doc but not in JSON)

---

## 5. Nguyen AI vertical configuration

Nguyen AI may contribute vertical-specific configuration INTO the catalog:

- Vietnamese-localized plan names (`name_vi`)
- Vietnamese target audience copy (`target_vi`)
- Heritage/genealogy Super App entitlements
- Academy track ids specific to Nguyen AI

But Nguyen AI does NOT own:
- base plan structure
- pricing tiers
- entitlement key schema
- billing mapping

---

## 6. Change log

| Date | Version | Change |
|---|---|---|
| 2026-07-02 | 0.1.0 | Initial lock — temp location nguyenai.net, logical owner Gen 2 |
