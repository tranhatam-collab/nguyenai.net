# QA Audit — Tổng kế hoạch Nguyễn AI

- **Ngày audit:** 2026-07-02
- **Auditor:** Devin (AI agent)
- **Phạm vi:** toàn bộ tài liệu trong `nguyenai.net/docs/` (20 file, 6568 dòng) + `docs/governance/` (9 file, 2862 dòng) = 29 file, 9430 dòng
- **Mục đích:** kiểm tra logic, mâu thuẫn, thiếu sót, trùng lặp và tính nhất quán

---

## A. Tổng quan tài liệu đã gom vào nguyenai.net

### A.1 Cấu trúc hiện tại

```
nguyenai.net/docs/
├── governance/                          (9 file — Sprint 0 Governance Lock)
│   ├── ECOSYSTEM_SOURCE_OF_TRUTH.md
│   ├── BRAND_SURFACE_MATRIX.md
│   ├── PRODUCT_BOUNDARY_CONTRACT.md
│   ├── IDENTITY_AND_TENANCY_RFC.md
│   ├── ENTITLEMENT_MODEL.md
│   ├── DATA_CLASSIFICATION_AND_RETENTION.md
│   ├── INVESTOR_ACCESS_POLICY.md
│   ├── NGUYEN_AI_FOUNDER_VERDICT_2026-07-02.md
│   └── NGUYEN_AI_ECOSYSTEM_AUDIT_4_REPOS_2026-07-02.md
├── investor/                            (6 file)
│   ├── HO_SO_KEU_GOI_DAU_TU_..._V1.md   (1810 dòng — hồ sơ VI đầy đủ)
│   ├── NGUYEN_AI_INVEST_STRATEGY_VALUATION_V2.md
│   ├── NGUYEN_AI_INVESTOR_MEMORANDUM_V1.md
│   ├── NGUYEN_AI_INVESTOR_DECK.md
│   ├── NGUYEN_AI_INVESTOR_SITE_PLAN.md
│   └── NGUYEN_AI_FINANCIAL_MODEL_HYPOTHESIS.md
├── architecture/                        (2 file)
├── brand/                               (2 file)
├── product/                             (1 file)
├── legal/                               (3 file)
├── privacy/                             (1 file)
├── security/                            (1 file)
├── seo/                                 (1 file)
├── NGUYEN_AI_COMPUTER_MASTER_POSITIONING_GEN1_GEN2.md
├── NGUYEN_AI_MASTER_FOUNDATION.md
├── NGUYEN_AI_MASTER_MARKET_POSITIONING_INVESTMENT_STRATEGY_V3_2026.md
└── NGUYEN_AI_ACADEMY_PLAN.md
```

### A.2 Phán quyết cấu trúc

**Cấu trúc đã gom đúng.** Tất cả tài liệu chiến lược nằm trong một repo `nguyenai.net`. Không còn phân tán ở `Maytinhai.com/` hay `governance/` riêng biệt.

**Nhưng:** có trùng lặp và mâu thuẫn giữa các tài liệu cũ (pre-2026-07-02) và tài liệu governance mới. Cần dọn dẹp.

---

## B. Mâu thuẫn nghiêm trọng (P0 — phải sửa trước khi gửi nhà đầu tư)

### B.1 Định giá hiện tại mâu thuẫn

| Tài liệu | Định giá scaffold hiện tại |
|---|---|
| `INVEST_STRATEGY_VALUATION_V2.md:536` | **4,5 triệu USD** pre-money |
| `MASTER_STRATEGY_V3:318` | **1,5–3 triệu USD** |
| `HO_SO_KEU_GOI_DAU_TU_V1:1154` | **1,5–3 triệu đô la Mỹ** |

**Mâu thuẫn:** V2 nói 4,5M, V3 và hồ sơ VI nói 1,5–3M. Chênh lệch gấp đôi.

**Nguyên nhân:** V2 viết ngày 2026-07-01, trước khi Founder verdict và governance lock (2026-07-02). V2 chưa phản ánh được rằng Gen 1 build đang broken, Gen 2 chưa audit, IP chưa form, legal entity chưa thành lập.

