# NAI — Brand Identity Design Prompt (Full System)

- **Status:** BINDING — Founder directive
- **Date:** 2026-07-02
- **Owner:** Founder
- **Purpose:** Prompt chuẩn để thiết kế bộ nhận diện thương hiệu đầy đủ nhất cho Nguyen AI (NAI), áp dụng ngay cho toàn bộ hệ thống.
- **Input docs:** `NGUYEN_AI_BRAND_CHARTER.md`, `NGUYEN_AI_BRAND_CODEX.md`, `brand/nguyenai/*.json`

---

## Cách dùng prompt này

Copy toàn bộ phần **"DESIGN BRIEF"** bên dưới và dán vào AI design tool (Figma AI, Midjourney, DALL-E, Stable Diffusion, hoặc gửi cho designer). Prompt đã được tối ưu cho cả AI generator lẫn human designer.

---

## DESIGN BRIEF

### Project name
**Nguyen AI** (code: NAI)

### Brand essence
A specialized cloud AI Computer line for the global Nguyen ecosystem — 32 million people. Not a chatbot, not a genealogy site, not a generic AI tool. Each user owns a private AI Computer with an Agent team, memory, data vault, tools, workflows, evidence, and approval gates. Heritage and genealogy are important Super Apps, but not the whole product.

### Brand promise
- Vietnamese: "Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu."
- English: "Rooted identity. Powerful intelligence. Global execution."

### Tone of voice
Respectful, precise, sourced, cautious, modern, non-mythologizing, privacy-first, evidence-driven, capable, operational, agentic.

NOT: royalist, sensational, absolute, self-appointed, pseudo-historical, AI-hype, chatbot-like, genealogy-only.

### Naming rules (STRICT)
- Vietnamese: **Nguyễn AI**
- English: **Nguyen AI**
- Product category: **Nguyen AI Computer**
- Domain: **nguyenai.net**
- Code identifier: **nguyenai** / **NAI**

FORBIDDEN as brand names: Nguyên AI, AI Nguyen, NguyenAI, Nguyễn.AI, Nguyen Artificial Intelligence, NAI Network.

---

## 1. LOGO SYSTEM

### 1.1 Primary logo — full lockup

**Concept:** Letter "N" combined with roots, connection nodes, and a bridge between generations. Negative space suggesting AI intelligence. An archival circle or generational ring as container.

**Design requirements:**
- Letter "N" as the central mark — bold, geometric, modern, NOT calligraphic
- Roots growing downward from the N — suggesting heritage, cội nguồn, but NOT a tree
- Connection nodes (small circles) at key points — suggesting network, diaspora, global connection
- A subtle bridge or arch element — suggesting bridge between generations, past → future
- Negative space within the N should suggest an AI chip, circuit, or intelligence node — NOT a brain icon, NOT a robot
- Optional: an archival circle or generational ring surrounding or containing the mark — suggesting archive, evidence, provenance
- The mark must work at 16×16px (favicon) and 1024×1024px (social) without losing identity

**Wordmark:**
- "Nguyen AI" in Be Vietnam Pro, weight 700, tight tracking
- "N" and "A" capitalized, rest lowercase: "Nguyen AI"
- Vietnamese version: "Nguyễn AI" with full diacritics
- Product category below in smaller weight 400: "Nguyen AI Computer"

**Layout:**
- Horizontal lockup: [mark] [Nguyen AI] / [Nguyen AI Computer]
- Vertical lockup: [mark] above [Nguyen AI] / [Nguyen AI Computer]
- Icon-only: [mark] alone

