# KẾ HOẠCH ĐỘC LẬP HOÀN TOÀN NGUYENAI.NET — v1.0

> **⚠️ SUPERSEDED 2026-07-16:** Direct vendor key instructions (OPENAI_API_KEY, etc.)
> in this document are BANNED per `AI_PROVIDER_SINGLE_SOURCE_DECISION_2026-07-16.md`.
> All AI calls now go through `aiagent.iai.one` via `AI_PROVIDER_API_KEY`.
> Kept for historical reference only — do not use for new decisions.

> **Ngày:** 2026-07-08
> **Người phê duyệt:** Trần Hà Tâm (Founder)
> **Căn cứ:** Văn kiện V2.0 (2026-07-06), báo cáo kiểm định 2026-07-06, audit codebase trực tiếp 2026-07-08
> **Mục tiêu:** nguyenai.net vận hành hoàn toàn độc lập — không đụng tới Gen1 (computer.iai.one) và Gen2 (maytinhai.org) trong bất kỳ đường chạy, nội dung, hay lời công khai nào.
> **Thay thế:** Kế hoạch độc lập 2026-07-04 và V2.0 2026-07-06 (bổ sung và sửa số liệu)

---

## 0. PHÁN QUYẾT HIỆN TRẠNG (verify trực tiếp 2026-07-08)

### 0.1. Số liệu thực tế (đã đếm lại)

| Chỉ số | V2.0 nói | Thực tế | Chênh |
|---|---|---|---|
| Số gói `@nai/*` | 67 | **78** | +11 |
| Số test | ~2.321 | **chưa verify lại** (turbo test đang chạy) | — |
| Typecheck | không đề cập | **139/139 PASS** (đã fix phiên này) | — |
| Route files đã viết | không đề cập | **8 file, ~50+ endpoint** | — |
| Route files đã mount | không đề cập | **0/8** (toàn bộ dead code) | — |
| proxyToGen1 routes | 8 | **8** (dòng 516-537) | đúng |
| LEGACY_BRIDGE_ENABLED | cần tạo | **không tồn tại** | — |
| Gen1/Gen2 trong nội dung công khai | 12 dòng | **12 dòng** (pages.ts: 154, 163, 363, 365, 644, 844, 846) | đúng |
| Gen1/Gen2 trong src/ cũ | 18 dòng | **18 dòng** (src/data/pages.ts: 28, 147-148, 160, 317-318 + verify.iai.one) | đúng |
| GEN1_GATEWAY_URL trong wrangler.jsonc | không đề cập | **có** — `https://aiagent-iai-one-api-prod.tranhatam.workers.dev` | — |
| Component nhận diện (RGradeBadge, v.v.) | thiếu | **thiếu toàn bộ** | đúng |
| Trang bằng chứng (/proof, /status, v.v.) | thiếu | **thiếu toàn bộ** | đúng |

### 0.2. Khoảng cách trước–sau

| Lớp | Trước | "Sau áp dụng" (thực tế 2026-07-08) |
|---|---|---|
| Văn kiện chính sách | 0% | ~100% (V2.0 + QA reports) |
| Khung code đã viết | 0% | ~40% (8 route files, không mount) |
| Nối vào hệ thống chạy thật | 0% | **0%** |
| Kiểm chứng độc lập | 0% | **0%** (template rỗng "NOT RUN") |
| Nội dung công khai gỡ Gen1 | 0% | **0%** (vẫn đang index) |

**Phán quyết:** V2.0 đúng bản chất nhưng chưa được thi công. Kế hoạch này là lệnh thi công thực sự.

---

## 1. NGUYÊN TẮC ĐỘC LẬP (KHÓA)

1. **Nguyễn AI là hệ nhận diện và hệ sản phẩm độc lập.** Mọi năng lực công bố phải chạy trên nền riêng.
2. **Gen1 và Gen2 chỉ là dự phòng kỹ thuật nội bộ**, không xuất hiện trong lời công khai, không là điều kiện vận hành mặc định.
3. **Cầu chuyển tiếp tắt mặc định.** Bật chỉ khi failover, có phê duyệt Founder, có biên nhận kiểm định.
4. **Không một chuỗi công khai nào chứa "Gen1", "Gen2", "computer.iai.one", "maytinhai.org"** — trừ khối kỹ thuật (code blocks) trong tài liệu hướng dẫn.
5. **Cổng xác minh danh tính** (`verify.iai.one`) là ngoại lệ được phép — gọi là "Cổng xác minh danh tính" / "Identity Verification Gateway" trong nội dung người dùng.
6. **Sổ đăng ký lõi mật (AIOS_CORE_SECRET_REGISTER) không đặt trong kho công khai.**

