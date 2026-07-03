import type { APIRoute } from 'astro';
import { tracks } from '../data/tracks';
import { programs } from '../data/programs';

const site = 'https://edu.nguyenai.net';
const staticRoutes = [
  '',
  '/about',
  '/certification',
  '/tracks',
  '/programs',
  '/scholarship',
  '/login',
  '/verify',
];

const trackRoutes = tracks.map((t) => `/tracks/${t.slug}`);
const programRoutes = programs.map((p) => `/programs/${p.slug}`);

// Only track 1 has lesson content — other tracks show "coming soon"
const lessonRoutes: string[] = [];
for (let i = 1; i <= 10; i++) {
  lessonRoutes.push(`/lessons/track-01-lesson-${String(i).padStart(2, '0')}`);
}

const allRoutes = [...staticRoutes, ...trackRoutes, ...programRoutes, ...lessonRoutes];

const urls = allRoutes.map((path) => {
  const priority = path === '' ? '1.0'
    : path === '/scholarship' ? '0.9'
    : path === '/programs' ? '0.9'
    : path.startsWith('/programs/') ? '0.8'
    : path.startsWith('/tracks/') ? '0.8'
    : '0.7';
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
