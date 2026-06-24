export type { Author, Post } from '../types/blog';
import type { Author, Post } from '../types/blog';
import { escapeHtml, slugText } from './utils/string';
import { fetchCategories, type CategoryMeta } from './categories';
import { fetchWithRetry } from './api';

export { escapeHtml, slugText };

export function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

export function formatDate(dateStr: string): string {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function getCatInfo(categories: readonly CategoryMeta[], slug: string): { label: string; hashtag: string } {
  const cat = categories.find((c) => c.slug === slug);
  return cat ? { label: cat.label, hashtag: cat.hashtag } : { label: slug, hashtag: `#${slug}` };
}

function stripTitleHeading(content: string, title: string): string {
  const normalizedTitle = slugText(title);
  return content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter((line) => {
      const match = line.match(/^#{1,6}\s+(.+)$/);
      return !match || slugText(match[1]) !== normalizedTitle;
    })
    .join('\n')
    .trim();
}

function markdownToText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/!\[([^\]]*)\]/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstTextParagraph(markdown: string): string {
  const blocks = markdown.replace(/\r\n?/g, '\n').split(/\n{2,}/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^!\[/.test(trimmed)) continue;
    if (/^!\S+$/.test(trimmed)) continue;
    if (/^\[.*\]\(.*\)/.test(trimmed)) continue;
    if (/^[-*_]{3,}$/.test(trimmed)) continue;
    const text = markdownToText(trimmed);
    if (text.includes(' ') && text.length > 80) return text;
  }
  return '';
}

function formatInline(value: string): string {
  const softBreak = '\uE000';
  let html = escapeHtml(value.replace(/<br\s*\/?>/gi, softBreak));

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (_match, label, href) => {
    return `<a href="${href}" target="${href.startsWith('http') ? '_blank' : '_self'}" rel="noopener noreferrer">${label}</a>`;
  });
  html = html.replaceAll(softBreak, '<br>');

  return html;
}

