import type { Post } from '../types/blog';

export const HOME_POSTS_PER_PAGE = 5;
export const CATEGORY_POSTS_PER_PAGE = 10;

const CATEGORY_IMAGES: Record<string, string> = {
  aleatoriedades: '/aleatoriedades-astronaut-body.webp',
  carreira: '/carreira-profissional-astronaut-body.webp',
  livros: '/livros-astronaut.webp',
  musica: '/musica-astronaut.webp',
  noticias: '/noticias-astronaut.webp',
  tech: '/tech-astronaut.webp',
};

export type HomePostCard = Post & {
  sectionId: string;
  href: string;
  authorBio: string;
  imageSrc: string;
};

export type PostJsonItem = {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  excerpt: string;
  author: {
    name: string;
    photo: string;
    role: string;
  };
  sectionId: string;
  href: string;
  authorBio: string;
  imageSrc: string;
  publishedAt: string | null | undefined;
  readingTime: string;
  readTime: string;
  hashtag: string;
  cover: string | null | undefined;
};

export function getPostImageSrc(post: Pick<Post, 'categorySlug' | 'thumbUrl'>): string {
  return post.thumbUrl ?? CATEGORY_IMAGES[post.categorySlug] ?? '/logo-high-color.webp';
}

export function getHomePostHref(post: Pick<Post, 'slug'>): string {
  return `/posts/${post.slug}?from=home`;
}

export function toHomePostCard(post: Post, absoluteIndex: number): HomePostCard {
  return {
    ...post,
    sectionId: `section-${absoluteIndex + 1}`,
    href: getHomePostHref(post),
    authorBio: post.author.role,
    imageSrc: getPostImageSrc(post),
  };
}

export function toPostJsonItem(post: Post, absoluteIndex: number): PostJsonItem {
  return {
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
    sectionId: `section-${absoluteIndex + 1}`,
    href: getHomePostHref(post),
    authorBio: post.author.role,
    imageSrc: getPostImageSrc(post),
    publishedAt: post.publishedAt,
    readingTime: post.readTime,
    readTime: post.readTime,
    hashtag: post.hashtag,
    cover: post.thumbUrl,
  };
}

export function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function clampPageSize(value: number, fallback: number, max = 20): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(1, Math.floor(value))) : fallback;
}
