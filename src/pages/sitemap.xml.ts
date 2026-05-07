import type { APIRoute } from 'astro';
import { fetchPosts } from '../lib/posts';

const SITE = 'https://devsaderiva.com.br';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/categorias/tech', priority: '0.8', changefreq: 'weekly' },
  { url: '/categorias/carreira', priority: '0.8', changefreq: 'weekly' },
  { url: '/categorias/livros', priority: '0.8', changefreq: 'weekly' },
  { url: '/categorias/musica', priority: '0.8', changefreq: 'weekly' },
  { url: '/categorias/aleatoriedades', priority: '0.8', changefreq: 'weekly' },
  { url: '/categorias/noticias', priority: '0.8', changefreq: 'weekly' },
  { url: '/manifesto', priority: '0.6', changefreq: 'monthly' },
  { url: '/devs', priority: '0.6', changefreq: 'monthly' },
];

export const GET: APIRoute = async () => {
  const posts = await fetchPosts();

  const postEntries = posts.map((post) => ({
    url: `/posts/${post.slug}`,
    priority: '0.9',
    changefreq: 'monthly',
  }));

  const allEntries = [...STATIC_PAGES, ...postEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) => `  <url>
    <loc>${SITE}${entry.url}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
