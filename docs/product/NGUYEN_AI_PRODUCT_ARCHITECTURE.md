# Nguyễn AI / Nguyen AI — Product Architecture

## Product category

Nguyen AI is a Heritage Intelligence Network, not a general AI computer catalog.

## Core product pillars

### 1. Nguyen Roots — Cội Nguồn

Private genealogy workspace.

Must support:

- private family trees;
- multiple family branches;
- aliases, húy, tự and common names;
- historical and modern place names;
- family timelines;
- controlled GEDCOM import/export;
- living/deceased status;
- role-based access;
- invited relative confirmation;
- conflicting data records.

### 2. Nguyen Memory — Di Sản

Digital heritage archive.

Must support:

- photos;
- genealogy books in Hán, Nôm and Quốc ngữ;
- inscriptions;
- birth, marriage and death records;
- royal decrees only when legitimately provided;
- diaries;
- audio recordings;
- oral-history interviews;
- AI-assisted document description;
- versioning;
- provenance;
- retention and deletion policy.

OCR output is assistance only and must not be treated as verified translation or proof.

### 3. Nguyen Knowledge — Tri Thức

Bilingual edited knowledge base.

Must support:

- edited research articles;
- source directories;
- place profiles;
- historical person profiles;
- branch studies;
- migration maps;
- genealogy terminology;
- sourced Q&A assistant;
- variant comparison;
- last-reviewed date and editor identity.

### 4. Nguyen Trust — Minh Chứng

Core trust layer.

```text
Claim
├── Subject
├── Statement
├── Source
├── Evidence type
├── Contributor
├── Verification status
├── Confidence
├── Dispute record
├── Consent status
└── Revision history
```

Evidence scale:

| Level | Meaning |
|---|---|
| A | Primary source or multiple independent checkable sources |
| B | Trustworthy source but incomplete continuity |
| C | Branch genealogy or secondary source not fully cross-checked |
| D | Oral history, inference or unverified content |

AI must never upgrade a C or D claim to A by itself.

### 5. Nguyen Network — Kết Nối

Verified Nguyen and Vietnamese heritage network.

Must support:

- verified profiles;
- search by country, city and field;
- local communities;
- private family groups;
- professional groups;
- events;
- local chapters;
- business directory;
- mentor introductions;
- hidden profile option;
- abuse reporting;
- anti-impersonation controls.

### 6. Nguyen Founders — Sáng Lập

Founder and expert network.

Must support:

- founder profiles;
- business map;
- project rooms;
- advisor discovery;
- expert councils;
- talent introductions;
- opportunity board;
- case study library;
- business-role verification;
- intergenerational connection programs.

### 7. Nguyen Chapter OS — Chi Họ và Cộng Đồng

B2B/B2Community operating system for branches, associations and communities.

Must support:

- member management;
- multi-admin governance;
- bylaws;
- events;
- funds tracking;
- minutes;
- archive;
- tasks;
- access control;
- audit log;
- community website;
- custom domain;
- private AI over permitted data.

## Pricing hypothesis

Do not publish as final until cost, AI usage, storage, support and payment feasibility are validated.

| Plan | Draft price | Audience |
|---|---:|---|
| Open — Khai Mở | Free | New users |
| Roots — Cội Nguồn | 99,000 VND/mo | Small families |
| Legacy — Di Sản | 299,000 VND/mo | Large families |
| Founder — Sáng Lập | 799,000 VND/mo | Entrepreneurs and experts |
| Chapter — Chi Họ & Hội | 2,990,000 VND/mo | Branches and associations |
| Global — Toàn Cầu | Custom | Large organizations |

## MVP lock

Must have:

- bilingual public website;
- 20–30 sourced foundation articles;
- methodology;
- private family tree;
- source upload;
- claim and evidence model;
- cited AI assistant;
- consent;
- user export/delete;
- pricing;
- billing;
- admin editorial;
- security and audit log.

Do not build in MVP:

- DNA matching;
- public living-person data;
- automatic relative recognition from photos;
- blockchain, token or NFT genealogy;
- open marketplace;
- clan scoring;
- automated royal lineage claims;
- mass AI-generated thin SEO pages.
