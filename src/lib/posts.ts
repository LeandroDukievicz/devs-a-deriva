export interface Author {
  name: string;
  role: string;
  photo: string;
  socialLinks: {
    linkedin: string | null;
    github: string | null;
    instagram: string | null;
    twitter: string | null;
  };
}

export interface Post {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  excerpt: string;
  content: string;
  contentHtml: string;
  readTime: string;
  hashtag: string;
  author: Author;
  thumbUrl?: string | null;
  featured?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; hashtag: string }> = {
  aleatoriedades: { label: 'Aleatoriedades', hashtag: '#devaneios' },
  carreira:       { label: 'Carreira Profissional', hashtag: '#carreira' },
  livros:         { label: 'Livros & Leituras', hashtag: '#livros' },
  musica:         { label: 'Música', hashtag: '#musica' },
  noticias:       { label: 'Notícias', hashtag: '#noticias' },
  tech:           { label: 'Tech', hashtag: '#tech' },
};

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function slugText(value: string): string {
  return value
    .replace(/[#>*_`[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatInline(value: string): string {
  let html = escapeHtml(value);

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (_match, label, href) => {
    return `<a href="${href}" target="${href.startsWith('http') ? '_blank' : '_self'}" rel="noopener noreferrer">${label}</a>`;
  });

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

    const heading = trimmed.match(/^(#{2,6})\s+(.+)$/);
    if (heading) {
      flushAll();
      const level = Math.min(4, heading[1].length);
      blocks.push(`<h${level}>${formatInline(heading[2])}</h${level}>`);
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

function hasValidSlug(raw: unknown): raw is { slug: string } {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    typeof (raw as { slug?: unknown }).slug === 'string' &&
    (raw as { slug: string }).slug.trim().length > 0
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(raw: any): Post {
  const categorySlug = raw.category?.slug ?? raw.category ?? '';
  const cat = CATEGORY_MAP[categorySlug] ?? { label: categorySlug, hashtag: `#${categorySlug}` };
  const title = raw.title ?? 'Post sem titulo';
  const content = stripTitleHeading(raw.content ?? '', title);
  const excerpt = markdownToText(raw.excerpt ?? content).slice(0, 240);
  const author: Author = raw.author?.displayName
    ? {
        name: raw.author.displayName,
        role: raw.author.jobTitle ?? 'Colaborador',
        photo: raw.author.photoUrl ?? '/logo-high-color.webp',
        socialLinks: {
          linkedin: raw.author.socialLinks?.linkedin ?? raw.author.linkedinUrl ?? null,
          github: raw.author.socialLinks?.github ?? raw.author.githubUrl ?? null,
          instagram: raw.author.socialLinks?.instagram ?? raw.author.instagramUrl ?? null,
          twitter: raw.author.socialLinks?.twitter ?? raw.author.twitterUrl ?? null,
        },
      }
    : {
        name: 'Devs à Deriva',
        role: 'Editorial',
        photo: '/logo-high-color.webp',
        socialLinks: {
          linkedin: null,
          github: null,
          instagram: null,
          twitter: null,
        },
      };

  return {
    slug: raw.slug,
    title,
    category: cat.label,
    categorySlug,
    excerpt,
    content,
    contentHtml: markdownToHtml(content),
    readTime: estimateReadTime(content),
    hashtag: cat.hashtag,
    author,
    thumbUrl: raw.thumbUrl ?? null,
    featured: true,
  };
}

const DASHBOARD_URL = import.meta.env.PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000';

let _cache: Post[] | null = null;

export async function fetchPosts(): Promise<Post[]> {
  if (_cache && import.meta.env.PROD) return _cache;
  try {
    const res = await fetch(`${DASHBOARD_URL}/api/posts?status=PUBLISHED`);
    if (!res.ok) return [];
    const json = await res.json();
    const items: unknown[] = Array.isArray(json?.data) ? json.data : [];
    _cache = items.filter(hasValidSlug).map(mapPost);
    return _cache;
  } catch {
    return [];
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

export function paginatePosts(posts: Post[], page: number, pageSize = 10): {
  items: Post[];
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
