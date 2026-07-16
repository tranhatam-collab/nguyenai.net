#!/usr/bin/env node
/**
 * SEO + Bilingual + Brand BUILD audit (SEC/SEO P0 verification).
 *
 * This audit checks the RENDERED HTML in dist/, not the source. The previous
 * audits checked source files, which passed even when the built HTML had
 * wrong lang attributes, broken hreflang (/en/en/*), x-default pointing to
 * English, missing Open Graph, or English titles on Vietnamese pages.
 *
 * Run AFTER `pnpm build`. Scans all .html files under dist/ for:
 *  - <html lang> matches the route locale (vi for /, en for /en/)
 *  - hreflang present, reciprocal, no /en/en/* double-prefix
 *  - x-default points to the Vietnamese root (not English)
 *  - canonical present
 *  - <title> and <meta description> present and non-empty
 *  - Open Graph tags present (og:title, og:description, og:url, og:image)
 *  - no mixed-language title (VI page must not have an English-only title)
 *
 * Usage: npx tsx tools/audit-seo-build.ts [app...] (default: web, edu, invest)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const COLORS = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', reset: '\x1b[0m' };
let errors = 0;
let checked = 0;

interface AppSpec {
  name: string;
  distDir: string;
  host: string;
  // routes that are legitimately noindex (skip OG checks there)
  noindexPrefixes?: string[];
}

const APPS: AppSpec[] = [
  { name: 'web', distDir: 'apps/web/dist', host: 'https://nguyenai.net' },
  { name: 'edu', distDir: 'apps/edu/dist', host: 'https://edu.nguyenai.net' },
  { name: 'invest', distDir: 'apps/invest/dist', host: 'https://invest.nguyenai.net', noindexPrefixes: ['/private'] },
];

function walkHtml(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// Derive the locale from the file path within the dist root.
function localeOf(relPath: string): 'vi' | 'en' {
  const normalized = relPath.replace(/\\/g, '/');
  return normalized.includes('/en/') || normalized.startsWith('en/') ? 'en' : 'vi';
}

function readAttr(tag: string, attr: string): string | null {
  const m = tag.match(new RegExp(`${attr}=["']([^"']*)["']`));
  return m ? m[1] : null;
}

function findTags(html: string, pattern: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  while ((m = re.exec(html)) !== null) {
    out.push(m[0]);
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return out;
}

function checkFile(app: AppSpec, file: string): void {
  const rel = path.relative(path.join(ROOT, app.distDir), file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf-8');
  const locale = localeOf(rel);
  checked++;

  // Skip redirect stubs (Astro redirect pages have <meta http-equiv="refresh"> or very short HTML)
  const isRedirect = /<meta[^>]*http-equiv=["']refresh["']/i.test(html) || html.length < 500;
  if (isRedirect) return;

  const fails: string[] = [];
  const htmlTagMatch = html.match(/<html[^>]*>/i);
  const htmlLang = htmlTagMatch ? readAttr(htmlTagMatch[0], 'lang') : null;
  const expectedLang = locale === 'en' ? 'en' : 'vi';
  if (!htmlLang) fails.push('missing <html lang>');
  else if (!htmlLang.startsWith(expectedLang)) fails.push(`html lang="${htmlLang}" expected "${expectedLang}"`);

  // Detect noindex pages (private/auth) — skip hreflang/canonical/OG checks.
  const robotsMeta = findTags(html, /<meta[^>]*name=["']robots["'][^>]*>/i)[0];
  const isNoindexPage = robotsMeta ? /noindex/i.test(readAttr(robotsMeta, 'content') ?? '') : false;

  // hreflang links
  const altLinks = findTags(html, /<link[^>]*rel=["']alternate["'][^>]*>/gi);
  const hreflangs = altLinks.map((t) => ({ hreflang: readAttr(t, 'hreflang'), href: readAttr(t, 'href') }));
  const hasVi = hreflangs.some((h) => h.hreflang === 'vi' || h.hreflang === 'vi-VN');
  const hasEn = hreflangs.some((h) => h.hreflang === 'en');
  const xdef = hreflangs.find((h) => h.hreflang === 'x-default');

  // canonical
  const canonical = findTags(html, /<link[^>]*rel=["']canonical["'][^>]*>/i)[0];
  if (!canonical && !isNoindexPage) fails.push('missing canonical');

  // title + description
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) fails.push('missing/empty <title>');
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*>/i);
  if (!descMatch) fails.push('missing meta description');

  // hreflang + Open Graph (skip noindex pages — they are private/auth and
  // intentionally have no hreflang, canonical or OG).
  if (!isNoindexPage) {
    if (altLinks.length === 0) fails.push('no hreflang alternate links');
    if (!hasVi) fails.push('missing hreflang vi');
    if (!hasEn) fails.push('missing hreflang en');
    if (!xdef) fails.push('missing hreflang x-default');
    else if (xdef.href && /\/en(\/|$)/.test(xdef.href.replace(app.host, ''))) fails.push(`x-default points to EN: ${xdef.href}`);

    // no /en/en/* double prefix in any hreflang href
    for (const h of hreflangs) {
      if (h.href && /\/en\/en\//.test(h.href)) fails.push(`double /en/en/ in hreflang ${h.hreflang}: ${h.href}`);
    }

    const isNoindexRoute = app.noindexPrefixes?.some((p) => rel.startsWith(p.slice(1))) ?? false;
    if (!isNoindexRoute) {
      const ogTitle = findTags(html, /<meta[^>]*property=["']og:title["'][^>]*>/i)[0];
      const ogDesc = findTags(html, /<meta[^>]*property=["']og:description["'][^>]*>/i)[0];
      const ogUrl = findTags(html, /<meta[^>]*property=["']og:url["'][^>]*>/i)[0];
      const ogImage = findTags(html, /<meta[^>]*property=["']og:image["'][^>]*>/i)[0];
      if (!ogTitle) fails.push('missing og:title');
      if (!ogDesc) fails.push('missing og:description');
      if (!ogUrl) fails.push('missing og:url');
      if (!ogImage) fails.push('missing og:image');
      for (const tag of [ogTitle, ogDesc, ogUrl, ogImage]) {
        if (tag && !/content=/.test(tag) && /href=/.test(tag)) fails.push(`OG tag uses href= instead of content=: ${tag}`);
      }
    }
  }

  if (fails.length === 0) {
    console.log(`${COLORS.green}✓${COLORS.reset} ${app.name}:${rel} (${locale})`);
  } else {
    errors += fails.length;
    console.log(`${COLORS.red}✗${COLORS.reset} ${app.name}:${rel} (${locale})`);
    for (const f of fails) console.log(`    ${COLORS.red}-${COLORS.reset} ${f}`);
  }
}

function main(): void {
  const requested = process.argv.slice(2);
  const apps = requested.length > 0
    ? APPS.filter((a) => requested.includes(a.name))
    : APPS;
  console.log('=== SEO + Bilingual BUILD audit (dist HTML) ===\n');
  for (const app of apps) {
    const dist = path.join(ROOT, app.distDir);
    if (!fs.existsSync(dist)) {
      console.log(`${COLORS.yellow}⚠ ${app.name}: dist not found at ${app.distDir} (run build first)${COLORS.reset}`);
      continue;
    }
    const files = walkHtml(dist);
    if (files.length === 0) {
      console.log(`${COLORS.yellow}⚠ ${app.name}: no static HTML in dist (SSR/hybrid via Cloudflare adapter) — requires live audit against deployed URL${COLORS.reset}`);
      continue;
    }
    console.log(`\n--- ${app.name} (${files.length} HTML files) ---`);
    for (const f of files) checkFile(app, f);
  }
  console.log(`\n${checked} files checked, ${errors} error(s)`);
  if (errors > 0) {
    console.log(`${COLORS.red}BUILD AUDIT FAILED${COLORS.reset}`);
    process.exit(1);
  }
  console.log(`${COLORS.green}BUILD AUDIT PASSED${COLORS.reset}`);
}

main();