**Giải pháp:** V2 phải bị supersede. Tài liệu canonical cho định giá hiện tại là `MASTER_STRATEGY_V3` và `HO_SO_KEU_GOI_DAU_TU_V1`. Cần thêm dòng `SUPERSEDED by V3.0` vào đầu V2.

### B.2 Vòng vốn mâu thuẫn

| Tài liệu | Vòng vốn đề xuất |
|---|---|
| `INVEST_STRATEGY_VALUATION_V2.md:537` | **750.000 USD** |
| `DATA_ROOM_PLAN.md:57` | **750K USD** use of funds |
| `MASTER_STRATEGY_V3:354-363` | **500K–750K** trước beta, **1M** sau beta |
| `HO_SO_KEU_GOI_DAU_TU_V1:1262-1272` | **500K–750K** trước beta, **1M** sau beta |

**Mâu thuẫn:** V2 và Data Room Plan nói 750K. V3 và hồ sơ VI nói 500K–750K trước beta, 1M sau beta.

**Giải pháp:** V3 và hồ sơ VI là canonical. V2 và Data Room Plan phải cập nhật. Phân bổ vốn 1M trong hồ sơ VI (§XX) là canonical cho vòng sau beta.

### B.3 Academy pricing mâu thuẫn

| Tài liệu | Academy là gì? |
|---|---|
| `INVEST_STRATEGY_VALUATION_V2.md:515` | "free AI learning to all subscribers. Academy is not a separate paid product" |
| `ENTITLEMENT_MODEL.md:36` | `academy.pass` là entitlement riêng |
| `HO_SO_KEU_GOI_DAU_TU_V1:941-946` | Academy có vé học, chương trình, khóa chuyên sâu — ngụ ý trả phí |
| `MARKET_STRATEGY_V3:246` | "Academy" là revenue pillar riêng |

**Mâu thuẫn:** V2 nói Academy free cho subscribers. Governance docs nói Academy Pass là entitlement riêng (có thể tách biệt). Hồ sơ VI liệt kê Academy là revenue pillar.

**Giải pháp:** Cần Founder quyết định rõ:
- **Option A:** Academy free cho tất cả subscribers (như V2 nói) → xóa `academy.pass` khỏi entitlement model, Academy không phải revenue pillar
- **Option B:** Academy có free tier cho subscribers + paid tier (Pass cho tracks nâng cao, Certification Fee riêng) → cập nhật V2 cho nhất quán

**Khuyến nghị:** Option B nhất quán với governance docs và hồ sơ VI. V2 cần sửa.

### B.4 Số audience Nguyễn mâu thuẫn

| Tài liệu | Số audience |
|---|---|
| `INVEST_STRATEGY_VALUATION_V2.md:60` | ~31,88 triệu |
| `FINANCIAL_MODEL_HYPOTHESIS.md:9` | 33–34M |
| `MASTER_STRATEGY_V3` | 31–32 triệu (ngụ ý) |

**Mâu thuẫn:** 31,88M vs 33–34M.

**Giải pháp:** Cần dùng một con số duy nhất. Nguồn MDPI 2024 nói 31,57% trong dataset. Với dân số 102,3M (2025): 102,3M × 31,57% ≈ 32,3M. **Con số canonical nên là ~32 triệu**, không phải 33–34M. `FINANCIAL_MODEL_HYPOTHESIS.md` phải sửa.

### B.5 Data room access expiry mâu thuẫn

| Tài liệu | Thời hạn access |
|---|---|
| `DATA_ROOM_PLAN.md:128` | 30 ngày |
| `INVESTOR_ACCESS_POLICY.md:5.1` | tối đa 90 ngày |

**Mâu thuẫn:** 30 ngày vs 90 ngày.

**Giải pháp:** `INVESTOR_ACCESS_POLICY.md` là governance lock, canonical. Data Room Plan phải cập nhật thành 90 ngày (hoặc 30 ngày cho tier 2, 90 ngày cho tier 3-4 — nếu Founder muốn phân cấp).

