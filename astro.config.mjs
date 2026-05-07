import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://devsaderiva.com.br',
  vite: {
    plugins: [tailwindcss()],
  },
});
