import { describe, expect, it } from 'vitest';
import { searchPosts } from '../src/lib/posts';
import type { Post } from '../src/types/blog';

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    slug: 'test-post',
    title: 'Test Post',
    category: 'Tech',
    categorySlug: 'tech',
    excerpt: 'A short excerpt about programming.',
    tldr: 'A short excerpt about programming.',
    content: '# Test Post\nContent here.',
    contentHtml: '<p>Content here.</p>',
    readTime: '1 min',
    hashtag: '#tech',
    author: {
      name: 'Leandro',
      role: 'Developer',
      photo: '/photo.jpg',
      socialLinks: { linkedin: null, github: null, instagram: null, twitter: null },
    },
    thumbUrl: null,
    featured: true,
    publishedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

const POSTS: Post[] = [
  makePost({
    slug: 'typescript-tips',
    title: 'TypeScript Tips',
    category: 'Tech',
    categorySlug: 'tech',
    excerpt: 'Advanced TypeScript techniques for production.',
    author: { name: 'Alice', role: 'Eng', photo: '/a.jpg', socialLinks: { linkedin: null, github: null, instagram: null, twitter: null } },
  }),
  makePost({
    slug: 'career-guide',
    title: 'Career Guide for Devs',
    category: 'Carreira',
    categorySlug: 'carreira',
    excerpt: 'How to advance your software engineering career.',
    author: { name: 'Bob', role: 'Eng', photo: '/b.jpg', socialLinks: { linkedin: null, github: null, instagram: null, twitter: null } },
  }),
  makePost({
    slug: 'book-review',
    title: 'My Favorite Books',
    category: 'Livros',
    categorySlug: 'livros',
    excerpt: 'Books every developer should read.',
    author: { name: 'Alice', role: 'Eng', photo: '/a.jpg', socialLinks: { linkedin: null, github: null, instagram: null, twitter: null } },
  }),
  makePost({
    slug: 'draft-post',
    title: 'Draft Post',
    category: 'Tech',
    categorySlug: 'tech',
    excerpt: 'This should not appear in search results if not included.',
    author: { name: 'Carol', role: 'Eng', photo: '/c.jpg', socialLinks: { linkedin: null, github: null, instagram: null, twitter: null } },
  }),
];

// searchPosts only operates on the posts passed in — privacy enforcement is at fetch time
const PUBLIC_POSTS = POSTS.filter((p) => p.slug !== 'draft-post');

describe('searchPosts', () => {
  it('returns empty array for empty string query', () => {
    expect(searchPosts(PUBLIC_POSTS, '')).toHaveLength(0);
  });

  it('returns empty array for whitespace-only query', () => {
    expect(searchPosts(PUBLIC_POSTS, '   ')).toHaveLength(0);
  });

  it('finds post by title', () => {
    const results = searchPosts(PUBLIC_POSTS, 'typescript');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('typescript-tips');
  });

  it('finds post by category', () => {
    const results = searchPosts(PUBLIC_POSTS, 'carreira');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('career-guide');
  });

  it('finds post by author name', () => {
    const results = searchPosts(PUBLIC_POSTS, 'alice');
    expect(results).toHaveLength(2);
    expect(results.map((p) => p.slug)).toEqual(
      expect.arrayContaining(['typescript-tips', 'book-review']),
    );
  });

  it('finds post by excerpt content', () => {
    const results = searchPosts(PUBLIC_POSTS, 'advance your software');
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('career-guide');
  });

  it('is case-insensitive', () => {
    expect(searchPosts(PUBLIC_POSTS, 'TYPESCRIPT')).toHaveLength(1);
    expect(searchPosts(PUBLIC_POSTS, 'TypeScript')).toHaveLength(1);
    expect(searchPosts(PUBLIC_POSTS, 'typescript')).toHaveLength(1);
  });

  it('returns empty array when nothing matches', () => {
    expect(searchPosts(PUBLIC_POSTS, 'xyznotexist999')).toHaveLength(0);
  });

  it('returns empty array for empty posts array', () => {
    expect(searchPosts([], 'typescript')).toHaveLength(0);
  });

  it('does not break on special characters in query', () => {
    expect(() => searchPosts(PUBLIC_POSTS, '<script>alert(1)</script>')).not.toThrow();
    expect(searchPosts(PUBLIC_POSTS, '<script>alert(1)</script>')).toHaveLength(0);
  });

  it('does not include posts not in the input array', () => {
    // Draft post is excluded from PUBLIC_POSTS — searchPosts must not return it
    const results = searchPosts(PUBLIC_POSTS, 'draft');
    expect(results.every((p) => p.slug !== 'draft-post')).toBe(true);
  });

  it('handles partial matches across multiple fields', () => {
    // "books" appears in excerpt; "Livros" is the category
    const byExcerpt = searchPosts(PUBLIC_POSTS, 'books');
    expect(byExcerpt.some((p) => p.slug === 'book-review')).toBe(true);
  });
});
