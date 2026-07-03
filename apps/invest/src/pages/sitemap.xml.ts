import type { APIRoute } from 'astro';

const site = 'https://invest.nguyenai.net';
const publicRoutes = [
  '',
  '/why-now',
  '/ai-computer',
  '/market',
  '/business-model',
  '/moat',
  '/roadmap',
  '/team',
  '/governance',
  '/risks',
  '/impact',
  '/request-access',
];

const enRoutes = publicRoutes.map((r) => `/en${r}`);

// Private routes are noindex — excluded from sitemap per AGENTS.md

const allRoutes = [...publicRoutes, ...enRoutes];

const urls = allRoutes.map((path) => {
  const isEn = path.startsWith('/en');
  const priority = path === '' || path === '/en' ? '1.0' : path.endsWith('/request-access') ? '0.9' : '0.8';
  return `  <url>
    <loc>${site}${path === '' ? '' : path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join('\n');

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
