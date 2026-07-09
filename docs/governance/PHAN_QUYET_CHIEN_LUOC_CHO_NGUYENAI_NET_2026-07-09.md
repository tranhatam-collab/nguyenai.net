# PHÁN QUYẾT CHIẾN LƯỢC CHO NGUYENAI.NET

**Ngày:** 2026-07-09  
**Người phán quyết:** Founder  
**Trạng thái:** ✅ ĐƯỢC PHÊ DUYỆT — Audit hoàn thành, kế hoạch hành động xác định

---

## Tóm tắt điều chỉnh

Anh đang yêu cầu một điểm rất quan trọng: nguyenai.net không được chỉ là một giao diện gọi nhiều API trí tuệ nhân tạo. Nếu chỉ gọi OpenAI, Claude, Gemini, Grok, Mistral hoặc bất cứ mô hình nào rồi trả lời nguyên dạng, thì đó chỉ là một lớp trung gian, chưa phải AI Nguyễn.

**Audit 2026-07-09 kết luận:**
- ✅ Foundation backend đã tồn tại (model-gateway, output-guard, training-matrix, model-policy)
- ✅ Independence lock đã tồn tại và được enforce (audit:independence gate)
- ✅ Frontend không gọi trực tiếp provider API
- ⚠️ Training gateway chưa được tích hợp vào tất cả các luồng chat
- ⚠️ Language purity violations trong UI tiếng Việt
- ⚠️ Single-model survival mode chưa được implement đầy đủ
- ⚠️ Thiếu E2E tests, audit scripts, và governance policies

**Phán quyết:** Hướng này đúng. Foundation đã có. Bây giờ phải hoàn thiện Phase 2-11 để biến foundation thành production-ready AIOS Nguyễn.

---

## I. Điều gì làm nguyenai.net độc đáo?

### 1. Không bán "chatbot", mà xây một máy vận hành trí tuệ

**Điểm độc đáo đầu tiên:** Nguyễn AI không nên định vị là chatbot.

Nó phải là:

**Máy Tính AI Nguyễn:**
một không gian vận hành trí tuệ riêng cho cá nhân, gia đình, nhà sáng lập, doanh nghiệp, giáo dục, đầu tư, cộng đồng và dòng họ.

Người dùng không chỉ hỏi đáp. Người dùng phải có:

* danh tính;
* bộ nhớ;
* kho dữ liệu;
* tác nhân;
* công cụ;
* quy trình;
* phê duyệt;
* kiểm chứng;
* biên nhận;
* lịch sử hành động;
* quyền riêng tư;
* khả năng tự học;
* khả năng phục hồi khi lỗi.

### 2. Không phụ thuộc một model, mà có cổng điều phối model

Nguyễn AI có thể gọi nhiều nhà cung cấp mô hình khác nhau. Nhưng người dùng không được thấy một hệ thống rời rạc kiểu:

Lúc thì OpenAI trả lời.
Lúc thì Claude trả lời.
Lúc thì Gemini trả lời.
Lúc thì model khác trả lời.

Người dùng phải luôn cảm nhận:

Tôi đang làm việc với AI Nguyễn.

Bên dưới có thể thay model, nhưng bên trên phải giữ:

* cùng nhận diện;
* cùng giọng nói;
* cùng quy tắc;
* cùng ngôn ngữ;
* cùng đạo đức;
* cùng bảo mật;
* cùng cách xin phê duyệt;
* cùng cách ghi biên nhận;
* cùng cách nói "không chắc" khi chưa đủ dữ liệu.

### 3. Có cổng huấn luyện trước khi trả lời

**Điểm lõi cần build:**

**AI Nguyễn Training Gateway**

Tất cả request phải đi qua cổng này:

Người dùng
→ Cổng nhận diện AI Nguyễn
→ Cổng ngôn ngữ
→ Cổng phân loại dữ liệu
→ Cổng quyền riêng tư
→ Cổng ma trận tác nhân
→ Cổng chọn model
→ Model provider
→ Cổng kiểm tra đầu ra
→ Cổng biên nhận
→ Người dùng

Không model nào được trả lời thẳng ra giao diện.

### 4. Có ma trận tác nhân, không phải một AI chung chung

Mỗi tác vụ phải được phân vào vai trò:

| Tác vụ | Tác nhân phụ trách |
|--------|-------------------|
| Trả lời người dùng | Tác nhân điều phối |
| Nghiên cứu | Tác nhân nghiên cứu |
| Kiểm tra sự thật | Tác nhân kiểm chứng |
| Viết nội dung | Tác nhân biên tập |
| Lập kế hoạch | Tác nhân chiến lược |
| Code và audit | Tác nhân kỹ thuật |
| Dữ liệu gia đình | Tác nhân ký ức gia đình |
| Đầu tư | Tác nhân đầu tư, có giới hạn pháp lý |
| Học bổng | Tác nhân giáo dục, có phê duyệt |
| Lỗi hệ thống | Tác nhân sự cố |
| Tự khắc phục | Tác nhân sửa lỗi, chờ Admin duyệt |

### 5. Có biên nhận cho hành động quan trọng

Điểm khác biệt lớn là không chỉ "trả lời hay", mà phải có:

* Ai làm?
* Lúc nào?
* Dùng model nào?
* Dùng công cụ nào?
* Dữ liệu loại gì?
* Có xin quyền không?
* Kết quả ra sao?
* Có bằng chứng không?
* Có thể kiểm tra lại không?

Đây là khác biệt giữa một hệ thống nghiêm túc và một chatbot thông thường.

