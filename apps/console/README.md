# Nguyen AI Console

The authenticated web app for **Nguyen AI Computer** — a specialized cloud AI Computer line where each user owns a private AI Computer Instance.

**Domain:** `app.nguyenai.net`
**Public website:** `nguyenai.net` (separate repo)

## Tech Stack

- **Astro 4.x** — static site generator with islands architecture
- **React** — interactive islands (via `@astrojs/react`)
- **Tailwind CSS** — utility-first styling with custom dark theme
- **Cloudflare Pages** — deployment target

## Project Structure

```
nguyenai-console/
├── public/
│   ├── favicon.svg          # "N" lettermark
│   └── robots.txt           # noindex (authenticated app)
├── src/
│   ├── components/
│   │   ├── Sidebar.astro        # Navigation sidebar
│   │   ├── TopBar.astro         # Top bar (user, plan, language)
│   │   ├── AgentCard.astro      # Reusable agent card
│   │   ├── SuperAppCard.astro   # Reusable super app card
│   │   └── StatusBadge.astro    # Status indicator (active/idle/offline)
│   ├── layouts/
│   │   └── ConsoleLayout.astro  # Main layout with sidebar + topbar
│   ├── pages/
│   │   ├── index.astro           # Redirect → /dashboard
│   │   ├── login.astro           # Login page (standalone)
│   │   ├── dashboard.astro       # Instance overview
│   │   ├── command-center.astro  # Command input + history
│   │   ├── agents.astro          # 9 Agent cards
│   │   ├── super-apps.astro      # 16 Super App launcher grid
│   │   ├── models.astro          # Model Mesh selector
│   │   ├── data-vault.astro      # File storage + privacy
│   │   ├── memory.astro          # Memory timeline + search
│   │   └── settings.astro        # Profile, plan, billing, API keys, security
│   ├── styles/
│   │   └── global.css            # Tailwind directives + theme variables
│   └── middleware.ts             # Auth check placeholder
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
├── wrangler.toml
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Theme

The console uses a dark theme:
- **Background:** `#0a0e1a`
- **Sidebar:** `#111827`
- **Card:** `#1a2235`
- **Accent:** `#2563eb`

Theme colors are defined both as Tailwind extensions (`tailwind.config.mjs`) and CSS variables (`src/styles/global.css`).

## Bilingual Support

UI labels show Vietnamese (VI) primary with English (EN) secondary where relevant. The top bar includes a VI/EN language switch placeholder.

## Authentication

`src/middleware.ts` contains a placeholder auth check:
- Routes other than `/login` require a `nguyenai_session` cookie
- Missing session → redirect to `/login?redirect=<original_path>`
- **TODO:** Replace with real JWT/session validation

## Deployment (Cloudflare Pages)

### Option 1: Wrangler CLI

```bash
npm run build
npx wrangler pages deploy dist
```

### Option 2: Git Integration

1. Push this repo to GitHub/GitLab
2. In Cloudflare Dashboard → Pages → Create project → Connect to Git
3. Set build configuration:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 18 or later
4. Set environment variables as needed
5. Deploy

### Custom Domain

In Cloudflare Pages project settings, add custom domain `app.nguyenai.net` and configure DNS.

## Notes

- Output is currently `static`. Switch to `hybrid` in `astro.config.mjs` when API routes are needed.
- All pages except `login.astro` use `ConsoleLayout`.
- Content is structured placeholders — no fake data, ready for real API integration.
