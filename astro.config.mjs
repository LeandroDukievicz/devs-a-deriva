import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Vercel sets VERCEL=1 in its own build environment automatically.
// Everywhere else (CI, Docker, local) we use @astrojs/node standalone.
const isVercel = process.env.VERCEL === '1';

const { default: adapter } = isVercel
  ? await import('@astrojs/vercel')
  : await import('@astrojs/node');

export default defineConfig({
  site: 'https://devsaderiva.com.br',
  adapter: isVercel ? adapter() : adapter({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
  },
});