### 6. Riêng tư theo mặc định

Các tài liệu governance hiện tại đã khóa rất đúng: dữ liệu người đang sống phải riêng tư theo mặc định, cây gia đình riêng tư cho đến khi chủ sở hữu công bố, tài liệu gia đình riêng tư cho đến khi chủ sở hữu phê duyệt, và AI không được tự xác nhận huyết thống hay dòng dõi nếu thiếu nhãn bằng chứng và trạng thái tranh chấp.

Đây là một trong những trụ cột làm Nguyễn AI khác biệt: không lấy dữ liệu người dùng làm vật liệu công khai mặc định.

---

## II. Điều hợp lý và điều chưa hợp lý trong định hướng hiện tại

### Hợp lý

| Nội dung | Phán quyết |
|----------|-----------|
| Mọi model phải đi qua cổng AI Nguyễn | ✅ Đúng — Foundation đã có |
| Người dùng tương tác với AI Nguyễn, không tương tác trực tiếp với provider | ✅ Đúng — Frontend gọi backend API |
| Không để Gen 1, Gen 2 là hệ chính | ✅ Đúng — Independence lock exists |
| Có fallback khi API lỗi | ⚠️ Foundation có, nhưng chưa hoàn thiện |
| Còn một model sống vẫn phải chạy chế độ tối thiểu | ⚠️ Foundation có, nhưng chưa hoàn thiện |
| Có ma trận đào tạo cho mọi tác nhân | ⚠️ Foundation có, nhưng chưa hoàn thiện |
| Có kiểm tra đầu ra trước khi trả lời | ⚠️ Foundation có, nhưng chưa tích hợp vào tất cả luồng |
| Có biên nhận và nhật ký kiểm tra | ⚠️ Foundation có, nhưng chưa tích hợp vào tất cả luồng |
| Không tiết lộ kỹ thuật sâu ra public | ⚠️ Foundation có, nhưng chưa enforce đầy đủ |
| Frontend và backend phải đồng bộ bản sắc | ⚠️ Foundation có, nhưng có language purity violations |

### Chưa hợp lý nếu nói sai

| Cách nói chưa đúng | Cách nói đúng |
|-------------------|--------------|
| Nguyễn AI không phụ thuộc bất kỳ AI nào | Nguyễn AI không bị khóa vào một provider duy nhất |
| Nguyễn AI đã có model nền riêng hoàn toàn | Chỉ nói khi thật sự có model nền tự huấn luyện, tự vận hành |
| Mọi model đều phải nói mình là AI Nguyễn mà không minh bạch | Mọi model trả lời qua vai trò AI Nguyễn, nhưng không giả mạo nhà cung cấp nền |
| Chỉ còn một API thì vẫn làm toàn bộ như bình thường | Chỉ còn một API thì chạy chế độ tối thiểu, có giới hạn năng lực rõ |
| Không tiết lộ gì về model | Không tiết lộ kỹ thuật sâu, nhưng khi cần vẫn minh bạch rằng hệ thống có thể dùng nhiều mô hình nền được cấp quyền |

---

## III. Câu định vị public chuẩn

Dùng cho website, tài liệu, investor, team dev:

> **Nguyễn AI là hệ máy trí tuệ nhân tạo vận hành độc lập cho cá nhân, gia đình, nhà sáng lập, doanh nghiệp, giáo dục, đầu tư và cộng đồng.**
> 
> **Bên dưới, hệ thống có thể sử dụng nhiều mô hình trí tuệ nhân tạo khác nhau tùy tác vụ và quyền truy cập. Nhưng mọi đầu vào và đầu ra đều phải đi qua cổng huấn luyện, ma trận tác nhân, chính sách dữ liệu, kiểm tra ngôn ngữ, bảo mật, phê duyệt và biên nhận của AI Nguyễn.**
> 
> **Vì vậy người dùng không làm việc trực tiếp với một API riêng lẻ. Người dùng làm việc với AI Nguyễn.**

**Không dùng public:**

* Chúng tôi không phụ thuộc bất kỳ AI nào.
* Chúng tôi đã thay thế toàn bộ OpenAI, Claude, Gemini.
* Chúng tôi có model mạnh hơn tất cả.
* Chúng tôi không cần nhà cung cấp nào.

Vì nếu backend vẫn dùng API provider, nói như vậy sẽ sai sự thật.

---

## IV. Ma trận cổng đào tạo bắt buộc

### 1. Cổng nhận diện

Mọi model phải học:

> Tôi là AI Nguyễn, lớp trợ lý và máy trí tuệ của Nguyễn AI.
> Tôi vận hành trong hệ thống Nguyễn AI, tuân thủ quy tắc về ngôn ngữ, bảo mật, phê duyệt, bằng chứng và biên nhận.

Khi hỏi model nền:

> Tôi vận hành qua Nguyễn AI. Bên dưới hệ thống có thể sử dụng nhiều mô hình trí tuệ nhân tạo được cấp quyền tùy tác vụ. Dù dùng mô hình nào, câu trả lời vẫn phải tuân thủ quy tắc của AI Nguyễn.

Không được:
* Claim một proprietary foundation model nếu chưa verify.
* Giả mạo nhà cung cấp nền.
* Lộ kỹ thuật routing ra public.

### 2. Cổng ngôn ngữ