### B.6 Use of funds breakdown mâu thuẫn

| Tài liệu | Phân bổ |
|---|---|
| `HO_SO_KEU_GOI_DAU_TU_V1:1288-1300` | 30% product, 15% agents, 12% security/legal, 10% infra, 12% GTM, 8% Academy, 5% content, 5% support, 3% reserve |
| `MARKET_STRATEGY_V3 (governance)` | ≥60% build, ≤20% GTM, ≤10% legal, ≤10% ops |

**Mâu thuẫn:** Hồ sơ VI phân bổ 12% GTM (OK ≤20%), nhưng 30+15+10+8 = 63% build (OK ≥60%), 12% security/legal (OK ≤10%? — 12% > 10%, VƯỢT). 

**Giải pháp:** Hồ sơ VI có 12% cho "Bảo mật, pháp lý và quyền riêng tư" — vượt giới hạn 10% trong governance. Cần hoặc:
- Tăng giới hạn governance lên 12%, hoặc
- Giảm hồ sơ VI xuống 10% và chuyển 2% sang build hoặc dự phòng

---

## C. Mâu thuẫn trung bình (P1 — nên sửa trước release)

### C.1 AGENTS.md stale

`AGENTS.md` liệt kê source-of-truth docs nhưng:
- Không liệt kê `docs/governance/` (9 file mới)
- Không liệt kê `MASTER_STRATEGY_V3`
- Không liệt kê `HO_SO_KEU_GOI_DAU_TU_V1`
- Brand lock rule trong AGENTS.md chưa phản ánh `BRAND_SURFACE_MATRIX.md` (nuance về "Máy Tính AI" là category, không phải brand)

**Giải pháp:** Cập nhật AGENTS.md để thêm governance docs vào source-of-truth list.

### C.2 Domain list mâu thuẫn

| Tài liệu | Số domains | Có docs.nguyenai.net? |
|---|---|---|
| `AGENTS.md` | 8 | Có |
| `MASTER_POSITIONING_GEN1_GEN2.md:542-548` | 7 | Không |
| `ECOSYSTEM_SOURCE_OF_TRUTH.md:134-148` | 10 | Có |

**Mâu thuẫn:** Master Positioning thiếu `docs.nguyenai.net`.

**Giải pháp:** Thêm `docs.nguyenai.net` vào Master Positioning domain list.

### C.3 Layer architecture numbering

- `MASTER_POSITIONING_GEN1_GEN2.md`: 4-layer (Layer 1 Gen1, Layer 2 Gen2, Layer 3 Nguyen AI, Layer 4 Academy)
- `ECOSYSTEM_SOURCE_OF_TRUTH.md`: 2 shared layers + brand layer + shared identity

**Không mâu thuẫn logic** nhưng gây nhầm lẫn khi đối chiếu. Cần ghi chú rõ hai cách slicing là cùng một kiến trúc.

### C.4 9 Models + 9 Functional Products chưa định nghĩa

`MARKET_STRATEGY_V3` §XV và `HO_SO_KEU_GOI_DAU_TU_V1` §VII.1 đề cập "2 dòng sản phẩm song song: 9 Models máy + 9 sản phẩm theo chức năng" nhưng **không định nghĩa** 9 models là gì, 9 functional products là gì.

**Giải pháp:** Cần tạo tài liệu `PRODUCT_CATALOG_9x9.md` định nghĩa:
- 9 AI Computer Models (tên, năng lực, giới hạn, giá)
- 9 Functional Products (tên, chức năng, target user, tool set)

### C.5 Trùng lặp nội dung giữa 5 tài liệu chiến lược/investor

| Tài liệu | Dòng | Vai trò |
|---|---|---|
| `MASTER_POSITIONING_GEN1_GEN2.md` | 595 | Positioning + product architecture |
| `MASTER_STRATEGY_V3` | 472 | Market + valuation + roadmap |
| `HO_SO_KEU_GOI_DAU_TU_V1` | 1810 | Hồ sơ đầu tư VI đầy đủ |
| `INVEST_STRATEGY_VALUATION_V2` | 563 | Investor brief EN (stale) |
| `INVESTOR_MEMORANDUM_V1` | 468 | Investor memorandum |

