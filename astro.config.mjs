import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nguyenai.net',
  output: 'static',
  build: {
    format: 'directory'
  }
});