function formatImage(alt: string, src: string): string {
  const safeSrc = escapeHtml(src);
  const safeAlt = escapeHtml(alt);
  return `<figure class="post-content-image"><img src="${safeSrc}" alt="${safeAlt}" loading="lazy" decoding="async" /></figure>`;
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let quote: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${formatInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push(`<ul>${list.map((item) => `<li>${formatInline(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(`<blockquote><p>${formatInline(quote.join(' '))}</p></blockquote>`);
    quote = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)(?:\s+"[^"]*")?\)$/);
    if (image) {
      flushAll();
      blocks.push(formatImage(image[1], image[2]));
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushAll();
      const hashes = heading[1].length;
      const content = heading[2];
      if (hashes >= 3) {
        blocks.push(`<p>${formatInline(content)}</p>`);
      } else {
        blocks.push(`<h${hashes}>${formatInline(content)}</h${hashes}>`);
      }
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushAll();
      blocks.push('<hr>');
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      flushQuote();
      list.push(listMatch[1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  flushAll();
  return blocks.join('\n');
}

function hasValidSlug(raw: unknown): raw is Record<string, unknown> & { slug: string } {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as { slug?: unknown }).slug === 'string' &&
    (raw as { slug: string }).slug.trim().length > 0
  );
}

function mapPost(raw: Record<string, unknown>, categories: readonly CategoryMeta[]): Post {
  const rawCategory = raw.category;
  const nestedCategorySlug = typeof rawCategory === 'object' && rawCategory !== null
    ? (rawCategory as { readonly slug?: unknown }).slug
    : undefined;
  const normalizedCategorySlug = typeof nestedCategorySlug === 'string'
    ? nestedCategorySlug
    : typeof rawCategory === 'string'
      ? rawCategory
      : '';
  const cat = getCatInfo(categories, normalizedCategorySlug);
  const title = typeof raw.title === 'string' ? raw.title : 'Post sem titulo';
  const rawContent = typeof raw.content === 'string' ? raw.content : '';
  const rawExcerpt = typeof raw.excerpt === 'string' ? raw.excerpt : '';
  const content = stripTitleHeading(rawContent, title);
  const excerptRaw = (firstTextParagraph(content) || firstTextParagraph(rawExcerpt) || markdownToText(rawExcerpt || content)).slice(0, 360);
  const excerpt = excerptRaw.length === 360 ? excerptRaw.trimEnd() + '…' : excerptRaw;
  const rawAuthor = typeof raw.author === 'object' && raw.author !== null
    ? raw.author as {
        readonly displayName?: unknown;
        readonly jobTitle?: unknown;
        readonly photoUrl?: unknown;
        readonly socialLinks?: {
          readonly linkedin?: unknown;
          readonly github?: unknown;
          readonly instagram?: unknown;
          readonly twitter?: unknown;
        };
        readonly linkedinUrl?: unknown;
        readonly githubUrl?: unknown;
        readonly instagramUrl?: unknown;
        readonly twitterUrl?: unknown;
      }
    : null;
  const author: Author = typeof rawAuthor?.displayName === 'string' && rawAuthor.displayName.length > 0
    ? {
        name: rawAuthor.displayName,
        role: typeof rawAuthor.jobTitle === 'string' ? rawAuthor.jobTitle : 'Membro',
        photo: typeof rawAuthor.photoUrl === 'string' ? rawAuthor.photoUrl : '/logo-high-color.webp',
        socialLinks: {
          linkedin: typeof rawAuthor.socialLinks?.linkedin === 'string' ? rawAuthor.socialLinks.linkedin : typeof rawAuthor.linkedinUrl === 'string' ? rawAuthor.linkedinUrl : null,
          github: typeof rawAuthor.socialLinks?.github === 'string' ? rawAuthor.socialLinks.github : typeof rawAuthor.githubUrl === 'string' ? rawAuthor.githubUrl : null,
          instagram: typeof rawAuthor.socialLinks?.instagram === 'string' ? rawAuthor.socialLinks.instagram : typeof rawAuthor.instagramUrl === 'string' ? rawAuthor.instagramUrl : null,
          twitter: typeof rawAuthor.socialLinks?.twitter === 'string' ? rawAuthor.socialLinks.twitter : typeof rawAuthor.twitterUrl === 'string' ? rawAuthor.twitterUrl : null,
        },
      }
    : {
        name: 'Devs à Deriva',
        role: 'Editorial',
        photo: '/logo-high-color.webp',
        socialLinks: { linkedin: null, github: null, instagram: null, twitter: null },
      };

  return {
    slug: typeof raw.slug === 'string' ? raw.slug : '',
    title,
    category: cat.label,
    categorySlug: normalizedCategorySlug,
    excerpt,
    content,
    contentHtml: markdownToHtml(content),
    readTime: estimateReadTime(content),
    hashtag: cat.hashtag,
    author,
    thumbUrl: typeof raw.thumbUrl === 'string' ? raw.thumbUrl : null,
    featured: true,
    publishedAt: typeof raw.publishedAt === 'string' ? raw.publishedAt : typeof raw.createdAt === 'string' ? raw.createdAt : null,
  };
}

function isPublishableNow(post: Post): boolean {
  if (!post.publishedAt) return true;
  const publishedAt = new Date(post.publishedAt).getTime();
  return isNaN(publishedAt) || publishedAt <= Date.now();
}

const DASHBOARD_URL = import.meta.env.PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000';

let _cache: Post[] | null = null;
let _cacheTime = 0;
let _apiOffline = false;
const CACHE_TTL_MS = 30_000;

export function isApiOffline(): boolean { return _apiOffline; }

export async function fetchPosts(): Promise<Post[]> {
  const now = Date.now();
  if (_cache && import.meta.env.PROD && now - _cacheTime < CACHE_TTL_MS) return _cache;
  try {
    const res = await fetchWithRetry(`${DASHBOARD_URL}/api/posts?status=PUBLISHED`);
    if (!res.ok) { _apiOffline = true; return _cache ?? []; }
    const json = await res.json();
    const items: unknown[] = Array.isArray(json?.data) ? json.data : [];
    const categories = await fetchCategories();
    _apiOffline = false;
    _cache = items.filter(hasValidSlug).map((post) => mapPost(post, categories)).filter(isPublishableNow);
    _cache.sort((a, b) => {
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });
    _cacheTime = now;
    return _cache;
  } catch {
    _apiOffline = true;
    return _cache ?? [];
  }
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const posts = await fetchPosts();
  return posts.find(p => p.slug === slug);
}

export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  const posts = await fetchPosts();
  return posts.filter(p => p.categorySlug === categorySlug);
}

export async function getFeaturedByCategory(categorySlug: string): Promise<Post[]> {
  return getPostsByCategory(categorySlug);
}

export function paginatePosts<T>(posts: T[], page: number, pageSize = 10): {
  items: T[];
  hasMore: boolean;
  total: number;
} {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const start = (safePage - 1) * safePageSize;

  return {
    items: posts.slice(start, start + safePageSize),
    hasMore: start + safePageSize < posts.length,
    total: posts.length,
  };
}

export function searchPosts(posts: readonly Post[], query: string): readonly Post[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q) ||
      post.author.name.toLowerCase().includes(q),
  );
}
