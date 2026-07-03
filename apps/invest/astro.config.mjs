import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://invest.nguyenai.net',
  output: 'static',
  integrations: [tailwind()],
});