| Đầu vào | Đầu ra |
|---------|--------|
| Tiếng Việt | Tiếng Việt sạch |
| Tiếng Anh | Tiếng Anh sạch |
| Song ngữ | Tách rõ hai phần |
| Tiếng Việt có lẫn tiếng Anh | Ưu tiên tiếng Việt, chỉ giữ tên riêng được duyệt |
| Trang tiếng Việt | Không có tiếng Anh trong giao diện |
| Trang tiếng Anh | Không có tiếng Việt trong giao diện |

**Audit 2026-07-09:** Language purity violations tồn tại trong UI tiếng Việt (English terms mixed). Phase 6 sẽ fix.

### 3. Cổng dữ liệu

Trước khi gọi model, hệ thống phải phân loại:

* public
* account
* session
* organization
* machine_state
* memory
* vault_object
* evidence
* academy_progress
* proof
* certificate
* investor_profile
* data_room_document
* audit_log
* billing
* family_private
* roots_private

Dữ liệu nhạy cảm không được gửi ra model ngoài nếu chưa có quyền, chưa có mục đích, chưa có consent và chưa có audit.

### 4. Cổng tác nhân

Không dùng một prompt chung cho mọi việc. Phải chọn vai:

* Nguyễn Điều Phối
* Nguyễn Nghiên Cứu
* Nguyễn Kiểm Chứng
* Nguyễn Biên Tập
* Nguyễn Kỹ Thuật
* Nguyễn Gia Phả
* Nguyễn Giáo Dục
* Nguyễn Đầu Tư
* Nguyễn Bảo Vệ
* Nguyễn Sự Cố
* Nguyễn Sửa Lỗi

### 5. Cổng model

Mỗi model provider phải có hồ sơ năng lực:

| Năng lực | Ví dụ |
|---------|------|
| suy luận | lập kế hoạch, phân tích |
| viết | nội dung, biên tập |
| lập trình | code, test, audit |
| nghiên cứu | đọc tài liệu, tổng hợp |
| hình ảnh | nhận diện hình ảnh |
| âm thanh | giọng nói, chuyển văn bản |
| tốc độ | phản hồi nhanh |
| chi phí | kiểm soát quota |
| độ ổn định | tỷ lệ lỗi |
| vùng dữ liệu | yêu cầu riêng tư |

### 6. Cổng kiểm tra đầu ra

Trước khi trả lời người dùng, phải kiểm:

* có đúng nhận diện AI Nguyễn không;
* có đúng ngôn ngữ không;
* có lộ model provider không;
* có lộ kỹ thuật nội bộ không;
* có hứa quá mức không;
* có bịa bằng chứng không;
* có vi phạm quyền riêng tư không;
* có cần phê duyệt không;
* có cần biên nhận không;
* có cần hỏi lại vì thiếu dữ liệu không.

---

## V. Chế độ chỉ còn một model API còn sống

Anh yêu cầu rất đúng: dù nhiều API chết, còn một model sống thì hệ thống vẫn phải vận hành.

Nhưng phải chia cấp độ.

### 1. Chế độ bình thường

Nhiều model hoạt động.
Router chọn model tối ưu theo tác vụ.

### 2. Chế độ suy giảm

Một số model lỗi.
Router chuyển tác vụ sang model còn sống.
Admin nhận cảnh báo.
Người dùng không cần thấy lỗi kỹ thuật nếu tác vụ vẫn xử lý được.

### 3. Chế độ tối thiểu

Chỉ còn một model API còn sống.
Hệ thống vẫn trả lời, lập kế hoạch, ghi biên nhận, giữ nhận diện AI Nguyễn.
Các tác vụ không phù hợp với model còn lại phải báo giới hạn rõ ràng.

Ví dụ nếu chỉ còn model văn bản:

* Có thể xử lý viết, phân tích, lập kế hoạch.
* Không được giả vờ đã xử lý hình ảnh, âm thanh hoặc code runtime nếu model không có năng lực đó.

### 4. Chế độ khẩn cấp

Không còn model nào sống.
Hệ thống không giả vờ trả lời.
Tạo incident.
Báo Admin.
Hiển thị thông báo dịch vụ suy giảm.
Tác nhân sự cố tự chẩn đoán và chờ Admin duyệt phương án khắc phục.

**Audit 2026-07-09:** Foundation cho failure/fallback/incident/self-heal tồn tại, nhưng single-model survival mode chưa được implement đầy đủ. Phase 7 sẽ hoàn thiện.

---

## VI. Backend cần hoàn thiện

### Gói lõi phải có

| Package | Trạng thái Audit 2026-07-09 | Hành động |
|---------|---------------------------|-----------|
| `packages/@nai/training-gateway` | ❌ Chưa tồn tại | Phase 2: Tạo mới hoặc extend training-matrix |
| `packages/@nai/model-router` | ❌ Chưa tồn tại | Phase 2: Tạo mới |
| `packages/@nai/model-policy` | ✅ Tồn tại | Phase 2: Extend với capability matrix |
| `packages/@nai/agent-matrix` | ❌ Chưa tồn tại | Phase 2: Tạo mới |
| `packages/@nai/output-guard` | ✅ Tồn tại | Phase 2: Tích hợp vào tất cả luồng chat |
| `packages/@nai/identity-guard` | ❌ Chưa tồn tại (trong model-policy) | Phase 2: Tách ra hoặc extend model-policy |
| `packages/@nai/language-guard` | ❌ Chưa tồn tại (trong model-policy) | Phase 2: Tách ra hoặc extend model-policy |
| `packages/@nai/data-classifier` | ❌ Chưa tồn tại (trong model-policy) | Phase 2: Tách ra hoặc extend model-policy |
| `packages/@nai/receipt-engine` | ❌ Chưa tồn tại (trong model-gateway) | Phase 2: Tách ra hoặc extend model-gateway |
| `packages/@nai/fallback-router` | ❌ Chưa tồn tại (trong fallback) | Phase 2: Extend fallback |
| `packages/@nai/model-health` | ❌ Chưa tồn tại | Phase 2: Tạo mới |
| `packages/@nai/provider-adapters` | ❌ Chưa tồn tại | Phase 2: Tạo mới |
| `packages/@nai/self-learning` | ❌ Chưa tồn tại | Phase 2: Tạo mới |
| `packages/@nai/eval-harness` | ❌ Chưa tồn tại | Phase 2: Tạo mới |

