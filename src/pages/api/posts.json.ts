export const prerender = false;
import type { APIRoute } from 'astro';
import { fetchPosts } from '../../lib/posts';

const PAGE_SIZE = 5;

const CATEGORY_IMAGES: Record<string, string> = {
  aleatoriedades: '/aleatoriedades-astronaut-body.webp',
  carreira: '/carreira-profissional-astronaut-body.webp',
  livros: '/livros-astronaut.webp',
  musica: '/musica-astronaut.webp',
  noticias: '/noticias-astronaut.webp',
  tech: '/tech-astronaut.webp',
};

export const GET: APIRoute = async ({ url }) => {
  const pageParam = url.searchParams.get('page');
  const parsedPage = parseInt(pageParam ?? '1', 10);
  const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
  const limitParam = url.searchParams.get('limit');
  const parsedLimit = parseInt(limitParam ?? String(PAGE_SIZE), 10);
  const pageSize = Number.isFinite(parsedLimit) ? Math.min(20, Math.max(1, parsedLimit)) : PAGE_SIZE;
  const category = url.searchParams.get('category')?.trim();

  const allPosts = category
    ? (await fetchPosts()).filter((post) => post.categorySlug === category)
    : await fetchPosts();
  const total = allPosts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const slice = allPosts.slice(start, start + pageSize);

  const posts = slice.map((post, i) => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    categorySlug: post.categorySlug,
    excerpt: post.excerpt,
    author: {
      name: post.author.name,
      photo: post.author.photo,
      role: post.author.role,
    },
    sectionId: `section-${start + i + 1}`,
    href: `/posts/${post.slug}?from=home`,
    authorBio: post.author.role,
    imageSrc: post.thumbUrl ?? CATEGORY_IMAGES[post.categorySlug] ?? '/logo-high-color.webp',
    publishedAt: post.publishedAt,
    readingTime: post.readTime,
    readTime: post.readTime,
    hashtag: post.hashtag,
    cover: post.thumbUrl,
  }));

  return new Response(
    JSON.stringify({
      posts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      nextPage: page < totalPages ? page + 1 : null,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    },
  );
};
