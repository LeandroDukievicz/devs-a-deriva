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
  publishedAt?: string | null;
}