**Trùng lặp:** Thị trường, moat, valuation, beachhead, revenue model lặp lại 3-5 lần với wording khác nhau.

**Giải pháp:** Thiết lập clear hierarchy:
1. `MASTER_POSITIONING_GEN1_GEN2.md` — positioning + product (canonical cho sản phẩm)
2. `MASTER_STRATEGY_V3` — market + valuation (canonical cho chiến lược)
3. `HO_SO_KEU_GOI_DAU_TU_V1` — hồ sơ đầu tư VI (canonical cho nhà đầu tư)
4. `INVEST_STRATEGY_VALUATION_V2` — **SUPERSEDED**, giữ lại nhưng đánh dấu
5. `INVESTOR_MEMORANDUM_V1` — cần kiểm tra có bị stale không

---

## D. Thiếu sót (P1 — cần bổ sung)

### D.1 Gen 2 audit chưa hoàn thành

Gen 1 audit xong (PARTIAL, build broken). Gen 2 audit bị cancel, chưa chạy lại.

**Rủi ro:** Không thể claim "Gen 2 identity/entitlement/billing chạy" nếu chưa audit.

**Giải pháp:** Chạy Gen 2 audit trước Sprint 3.

### D.2 9 Models + 9 Functional Products chưa có

Như C.4. Đây là core product definition cho build directive.

### D.3 Legal entity chưa thành lập

`DATA_ROOM_PLAN.md:144`: "Legal entity: NOT FORMED"
`ENTITY_FORMATION_CHECKLIST.md`: template available, chưa execute

**Rủi ro:** Không thể ký IP agreement, không thể issue shares, không thể nhận vốn chính thức.

### D.4 IP agreement chưa execute

`DATA_ROOM_PLAN.md:145`: "IP agreement: NOT EXECUTED (template available)"

**Rủi ro:** Nhà đầu tư sẽ hỏi ai sở hữu Gen 1, Gen 2 code. Nếu không có IP agreement, định giá giảm.

### D.5 Cap table chưa finalized

`DATA_ROOM_PLAN.md:147`: "Cap table: NOT FINALIZED"

**Rủi ro:** Không thể term sheet.

### D.6 Compliance map chưa tạo

`DATA_ROOM_PLAN.md:146`: "Compliance map: NOT CREATED"

**Rủi ro:** PDPD 91/2025 có hiệu lực từ 01/01/2026. Đã quá hạn.

### D.7 Product catalog package chưa tồn tại

`ECOSYSTEM_SOURCE_OF_TRUTH.md:184-192` chỉ định `packages/product-catalog/` là source of truth cho pricing. **Package này chưa tồn tại trong bất kỳ repo nào.**

### D.8 auth.nguyenai.net chưa tồn tại

`IDENTITY_AND_TENANCY_RFC.md` định nghĩa `auth.nguyenai.net` là IdP duy nhất. **Service này chưa tồn tại.**

### D.9 Proof/Verify service chưa tồnẫn

`ECOSYSTEM_SOURCE_OF_TRUTH.md:105-113` định nghĩa shared Proof/Verify service. **Chưa tồn tại.**

### D.10 Gen 1 có secret exposed

Gen 1 audit phát hiện `.env.local` chứa `PAY_IAI_ONE_SITE_KEY` thật. Cần rotate và purge khỏi git history.

---

## E. Tính nhất quán — kiểm tra cross-reference

### E.1 Pricing (8 plans) — NHẤT QUÁN ✅

Tất cả tài liệu đều đồng ý 8 gói: Start (Free), Personal (299K), Family (599K), Creator (999K), Founder (1.999M), Business (4.999M), Chapter (7.999M), Enterprise (custom).

### E.2 Kiến trúc Gen1 → Gen2 → Nguyen AI — NHẤT QUÁN ✅

Tất cả tài liệu đều đồng ý: Gen 1 runtime, Gen 2 product, Nguyen AI vertical brand. Không có ai nói "engine thứ 3".

