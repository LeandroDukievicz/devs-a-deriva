import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://devsaderiva.com.br',
  integrations: [tailwind()],
});