---

## NHÓM 1 — NỐI MẠCH (làm đầu tiên, mọi thứ khác phụ thuộc)

> **Mục tiêu:** API chạy thật đi qua nền riêng, Gen1 chỉ là failoff tắt mặc định.

### WI-1.1: Mount 6 route file vào index.ts

**File:** `apps/api/src/index.ts`

**Hiện trạng:** 6 file route đã viết nhưng KHÔNG được import:
- `./routes/model-gateway.ts` (3 routes)
- `./routes/fallback.ts` (9 routes)
- `./routes/incidents.ts` (8 routes)
- `./routes/self-heal.ts` (12 routes)
- `./routes/notifications.ts` (3 routes)
- `./routes/admin-approvals.ts` (6 routes)

**Việc làm:**
1. Import 6 file route vào `index.ts`
2. Mount bằng `app.route('/v1/model-gateway', modelGatewayRoutes)` v.v.
3. Mount thêm `scholarship-routes.ts` và `investor-routes.ts`

**Tiêu chí nghiệm thu:** `curl https://api.nguyenai.net/v1/incidents` trả JSON (không 404), `curl /v1/self-heal` trả JSON.

### WI-1.2: Đảo provider chain — /v1/chat đi qua model-gateway, không qua proxyToGen1

**File:** `apps/api/src/index.ts` dòng 516-537

**Hiện trạng:** 8 route gọi `proxyToGen1` trực tiếp:
- `POST /v1/chat` → `proxyToGen1(c, '/v1/chat')`
- `POST /v1/stream` → `proxyToGen1(c, '/v1/stream')`
- `GET /v1/gen1/models` → `proxyToGen1(c, '/v1/models')`
- `GET /v1/gen1/health` → `proxyToGen1(c, '/v1/health')`
- `GET /v1/gen1/quota` → `proxyToGen1(c, '/v1/quota')`
- `GET /v1/gen1/tos` → `proxyToGen1(c, '/v1/tos')`
- `POST /v1/gen1/tos/accept` → `proxyToGen1(c, '/v1/tos/accept')`
- `POST /v1/workflows` → `proxyToGen1(c, '/v1/workflows')`

**Việc làm:**
1. `POST /v1/chat` → gọi `@nai/model-gateway` (provider riêng: OpenAI/Anthropic/Google qua key riêng)
2. `POST /v1/stream` → gọi `@nai/model-gateway` streaming
3. `GET /v1/models` → trả danh sách model từ `@nai/model-gateway` (không prefix `/gen1/`)
4. `GET /v1/health` → kiểm tra sức khỏe nền riêng (không proxy Gen1)
5. `POST /v1/workflows` → gọi `@nai/aqueduct` (WorkflowExecutor riêng)
6. Các route `/v1/gen1/*` → giữ nhưng **chỉ hoạt động khi `LEGACY_BRIDGE_ENABLED=true`**; mặc định trả 404
7. Khi model-gateway fail → gọi `@nai/fallback` chain → nếu fallback cũng fail → trả lỗi rõ ràng (không tự động proxy Gen1)

**Tiêu chí nghiệm thu:**
- `POST /v1/chat` với body `{model: "gpt-4o", messages: [...]}` → trả response từ provider riêng
- `LEGACY_BRIDGE_ENABLED` không set → `GET /v1/gen1/models` trả 404
- `LEGACY_BRIDGE_ENABLED=true` → `GET /v1/gen1/models` trả data Gen1 (failoff)

### WI-1.3: Đặt cờ LEGACY_BRIDGE_ENABLED=false mặc định

**File:** `apps/api/src/index.ts`, `apps/api/wrangler.jsonc`

**Việc làm:**
1. Thêm `LEGACY_BRIDGE_ENABLED?: string` vào `AppEnv` bindings
2. Trong `proxyToGen1`, kiểm tra `if (c.env.LEGACY_BRIDGE_ENABLED !== 'true') return c.json({error: 'Legacy bridge disabled'}, 404)`
3. Trong `wrangler.jsonc`, KHÔNG set `LEGACY_BRIDGE_ENABLED` (mặc định undefined = false)
4. Mỗi lần bật/tắt → ghi biên nhận qua `@nai/audit`

