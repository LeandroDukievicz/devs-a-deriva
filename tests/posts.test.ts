import { afterEach, describe, expect, it, vi } from 'vitest';

import { estimateReadTime, formatDate, getPost, paginatePosts, slugText, type Post } from '../src/lib/posts';

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

  it('returns empty list and no more when there are 0 posts', () => {
    expect(paginatePosts([], 1, 10)).toEqual({
      items: [],
      hasMore: false,
      total: 0,
    });
  });

  it('returns all posts and no more when total is less than pageSize', () => {
    const few = Array.from({ length: 5 }, (_, i) => makePost(`post-${i + 1}`));
    expect(paginatePosts(few, 1, 10)).toEqual({
      items: few,
      hasMore: false,
      total: 5,
    });
  });

  it('returns all posts and no more when total equals pageSize exactly', () => {
    const exact = Array.from({ length: 10 }, (_, i) => makePost(`post-${i + 1}`));
    expect(paginatePosts(exact, 1, 10)).toEqual({
      items: exact,
      hasMore: false,
      total: 10,
    });
  });

  it('returns hasMore true when there is one post beyond pageSize', () => {
    const eleven = Array.from({ length: 11 }, (_, i) => makePost(`post-${i + 1}`));
    const page1 = paginatePosts(eleven, 1, 10);
    expect(page1.hasMore).toBe(true);
    expect(page1.items).toHaveLength(10);

    const page2 = paginatePosts(eleven, 2, 10);
    expect(page2.hasMore).toBe(false);
    expect(page2.items).toHaveLength(1);
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

describe('estimateReadTime', () => {
  it('returns 1 min for very short content', () => {
    expect(estimateReadTime('palavra')).toBe('1 min');
  });

  it('returns 1 min for exactly 200 words', () => {
    const content = Array.from({ length: 200 }, (_, i) => `palavra${i}`).join(' ');
    expect(estimateReadTime(content)).toBe('1 min');
  });

  it('returns 2 min for 201 words', () => {
    const content = Array.from({ length: 201 }, (_, i) => `palavra${i}`).join(' ');
    expect(estimateReadTime(content)).toBe('2 min');
  });

  it('returns 5 min for 1000 words', () => {
    const content = Array.from({ length: 1000 }, (_, i) => `palavra${i}`).join(' ');
    expect(estimateReadTime(content)).toBe('5 min');
  });

  it('returns 1 min for empty string', () => {
    expect(estimateReadTime('')).toBe('1 min');
  });
});

describe('slugText', () => {
  it('lowercases text', () => {
    expect(slugText('HELLO WORLD')).toBe('hello world');
  });

  it('removes markdown syntax characters', () => {
    expect(slugText('**bold** and _italic_')).toBe('bold and italic');
  });

  it('removes heading hashes', () => {
    expect(slugText('# Título do Post')).toBe('título do post');
  });

  it('collapses multiple spaces into one', () => {
    expect(slugText('a   b   c')).toBe('a b c');
  });

  it('trims leading and trailing whitespace', () => {
    expect(slugText('  texto  ')).toBe('texto');
  });

  it('removes backticks and brackets', () => {
    expect(slugText('`code` [link](url)')).toBe('code linkurl');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string to DD mmm YYYY', () => {
    expect(formatDate('2026-05-07T00:00:00Z')).toBe('07 mai 2026');
  });

  it('formats January correctly', () => {
    expect(formatDate('2026-01-01T00:00:00Z')).toBe('01 jan 2026');
  });

  it('formats December correctly', () => {
    expect(formatDate('2026-12-31T00:00:00Z')).toBe('31 dez 2026');
  });

  it('returns the original string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});
