import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
// output: 'server' required for /private/* middleware auth gate
// per INVESTOR_ACCESS_POLICY §9 (LOCKED)
export default defineConfig({
  site: 'https://invest.nguyenai.net',
  output: 'server',
  adapter: cloudflare({ prerenderEnvironment: false }),
  integrations: [tailwind()],
});