### E.3 Beachhead Founder → Business → Family — NHẤT QUÁN ✅

Cả V3, hồ sơ VI, V2 đều đồng ý thứ tự beachhead.

### E.4 TAM-SAM-SOM — NHẤT QUÁN ✅

SAM 143–158M USD, SOM năm 3: 5–15M USD. Đồng ý giữa V3 và hồ sơ VI.

### E.5 Valuation ladder (6 mức + upside) — NHẤT QUÁN ✅

Đồng ý giữa V3 và hồ sơ VI: 1.5-3M → 4-7M → 8-15M → 10-25M → 20-50M → 60-120M → 150-300M+.

### E.6 9 Agents — NHẤT QUÁN ✅

Đồng ý giữa Master Positioning, hồ sơ VI, AGENTS.md.

### E.7 Privacy defaults — NHẤT QUÁN ✅

Living-person data private, family tree private, PDPD 91/2025, consent/export/deletion.

### E.8 Ethics boundaries — NHẤT QUÁN ✅

Không claim cùng huyết thống, không claim ưu thế sinh học, evidence labels.

---

## F. Đánh giá logic tổng thể

### F.1 Luận điểm đầu tư — LOGIC ✅

"Không cạnh tranh model, cạnh tranh orchestration + memory + workflow + trust + distribution" — logic đúng, có nguồn hỗ trợ (Stanford AI Index, Gartner, McKinsey).

### F.2 Moat analysis — LOGIC ✅

Phân biệt moat thật (memory, workflow, network, evidence) vs moat giả (surname, UI, model) — logic đúng, thực tế.

### F.3 Beachhead strategy — LOGIC ✅

Founder → Business → Family thay vì "mọi người họ Nguyễn" — logic đúng, tránh scatter.

### F.4 Valuation ladder — LOGIC ✅

Mỗi mức định giá có điều kiện cụ thể, không phải con số tự do. Upside 150-300M được đánh dấu "không phải base forecast".

### F.5 Roadmap 36 tháng — LOGIC ✅

0-3 tháng: governance + audit. 3-6: beta. 6-12: commercial. 12-18: family + chapter. 18-24: scale. 24-36: enterprise. Thứ tự đúng.

### F.6 Risk analysis — LOGIC ✅

10 rủi ro với biện pháp cụ thể. Đặc biệt rủi ro IP dependency và "chỉ là lớp giao diện" — đúng thực tế.

### F.7 Revenue model — LOGIC ✅

9 revenue pillars tách biệt. Không trộn Machine + Academy + Certification. Pricing chỉ lock sau khi đo cost.

---

## G. Phán quyết QA

### G.1 Điểm mạnh

1. **Kiến trúc rõ ràng:** Gen 1 → Gen 2 → Nguyen AI, không mập mờ
2. **Định vị trung thực:** không tuyên bố "AI duy nhất", thừa nhận tổ hợp là moat
3. **Valuation có điều kiện:** mỗi mức gắn với evidence cụ thể
4. **Privacy-by-design:** PDPD compliance tích hợp vào sản phẩm
5. **Beachhead thực tế:** Founder/Business/Family thay vì mass market
6. **Risk honest:** thừa nhận "scaffold", "chưa integration", "chưa traction"
7. **Governance lock:** 9 tài liệu khóa contract trước build

### G.2 Điểm yếu phải sửa

