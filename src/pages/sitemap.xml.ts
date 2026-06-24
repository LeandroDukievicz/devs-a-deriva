export const prerender = false;

import type { APIRoute } from 'astro';
import { fetchCategories } from '../lib/categories';
import { fetchPosts } from '../lib/posts';

const SITE = 'https://devsaderiva.com.br';

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/manifesto', priority: '0.6', changefreq: 'monthly' },
  { url: '/devs', priority: '0.6', changefreq: 'monthly' },
  { url: '/termos', priority: '0.3', changefreq: 'yearly' },
  { url: '/privacidade', priority: '0.3', changefreq: 'yearly' },
  { url: '/exclusao-de-dados', priority: '0.3', changefreq: 'yearly' },
];

export const GET: APIRoute = async () => {
  const [posts, categories] = await Promise.all([fetchPosts(), fetchCategories()]);

  const postEntries = posts.map((post) => ({
    url: `/posts/${post.slug}`,
    priority: '0.9',
    changefreq: 'monthly',
  }));
  const categoryEntries = categories.map((category) => ({
    url: `/categorias/${category.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const allEntries = [...STATIC_PAGES, ...categoryEntries, ...postEntries];

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
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