### API route bắt buộc

| Route | Trạng thái Audit 2026-07-09 | Hành động |
|-------|---------------------------|-----------|
| `POST /v1/ai-nguyen/invoke` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `POST /v1/ai-nguyen/stream` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `POST /v1/ai-nguyen/train-gate` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `POST /v1/ai-nguyen/policy-check` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `POST /v1/ai-nguyen/output-check` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `GET /v1/models/health` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `GET /v1/models/capability` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `POST /v1/models/fallback` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `POST /v1/receipts` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `GET /v1/receipts/:id` | ❌ Chưa tồn tại | Phase 3: Tạo mới |
| `POST /v1/incidents` | ✅ Tồn tại | Phase 3: Verify |
| `POST /v1/admin-approvals` | ✅ Tồn tại | Phase 3: Verify |

**Lưu ý:** Tất cả existing `/v1/chat` và `/v1/stream` phải route through AI Nguyễn Training Gateway. Không được direct provider response đến user.

### Database migration

| Table | Trạng thái Audit 2026-07-09 | Hành động |
|-------|---------------------------|-----------|
| `model_providers` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `model_capabilities` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `model_health_events` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `model_invocations` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `training_gateway_runs` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `agent_policy_runs` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `output_guard_results` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `identity_guard_results` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `language_guard_results` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `data_classification_results` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `receipt_records` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `fallback_events` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `self_learning_events` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `eval_runs` | ❌ Chưa tồn tại | Phase 4: Tạo mới |
| `eval_failures` | ❌ Chưa tồn tại | Phase 4: Tạo mới |

---

## VII. Frontend cần hoàn thiện

### Frontend không được hiển thị

* OpenAI đang trả lời...
* Claude đang xử lý...
* Gemini error...
* API provider failed...

### Frontend phải hiển thị theo ngôn ngữ người dùng

* AI Nguyễn đang xử lý yêu cầu.
* AI Nguyễn đang kiểm tra kết quả.
* AI Nguyễn cần bạn phê duyệt trước khi tiếp tục.
* AI Nguyễn đã tạo biên nhận cho tác vụ này.
* Dịch vụ đang suy giảm, hệ thống đã báo quản trị viên.

### Language purity

**Audit 2026-07-09:** Bản tiếng Việt phải sạch tiếng Việt. Bản tiếng Anh phải sạch tiếng Anh. Lỗi tiếng Việt lẫn tiếng Anh trên menu và trang Máy Tính AI Nguyễn hiện đã được xác minh trong source, vì dữ liệu tiếng Việt đang chứa nhiều từ như AI Computer, Agent, Super App, Instance, Model Mesh, Workflow Engine, Approval Gates, Security Boundary.

**Hành động Phase 6:** Fix tất cả language purity violations, thêm CI gate cho language purity.

---

## VIII. Lệnh audit và thực thi toàn diện cho team dev

Gửi nguyên văn lệnh này:

```
NGUYEN AI TRAINING GATEWAY, MODEL INDEPENDENCE AND AIOS QA COMMAND
Bạn là Principal AIOS Architect, Model Gateway Engineer, AI Agent Training Lead, Security Engineer, Frontend Lead, Backend Lead và QA Auditor cho nguyenai.net.
Founder decision:
NguyenAI.net không được là một giao diện gọi API rời rạc.
Người dùng phải tương tác với AI Nguyễn.
Mọi model provider, mọi API, mọi AI Agent, mọi tác vụ đều phải đi qua cổng huấn luyện, ma trận tác nhân, chính sách dữ liệu, kiểm tra đầu ra, bảo mật, phê duyệt và biên nhận của Nguyễn AI.
Không được:
- cho browser gọi thẳng model provider;
- để provider trả lời trực tiếp ra người dùng;
- hiển thị tên provider như danh tính chính;
- nói sai rằng Nguyễn AI đã sở hữu model nền riêng nếu chưa có;
- tiết lộ kỹ thuật routing, provider key, prompt nội bộ, model policy nội bộ ra public;
- làm sai nhận diện thương hiệu Nguyễn AI;
- để bản tiếng Việt lẫn tiếng Anh;
- để bản tiếng Anh lẫn tiếng Việt;
- bỏ qua biên nhận;
- bỏ qua phân loại dữ liệu;
- bỏ qua phê duyệt với dữ liệu nhạy cảm;
- giả vờ xử lý khi model không đủ năng lực.
```

**Audit 2026-07-09:** Lệnh này đã được thực hiện và báo cáo đã được tạo tại `docs/governance/QA_AI_NGUYEN_TRAINING_GATEWAY_AUDIT_2026-07-09.md`.

---

## IX. Kế hoạch hành động Phase 1-11

### Phase 0 — Audit hiện trạng ✅ COMPLETED

**Trạng thái:** ✅ Đã hoàn thành

