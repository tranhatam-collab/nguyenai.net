# Scholarship Changelog

**Mục đích:** Lịch sử thay đổi của scholarship policies và system.

## 2026-07-04 — Initial Release v1.0.0

### Added
- 12 policy documents (01-12) covering scholarship, application, moderation, privacy, council, sponsorship, entitlement, appeal, security, data retention, ToS, change policy
- Acceptance log created
- Changelog created

### System
- Sprint 1: Applicant Form (8-part form, 9 programs, 4 Nguyen questions, 5 commitments)
- Sprint 2: Scholarship Room (messages, documents, timeline)
- Sprint 3: Investor Room (verify, access grant, feed, review, award)
- Sprint 4: Forum (comments, reports, moderation queue)
- Sprint 5: Decision Engine (rubric, council decision, waitlist)
- Sprint 6: Entitlement lifecycle (grant, suspend, revoke, restore, complete, cohorts)

### API
- 58 endpoints total under `/v1/scholarship`
- 28 entities in `@nai/scholarship` package
- 101 unit tests passing

### Audit
- 24 scholarship-specific audit events
- Registry version: 2026-07-03.1

---

*Changelog này là BINDING. Mọi thay đổi phải ghi vào đây.*
