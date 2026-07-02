# Nguyen AI — Product Catalog 9×9

- **Status:** BINDING — Founder Build Directive
- **Date:** 2026-07-02
- **Owner:** Founder
- **Companion to:** `ECOSYSTEM_SOURCE_OF_TRUTH.md`, `ENTITLEMENT_MODEL.md`, `PRODUCT_BOUNDARY_CONTRACT.md`, `NGUYEN_AI_COMPUTER_MASTER_POSITIONING_GEN1_GEN2.md`

---

## 1. Mục đích

Định nghĩa 2 dòng sản phẩm song song:

- **Dòng 1 — 9 Models máy (AI Computer Models):** 9 cấp độ Máy Tính AI từ cơ bản đến enterprise, mỗi model có năng lực, giới hạn và giá khác nhau.
- **Dòng 2 — 9 Functional Products (sản phẩm theo chức năng):** 9 sản phẩm chuyên biệt theo tool/chức năng mà Máy Tính AI làm tốt nhất.

Hai dòng độc lập nhưng phối hợp: khách hàng chọn 1 Model (cấp độ máy) + 1 hoặc nhiều Functional Products (chức năng chuyên biệt). Model quyết định năng lực phần cứng; Functional Product quyết định bộ tool chuyên biệt.

---

## 2. Dòng 1 — 9 Models máy (AI Computer Models)

### Nguyên tắc

- Mỗi Model là một "cấp độ máy" với năng lực tính toán, memory, vault, agent, model tier khác nhau
- Model cao hơn = nhiều agent hơn, model tier cao hơn, memory lớn hơn, vault lớn hơn, quota cao hơn
- Giá theo tháng, có thể thay đổi sau khi đo cost (per `ENTITLEMENT_MODEL.md` §10)
- Tất cả Models đều dùng chung Gen 1 runtime, Gen 2 entitlement, shared identity

### 9 Models

| # | Model | Code | Giá/tháng | Target user | Model tier | Agents | Memory | Vault | Quota |
|---|---|---|---:|---|---|---|---|---|---|
| 1 | **Nguyen Start** | `nguyen-start` | Free | Người mới thử | free | 2 (Guide, Guardian) | 100MB | 500MB | 10 commands/ngày |
| 2 | **Nguyen Personal** | `nguyen-personal` | 299.000 VNĐ | Cá nhân | standard | 4 (+Researcher, Verifier) | 5GB | 10GB | 100 commands/ngày |
| 3 | **Nguyen Family** | `nguyen-family` | 599.000 VNĐ | Gia đình (2-6 người) | standard | 5 (+Family Steward) | 20GB | 50GB | 300 commands/ngày |
| 4 | **Nguyen Creator** | `nguyen-creator` | 999.000 VNĐ | Người sáng tạo nội dung | standard+ | 5 (+Creator tools) | 20GB | 100GB | 500 commands/ngày |
| 5 | **Nguyen Founder** | `nguyen-founder` | 1.999.000 VNĐ | Nhà sáng lập | pro | 7 (+Founder, Business Operator) | 50GB | 200GB | 1.000 commands/ngày |
| 6 | **Nguyen Business** | `nguyen-business` | 4.999.000 VNĐ | Doanh nghiệp nhỏ (5-25 seat) | pro | 8 (+Global Connector) | 200GB | 1TB | 5.000 commands/ngày |
| 7 | **Nguyen Chapter** | `nguyen-chapter` | 7.999.000 VNĐ | Chi họ, hội, cộng đồng | pro | 9 (all) | 500GB | 5TB | 10.000 commands/ngày |
| 8 | **Nguyen Enterprise** | `nguyen-enterprise` | Báo giá | Tổ chức lớn (25+ seat) | enterprise | 9 (all) + custom | Custom | Custom | Custom |
| 9 | **Nguyen Sovereign** | `nguyen-sovereign` | Báo giá | Dedicated/private deployment | enterprise | 9 (all) + custom | Dedicated | Dedicated | Unlimited |

### Chi tiết từng Model

