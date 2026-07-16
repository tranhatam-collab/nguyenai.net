import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://edu.nguyenai.net',
  output: 'static',
  adapter: cloudflare({ prerenderEnvironment: false }),
  integrations: [
    mdx(),
    tailwind(),
    react(),
  ],
});
