# Nguyễn AI Academy — Online AI Learning Plan

**Domain:** academy.nguyenai.net  
**Status:** PLAN — pending implementation  
**Date:** 2026-07-01

## Purpose

Academy is the onboarding, certification and retention layer of Nguyen AI Computer. It provides AI learning through a paid Academy Pass (separate entitlement from machine subscription), with a dedicated track for Nguyen AI Computer operation.

Academy is a separate paid product governed by the `academy.pass` entitlement (see `ENTITLEMENT_MODEL.md` §2.2). It is **not** included with every subscription plan by default. It serves as:

- onboarding for new users;
- skill building for Agent operation;
- certification for verified skills;
- retention through progressive mastery;
- trust signal for enterprises and chapters.

## Domain

- `academy.nguyenai.net` — Academy platform
- Integrated with `app.nguyenai.net` for subscriber authentication
- Certification verifiable at `academy.nguyenai.net/verify/`

## Learning tracks

### Track 1 — AI Computer Fundamentals

- What is an AI Computer Instance
- Command Center basics
- Model Mesh overview
- Memory and Data Vault
- Approval Gates
- Cost Governor
- Audit and Replay

### Track 2 — Agent Operation

- Agent team overview
- Nguyen Guide, Researcher, Archivist, Verifier, Family Steward, Founder, Business Operator, Global Connector, Guardian
- How to command Agents
- How to review Agent work
- How to approve sensitive actions
- How to use evidence and verification

### Track 3 — Super App Usage

- Nguyen Roots — genealogy workspace
- Nguyen Memory — digital archive
- Nguyen Knowledge — bilingual knowledge base
- Nguyen Trust — claim-source-evidence
- Nguyen Network — community connections
- Nguyen Founders — founder network
- Nguyen Chapter OS — branch and community management

### Track 4 — Command Pack Authoring

- What is a Command Pack
- How to create a Pack
- Workflow design
- Agent assignment
- Tool configuration
- Approval gate setup
- Pack sharing and publishing

### Track 5 — Verification and Evidence Methodology

- Claim-source-evidence model
- Confidence labels
- Source types
- Dispute handling
- Audit trail
- Editorial standards for research

### Track 6 — Privacy and Security Practices

- Data Vault privacy
- Living-person data protection
- Permission management
- Approval gate configuration
- Audit log review
- Vietnam Personal Data Protection Law compliance
- Cross-border data considerations

### Track 7 — Founder and Business Workflows

- AI Founder OS
- AI Business OS
- AI Sales
- AI Finance Workspace
- AI Legal Workspace
- Investor Readiness Pack
- Business Operations Pack

### Track 8 — Chapter Governance

- Chapter OS administration
- Member management
- Governance and minutes
- Fund management
- Private chapter AI
- Chapter website setup

### Track 9 — Bilingual Content Creation

- AI Content tools
- Bilingual Publishing Pack
- SEO for bilingual content
- Editorial calendar
- Multi-channel publishing

### Track 10 — Heritage Research Methodology

- Genealogy research methods
- Hán-Nôm introduction
- Oral history collection
- Archive digitization
- Source verification
- Publication ethics

## Certification

- Each track has a certification exam
- Certification is independent and verifiable by third parties
- Certification includes: user identity, track, date, score, validity period
- Enterprise and Chapter plans can require certification for roles
- Certification can be revoked for ethics violations

## Integration with AI Computer

- Academy is accessible from `app.nguyenai.net` sidebar
- Progress syncs with user Memory
- Completed certifications appear in user profile
- Chapter admins can track member certifications
- Enterprise admins can require certifications for team members
- Academy can recommend Command Packs based on completed tracks

## Content format

- Video lessons with transcripts
- Interactive exercises inside AI Computer
- Quizzes with instant feedback
- Practical assignments using real AI Computer Instance
- Certification exam with proctoring (for enterprise tracks)
- Bilingual content (VI/EN)

## Tech approach

- Astro for public Academy pages (SEO, fast)
- Cloudflare Pages for hosting
- Cloudflare Workers + Hono for API
- Neon PostgreSQL for progress tracking
- Video hosting: Cloudflare R2 or external CDN
- Auth: integrated with `app.nguyenai.net` SSO
- Certification verification: public API at `academy.nguyenai.net/verify/`

## Build order

1. Track 1 (AI Computer Fundamentals) — onboard first beta users
2. Track 2 (Agent Operation) — enable productive Agent use
3. Track 5 (Verification and Evidence) — establish trust methodology
4. Track 6 (Privacy and Security) — compliance baseline
5. Track 3 (Super App Usage) — product depth
6. Track 7 (Founder and Business) — monetization tracks
7. Track 4 (Command Pack Authoring) — ecosystem growth
8. Track 8 (Chapter Governance) — community scale
9. Track 9 (Bilingual Content) — creator track
10. Track 10 (Heritage Research) — heritage depth

## Business model

- Academy requires paid Academy Pass (separate entitlement from machine subscription)
- Certification exams have separate Certification Fee per attempt (see `ENTITLEMENT_MODEL.md` §2.3)
- Free introductory lessons available without Academy Pass
- Enterprise and Chapter can request custom tracks
- Academy is both a retention tool and a revenue line

## Success metrics

- Onboarding completion rate
- Track completion rate
- Certification rate per plan
- Correlation between Academy progress and retention
- Chapter certification coverage
- Enterprise team certification coverage