#### Model 1 — Nguyen Start (Free)

- **Mục đích:** Cho người mới trải nghiệm Máy Tính AI
- **Agents:** Nguyen Guide, Nguyen Guardian
- **Model tier:** free (chỉ model cơ bản, không premium)
- **Memory:** 100MB (session + preference only)
- **Vault:** 500MB
- **Quota:** 10 commands/ngày, 50K tokens/tháng
- **Approval gate:** sensitive (mọi hành động nhạy cảm cần phê duyệt)
- **Evidence:** có (proof record cơ bản)
- **Academy:** xem được free introductory lessons, không có Academy Pass
- **Limitations:** không Super App, không workflow scheduling, không browser execution

#### Model 2 — Nguyen Personal (299K VNĐ)

- **Mục đích:** Cá nhân cần AI productivity
- **Agents:** + Nguyen Researcher, Nguyen Verifier (4 total)
- **Model tier:** standard (GPT-4o-mini, Claude Haiku, tương đương)
- **Memory:** 5GB (session, preference, project, decision)
- **Vault:** 10GB
- **Quota:** 100 commands/ngày, 500K tokens/tháng
- **Super Apps:** AI Office, AI Research, AI Content (basic)
- **Approval gate:** sensitive
- **Academy:** không bao gồm, mua riêng

#### Model 3 — Nguyen Family (599K VNĐ)

- **Mục đích:** Gia đình 2-6 người chia sẻ memory và vault
- **Agents:** + Nguyen Family Steward (5 total)
- **Model tier:** standard
- **Memory:** 20GB (thêm family memory)
- **Vault:** 50GB
- **Quota:** 300 commands/ngày, 1M tokens/tháng
- **Super Apps:** AI Office, AI Research, AI Content, Nguyen Roots, Nguyen Memory
- **Features:** family invitation, shared vault, family calendar, oral history interview
- **Approval gate:** sensitive + family-level approval cho shared actions
- **Academy:** không bao gồm, mua riêng

#### Model 4 — Nguyen Creator (999K VNĐ)

- **Mục đích:** Người sáng tạo nội dung cần multi-channel publishing
- **Agents:** 5 (Guide, Guardian, Researcher, Verifier, + Creator specialist)
- **Model tier:** standard+ (thêm vision model cho media)
- **Memory:** 20GB (thêm brand memory)
- **Vault:** 100GB (nhiều hơn cho media)
- **Quota:** 500 commands/ngày, 2M tokens/tháng
- **Super Apps:** AI Office, AI Research, AI Content, AI Media, AI Browser
- **Features:** bilingual publishing, SEO, social media scheduling, media asset management
- **Approval gate:** sensitive
- **Academy:** không bao gồm, mua riêng

#### Model 5 — Nguyen Founder (1.999M VNĐ)

- **Mục đích:** Nhà sáng lập cần strategy, pitch, fundraising
- **Agents:** + Nguyen Founder, Nguyen Business Operator (7 total)
- **Model tier:** pro (GPT-4o, Claude Sonnet, premium models)
- **Memory:** 50GB (thêm decision memory, founder memory)
- **Vault:** 200GB
- **Quota:** 1.000 commands/ngày, 5M tokens/tháng
- **Super Apps:** AI Office, AI Research, AI Content, AI Browser, AI Founder OS, AI Finance Workspace, AI Legal Workspace, Nguyen Founders
- **Features:** decision log, pitch deck builder, investor brief, KPI dashboard, founder network
- **Approval gate:** sensitive + financial approval gate
- **Academy:** không bao gồm, mua riêng

#### Model 6 — Nguyen Business (4.999M VNĐ)

- **Mục đích:** Doanh nghiệp nhỏ 5-25 seat
- **Agents:** + Nguyen Global Connector (8 total)
- **Model tier:** pro
- **Memory:** 200GB (organization memory)
- **Vault:** 1TB
- **Quota:** 5.000 commands/ngày, 20M tokens/tháng
- **Super Apps:** All standard + AI Business OS, AI Sales, AI Automation, AI Code
- **Features:** multi-seat, RBAC, org memory, CRM, SOP, automation, audit
- **Approval gate:** configurable per-role
- **Academy:** không bao gồm, mua riêng (bulk discount cho org)