**Color variants:**
- Full color: mark in heritage-red (#7A1F2B) + bronze-gold (#C89B3C) accents, wordmark in deep-indigo (#0F2742)
- On dark (deep-indigo bg): mark in warm-white (#FFFDF8) + bronze-gold accents, wordmark in warm-white
- Monochrome: single color (ink #161A1D or warm-white)
- Reversed: on heritage-red background, mark in warm-white

**AVOID:**
- Crowns, throne symbols, imperial dragons as generic identity
- Nguyễn dynasty seals or state-like emblems
- DNA icons as bloodline proof
- Clip-art family trees
- Robot icons, brain icons, chat bubble icons
- Generic AI sparkles/stars
- Calligraphic or brushstroke style for the logo mark

### 1.2 Logo mark (icon only)

- The "N" + roots + nodes + negative space AI element
- Must work at 16×16, 32×32, 180×180 (Apple touch icon), 512×512
- No wordmark, no tagline
- Geometric, clean, scalable

### 1.3 Monochrome logo

- Single-color version for stamps, watermarks, evidence headers, audit documents
- Must work in pure black on white AND pure white on black
- No gradients, no color accents

### 1.4 Favicon set

- `favicon-16x16.png` — 16×16
- `favicon-32x32.png` — 32×32
- `favicon.ico` — multi-resolution ICO
- `apple-touch-icon.png` — 180×180 (mark on deep-indigo background, rounded corners)
- `android-chrome-192x192.png` — 192×192
- `android-chrome-512x512.png` — 512×512
- `og-image.png` — 1200×630 (social share card)
- `og-image-invest.png` — 1200×630 (invest page social card)

---

## 2. COLOR SYSTEM

### 2.1 Primary palette (LOCKED)

| Token | Hex | RGB | Role |
|---|---|---|---|
| heritage-red | #7A1F2B | 122, 31, 43 | Heritage, mark, primary accent, focus |
| deep-indigo | #0F2742 | 15, 39, 66 | Knowledge, technology, trust, hero background |
| bronze-gold | #C89B3C | 200, 155, 60 | Archive, bronze, highlight, premium accent |
| jade-green | #1F6D5A | 31, 109, 90 | Life, generations, growth, trust accent |
| parchment | #F4EBDD | 244, 235, 221 | Archival paper, editorial surface |
| ink | #161A1D | 22, 26, 29 | Primary text |
| warm-white | #FFFDF8 | 255, 253, 248 | Light surface, background |

### 2.2 Extended palette (for UI states)

| Token | Hex | Role |
|---|---|---|
| muted | #5D646B | Secondary text |
| surface | #FFFFFF | Card surface |
| border | rgba(22,26,29,0.14) | Hairline border |
| success | #1F6D5A (jade) | Success state |
| warning | #C89B3C (bronze) | Warning state |
| error | #7A1F2B (heritage-red) | Error state |
| info | #0F2742 (deep-indigo) | Info state |

### 2.3 Gradient (use sparingly)

- Hero gradient: `linear-gradient(135deg, #0F2742 0%, #161A1D 100%)` — deep-indigo to ink
- Accent gradient: `linear-gradient(135deg, #7A1F2B 0%, #C89B3C 100%)` — heritage-red to bronze-gold (for premium badges only)
- NEVER use rainbow gradients, neon gradients, or AI-hype gradients

### 2.4 Color rules

- Primary background: warm-white
- Primary text: ink
- Hero background: deep-indigo
- Primary accent: heritage-red
- Secondary accent: bronze-gold
- Trust accent: jade-green
- Editorial surface: parchment
- All pairs must pass WCAG 2.2 AA contrast (≥ 4.5:1 for text, ≥ 3:1 for large text and UI components)

---

## 3. TYPOGRAPHY

### 3.1 Font families

| Role | Family | Weights | Fallback |
|---|---|---|---|
| UI sans | Be Vietnam Pro | 400, 500, 700 | Inter, system-ui, sans-serif |
| Editorial serif | Noto Serif | 400, 700 | Georgia, serif |
| Mono | JetBrains Mono | 400, 500 | SFMono-Regular, Consolas, monospace |

### 3.2 Type scale

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| display | 3.5rem (56px) | 700 | 1.1 | Hero h1 |
| h1 | 2.5rem (40px) | 700 | 1.2 | Page h1 |
| h2 | 2rem (32px) | 700 | 1.25 | Section h2 |
| h3 | 1.5rem (24px) | 500 | 1.3 | Subsection |
| h4 | 1.25rem (20px) | 500 | 1.4 | Card title |
| body-lg | 1.125rem (18px) | 400 | 1.65 | Hero text, lead |
| body | 1rem (16px) | 400 | 1.65 | Default body |
| body-sm | 0.875rem (14px) | 400 | 1.5 | Secondary text, meta |
| caption | 0.75rem (12px) | 400 | 1.4 | Labels, tags, badges |
| code | 0.875rem (14px) | 400 | 1.5 | Code, evidence ID |

### 3.3 Typography rules

- Vietnamese diacritics must render correctly at all sizes
- Do NOT use calligraphic fonts for long-form content
- Use serif (Noto Serif) only for: editorial research articles, heritage content, long-form history
- Use mono (JetBrains Mono) only for: code blocks, evidence IDs, audit log entries, command output
- Limit webfont weights to 400, 500, 700 for performance
- Always provide system fallbacks
- NEVER use: Comic Sans, Papyrus, Brush Script, or any decorative font

---

## 4. SPACING & LAYOUT

### 4.1 Spacing scale (8px base)

| Token | Value |
|---|---|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |
| 4xl | 96px |

### 4.2 Layout grid

- Max content width: 1200px
- Content padding: `clamp(1rem, 4vw, 4rem)` (responsive)
- Grid: 12-column, 24px gap
- Section vertical padding: 96px (desktop), 48px (mobile)
- Card border radius: 12px
- Button border radius: 999px (pill) for primary, 8px for secondary
- Hairline border: 1px solid `rgba(22, 26, 29, 0.14)`

### 4.3 Breakpoints

| Name | Min width |
|---|---|
| mobile | 320px |
| tablet | 768px |
| desktop | 1024px |
| wide | 1440px |

---

## 5. ICONOGRAPHY

### 5.1 Icon style

- Line icons, 1.5px stroke, 24×24 viewBox
- Rounded line caps
- Color: currentColor (inherit from parent)
- Style: minimal, geometric, consistent stroke weight
- Library base: Lucide Icons or Phosphor Icons (then customize)

### 5.2 Custom icons needed (NAI-specific)

| Icon | Concept | Usage |
|---|---|---|
| AI Computer | A monitor/cloud hybrid with a small node inside | Product category |
| Agent | A small geometric figure with connection lines | Agent team |
| Roots | Stylized roots (NOT a tree) | Heritage, cội nguồn |
| Evidence | A document with a checkmark and hash | Evidence, proof |
| Vault | A safe/lockbox with a key | Data vault |
| Memory | Concentric arcs (like memory slots) | Long-term memory |
| Approval | A hand + checkmark | Approval gate |
| Chapter | A group of nodes connected in a circle | Chapter, community |
| Founder | A flag on a peak | Founder, entrepreneurship |
| Guardian | A shield with an eye | Security, guardian agent |
| Nguyen Network | Globe with connection nodes | Global network, diaspora |

### 5.3 Icon rules

- NEVER use: crown icons, throne icons, dragon icons, DNA icons, robot icons, brain icons
- All icons must work at 16×16, 20×20, 24×24, 32×32
- All icons must work in currentColor (inherit text color)
- Stroke-based, not filled (except for status badges)

---

## 6. UI COMPONENTS

### 6.1 Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| Primary | heritage-red | warm-white | none | Main CTA |
| Secondary | transparent | deep-indigo | 1px deep-indigo | Secondary CTA |
| Ghost | transparent | deep-indigo | none | Tertiary action |
| Dark | deep-indigo | warm-white | none | On light bg |
| Light | warm-white | deep-indigo | none | On dark bg |
| Bronze | bronze-gold | ink | none | Premium, invest |

- Border radius: 999px (pill) for primary/secondary, 8px for ghost/utility
- Padding: 0.75rem 1.5rem (default), 0.5rem 1rem (small), 1rem 2rem (large)
- Hover: darken 10%, transition 150ms ease
- Focus: 3px bronze-gold outline, 4px offset
- Disabled: 50% opacity, no pointer

### 6.2 Cards

- Background: surface (white) or warm-white
- Border: 1px solid `rgba(22, 26, 29, 0.14)`
- Border radius: 12px
- Padding: 24px
- Shadow: `0 24px 70px rgba(15, 39, 66, 0.14)` (subtle, warm)
- Hover: shadow increase, slight translateY(-2px)

### 6.3 Badges & tags

| Type | Background | Text | Usage |
|---|---|---|---|
| Plan badge | deep-indigo | warm-white | Model tier (Start, Personal, etc.) |
| Evidence badge | jade-green | warm-white | Verified, evidence-backed |
| Warning badge | bronze-gold | ink | Insufficient evidence, disputed |
| Error badge | heritage-red | warm-white | Cannot conclude, rejected |
| Neutral badge | parchment | ink | Draft, pending |

- Border radius: 999px
- Padding: 0.25rem 0.75rem
- Font: caption (12px, 500)

### 6.4 Navigation

- Header: sticky, deep-indigo bg (94% opacity), backdrop-blur
- Nav items: warm-white text, 16px, hover → bronze-gold
- Language switch: pill button, warm-white border
- Mobile: hamburger → full-screen overlay, deep-indigo bg

### 6.5 Footer

- Background: deep-indigo
- Text: warm-white
- Links: warm-white, hover → bronze-gold
- Tagline in serif (Noto Serif) for editorial feel

### 6.6 Hero section

- Background: deep-indigo or hero gradient
- Eyebrow: bronze-gold, caption size, uppercase tracking
- H1: warm-white, display size
- Body: warm-white 80% opacity, body-lg
- CTA: primary (heritage-red) + secondary (transparent, warm-white border)

### 6.7 FAQ

- Use native `<details>` / `<summary>`
- Summary: h3 size, ink color, hover → heritage-red
- Open state: summary has bronze-gold left border (3px)
- Content: body size, muted color

---

## 7. SOCIAL MEDIA ASSETS

### 7.1 Social profile images

| Platform | Size | Content |
|---|---|---|
| Twitter/X | 400×400 | Logo mark on deep-indigo |
| LinkedIn | 400×400 | Logo mark on deep-indigo |
| Facebook | 500×500 | Logo mark on deep-indigo |
| YouTube | 800×800 | Logo mark on deep-indigo |
| GitHub | 500×500 | Logo mark on warm-white |

### 7.2 Social cover images

| Platform | Size | Content |
|---|---|---|
| Twitter/X | 1500×500 | Hero gradient bg + logo + tagline |
| LinkedIn | 1584×396 | Hero gradient bg + logo + tagline |
| Facebook | 820×312 | Hero gradient bg + logo + tagline |
| YouTube | 2560×1440 | Hero gradient bg + logo + tagline + "Nguyen AI Computer" |

### 7.3 Open Graph images

| Image | Size | Content |
|---|---|---|
| og-default | 1200×630 | Logo + "Nguyen AI Computer" + tagline + nguyenai.net |
| og-invest | 1200×630 | Logo + "Seed Round" + "500K-1M USD" + nguyenai.net/invest |
| og-academy | 1200×630 | Logo + "Academy" + nguyenai.net/academy |

---

## 8. BRAND APPLICATIONS

### 8.1 Website header (current)

```
[logo mark] Nguyen AI          [AI Computer] [Super Apps] [Agents] [Plans] [About] [Contact]    [English/Tiếng Việt]
            Nguyen AI Computer
```

- Replace current text "N" brand-mark with real logo mark SVG
- Add logo SVG inline in BaseLayout.astro

### 8.2 Email signature

```
[logo mark 32px] Trần Hà Tâm
                 Founder, Nguyen AI
                 nguyenai.net
                 "Cội nguồn vững. Trí tuệ mạnh. Vận hành toàn cầu."
```

### 8.3 Email templates (react-email)

- Header: logo mark (32px) + "Nguyen AI" wordmark
- Footer: tagline + nguyenai.net + legal disclaimer
- Background: warm-white
- Card: surface white with hairline border
- Primary button: heritage-red
- All text: ink

### 8.4 Investor documents

- Cover page: logo (full lockup) + document title + date + "CONFIDENTIAL"
- Header: logo mark (24px) + document name
- Footer: page number + nguyenai.net + "NOT LEGAL ADVICE" disclaimer
- Accent: bronze-gold for section dividers, heritage-red for key numbers

### 8.5 Business cards

- Front: logo mark + "Nguyen AI" + tagline
- Back: name + title + email + phone + nguyenai.net
- Background: deep-indigo
- Text: warm-white
- Accent: bronze-gold line

### 8.6 Presentation slides

- Title slide: logo (full lockup) + presentation title + date + presenter
- Content slides: logo mark (top-left, 24px) + slide title + content
- Closing slide: logo + tagline + nguyenai.net + contact
- Background: warm-white (light slides) or deep-indigo (dark slides)
- Accent: heritage-red for key points, bronze-gold for highlights

---

## 9. MOTION & ANIMATION

### 9.1 Principles

- Subtle, purposeful, NOT decorative
- Duration: 150ms (micro), 300ms (standard), 500ms (page transition)
- Easing: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes
- NEVER: bounce, elastic, exaggerated spring (this is a serious brand, not a toy)

### 9.2 Specific animations

| Element | Animation |
|---|---|
| Page load | Fade in 300ms ease-out |
| Card hover | translateY(-2px) + shadow increase, 150ms |
| Button hover | Background darken 10%, 150ms |
| Nav link hover | Color → bronze-gold, 150ms |
| FAQ open | Height expand + chevron rotate, 300ms |
| Logo mark | Static on load, optional: subtle node pulse on hero (1s loop, 50% opacity, very subtle) |

---

## 10. DESIGN DELIVERABLES CHECKLIST

### Logo
- [ ] `logo-primary.svg` — full lockup (horizontal)
- [ ] `logo-primary-vertical.svg` — full lockup (vertical)
- [ ] `logo-mark.svg` — icon only
- [ ] `logo-mono-black.svg` — monochrome (black on white)
- [ ] `logo-mono-white.svg` — monochrome (white on black)
- [ ] `logo-on-dark.svg` — reversed for dark backgrounds
- [ ] `logo-on-heritage-red.svg` — reversed for heritage-red background

### Favicon
- [ ] `favicon-16x16.png`
- [ ] `favicon-32x32.png`
- [ ] `favicon.ico` (multi-res)
- [ ] `apple-touch-icon.png` (180×180)
- [ ] `android-chrome-192x192.png`
- [ ] `android-chrome-512x512.png`
- [ ] `site.webmanifest`

### Social
- [ ] `og-default.png` (1200×630)
- [ ] `og-invest.png` (1200×630)
- [ ] `og-academy.png` (1200×630)
- [ ] Twitter avatar (400×400)
- [ ] Twitter cover (1500×500)
- [ ] LinkedIn avatar (400×400)
- [ ] LinkedIn cover (1584×396)

### Icons
- [ ] Custom icon set (12 NAI-specific icons as SVG)
- [ ] Icon sprite sheet

### Brand tokens
- [ ] `colors.json` (already exists — verify)
- [ ] `typography.json` (already exists — verify)
- [ ] `spacing.json` (new)
- [ ] `iconography.json` (new)
- [ ] `brand-manifest.json` (already exists — verify)

### Templates
- [ ] Email signature template
- [ ] react-email header/footer component
- [ ] Investor document cover template
- [ ] Business card template
- [ ] Presentation slide template (16:9)

---

## 11. AI GENERATOR PROMPT (copy-paste)

### For logo mark generation

```
Design a modern, geometric logo mark for "Nguyen AI" — a specialized cloud AI Computer brand for the global Nguyen community (32 million people).

The mark should combine:
- Letter "N" as the central element — bold, geometric, clean
- Roots growing downward (heritage, cội nguồn) — stylized, NOT a tree
- Connection nodes (small circles) — network, diaspora, global connection
- Negative space suggesting AI intelligence — a chip, circuit, or node, NOT a brain or robot
- Optional: an archival circle or generational ring

Style: minimal, geometric, scalable, works at 16px and 1024px.
Colors: heritage-red (#7A1F2B) + bronze-gold (#C89B3C) accents on warm-white (#FFFDF8) background.
Mood: respectful, precise, modern, evidence-driven, non-mythologizing.

AVOID: crowns, thrones, dragons, imperial seals, DNA icons, robot icons, brain icons, chat bubbles, generic AI sparkles, calligraphic/brushstroke style.

Output: SVG vector, flat design, no gradients in the mark itself.
```

### For social cover generation

```
Design a social media cover image (1500×500) for "Nguyen AI" brand.

Background: deep-indigo (#0F2742) to ink (#161A1D) gradient, 135 degrees.
Content: logo mark on the left, "Nguyen AI" wordmark in Be Vietnam Pro 700 white, tagline "Rooted identity. Powerful intelligence. Global execution." in white 80% opacity below.
Accent: a thin bronze-gold (#C89B3C) line separating logo from tagline.
Mood: premium, trustworthy, technological, heritage-aware.

No crowns, no dragons, no robots, no chat bubbles.
```

### For OG image generation

```
Design an Open Graph image (1200×630) for "Nguyen AI Computer" website.

Background: deep-indigo (#0F2742).
Layout: logo mark + "Nguyen AI" wordmark centered, "Nguyen AI Computer" below in smaller text, nguyenai.net at bottom.
Text color: warm-white (#FFFDF8).
Accent: bronze-gold (#C89B3C) thin line above nguyenai.net.
Style: clean, minimal, premium, no clutter.

No crowns, no dragons, no robots, no AI sparkles.
```

---

## 12. FILE STRUCTURE (target)

```
brand/nguyenai/
├── logo/
│   ├── logo-primary.svg
│   ├── logo-primary-vertical.svg
│   ├── logo-mark.svg
│   ├── logo-mono-black.svg
│   ├── logo-mono-white.svg
│   ├── logo-on-dark.svg
│   └── logo-on-heritage-red.svg
├── favicon/
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   └── site.webmanifest
├── social/
│   ├── og-default.png
│   ├── og-invest.png
│   ├── og-academy.png
│   ├── twitter-avatar.png
│   ├── twitter-cover.png
│   ├── linkedin-avatar.png
│   └── linkedin-cover.png
├── icons/
│   ├── ai-computer.svg
│   ├── agent.svg
│   ├── roots.svg
│   ├── evidence.svg
│   ├── vault.svg
│   ├── memory.svg
│   ├── approval.svg
│   ├── chapter.svg
│   ├── founder.svg
│   ├── guardian.svg
│   ├── network.svg
│   └── icon-sprite.svg
├── templates/
│   ├── email-signature.html
│   ├── investor-cover.html
│   ├── business-card-front.html
│   ├── business-card-back.html
│   └── slide-template.html
├── colors.json (exists)
├── typography.json (exists)
├── spacing.json (new)
├── iconography.json (new)
└── brand-manifest.json (exists)
```

---

## 13. INTEGRATION INTO nguyenai.net

Sau khi brand assets hoàn thiện, tích hợp vào site:

### 13.1 Favicon
- Copy `favicon/` contents vào `public/`
- Add `<link>` tags trong `BaseLayout.astro` `<head>`

### 13.2 Logo inline
- Inline `logo-mark.svg` trong `BaseLayout.astro` header (thay text "N" hiện tại)
- Inline `logo-mark.svg` trong footer

### 13.3 OG images
- Copy `social/og-*.png` vào `public/`
- Update `<meta property="og:image">` trong `BaseLayout.astro`

### 13.4 Icons
- Copy `icons/*.svg` vào `src/components/icons/`
- Create `Icon.astro` component để render icon by name

### 13.5 Web manifest
- Copy `site.webmanifest` vào `public/`
- Add `<link rel="manifest" href="/site.webmanifest">` trong `BaseLayout.astro`

---

## Change log

| Date | Version | Change | By |
|---|---|---|---|
| 2026-07-02 | V1.0 | Initial brand identity design prompt — full system | Founder |