**Tiêu chí nghiệm thu:** Deploy → `GET /v1/gen1/health` trả 404. Bật cờ → trả 200. Có biên nhận audit.

### WI-1.4: Cấp secrets cho provider riêng

**Việc làm:**
1. `wrangler secret put OPENAI_API_KEY` — key OpenAI riêng
2. `wrangler secret put ANTHROPIC_API_KEY` — key Anthropic riêng
3. `wrangler secret put GOOGLE_AI_API_KEY` — key Google AI riêng
4. `wrangler secret put RESEND_API_KEY` — Resend cho email
5. `wrangler secret put TELEGRAM_BOT_TOKEN` — Telegram cho alert
6. Nếu thiếu key → cảnh báo Admin, độc lập chỉ nằm trên giấy

**Tiêu chí nghiệm thu:** `POST /v1/chat` với model `gpt-4o` → trả response thật từ OpenAI (không qua Gen1).

---

## NHÓM 2 — DANH TÍNH AIOS (gỡ Gen1/Gen2 khỏi công khai)

> **Mục tiêu:** Không một chuỗi "Gen1/Gen2/computer.iai.one/maytinhai.org" nào trong nội dung người dùng.

### WI-2.1: Gỡ Gen1/Gen2 khỏi apps/web/src/data/pages.ts

**File:** `apps/web/src/data/pages.ts`

**12 vi phạm cần sửa (verify trực tiếp):**

| Dòng | Bản ngữ | Chuỗi sai | Chuỗi thay |
|---|---|---|---|
| 154 | VI | "Gen 1 và Gen 2 đóng băng làm kiến trúc tham chiếu; adapter giữ compatibility contract khi integrate" | "Nguyễn AI vận hành trên phần nền riêng, tự chủ toàn bộ. Chúng tôi không mô tả cơ chế bên trong — chúng tôi công bố kết quả kèm biên nhận." |
| 163 | VI | "Đội ngũ AI Agent mặc định vận hành trên nền tảng Gen1" | "Chín tác nhân chuyên biệt vận hành trên nền tảng riêng của Nguyễn AI" |
| 363 | VI | "vận hành trên nền Gen1" | "vận hành trên nền tảng riêng của Nguyễn AI" |
| 365 | VI | "Nền tảng Gen1" + "9 Agent Nguyễn vận hành trên nền 9 Agent Gen1" | "Nền tảng riêng" + "Chín tác nhân Nguyễn AI: Dẫn Đường, Nghiên Cứu, Lưu Trữ, Kiểm Chứng, Quản Gia Đình, Sáng Lập, Vận Hành Kinh Doanh, Kết Nối Toàn Cầu, Bảo Vệ" |
| 644 | EN | "operates on the Gen1 platform" | "runs on Nguyen AI's own platform" |
| 844 | EN | "operating on the Gen1 platform" | "run on Nguyen AI's own platform" |
| 846 | EN | "Gen1 platform" + "9 Gen1 platform Agents" | "Nguyen AI platform" + "Nine Nguyen AI agents" |

**Tiêu chí nghiệm thu:** `grep -ri "Gen1\|Gen 1\|Gen2\|Gen 2\|computer.iai.one\|maytinhai.org" apps/web/src/data/pages.ts` → 0 kết quả (trừ code blocks).

### WI-2.2: Cách ly src/ gốc cũ

**Việc làm:**
1. `mkdir -p docs/legacy/root-site-2026-07/`
2. `mv src/ docs/legacy/root-site-2026-07/src/`
3. `mv public/ docs/legacy/root-site-2026-07/public/` (nếu có)
4. Gỡ khỏi mọi lệnh dựng (astro.config, package.json scripts)
5. Ghi quyết định vào `docs/governance/GOVERNANCE_DECISION_LOG.md`

**Tiêu chí nghiệm thu:** `ls src/` → không tồn tại. `grep -r "Gen1" docs/legacy/` → chỉ trong vùng lịch sử.

### WI-2.3: Gỡ GEN1_GATEWAY_URL khỏi wrangler.jsonc mặc định