#### Model 7 — Nguyen Chapter (7.999M VNĐ)

- **Mục đích:** Chi họ, hội, cộng đồng (50+ members)
- **Agents:** 9 (all Nguyen agents)
- **Model tier:** pro
- **Memory:** 500GB (chapter memory, archive)
- **Vault:** 5TB
- **Quota:** 10.000 commands/ngày, 50M tokens/tháng
- **Super Apps:** All + Nguyen Chapter OS, Nguyen Network, Nguyen Knowledge, Nguyen Trust
- **Features:** membership management, governance, events, archive, chapter website, private community AI
- **Approval gate:** configurable + chapter board approval
- **Academy:** không bao gồm, mua riêng (bulk discount cho chapter)

#### Model 8 — Nguyen Enterprise (Báo giá)

- **Mục đích:** Tổ chức lớn 25+ seat, cần SSO, SLA, compliance
- **Agents:** 9 + custom agents
- **Model tier:** enterprise (tất cả models, bao gồm private model routing)
- **Memory:** Custom
- **Vault:** Custom
- **Quota:** Custom
- **Super Apps:** All + custom integrations
- **Features:** SSO (SAML/OIDC), tenant isolation, SLA, audit export, compliance map, dedicated support
- **Approval gate:** custom policy engine
- **Academy:** custom enterprise training (báo giá riêng)
- **Deployment:** shared cloud, region selection

#### Model 9 — Nguyen Sovereign (Báo giá)

- **Mục đích:** Dedicated/private deployment, full control
- **Agents:** 9 + custom agents
- **Model tier:** enterprise + private model option
- **Memory:** Dedicated infrastructure
- **Vault:** Dedicated storage
- **Quota:** Unlimited (chỉ giới hạn bởi hạ tầng dedicated)
- **Super Apps:** All + custom
- **Features:** dedicated Gen 1 runtime, dedicated Gen 2 tenant, region/data residency, on-premise option, private model, full audit export, custom security baseline, incident response SLA
- **Approval gate:** custom
- **Academy:** custom
- **Deployment:** dedicated cloud hoặc on-premise

---

## 3. Dòng 2 — 9 Functional Products

### Nguyên tắc

- Mỗi Functional Product là một bộ tool chuyên biệt cho một chức năng cụ thể
- Functional Product có thể mua thêm (add-on) cho bất kỳ Model nào (trừ Start)
- Functional Product bao gồm: tool set, agent specialist, command packs, workflow templates
- Giá add-on/tháng, tách biệt với Model subscription
- Một khách hàng có thể có 1 Model + nhiều Functional Products

### 9 Functional Products

| # | Product | Code | Add-on giá/tháng | Tools bao gồm | Target use case |
|---|---|---|---:|---|---|
| 1 | **Nguyen Office Pro** | `func-office` | 99.000 VNĐ | AI Office + AI Automation | Văn phòng, tài liệu, báo cáo, tự động hóa |
| 2 | **Nguyen Research Lab** | `func-research` | 199.000 VNĐ | AI Research + AI Browser + Nguyen Trust | Nghiên cứu, source synthesis, evidence |
| 3 | **Nguyen Content Studio** | `func-content` | 299.000 VNĐ | AI Content + AI Media | Sáng tạo nội dung, multi-channel, song ngữ |
| 4 | **Nguyen Code Forge** | `func-code` | 299.000 VNĐ | AI Code + AI Automation | Coding, review, test, deploy |
| 5 | **Nguyen Founder Suite** | `func-founder` | 499.000 VNĐ | AI Founder OS + AI Finance + AI Legal + Nguyen Founders | Strategy, pitch, gọi vốn, decision log |
| 6 | **Nguyen Business Pack** | `func-business` | 799.000 VNĐ | AI Business OS + AI Sales + AI Automation | Vận hành doanh nghiệp, CRM, SOP |
| 7 | **Nguyen Heritage Vault** | `func-heritage` | 199.000 VNĐ | Nguyen Roots + Nguyen Memory + Nguyen Knowledge | Gia phả, oral history, lưu trữ gia đình |
| 8 | **Nguyen Community OS** | `func-community` | 599.000 VNĐ | Nguyen Chapter OS + Nguyen Network + Nguyen Trust | Chi họ, hội, cộng đồng, events |
| 9 | **Nguyen Evidence Pro** | `func-evidence` | 149.000 VNĐ | Nguyen Trust + AI Research + proof engine | Kiểm chứng, audit, compliance, certification prep |

