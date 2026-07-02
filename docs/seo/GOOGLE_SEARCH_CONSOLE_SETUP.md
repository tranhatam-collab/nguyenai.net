# Google Search Console — Setup Guide

- **Status:** PENDING — custom domain live, awaiting GSC verification
- **Date:** 2026-07-02
- **Domain:** nguyenai.net

---

## 1. Prerequisites (DONE)

- [x] Custom domain `nguyenai.net` active on Cloudflare Pages
- [x] SSL certificate active (Google CA)
- [x] Sitemap accessible at `https://nguyenai.net/sitemap.xml`
- [x] Sitemap index with 2 sub-sitemaps:
  - `https://nguyenai.net/sitemap-vi.xml` (25 VI URLs)
  - `https://nguyenai.net/sitemap-en.xml` (25 EN URLs)
- [x] robots.txt accessible at `https://nguyenai.net/robots.txt`
- [x] Canonical + hreflang on all 50 pages

---

## 2. Add property to Google Search Console

1. Go to https://search.google.com/search-console
2. Sign in with Google account (founder@nguyenai.net or tranhatam@gmail.com)
3. Click "Add property"
4. Choose "URL prefix" → enter `https://nguyenai.net/`
5. Choose verification method:

### Method A: HTML file (recommended)

1. Download the verification file from GSC (e.g., `google1234567890abcdef.html`)
2. Replace `public/google-site-verification.txt` with the actual file
3. Or place the HTML file in `public/`
4. Rebuild + redeploy:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name nguyenai-net --branch main --commit-dirty=true
   ```
5. Click "Verify" in GSC

### Method B: HTML meta tag

1. Copy the meta tag from GSC (e.g., `<meta name="google-site-verification" content="..." />`)
2. Add to `BaseLayout.astro` `<head>` section
3. Rebuild + redeploy
4. Click "Verify" in GSC

### Method C: Google Analytics (if already connected)

1. If you have GA4 on the site, GSC can verify via GA connection
2. Not recommended for initial setup

### Method D: Cloudflare DNS TXT record

1. Copy the TXT record value from GSC
2. Add via Cloudflare dashboard or API:
   ```
   Type: TXT
   Name: @ (or nguyenai.net)
   Content: google-site-verification=XXXXXXXXXXXX
   ```
3. Wait for DNS propagation (5-30 minutes)
4. Click "Verify" in GSC

---

## 3. Submit sitemap

After verification:

1. In GSC, go to "Sitemaps" (left sidebar)
2. Enter `sitemap.xml` (full URL: `https://nguyenai.net/sitemap.xml`)
3. Click "Submit"
4. Wait for Google to process (usually 24-48 hours for first crawl)
5. Check status: should show "Success" with 50 URLs discovered

### Sitemap structure

```
https://nguyenai.net/sitemap.xml (index)
  ├── https://nguyenai.net/sitemap-vi.xml (25 VI URLs)
  └── https://nguyenai.net/sitemap-en.xml (25 EN URLs)
```

---

## 4. Submit individual URLs for indexing (optional, faster)

For important pages, use "URL Inspection" tool in GSC:

1. Enter URL: `https://nguyenai.net/`
2. Click "Request indexing"
3. Repeat for:
   - `https://nguyenai.net/invest/`
   - `https://nguyenai.net/ai-computer/`
   - `https://nguyenai.net/plans/`
   - `https://nguyenai.net/about/`
   - `https://nguyenai.net/contact/`
   - `https://nguyenai.net/en/`
   - `https://nguyenai.net/en/invest/`

---

## 5. International targeting

### Set international targeting in GSC

1. Go to "International targeting" (legacy GSC feature, may not be available in new version)
2. Set `hreflang` tags are already in place (vi-VN, en, x-default)
3. Google will automatically use hreflang for language/region targeting

### Country targeting

- No specific country targeting (global brand)
- VI content targets Vietnamese speakers globally
- EN content targets English speakers globally

---

## 6. Monitor

After 1-2 weeks, check in GSC:

- **Coverage**: How many URLs are indexed
- **Performance**: Impressions, clicks, CTR, position
- **Sitemaps**: Status and discovered URLs
- **Mobile usability**: All pages should pass (responsive design)
- **Core Web Vitals**: LCP, FID, CLS metrics
- **Enhancements**: Breadcrumb, FAQ, Sitelinks searchbox (if structured data is present)

---

## 7. Bing Webmaster Tools (optional, recommended)

1. Go to https://www.bing.com/webmasters
2. Sign in with Microsoft or Google account
3. Add site: `https://nguyenai.net/`
4. Verify (same methods as GSC)
5. Submit sitemap: `https://nguyenai.net/sitemap.xml`
6. Bing powers Yahoo and DuckDuckGo results

---

## 8. Verification checklist

- [ ] GSC property added
- [ ] Verification passed
- [ ] Sitemap submitted
- [ ] At least 1 URL requested for indexing
- [ ] Coverage report shows pages being crawled
- [ ] No manual actions or security issues
- [ ] Bing Webmaster Tools added (optional)

---

_Generated 2026-07-02 by Devin. Setup guide for Google Search Console._
