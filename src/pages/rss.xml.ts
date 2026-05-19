import type { APIRoute } from 'astro';
import { fetchPosts } from '../lib/posts';

const SITE = 'https://devsaderiva.com.br';
const FEED_URL = `${SITE}/rss.xml`;

function toRFC822(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toUTCString();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const posts = await fetchPosts();

  const sorted = [...posts].sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  const items = sorted
    .map((post) => {
      const url = `${SITE}/posts/${post.slug}`;
      const thumb = post.thumbUrl
        ? `<enclosure url="${escapeXml(post.thumbUrl.startsWith('http') ? post.thumbUrl : SITE + post.thumbUrl)}" type="image/webp" length="0" />\n        `
        : '';

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <content:encoded><![CDATA[${post.contentHtml}]]></content:encoded>
      <pubDate>${toRFC822(post.publishedAt)}</pubDate>
      <category>${escapeXml(post.category)}</category>
      <author>noreply@devsaderiva.com.br (${escapeXml(post.author.name)})</author>
      ${thumb}</item>`;
    })
    .join('\n');

  const lastBuildDate = sorted[0]?.publishedAt
    ? toRFC822(sorted[0].publishedAt)
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Devs à Deriva</title>
    <link>${SITE}</link>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
    <description>Tech, carreira, cultura e aleatoriedades por devs que navegam sem mapa.</description>
    <language>pt-BR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <url>${SITE}/logo-high-color.webp</url>
      <title>Devs à Deriva</title>
      <link>${SITE}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