### Chi tiết từng Functional Product

#### Product 1 — Nguyen Office Pro (99K VNĐ/tháng)

- **Tools:** AI Office (documents, spreadsheets, presentations, reports, minutes, summaries, file conversion) + AI Automation (workflow, trigger, scheduled task, notification)
- **Agents specialist:** Nguyen Guide (office mode)
- **Command Packs:** Document Pack, Report Pack, Meeting Minutes Pack
- **Use case:** cá nhân/doanh nghiệp cần văn phòng AI + tự động hóa tài liệu
- **Compatible Models:** Personal trở lên

#### Product 2 — Nguyen Research Lab (199K VNĐ/tháng)

- **Tools:** AI Research (web search, PDF reading, document analysis, source comparison, bibliography, cited reports) + AI Browser (controlled web access, page reading, data extraction) + Nguyen Trust (claim, source, evidence, verification, dispute, confidence)
- **Agents specialist:** Nguyen Researcher, Nguyen Verifier
- **Command Packs:** Research Pack, Evidence Pack, Source Verification Pack
- **Use case:** nghiên cứu, học thuật, due diligence, fact-checking
- **Compatible Models:** Personal trở lên

#### Product 3 — Nguyen Content Studio (299K VNĐ/tháng)

- **Tools:** AI Content (articles, bilingual content, SEO, social media, newsletter, editorial calendar, multi-channel publishing) + AI Media (images, audio, video, transcript, subtitles, media asset management)
- **Agents specialist:** Nguyen Guide (creator mode), Nguyen Researcher (trend)
- **Command Packs:** Bilingual Publishing Pack, SEO Pack, Social Media Pack, Media Production Pack
- **Use case:** content creator, marketer, publisher
- **Compatible Models:** Personal trở lên

#### Product 4 — Nguyen Code Forge (299K VNĐ/tháng)

- **Tools:** AI Code (repository audit, write code, test, fix, QA, deploy, release evidence) + AI Automation (CI/CD workflow, trigger)
- **Agents specialist:** Nguyen Guide (code mode), Nguyen Verifier (code review)
- **Command Packs:** Code Review Pack, Test Pack, Deploy Pack, Release Evidence Pack
- **Use case:** developer, tech lead, dev team
- **Compatible Models:** Personal trở lên

#### Product 5 — Nguyen Founder Suite (499K VNĐ/tháng)

- **Tools:** AI Founder OS (vision, strategy, roadmap, decision log, pitch deck, investor brief, fundraising, KPI, board report) + AI Finance Workspace (budget, cash flow, voucher analysis, management report, risk alerts) + AI Legal Workspace (contract classification, clause extraction, version comparison, issue spotting, approval workflow) + Nguyen Founders (founder profiles, businesses, projects, mentorship, partnership, opportunity board)
- **Agents specialist:** Nguyen Founder, Nguyen Business Operator
- **Command Packs:** Founder Launch Pack, Investor Readiness Pack, Strategy Pack, Decision Log Pack
- **Use case:** nhà sáng lập cần full suite strategy + fundraising + legal
- **Compatible Models:** Founder trở lên (hoặc Personal + add-on)

#### Product 6 — Nguyen Business Pack (799K VNĐ/tháng)