| # | Vấn đề | Mức | Hành động |
|---|---|---|---|
| 1 | Định giá V2 (4,5M) mâu thuẫn V3 (1,5-3M) | P0 | Đánh dấu V2 SUPERSEDED |
| 2 | Vòng vốn V2 (750K) mâu thuẫn V3 (500K-1M) | P0 | Cập nhật V2 + Data Room Plan |
| 3 | Academy free vs paid mâu thuẫn | P0 | Founder quyết định + cập nhật V2 |
| 4 | Audience 31,88M vs 33-34M | P0 | Chuẩn hóa thành ~32M |
| 5 | Data room expiry 30 ngày vs 90 ngày | P0 | Cập nhật Data Room Plan thành 90 ngày |
| 6 | Use of funds 12% legal > 10% governance | P0 | Giảm thành 10% hoặc tăng governance limit |
| 7 | AGENTS.md stale | P1 | Cập nhật source-of-truth list |
| 8 | Domain list thiếu docs.nguyenai.net | P1 | Thêm vào Master Positioning |
| 9 | 9 Models + 9 Products chưa định nghĩa | P1 | Tạo PRODUCT_CATALOG_9x9.md |
| 10 | 5 tài liệu investor trùng lặp | P1 | Thiết lập hierarchy + SUPERSEDED markers |
| 11 | Gen 2 audit chưa xong | P1 | Chạy audit |
| 12 | Legal entity, IP, cap table, compliance map | P1 | Execute theo ENTITY_FORMATION_CHECKLIST |
| 13 | Product catalog package chưa tồn tại | P1 | Tạo packages/product-catalog/ |
| 14 | auth.nguyenai.net chưa tồn tại | P1 | Build trong Sprint 2 |
| 15 | Gen 1 secret exposed | P1 | Rotate + purge git history |

### G.3 Điểm số

| Tiêu chí | Điểm | Ghi chú |
|---|---|---|
| Tính nhất quán nội bộ | 7/10 | 6 mâu thuẫn P0 nhưng có thể sửa |
| Logic chiến lược | 9/10 | Luận điểm đúng, moat đúng, beachhead đúng |
| Tính trung thực | 9/10 | Thừa nhận scaffold, không over-claim |
| Tính đầy đủ | 7/10 | 9x9 chưa định nghĩa, Gen 2 chưa audit, legal chưa form |
| Tính sẵn sàng cho nhà đầu tư | 5/10 | Cần sửa P0 + form entity + IP agreement trước khi gửi |
| **Tổng** | **7,4/10** | **Khá tốt, cần dọn dẹp P0 trước khi gửi nhà đầu tư** |

---

## H. Khuyến nghị hành động

### H.1 Ngay lập tức (trước khi gửi nhà đầu tư)

1. Đánh dấu `INVEST_STRATEGY_VALUATION_V2.md` là SUPERSEDED by V3.0
2. Sửa `FINANCIAL_MODEL_HYPOTHESIS.md` audience 33-34M → ~32M
3. Sửa `DATA_ROOM_PLAN.md` expiry 30 ngày → 90 ngày
4. Founder quyết định Academy pricing (free vs freemium) → cập nhật V2
5. Sửa use of funds 12% legal → 10% (hoặc tăng governance limit)
6. Cập nhật AGENTS.md source-of-truth list

### H.2 Trước Sprint 2 (Shared Identity)

7. Tạo `PRODUCT_CATALOG_9x9.md` định nghĩa 9 models + 9 functional products
8. Chạy Gen 2 audit
9. Tạo `packages/product-catalog/` (plans.json, entitlements.json, prices.json)
10. Rotate Gen 1 secret + purge git history

### H.3 Trước gọi vốn

11. Form legal entity (theo ENTITY_FORMATION_CHECKLIST)
12. Execute IP agreement
13. Finalize cap table
14. Create PDPD compliance map
15. Populate data room

---

## I. Kết luận

Bộ tài liệu Nguyễn AI **có nền tảng chiến lược vững và governance lock tốt**, nhưng **có 6 mâu thuẫn P0** giữa tài liệu cũ (V2, Data Room Plan, Financial Model) và tài liệu mới (V3, governance, hồ sơ VI). Những mâu thuẫn này **có thể sửa trong 1-2 giờ** nhưng **phải sửa trước khi gửi nhà đầu tư**, vì nhà đầu tư sẽ phát hiện ngay nếu đọc nhiều tài liệu cùng lúc.

Sau khi sửa P0, bộ tài liệu sẽ **đạt 8,5-9/10** và sẵn sàng cho investor conversations (nhưng vẫn cần legal entity + IP agreement trước khi term sheet).

---

*Audit hoàn thành 2026-07-02 bởi Devin. Phán quyết: CONDITIONAL PASS — sửa P0 trước release.*