**Kết quả:**
- ✅ Foundation backend tồn tại (model-gateway, output-guard, training-matrix, model-policy)
- ✅ Independence lock tồn tại và được enforce
- ✅ Frontend không gọi trực tiếp provider API
- ⚠️ Training gateway chưa được tích hợp vào tất cả luồng chat
- ⚠️ Language purity violations trong UI tiếng Việt
- ⚠️ Single-model survival mode chưa được implement đầy đủ
- ⚠️ Thiếu E2E tests, audit scripts, và governance policies

**Báo cáo:** `docs/governance/QA_AI_NGUYEN_TRAINING_GATEWAY_AUDIT_2026-07-09.md`

---

### Phase 1 — Governance lock 🟡 IN PROGRESS

**Trạng thái:** 🟡 Một số policies tồn tại, nhưng thiếu key policies

**Existing Policies:**
- ✅ `docs/governance/IDENTITY_AND_TENANCY_RFC.md`
- ✅ `docs/governance/DATA_CLASSIFICATION_AND_RETENTION.md`
- ✅ `docs/governance/NGUYENAI_NET_INDEPENDENCE_PLAN_2026-07-08.md`
- ✅ `docs/governance/FOUNDER_BRAND_NAMING_LOCK_2026-07-04.md`

**Missing Policies (P0):**
- ❌ `docs/governance/AI_NGUYEN_TRAINING_GATEWAY_POLICY.md`
- ❌ `docs/governance/MODEL_PROVIDER_ABSTRACTION_POLICY.md`
- ❌ `docs/governance/AI_AGENT_TRAINING_MATRIX.md`
- ❌ `docs/governance/OUTPUT_GUARD_POLICY.md`
- ❌ `docs/governance/MODEL_FAILURE_AND_SINGLE_MODEL_SURVIVAL_POLICY.md`
- ❌ `docs/governance/NO_DIRECT_MODEL_CALL_POLICY.md`
- ❌ `docs/governance/PUBLIC_TECH_DISCLOSURE_BOUNDARY.md`

**Hành động:**
1. Tạo tất cả 7 missing policies với governance lock
2. Lấy Founder approval cho tất cả policies
3. Thêm CI gate để enforce policies

**Ước tính:** 3-5 ngày

---

### Phase 2 — Implement backend packages 🟡 IN PROGRESS

**Trạng thái:** 🟡 Foundation tồn tại, nhưng thiếu key packages

**Existing Packages:**
- ✅ `packages/@nai/model-gateway`
- ✅ `packages/@nai/output-guard`
- ✅ `packages/@nai/training-matrix`
- ✅ `packages/@nai/model-policy`
- ✅ `packages/@nai/fallback`
- ✅ `packages/@nai/incident`
- ✅ `packages/@nai/self-heal`
- ✅ `packages/@nai/admin-approval`
- ✅ `packages/@nai/notifier`
- ✅ `packages/@nai/qa-loop`

**Missing Packages (P0):**
- ❌ `packages/@nai/training-gateway` (separate from training-matrix)
- ❌ `packages/@nai/model-router` (intelligent routing by capability)
- ❌ `packages/@nai/agent-matrix` (agent role matrix)
- ❌ `packages/@nai/identity-guard` (separate from model-policy)
- ❌ `packages/@nai/language-guard` (separate from model-policy)
- ❌ `packages/@nai/data-classifier` (separate from model-policy)
- ❌ `packages/@nai/receipt-engine` (separate from model-gateway)
- ❌ `packages/@nai/model-health` (health monitoring)
- ❌ `packages/@nai/provider-adapters` (OpenAI/Anthropic/Google adapters)
- ❌ `packages/@nai/self-learning` (self-learning system)
- ❌ `packages/@nai/eval-harness` (evaluation harness)

**Hành động:**
1. Tạo tất cả 11 missing packages hoặc extend existing packages
2. Implement provider adapters cho OpenAI, Anthropic, Google
3. Implement model health monitoring system
4. Implement intelligent routing by capability
5. Implement self-learning system
6. Implement eval harness

**Ước tính:** 7-10 ngày

---

### Phase 3 — Implement API 🟡 IN PROGRESS

**Trạng thái:** 🟡 Foundation tồn tại, nhưng thiếu key routes

**Existing Routes:**
- ✅ `POST /v1/model-gateway/invoke`
- ✅ `GET /v1/model-gateway/invocations/:id/receipt`
- ✅ `GET /v1/model-gateway/invocations`
- ✅ `POST /v1/command`
- ✅ `POST /v1/command/:id/resume`
- ✅ `POST /v1/command/:id/cancel`
- ✅ `GET /v1/command/:id/evidence`
- ✅ `GET /v1/agents`
- ✅ `GET /v1/memory`
- ✅ `POST /v1/memory`
- ✅ `DELETE /v1/memory/:key`
- ✅ `GET /v1/models`
- ✅ `POST /v1/incidents`
- ✅ `POST /v1/admin-approvals`

**Missing Routes (P0):**
- ❌ `POST /v1/ai-nguyen/invoke` (AI Nguyễn Training Gateway)
- ❌ `POST /v1/ai-nguyen/stream` (AI Nguyễn streaming)
- ❌ `POST /v1/ai-nguyen/train-gate` (Training gate check)
- ❌ `POST /v1/ai-nguyen/policy-check` (Policy check)
- ❌ `POST /v1/ai-nguyen/output-check` (Output check)
- ❌ `GET /v1/models/health` (Model health)
- ❌ `GET /v1/models/capability` (Model capability)
- ❌ `POST /v1/models/fallback` (Fallback trigger)
- ❌ `POST /v1/receipts` (Receipt creation)
- ❌ `GET /v1/receipts/:id` (Receipt retrieval)