- **Tools:** AI Business OS (operations, SOP, task management, internal knowledge, customer care, reporting, automation) + AI Sales (customer research, CRM, proposal, follow-up, pipeline analysis, sales scripts) + AI Automation (workflow, trigger, scheduled task, system integration)
- **Agents specialist:** Nguyen Business Operator, Nguyen Global Connector
- **Command Packs:** Business Operations Pack, Sales Pipeline Pack, SOP Pack, Customer Service Pack
- **Use case:** doanh nghiệp cần vận hành + bán hàng + tự động hóa
- **Compatible Models:** Business trở lên (hoặc Founder + add-on)

#### Product 7 — Nguyen Heritage Vault (199K VNĐ/tháng)

- **Tools:** Nguyen Roots (family graph, family tree, branches, relationships, place names, timeline) + Nguyen Memory (photos, documents, journals, interviews, oral history, archive) + Nguyen Knowledge (history, culture, research library, sourced Q&A, bilingual articles)
- **Agents specialist:** Nguyen Family Steward, Nguyen Archivist
- **Command Packs:** Family Archive Pack, Legacy Interview Pack, Heritage Research Pack
- **Use case:** gia đình lưu trữ di sản, oral history, gia phả
- **Compatible Models:** Family trở lên

#### Product 8 — Nguyen Community OS (599K VNĐ/tháng)

- **Tools:** Nguyen Chapter OS (membership, governance, archive, events, communication, private chapter AI, dedicated website, permission and audit) + Nguyen Network (individuals, experts, founders, chapters, diaspora, events, trusted connections) + Nguyen Trust (claim, source, evidence, verification, dispute, confidence, audit)
- **Agents specialist:** Nguyen Global Connector, Nguyen Guardian
- **Command Packs:** Chapter Governance Pack, Event Pack, Membership Pack, Community Communication Pack
- **Use case:** chi họ, hội, cộng đồng quản lý thành viên và sự kiện
- **Compatible Models:** Chapter trở lên (hoặc Business + add-on)

#### Product 9 — Nguyen Evidence Pro (149K VNĐ/tháng)

- **Tools:** Nguyen Trust (full evidence engine: claim, source, evidence, verification, dispute, confidence, audit) + AI Research (source collection) + proof engine (proof record, audit trail, evidence pack export)
- **Agents specialist:** Nguyen Verifier, Nguyen Archivist
- **Command Packs:** Evidence Pack, Audit Pack, Compliance Pack, Certification Prep Pack
- **Use case:** kiểm chứng, audit, compliance, chuẩn bị certification
- **Compatible Models:** Personal trở lên
- **Special:** tích hợp với Academy Certification — proof records từ Functional Product này có thể nộp cho Academy certification

---

## 4. Ma trận Model × Functional Product compatibility

| Functional Product ↓ / Model → | Start | Personal | Family | Creator | Founder | Business | Chapter | Enterprise | Sovereign |
|---|---|---|---|---|---|---|---|---|---|
| Office Pro | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Research Lab | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Content Studio | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Code Forge | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Founder Suite | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Business Pack | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Heritage Vault | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Community OS | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Evidence Pro | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Quy tắc:**
- Start: không mua add-on được
- Business Pack: cần Founder trở lên (cần org capability)
- Heritage Vault: cần Family trở lên (cần family memory)
- Community OS: cần Business trở lên (cần multi-seat org)

---

## 5. Academy — tách biệt hoàn toàn

Academy không nằm trong 9 Models hay 9 Functional Products. Academy là sản phẩm trả phí riêng:

- **Academy Pass:** entitlement riêng, mua standalone, không grant mặc định từ bất kỳ Model nào
- **Certification Fee:** per-attempt, tách biệt với Academy Pass
- Xem `ENTITLEMENT_MODEL.md` §2.2-2.3 và `NGUYEN_AI_ACADEMY_PLAN.md`

---

## 6. Entitlement mapping

Mỗi Model grant các entitlement keys per `ENTITLEMENT_MODEL.md`:

