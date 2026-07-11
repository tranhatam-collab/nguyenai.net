/**
 * Regenerate static web sitemaps from apps/web/src/data/site.ts routes.
 * Usage: npx tsx tools/generate-web-sitemaps.ts
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes, site } from '../apps/web/src/data/site.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(repoRoot, 'apps/web/public');
const base = site.url;

function urlEntry(viPath: string, enPath: string): string {
  const vi = `${base}${viPath}`;
  const en = `${base}${enPath}`;
  return `  <url><loc>${vi}</loc><xhtml:link rel="alternate" hreflang="vi-VN" href="${vi}"/><xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="x-default" href="${vi}"/></url>`;
}

const viEntries = routes.map((route) => urlEntry(route.vi, route.en)).join('\n');
const enEntries = routes
  .map((route) => {
    const vi = `${base}${route.vi}`;
    const en = `${base}${route.en}`;
    return `  <url><loc>${en}</loc><xhtml:link rel="alternate" hreflang="vi-VN" href="${vi}"/><xhtml:link rel="alternate" hreflang="en" href="${en}"/><xhtml:link rel="alternate" hreflang="x-default" href="${vi}"/></url>`;
  })
  .join('\n');

const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
const footer = '\n</urlset>\n';

writeFileSync(join(publicDir, 'sitemap-vi.xml'), `${header}${viEntries}${footer}`);
writeFileSync(join(publicDir, 'sitemap-en.xml'), `${header}${enEntries}${footer}`);
writeFileSync(
  join(publicDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${base}/sitemap-vi.xml</loc></sitemap>\n  <sitemap><loc>${base}/sitemap-en.xml</loc></sitemap>\n</sitemapindex>\n`,
);

console.log(`Generated sitemaps for ${routes.length} bilingual route pairs.`);