**Hành động:**
1. Tạo tất cả 10 missing routes
2. Tích hợp training gateway vào tất cả `/v1/chat` và `/v1/stream` flows
3. Không cho direct provider response đến user
4. Tất cả outputs phải qua output guard

**Ước tính:** 5-7 ngày

---

### Phase 4 — Data model 🔴 NOT STARTED

**Trạng thái:** 🔴 Không có database migrations cho training gateway

**Existing Migrations:**
- ✅ `packages/@nai/migrations` tồn tại
- ✅ Một số migrations tồn tại cho các features khác

**Missing Migrations (P0):**
- ❌ `model_providers`
- ❌ `model_capabilities`
- ❌ `model_health_events`
- ❌ `model_invocations`
- ❌ `training_gateway_runs`
- ❌ `agent_policy_runs`
- ❌ `output_guard_results`
- ❌ `identity_guard_results`
- ❌ `language_guard_results`
- ❌ `data_classification_results`
- ❌ `receipt_records`
- ❌ `fallback_events`
- ❌ `self_learning_events`
- ❌ `eval_runs`
- ❌ `eval_failures`

**Hành động:**
1. Tạo tất cả 15 missing migrations với schema phù hợp
2. Implement real database stores (không dùng in-memory)
3. Add migration run scripts

**Ước tính:** 3-5 ngày

---

### Phase 5 — Training matrix 🔴 NOT STARTED

**Trạng thái:** 🟡 Foundation tồn tại, nhưng thiếu key matrices

**Existing Matrices:**
- ✅ `packages/@nai/training-matrix` có training run tracking
- ✅ `packages/@nai/model-policy` có identity/language/safety/data classification policies

**Missing Matrices (P0):**
- ❌ Identity matrix (detailed identity rules)
- ❌ Language matrix (detailed language rules)
- ❌ Data class matrix (detailed data classification rules)
- ❌ Agent role matrix (agent role definitions)
- ❌ Provider capability matrix (provider capability definitions)
- ❌ Output safety matrix (output safety rules)
- ❌ Approval matrix (approval rules)
- ❌ Receipt matrix (receipt rules)
- ❌ Failure mode matrix (failure mode definitions)
- ❌ Single-model survival matrix (single-model survival rules)

**Hành động:**
1. Tạo tất cả 10 missing matrices với detailed rules
2. Implement identity rule: "Bạn là ai?" → AI Nguyễn identity answer
3. Implement provider question rule: transparent AI Nguyễn provider abstraction answer
4. Không claim proprietary foundation model nếu chưa verify

**Ước tính:** 5-7 ngày

---

### Phase 6 — Frontend integration 🟡 IN PROGRESS

**Trạng thái:** 🟡 Foundation tồn tại, nhưng có language purity violations

**Existing Integration:**
- ✅ Console gọi backend API, không gọi trực tiếp providers
- ✅ Không có provider-specific UI
- ✅ Không có provider-specific identity trong UI
- ✅ Không có provider error exposed to user

**Gaps (P0):**
- ⚠️ English terms trong Vietnamese UI (language purity violations)
- ⚠️ Vietnamese terms trong English UI (language purity violations)
- ⚠️ Missing AI Nguyễn-specific UI messages
- ⚠️ Missing degraded mode UI
- ⚠️ Missing incident mode UI

**Hành động:**
1. Fix tất cả language purity violations
2. Thêm AI Nguyễn-specific UI messages:
   - "AI Nguyễn đang xử lý yêu cầu."
   - "AI Nguyễn đang kiểm tra kết quả."
   - "AI Nguyễn cần bạn phê duyệt trước khi tiếp tục."
   - "AI Nguyễn đã tạo biên nhận cho tác vụ này."
   - "Dịch vụ đang suy giảm, hệ thống đã báo quản trị viên."
3. Thêm degraded mode UI
4. Thêm incident mode UI
5. Thêm CI gate cho language purity

**Ước tính:** 3-5 ngày

---

### Phase 7 — Failure and fallback 🟡 IN PROGRESS

**Trạng thái:** 🟡 Foundation tồn tại, nhưng không được implement đầy đủ

**Existing Foundation:**
- ✅ `packages/@nai/fallback` tồn tại
- ✅ `packages/@nai/incident` tồn tại
- ✅ `packages/@nai/self-heal` tồn tại
- ✅ API routes cho fallback và incidents tồn tại

**Gaps (P0):**
- ⚠️ Không có model health check system
- ⚠️ Không có provider timeout handling
- ⚠️ Không có provider fail counter
- ⚠️ Không có automatic degraded mode
- ⚠️ Không có single-model survival mode
- ⚠️ Không có no-model incident mode
- ⚠️ Missing task capability limitation logic

**Hành động:**
1. Implement model health check system
2. Implement provider timeout handling
3. Implement provider fail counter
4. Implement automatic degraded mode
5. Implement single-model survival mode
6. Implement no-model incident mode
7. Implement task capability limitation logic

**Ước tính:** 5-7 ngày

---

### Phase 8 — Self-learning and eval 🔴 NOT STARTED

**Trạng thái:** 🔴 Không có self-learning hoặc eval system

**Existing Foundation:**
- ✅ `packages/@nai/qa-loop` tồn tại
- ✅ `packages/@nai/self-heal` tồn tại

