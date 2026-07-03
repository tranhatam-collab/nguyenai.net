import type { APIRoute } from 'astro';
import { tracks } from '../data/tracks';

const site = 'https://edu.nguyenai.net';
const staticRoutes = [
  '',
  '/about',
  '/certification',
  '/tracks',
  '/login',
  '/verify',
];

const trackRoutes = tracks.map((t) => `/tracks/${t.slug}`);

// Only track 1 has lesson content — other tracks show "coming soon"
const lessonRoutes: string[] = [];
for (let i = 1; i <= 10; i++) {
  lessonRoutes.push(`/lessons/track-01-lesson-${String(i).padStart(2, '0')}`);
}

const allRoutes = [...staticRoutes, ...trackRoutes, ...lessonRoutes];

const urls = allRoutes.map((path) => {
  const priority = path === '' ? '1.0' : path.startsWith('/tracks/') ? '0.8' : '0.7';
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
