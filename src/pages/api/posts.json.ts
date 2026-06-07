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
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));

  const allPosts = await fetchPosts();
  const total = allPosts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const slice = allPosts.slice(start, start + PAGE_SIZE);

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
