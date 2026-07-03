# nguyenai-invest

Investor site for **Nguyen AI Computer** — [invest.nguyenai.net](https://invest.nguyenai.net)

## Overview

This is the investor-facing site for Nguyen AI Computer, a specialized cloud AI Computer line for the global Nguyen ecosystem. The site contains:

- **Public pages** (indexable): investment thesis, product overview, market, business model, moat, roadmap, team, governance, risks, impact, why-now
- **Private pages** (auth-gated, noindex): data room, financial model, cap table, technical audit, IP, security, contracts
- **Request access**: public investor qualification form

## Tech stack

- [Astro](https://astro.build) 4.x — static site generation
- [Tailwind CSS](https://tailwindcss.com) 3.x — styling
- [Cloudflare Pages](https://pages.cloudflare.com) — deployment

## Design

- Dark theme (`#0a0e1a` background) with gold accents (`#d4af37`)
- Bilingual: Vietnamese primary, English secondary
- Professional investor-facing aesthetic

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
npm run preview  # preview production build
npm run deploy   # deploy to Cloudflare Pages
```

## Deployment (Cloudflare Pages)

1. Build the site: `npm run build`
2. Deploy: `npm run deploy` (uses `wrangler pages deploy dist`)
3. Or connect the Git repo to Cloudflare Pages with:
   - Build command: `npm run build`
   - Output directory: `dist`

## Important rules

- **Disclosure line required on every page**: "Financial projections are hypotheses, not commitments. Legal entity and IP ownership pending."
- **Private pages** must have `<meta name="robots" content="noindex, nofollow, noarchive">`
- **No real cap table, bank account, or term sheet data** in HTML — placeholders only
- **Bilingual**: VI primary, EN secondary
- Do not publish before legal entity, IP ownership, and disclaimer review are complete

## Source of truth

- `docs/investor/NGUYEN_AI_INVESTOR_MEMORANDUM_V1.md` (nguyenai.net repo)
- `docs/investor/NGUYEN_AI_INVEST_STRATEGY_VALUATION_V2.md` (nguyenai.net repo)

## License

Proprietary — Nguyen AI Computer. All rights reserved.
