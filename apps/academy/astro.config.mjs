import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://academy.nguyenai.net',
  output: 'hybrid',
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [
    mdx(),
    tailwind(),
    react(),
  ],
});