**Gaps (P1):**
- ❌ Không có eval set cho identity questions
- ❌ Không có eval set cho provider questions
- ❌ Không có eval set cho Vietnamese purity
- ❌ Không có eval set cho English purity
- ❌ Không có eval set cho privacy questions
- ❌ Không có eval set cho investment questions
- ❌ Không có eval set cho scholarship questions
- ❌ Không có eval set cho family data questions
- ❌ Không có eval set cho technical disclosure questions
- ❌ Không có eval set cho prompt injection attempts
- ❌ Không có eval set cho model failure scenarios
- ❌ Không có policy patch candidate system
- ❌ Không có training matrix update candidate system
- ❌ Không có Admin review system cho high-risk failures

**Hành động:**
1. Tạo complete eval system với tất cả 12 required eval sets
2. Implement policy patch candidate system
3. Implement training matrix update candidate system
4. Implement Admin review system cho high-risk failures

**Ước tính:** 7-10 ngày

---

### Phase 9 — Tests 🔴 NOT STARTED

**Trạng thái:** 🔴 Không có E2E tests cho training gateway

**Existing Tests:**
- ✅ Một số unit tests tồn tại trong packages
- ✅ Một số API tests tồn tại

**Missing E2E Tests (P1):**
- ❌ `tests/e2e/ai-nguyen-identity-e2e.ts`
- ❌ `tests/e2e/no-direct-model-call-e2e.ts`
- ❌ `tests/e2e/provider-abstraction-e2e.ts`
- ❌ `tests/e2e/output-guard-e2e.ts`
- ❌ `tests/e2e/language-guard-e2e.ts`
- ❌ `tests/e2e/data-classifier-e2e.ts`
- ❌ `tests/e2e/receipt-engine-e2e.ts`
- ❌ `tests/e2e/model-health-e2e.ts`
- ❌ `tests/e2e/single-model-survival-e2e.ts`
- ❌ `tests/e2e/no-model-incident-e2e.ts`
- ❌ `tests/e2e/prompt-injection-identity-e2e.ts`
- ❌ `tests/e2e/public-tech-disclosure-boundary-e2e.ts`

**Required Test Cases:**
1. User asks "Bạn là ai?" → AI Nguyễn identity answer
2. User asks "Bạn dùng model nào?" → transparent AI Nguyễn provider abstraction answer
3. OpenAI-only mode vẫn trả về AI Nguyễn
4. Claude-only mode vẫn trả về AI Nguyễn
5. Gemini-only mode vẫn trả về AI Nguyễn
6. All but one provider down → degraded mode PASS
7. All providers down → incident created, no fake answer
8. Browser không bao giờ gọi provider trực tiếp
9. Output guard blocks provider identity leakage
10. Prompt injection không thể override AI Nguyễn identity
11. Vietnamese input trả về Vietnamese output
12. Vietnamese UI có zero unauthorized English
13. English UI có zero unauthorized Vietnamese
14. Sensitive data được classify trước model call
15. Receipt được tạo cho mọi important invocation
16. Admin được notified trên S3/S4 model outage
17. Public response không bao giờ reveals internal routing, provider key, hidden prompt hoặc security policy internals

**Hành động:**
1. Tạo tất cả 12 missing E2E tests
2. Implement tất cả 17 required test cases
3. Ensure tất cả tests pass

**Ước tính:** 7-10 ngày

---

### Phase 10 — Audit scripts 🟡 IN PROGRESS

**Trạng thái:** 🟡 Một số audit scripts tồn tại, nhưng thiếu key scripts

**Existing Audit Scripts:**
- ✅ `tools/audit-independence.sh`
- ✅ `tools/audit-language-boundary.sh`
- ✅ `tools/audit-accessibility.sh`
- ✅ `tools/audit-brand-naming-lock.sh`
- ✅ `tools/audit-clone-contamination.sh`

**Missing Audit Scripts (P1):**
- ❌ `tools/audit-no-direct-model-call.ts`
- ❌ `tools/audit-training-gateway-required.ts`
- ❌ `tools/audit-provider-identity-leak.ts`
- ❌ `tools/audit-ai-nguyen-identity.ts`
- ❌ `tools/audit-model-fallback.ts`
- ❌ `tools/audit-single-model-survival.ts`
- ❌ `tools/audit-output-guard.ts`
- ❌ `tools/audit-receipt-engine.ts`
- ❌ `tools/audit-public-tech-disclosure.ts`
- ❌ `tools/audit-language-purity-build.ts`

**Missing Commands:**
- ❌ `pnpm audit:ai-nguyen`
- ❌ `pnpm audit:model-gateway`
- ❌ `pnpm audit:no-direct-provider`
- ❌ `pnpm audit:single-model`
- ❌ `pnpm audit:output-guard`
- ❌ `pnpm audit:language:pure`

**Hành động:**
1. Tạo tất cả 10 missing audit scripts
2. Thêm tất cả 6 missing commands vào package.json
3. Thêm CI gates cho tất cả audit scripts

**Ước tính:** 3-5 ngày

---

### Phase 11 — Reports 🔴 NOT STARTED

**Trạng thái:** 🔴 Không có reports được tạo

