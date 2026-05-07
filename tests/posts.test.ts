import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPost, paginatePosts, type Post } from '../src/lib/posts';

function makePost(slug: string): Post {
  return {
    slug,
    title: `Post ${slug}`,
    category: 'Tech',
    categorySlug: 'tech',
    excerpt: `Resumo ${slug}`,
    content: `Conteudo ${slug}`,
    contentHtml: `<p>Conteudo ${slug}</p>`,
    readTime: '1 min',
    hashtag: '#tech',
    author: {
      name: 'Devs à Deriva',
      role: 'Editorial',
      photo: '/logo-high-color.webp',
      socialLinks: {
        linkedin: null,
        github: null,
        instagram: null,
        twitter: null,
      },
    },
    thumbUrl: null,
    featured: true,
  };
}

describe('paginatePosts', () => {
  const posts = Array.from({ length: 25 }, (_, index) => makePost(`post-${index + 1}`));

  it('returns the requested page slice and total', () => {
    expect(paginatePosts(posts, 2, 10)).toEqual({
      items: posts.slice(10, 20),
      hasMore: true,
      total: 25,
    });
  });

  it('marks the last partial page without more items', () => {
    expect(paginatePosts(posts, 3, 10)).toEqual({
      items: posts.slice(20, 30),
      hasMore: false,
      total: 25,
    });
  });

  it('returns an empty page beyond the end', () => {
    expect(paginatePosts(posts, 4, 10)).toEqual({
      items: [],
      hasMore: false,
      total: 25,
    });
  });
});

describe('getPost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a post by slug', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: [makePost('existe')] })));

    await expect(getPost('existe')).resolves.toMatchObject({ slug: 'existe' });
  });

  it('returns undefined for an unknown slug', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ data: [makePost('existe')] })));

    await expect(getPost('nao-existe')).resolves.toBeUndefined();
  });
});
