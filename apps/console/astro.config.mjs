import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://app.nguyenai.net',
  output: 'static',
  adapter: cloudflare({ prerenderEnvironment: false }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