**File:** `apps/api/wrangler.jsonc` dòng 12

**Hiện trạng:** `"GEN1_GATEWAY_URL": "https://aiagent-iai-one-api-prod.tranhatam.workers.dev"`

**Việc làm:**
1. Xóa dòng này khỏi wrangler.jsonc (hoặc comment out)
2. Chỉ set qua `wrangler secret put GEN1_GATEWAY_URL` khi cần failoff
3. Ghi biên nhận audit

**Tiêu chí nghiệm thu:** `grep "GEN1_GATEWAY_URL" apps/api/wrangler.jsonc` → 0 kết quả.

### WI-2.4: Thuần ngữ toàn bộ nội dung tiếng Việt

**Áp dụng bảng thay thế 28 từ (Mục 4.2 V2.0):**

| Từ sai | Thay |
|---|---|
| instance | máy riêng |
| Agent / Agent Team | tác nhân / đội tác nhân |
| backend | phần nền sau |
| workflow | luồng công việc |
| model | mô hình |
| adapter | cầu chuyển tiếp |
| compatibility contract | hợp đồng tương thích |
| integrate | tích hợp |
| Automation | tự động hóa |
| trigger | điểm kích hoạt |
| scheduled task | tác vụ hẹn giờ |
| multi-step | nhiều bước |
| Command Center | Trung Tâm Lệnh |
| Model Mesh | Lưới Mô Hình |
| Tool Kernel | Nhân Công Cụ |
| Data Vault | Két Dữ Liệu |
| Long-term Memory | Bộ Nhớ Dài Hạn |
| Workflow Engine | Bộ Máy Luồng Việc |
| Approval Gates | Cổng Phê Duyệt |
| Security Boundary | Ranh Giới Bảo Mật |
| Cost Governor | Bộ Quản Chi Phí |
| Audit & Replay | Kiểm Định & Phát Lại |
| Sync Layer | Tầng Đồng Bộ |
| Self-Upgrade Registry | Sổ Tự Nâng Cấp |
| Identity | Danh Tính |
| Evidence | Bằng Chứng |
| Super Apps | Siêu Ứng Dụng |
| Verification | Kiểm Chứng |

**Tiêu chí nghiệm thu:** Công cụ quét ranh giới ngôn ngữ chạy đạt.

### WI-2.5: Tách tiêu đề trang theo bản ngữ

**Hiện trạng:** `title: 'Nguyen AI Computer | AI Computer cho thế hệ Nguyễn toàn cầu'` (trộn)

**Thay:**
- Bản Việt: `"Máy Tính AI Nguyễn — Máy Tính AI của thế hệ Nguyễn toàn cầu | Nguyễn AI"`
- Bản Anh: `"Nguyen AI Computer — The AI Computer for the global Nguyen generation | Nguyen AI"`

---

## NHÓM 3 — LỚP BẰNG CHỨNG V2.0

> **Mục tiêu:** Có component, trang, và file dữ liệu nhận diện.

### WI-3.1: Tạo 5 tệp dữ liệu thương hiệu

**Đường dẫn:** `packages/brand/`

1. `brand-names.json` — tên chuẩn (Nguyễn AI, Máy Tính AI Nguyễn, v.v.)
2. `banned-names.json` — tên cấm (Nguyên AI, AI Nguyen, NAI Network, v.v.)
3. `r-grade-labels.json` — 4 nhãn R0/R1/R2/R3 với tên VI + EN
4. `public-claims.json` — danh sách tuyên bố công khai được phép
5. `language-rules.json` — bảng 28 từ thay thế + 16 tên component song ngữ

### WI-3.2: Tạo 5 thành phần giao diện

**Đường dẫn:** `apps/web/src/components/`

1. `RGradeBadge.astro` — huy hiệu nhãn tin cậy R0–R3
2. `ProofReceiptCard.astro` — thẻ biên nhận (mã băm, thời gian, người duyệt)
3. `PublicClaimBlock.astro` — khối tuyên bố công khai
4. `ProductStatusMatrix.astro` — ma trận năng lực × nhãn
5. `LanguageBoundaryNotice.astro` — ghi chú ranh giới ngôn ngữ

### WI-3.3: Tạo 5 cặp trang bằng chứng song ngữ

**Đường dẫn:** `apps/web/src/pages/`

