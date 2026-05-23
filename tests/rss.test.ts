import { describe, expect, it, vi } from 'vitest';

import type { Post } from '../src/lib/posts';

vi.mock('../src/lib/posts', () => ({
  fetchPosts: vi.fn(async (): Promise<Post[]> => [
    {
      slug: 'cache-rss',
      title: 'Cache RSS',
      category: 'Tech',
      categorySlug: 'tech',
      excerpt: 'Feed cacheado',
      content: 'Conteudo',
      contentHtml: '<p>Conteudo</p>',
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
      publishedAt: '2026-05-23T12:00:00.000Z',
    },
  ]),
}));

describe('/rss.xml', () => {
  it('sets shared cache headers for RSS readers and edge caches', async () => {
    const { GET } = await import('../src/pages/rss.xml');

    const response = await GET({} as Parameters<typeof GET>[0]);

    expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
  });
});
