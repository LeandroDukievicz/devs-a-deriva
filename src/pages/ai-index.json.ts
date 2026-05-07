import type { APIRoute } from 'astro';
import { fetchPosts } from '../lib/posts';
import { CATEGORIES } from '../lib/categories';

const SITE = 'https://devsaderiva.com.br';

export const GET: APIRoute = async () => {
  const posts = await fetchPosts();

  const index = {
    site: SITE,
    language: 'pt-BR',
    title: 'Devs à Deriva',
    description: 'Blog independente sobre tecnologia, carreira e vida real no desenvolvimento de software.',
    pages: [
      { url: `${SITE}/`, type: 'home', title: 'Home' },
      { url: `${SITE}/manifesto`, type: 'page', title: 'Manifesto' },
      { url: `${SITE}/devs`, type: 'page', title: 'Devs' },
      ...CATEGORIES.map(cat => ({
        url: `${SITE}/categorias/${cat.slug}`,
        type: 'category',
        title: cat.label,
        description: cat.description,
      })),
    ],
    posts: posts.map(post => ({
      url: `${SITE}/posts/${post.slug}`,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      categorySlug: post.categorySlug,
      readTime: post.readTime,
      author: post.author.name,
      ...(post.publishedAt ? { publishedAt: post.publishedAt } : {}),
    })),
    resources: {
      sitemap: `${SITE}/sitemap.xml`,
      llms: `${SITE}/llms.txt`,
      llmsFull: `${SITE}/llms-full.txt`,
      robots: `${SITE}/robots.txt`,
    },
  };

  return new Response(JSON.stringify(index, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