| Route VI | Route EN | Nội dung |
|---|---|---|
| `/proof` | `/en/proof` | Bằng chứng độc lập vận hành |
| `/status` | `/en/status` | Trạng thái sản phẩm × nhãn R |
| `/claims` | `/en/claims` | Tuyên bố công khai |
| `/receipts` | `/en/receipts` | Biên nhận kiểm chứng |
| `/demo` | `/en/demo` | Bản chứng minh năng lực |

### WI-3.4: Đưa câu chủ lên trang chủ

- Câu chủ: **"Máy làm — người ký — mọi việc có biên nhận."**
- Khối nhận diện bằng bằng chứng (3 vế nối 3 tên lõi)
- Câu hiến chương ở chân trang

### WI-3.5: Tạo 6 tệp quản trị nhận diện

**Đường dẫn:** `docs/governance/`

1. `INDEPENDENT_IDENTITY_SYSTEM_CHARTER.md`
2. `PUBLIC_CLAIMS_CHARTER.md`
3. `TRUE_AI_COMPUTER_STANDARD.md`
4. `R_GRADE_STATUS_POLICY.md`
5. `LANGUAGE_PURITY_POLICY.md`
6. `GOVERNANCE_DECISION_LOG.md` (nhật ký quyết định)

> **Lưu ý an ninh:** `AIOS_CORE_SECRET_REGISTER` KHÔNG đặt trong kho này (kho công khai).

---

## NHÓM 4 — NỀN BẢO MẬT

> **Mục tiêu:** Không còn lỗi P0 security.

### WI-4.1: Sửa SQL injection trong scholarship-routes.ts

**File:** `apps/api/src/scholarship-routes.ts`
**Việc:** Thay toàn bộ string concatenation trong SQL bằng parameterized queries (`?` hoặc `$1`).
**Tiêu chí:** Không còn `${variable}` trong SQL string.

### WI-4.2: Sửa passkey bypass trong @nai/auth

**File:** `packages/@nai/auth/src/index.ts`
**Việc:** Kiểm tra logic passkey — đảm bảo không có path bỏ qua verification.
**Tiêu chí:** Test cố tình bypass → fail.

### WI-4.3: Gỡ signing key khỏi git

**Việc:**
1. Tìm tất cả private key / signing key trong code
2. Chuyển sang `wrangler secret put`
3. Xóa khỏi code, thêm vào `.gitignore`
**Tiêu chí:** `grep -r "PRIVATE_KEY\|SIGNING_KEY" --include="*.ts" apps/ packages/` → 0 kết quả.

### WI-4.4: Sửa auth middleware bypass

**File:** `apps/api/src/index.ts`
**Việc:** Đảm bảo mọi route `/v1/*` (trừ `/health`, `/v1/session`, `/v1/plans`) đều có auth middleware.
**Tiêu chí:** `curl /v1/me` không có cookie → 401.

### WI-4.5: Sửa XSS trong verify.astro

**Việc:** Tìm `set:html` hoặc unescaped input trong verify.astro, thay bằng escaped output.
**Tiêu chí:** Không còn `set:html` với user input.

### WI-4.6: Sửa 7 lỗi P0 SEO/song ngữ

1. Tách meta title/description theo bản ngữ
2. Thêm hreflang đủ hai chiều
3. Sitemap tách VI/EN
4. JSON-LD không chứa Gen1
5. robots.txt đúng
6. Open Graph tách bản ngữ
7. Canonical URL đúng

---

## NHÓM 5 — KIỂM CHỨNG VÀ ĐÓNG DẤU

> **Mục tiêu:** Chỉ tuyên bố "độc lập hoàn toàn" khi có bằng chứng thật.

### WI-5.1: Chạy 8 cổng kiểm tra

| Cổng | Điều kiện | Công cụ |
|---|---|---|
| 1. Tên thương hiệu | Không tên cấm | `tools/audit-brand-naming-lock.sh` |
| 2. Ngôn ngữ | Không trộn | `tools/audit-language-purity.sh` (viết mới) |
| 3. Độc lập | Không Gen1/Gen2 công khai | `tools/audit-independence.sh` (viết mới) |
| 4. Nhãn trạng thái | Mọi năng lực có nhãn R | `tools/audit-r-grade-claims.ts` (viết mới) |
| 5. Biên nhận | Tuyên bố quan trọng có mã | Kiểm tra thủ công + `@nai/audit` |
| 6. Tuyên bố công khai | Trong hiến chương | Đối chiếu `public-claims.json` |
| 7. Đầu tư | Không cam kết lợi nhuận | Kiểm tra `apps/invest/` |
| 8. Bằng chứng phát hành | Gói đầy đủ | Sinh `RELEASE_EVIDENCE_PACK.md` |

