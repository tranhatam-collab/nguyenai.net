# Nguyễn AI / Nguyen AI — Privacy and Data Map

## Privacy-by-design requirement

Nguyen AI handles family, heritage, identity, historical and potentially sensitive living-person data. Privacy must be designed into the database, permission model and product flows from the beginning.

## Core entities

```text
Person
FamilyUnit
Relationship
LineageBranch
Place
HistoricalEvent
Organization
Source
Document
Claim
Evidence
Citation
Contribution
Verification
Dispute
Consent
AccessGrant
AuditLog
```

## Data principles

- Person is not the same as user account.
- Every genealogy relationship is a claim that may require evidence.
- Living people are private by default.
- Documents have owners and usage rights.
- A claim may have supporting and contradicting sources.
- Disputed data revision history must not be erased.
- AI-generated content must be marked.
- Do not infer branch membership from middle name.
- Do not infer blood relations from surname alone.

## Privacy defaults

| Data | Default |
|---|---|
| Living person | Private |
| Email and phone | Private |
| Full date of birth | Private |
| Address | Private |
| Family tree | Invited members only |
| Deceased person | May be public according to rights and sources |
| Founder profile | Public only after profile owner approval |
| Family documents | Private until owner publishes |

## Consent requirements

System must support:

- consent by purpose;
- consent withdrawal;
- data access request;
- data correction request;
- data deletion request;
- export/download;
- retention schedule;
- data source records;
- child data handling;
- RBAC or ABAC;
- audit log;
- incident response;
- backup and recovery;
- data processing inventory;
- AI provider data flow tracking;
- no private-data model training without suitable lawful basis and consent.

## Private route rules

All app routes containing personal, family or document data must:

- require authentication;
- enforce server-side access control;
- use noindex;
- be excluded from public sitemap;
- avoid leaking IDs or private names in public HTML;
- log access and changes where appropriate.

## AI provider rules

Before connecting an AI provider:

- classify data sent to provider;
- document region and retention behavior;
- disable training on private data where possible;
- redact living-person private fields unless required and permitted;
- log prompt/output metadata without logging unnecessary sensitive content;
- provide user-facing disclosure.
