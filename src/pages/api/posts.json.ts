export const prerender = false;
import type { APIRoute } from 'astro';
import { HOME_POSTS_PER_PAGE, clampPageSize, isPositiveIntegerString, parsePositiveInteger, toPostJsonItem } from '../../lib/post-listing';
import { fetchPosts } from '../../lib/posts';

export const GET: APIRoute = async ({ url }) => {
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');

  if ((pageParam !== null && !isPositiveIntegerString(pageParam)) || (limitParam !== null && !isPositiveIntegerString(limitParam))) {
    return Response.json(
      { error: 'Invalid pagination parameters' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  const page = parsePositiveInteger(pageParam, 1);
  const pageSize = clampPageSize(
    parsePositiveInteger(limitParam, HOME_POSTS_PER_PAGE),
    HOME_POSTS_PER_PAGE,
  );
  const category = url.searchParams.get('category')?.trim();

  const allPosts = category
    ? (await fetchPosts()).filter((post) => post.categorySlug === category)
    : await fetchPosts();
  const total = allPosts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const slice = allPosts.slice(start, start + pageSize);

  const posts = slice.map((post, i) => toPostJsonItem(post, start + i));

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