```
Model 1 (Start):
  machine.plan = free
  machine.model.tier = free
  machine.agents.enabled = [guide, guardian]
  machine.super_apps.enabled = []
  machine.command.quota = 10/day
  machine.tokens.quota = 50K/month
  machine.approval.required = sensitive

Model 2 (Personal):
  machine.plan = personal
  machine.model.tier = standard
  machine.agents.enabled = [guide, guardian, researcher, verifier]
  machine.super_apps.enabled = [office, research, content-basic]
  machine.command.quota = 100/day
  machine.tokens.quota = 500K/month

... (tương tự cho Model 3-9)
```

Functional Product add-on grant thêm:
```
func-office:
  machine.super_apps.enabled += [office-pro, automation]
  command.packs += [document, report, minutes]

func-research:
  machine.super_apps.enabled += [research-pro, browser, trust]
  machine.agents.enabled += [researcher-pro, verifier-pro]
  command.packs += [research, evidence, source-verification]
```

---

## 7. Pricing summary

### Model subscription (tháng)

| Model | Giá |
|---|---:|
| Start | Free |
| Personal | 299.000 VNĐ |
| Family | 599.000 VNĐ |
| Creator | 999.000 VNĐ |
| Founder | 1.999.000 VNĐ |
| Business | 4.999.000 VNĐ |
| Chapter | 7.999.000 VNĐ |
| Enterprise | Báo giá |
| Sovereign | Báo giá |

### Functional Product add-on (tháng)

| Product | Giá |
|---|---:|
| Office Pro | 99.000 VNĐ |
| Research Lab | 199.000 VNĐ |
| Content Studio | 299.000 VNĐ |
| Code Forge | 299.000 VNĐ |
| Founder Suite | 499.000 VNĐ |
| Business Pack | 799.000 VNĐ |
| Heritage Vault | 199.000 VNĐ |
| Community OS | 599.000 VNĐ |
| Evidence Pro | 149.000 VNĐ |

### Academy (tách biệt)

| Item | Giá |
|---|---:|
| Academy Pass | Báo giá (theo track) |
| Certification Fee | Báo giá (per attempt) |

> **Giá chỉ khóa sau khi đo:** model cost, workflow cost, storage, support, gross margin, usage distribution. Per `ENTITLEMENT_MODEL.md` §10.

---

## 8. Ví dụ combo mua hàng

| Khách hàng | Model | Functional Products | Tổng/tháng |
|---|---|---|---:|
| Cá nhân mới | Start | — | Free |
| Cá nhân văn phòng | Personal + Office Pro | 299K + 99K | 398.000 VNĐ |
| Gia đình | Family + Heritage Vault | 599K + 199K | 798.000 VNĐ |
| Content creator | Creator + Content Studio | 999K + 299K | 1.298.000 VNĐ |
| Founder | Founder + Founder Suite | 1.999M + 499K | 2.498.000 VNĐ |
| Doanh nghiệp nhỏ | Business + Business Pack + Office Pro | 4.999M + 799K + 99K | 5.897.000 VNĐ |
| Chi họ | Chapter + Community OS + Heritage Vault | 7.999M + 599K + 199K | 8.797.000 VNĐ |
| Enterprise | Enterprise | Báo giá | Custom |
| Sovereign | Sovereign | Báo giá | Custom |

---

## 9. Source of truth

Catalog này là **source of truth** cho product definitions. Khi `packages/product-catalog/` được tạo (Sprint 1), nó phải implement:

```
packages/product-catalog/
├── models.json          — 9 AI Computer Models
├── functional-products.json — 9 Functional Products
├── entitlements.json    — entitlement keys per model + add-on
├── limits.json          — quota, memory, vault limits
├── prices.json          — pricing (locked after cost measurement)
├── compatibility.json   — model × functional product matrix
├── academy-access.json  — Academy Pass + Certification Fee (separate)
└── catalog.schema.json  — JSON schema validation
```

Không repo nào được hardcode pricing, model definitions, hoặc functional product definitions ngoài catalog này.

---

## 10. Change log

| Date | Version | Change | By |
|---|---|---|---|
| 2026-07-02 | V1.0 | Initial 9×9 product catalog | Founder |