**Missing Reports (P1):**
- ❌ `docs/governance/QA_AI_NGUYEN_TRAINING_GATEWAY_AUDIT_2026-07-09.md` (file này)
- ❌ `docs/governance/AI_NGUYEN_MODEL_PROVIDER_ABSTRACTION_REPORT_2026-07-09.md`
- ❌ `docs/governance/SINGLE_MODEL_SURVIVAL_TEST_REPORT_2026-07-09.md`
- ❌ `docs/governance/NO_DIRECT_PROVIDER_CALL_AUDIT_2026-07-09.md`
- ❌ `docs/governance/OUTPUT_GUARD_TEST_REPORT_2026-07-09.md`
- ❌ `docs/governance/AI_AGENT_TRAINING_MATRIX_REPORT_2026-07-09.md`
- ❌ `docs/governance/PUBLIC_TECH_DISCLOSURE_BOUNDARY_REPORT_2026-07-09.md`

**Hành động:**
1. Tạo tất cả 7 missing reports
2. Fill với real logs, không TBD, không NOT RUN
3. Verify tất cả exit gates pass

**Ước tính:** 3-5 ngày

---

## X. Exit Gate

**Exit Gate Requirements:**
- ❌ Tất cả user model calls đi qua AI Nguyễn Training Gateway — NOT IMPLEMENTED
- ✅ Không có direct provider calls từ frontend — PASS
- ❌ Không có provider identity leaks như assistant identity — NOT TESTED
- ❌ Tất cả outputs pass identity guard — NOT TESTED
- ❌ Tất cả outputs pass language guard — NOT TESTED
- ❌ Tất cả sensitive inputs pass data classifier — NOT TESTED
- ❌ Tất cả important invocations tạo receipt — NOT TESTED
- ❌ Single-model survival mode hoạt động — NOT TESTED
- ❌ No-model incident mode hoạt động — NOT TESTED
- ❌ Public UI không expose deep technical routing — NOT TESTED
- ❌ Vietnamese UI là pure Vietnamese — FAIL (violations tồn tại)
- ❌ English UI là pure English — NOT TESTED
- ❌ Tất cả tests pass — NOT TESTED
- ❌ Tất cả reports filled với real logs — NOT DONE

**Overall Exit Gate Status:** 🔴 FAIL — Không thể claim "AI Nguyễn Training Gateway verified"

---

## XI. Tổng kết thời gian và ưu tiên

### P0 Actions (Critical — 3-5 ngày)

1. **Complete language purity audit và fix violations** (Phase 6)
   - Run `tools/audit-language-boundary.sh` đến completion
   - Fix tất cả English terms trong Vietnamese UI
   - Fix tất cả Vietnamese terms trong English UI
   - Add CI gate cho language purity

2. **Create missing governance policies** (Phase 1)
   - Create tất cả 7 missing policies với governance lock
   - Lấy Founder approval cho tất cả policies

3. **Integrate training gateway vào tất cả chat flows** (Phase 2-3)
   - Ensure tất cả `/v1/chat` calls đi qua training gateway
   - Ensure tất cả model responses đi qua output guard
   - Create missing backend packages hoặc extend existing ones

### P1 Actions (High — 7-10 ngày)

4. **Create database migrations** (Phase 4)
   - Create tất cả 15 missing migrations
   - Implement real database stores (không dùng in-memory)

5. **Create training matrices** (Phase 5)
   - Create tất cả 10 missing matrices với detailed rules

6. **Fix frontend language purity** (Phase 6)
   - Fix tất cả language purity violations
   - Add AI Nguyễn-specific UI messages
   - Add degraded/incident mode UI

### P2 Actions (Medium — 5-7 ngày)

7. **Implement failure và fallback** (Phase 7)
   - Implement model health checks
   - Implement provider fail counter
   - Implement automatic degraded mode
   - Implement single-model survival mode
   - Implement no-model incident mode

8. **Create self-learning và eval system** (Phase 8)
   - Create complete eval system với tất cả required eval sets
   - Implement policy patch candidate system
   - Implement training matrix update candidate system

9. **Create E2E tests** (Phase 9)
   - Create tất cả 12 missing E2E tests
   - Ensure tất cả required test cases pass

### P3 Actions (Low — 3-5 ngày)

10. **Create audit scripts** (Phase 10)
    - Create tất cả 10 missing audit scripts
    - Add tất cả missing commands vào package.json

11. **Create reports** (Phase 11)
    - Create tất cả 7 missing reports
    - Fill với real logs, không TBD, không NOT RUN

**Tổng ước tính:** 21-32 ngày (3-5 tuần) cho Phase 1-11 hoàn chỉnh

---

## XII. Câu chốt cho team

Nguyễn AI không được thắng bằng lời nói.
Nguyễn AI phải thắng bằng cổng huấn luyện, ma trận tác nhân, dữ liệu riêng tư, kiểm tra đầu ra, biên nhận, khả năng sống sót khi model lỗi và trải nghiệm người dùng nhất quán.

Người dùng không đến để dùng một API.
Người dùng đến để làm việc với AI Nguyễn.

**Phán quyết cuối:** Hướng này nên làm ngay, nhưng không được claim quá sớm. Phải build cổng huấn luyện, ma trận model, kiểm tra đầu ra, chế độ một model còn sống, audit language purity và báo cáo E2E thật trước khi gọi đây là AIOS Nguyễn hoàn chỉnh.

**Audit 2026-07-09:** Foundation đã có. Bây giờ phải hoàn thiện Phase 2-11 để biến foundation thành production-ready AIOS Nguyễn.

---

**Ngày phán quyết:** 2026-07-09  
**Người phán quyết:** Founder  
**Trạng thái:** ✅ ĐƯỢC PHÊ DUYỆT — Audit hoàn thành, kế hoạch hành động xác định
