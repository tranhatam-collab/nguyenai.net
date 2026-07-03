# Nguyen AI Academy

**edu.nguyenai.net** — Free AI learning for all Nguyen AI subscribers.

Nguyen AI Academy is Layer 4 in the Nguyen AI Computer four-layer architecture. It provides 10 learning tracks, verifiable certification and bilingual (VI/EN) content for the global Nguyen community.

## Tech Stack

- **[Astro 4.x](https://astro.build)** — static site generator
- **[MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/)** — rich lesson content
- **[Tailwind CSS](https://tailwindcss.com)** — styling
- **[Cloudflare Pages](https://pages.cloudflare.com)** — hosting

## Project Structure

```
nguyenai-academy/
├── astro.config.mjs          # Astro config (MDX + Tailwind, static output)
├── tailwind.config.mjs       # Tailwind theme (academy colors)
├── tsconfig.json             # TypeScript (astro strict)
├── wrangler.toml             # Cloudflare Pages config
├── package.json
├── public/
│   ├── favicon.svg           # Graduation cap icon
│   └── robots.txt            # Allow all, disallow /api/
├── src/
│   ├── components/
│   │   ├── TrackCard.astro       # Track card with progress bar
│   │   ├── LessonCard.astro      # Lesson card in track listing
│   │   ├── ProgressBar.astro     # Reusable progress bar
│   │   └── CertBadge.astro       # Certification badge
│   ├── content/
│   │   ├── config.ts             # Content collection schema (lessons)
│   │   └── lessons/
│   │       ├── track-01-lesson-01.mdx   # What is an AI Computer?
│   │       ├── track-01-lesson-02.mdx   # Your AI Computer Instance
│   │       └── track-01-lesson-03.mdx   # The Agent Team
│   ├── data/
│   │   └── tracks.ts             # 10 tracks (bilingual VI/EN)
│   ├── layouts/
│   │   └── AcademyLayout.astro   # Top nav + footer + slot
│   ├── pages/
│   │   ├── index.astro           # Homepage (hero, tracks, how it works, cert)
│   │   ├── about.astro           # About the academy
│   │   ├── login.astro           # SSO login (placeholder, no layout)
│   │   ├── certification.astro   # How to get certified
│   │   ├── verify.astro          # Certificate verification form
│   │   ├── tracks/
│   │   │   ├── index.astro       # All tracks listing
│   │   │   └── [slug].astro      # Dynamic track page (10 tracks)
│   │   ├── lessons/
│   │   │   └── [slug].astro      # Dynamic lesson page with MDX
│   │   └── api/
│   │       └── verify.ts         # GET /api/verify?id=XXX (placeholder)
│   └── styles/
│       └── global.css            # Tailwind directives + CSS variables
└── README.md
```

## Dev Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## The 10 Learning Tracks

| # | Track (EN) | Track (VI) | Lessons | Difficulty |
|---|---|---|---|---|
| 01 | AI Computer Fundamentals | Cơ bản về AI Computer | 10 | Beginner |
| 02 | Agent Operation | Vận hành Agent | 8 | Beginner |
| 03 | Super App Usage | Sử dụng Super App | 12 | Beginner |
| 04 | Command Pack Authoring | Tạo Command Pack | 6 | Intermediate |
| 05 | Verification and Evidence Methodology | Phương pháp Xác minh và Bằng chứng | 8 | Intermediate |
| 06 | Privacy and Security Practices | Thực hành Quyền riêng tư và Bảo mật | 7 | Intermediate |
| 07 | Founder and Business Workflows | Workflow Founder và Doanh nghiệp | 10 | Advanced |
| 08 | Chapter Governance | Quản trị Chapter | 6 | Advanced |
| 09 | Bilingual Content Creation | Tạo nội dung Song ngữ | 5 | Intermediate |
| 10 | Heritage Research Methodology | Phương pháp Nghiên cứu Di sản | 9 | Advanced |

**Track 01** is the onboarding track — start here if you are new to Nguyen AI.

## Content Authoring Guide

### Adding a new lesson

1. Create a new `.mdx` file in `src/content/lessons/`:
   ```
   src/content/lessons/track-XX-lesson-YY.mdx
   ```

2. Add frontmatter matching the schema in `src/content/config.ts`:
   ```yaml
   ---
   title: "Lesson Title"
   description: "Short description"
   track: "track-slug"
   trackId: 1
   order: 4
   duration: "5 min read"
   difficulty: "Beginner"
   lang: "vi"
   ---
   ```

3. Write lesson content in **Vietnamese** with **English key terms** in italics or code blocks.

4. Add prev/next navigation links at the bottom:
   ```markdown
   ⬅️ **Bài trước:** [Previous Lesson](/lessons/track-XX-lesson-YY)
   ➡️ **Bài tiếp theo:** [Next Lesson](/lessons/track-XX-lesson-YY)
   ```

5. You can import Astro components inside MDX:
   ```mdx
   import ProgressBar from '@components/ProgressBar.astro'
   <ProgressBar value={4} max={10} />
   ```

### Adding a new track

1. Add the track to `src/data/tracks.ts` (follow the `Track` interface).
2. Track lessons will appear automatically on the track page.
3. Add MDX lesson files for the track.

### Content conventions

- **Language:** Lesson content is in Vietnamese with English key terms.
- **Evidence labels:** Use `verified`, `primary source`, `secondary source`, `insufficient evidence`, `disputed`, `cannot conclude`.
- **Privacy:** Never imply shared bloodline, royal descent, or that AI can confirm ancestry.
- **Brand:** Use "Nguyen AI" (English) or "Nguyễn AI" (Vietnamese). Never "NguyenAI" or "AI Nguyen".

## Deployment (Cloudflare Pages)

### Option A: Git integration (recommended)

1. Push this repo to GitHub/GitLab.
2. In Cloudflare Pages dashboard → Create project → Connect repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Cloudflare will auto-deploy on every push.

### Option B: Wrangler CLI

```bash
npm run build
npx wrangler pages deploy dist
```

### Custom domain

Set custom domain `edu.nguyenai.net` in Cloudflare Pages dashboard → Custom domains.

## API

### `GET /api/verify?id=XXX`

Verifies a certificate by ID.

**Response (valid):**
```json
{
  "valid": true,
  "certificate": {
    "id": "NAI-Academy-0001-0001",
    "holder": "Nguyen AI Subscriber",
    "trackTitle": "AI Computer Fundamentals",
    "trackId": 1,
    "issuedDate": "2024-09-01",
    "status": "valid"
  }
}
```

**Response (invalid):**
```json
{
  "valid": false,
  "certificate": null
}
```

> Currently uses placeholder data. Replace with a real database (Cloudflare D1 or Neon PostgreSQL) before production.

## SSO

Login uses SSO with `app.nguyenai.net` (placeholder redirect). Implementation:

1. User clicks "Đăng nhập" → redirected to `app.nguyenai.net/sso`.
2. After authentication, redirected back to Academy with a session token.
3. Academy validates token and stores progress.

## Brand Rules

- Vietnamese: **Nguyễn AI**
- English: **Nguyen AI**
- Domain: **nguyenai.net**
- Code identifier: **nguyenai**

Do NOT use: `Nguyên AI`, `AI Nguyen`, `NguyenAI`, `Nguyễn.AI`.

## Privacy Defaults

- Living-person data is private by default.
- Family trees are private by default.
- Family documents are private until owner publishes.
- The `/login` page is `noindex, nofollow`.
- The `/api/` path is disallowed in `robots.txt`.

## License

Proprietary — Nguyen AI. All rights reserved.