### WI-5.2: Chạy 6 bài IND chaos drill

1. Tắt `LEGACY_BRIDGE_ENABLED` → API vẫn hoạt động
2. Xóa `GEN1_GATEWAY_URL` → API vẫn hoạt động
3. Gọi `/v1/chat` → response từ provider riêng (verify header)
4. Gọi `/v1/gen1/models` → 404
5. `grep -ri "Gen1" apps/web/src/` → 0 kết quả
6. `grep -ri "maytinhai.org" apps/web/src/` → 0 kết quả

### WI-5.3: Cập nhật V2.0

1. Số gói: 67 → 78
2. Số dòng bảng vá: cập nhật theo verify thực tế
3. Thêm Nhóm 1 (nối mạch) vào danh mục hạng mục
4. Thêm Nhóm 4 (bảo mật) vào danh mục hạng mục

### WI-5.4: Sinh gói bằng chứng phát hành

Tạo `docs/governance/RELEASE_EVIDENCE_PACK_2026-07-08.md`:
- Kết quả 8 cổng
- Kết quả 6 chaos drill
- Mã nguồn mốc (git hash)
- Người duyệt
- Thời gian
- Mã băm

---

## 2. THỨ TỰ THI CÔNG

| Pha | Hạng mục | Ưu tiên | Phụ thuộc |
|---|---|---|---|
| 1A | WI-1.1 Mount routes | P0 | — |
| 1A | WI-1.2 Đảo provider chain | P0 | WI-1.1 |
| 1A | WI-1.3 LEGACY_BRIDGE_ENABLED | P0 | WI-1.2 |
| 1A | WI-1.4 Cấp secrets | P0 | WI-1.2 |
| 1B | WI-2.1 Gỡ Gen1 khỏi pages.ts | P0 | — |
| 1B | WI-2.2 Cách ly src/ | P0 | — |
| 1B | WI-2.3 Gỡ GEN1_GATEWAY_URL | P0 | WI-1.3 |
| 1B | WI-2.4 Thuần ngữ | P1 | WI-2.1 |
| 1B | WI-2.5 Tách tiêu đề | P1 | WI-2.1 |
| 2 | WI-3.1–3.5 Lớp bằng chứng | P1 | WI-2.1 |
| 3 | WI-4.1–4.6 Bảo mật | P0 | — |
| 4 | WI-5.1–5.4 Kiểm chứng | P0 | Tất cả trên |

---

## 3. ĐỊNH NGHĨA HOÀN TẤT

Độc lập hoàn toàn = tất cả các điều kiện sau đạt:

1. ✅ `POST /v1/chat` → response từ provider riêng (không qua Gen1)
2. ✅ `GET /v1/gen1/*` → 404 (cầu chuyển tiếp tắt)
3. ✅ `grep -ri "Gen1\|Gen2\|computer.iai.one\|maytinhai.org" apps/web/src/` → 0
4. ✅ `src/` gốc cũ không tồn tại (đã chuyển vào `docs/legacy/`)
5. ✅ 8 cổng kiểm tra đạt
6. ✅ 6 chaos drill đạt
7. ✅ Gói bằng chứng phát hành đầy đủ
8. ✅ Không còn lỗi P0 security

Khi cả 8 điều kiện đạt → ghi "ĐỘC LẬP HOÀN TOÀN" vào nhật ký quyết định + biên nhận audit.

---

## 4. LƯU Ý AN NINH

- Kho này là **kho công khai**. Sổ đăng ký lõi mật (`AIOS_CORE_SECRET_REGISTER`) tuyệt đối không đặt trong đây.
- Provider API keys chỉ set qua `wrangler secret put`, không commit vào code.
- Signing key cho evidence cũng set qua secret, không hardcode.
- `.dev.vars` đã có trong `.gitignore` — verify không bị track.

---

*Người phê duyệt cuối: Trần Hà Tâm.*
*Câu chủ: Máy làm — người ký — mọi việc có biên nhận.*
