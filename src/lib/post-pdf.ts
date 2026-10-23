import pdfmake from 'pdfmake';
import vfs from 'pdfmake/build/vfs_fonts.js';
import type { Content, ContentText, TDocumentDefinitions } from 'pdfmake/interfaces';
import { DomUtils, parseDocument } from 'htmlparser2';
import sharp from 'sharp';
import type { Post } from '../types/blog';
import { formatDate } from './posts';
import { getPostImageSrc } from './post-listing';

const SITE = 'https://devsaderiva.com.br';
const IMAGE_HOSTS = new Set([
  'devsaderiva.com.br', 'www.devsaderiva.com.br', 'dashboard.devsaderiva.com.br',
  'pub-619874c57b8d423990b291e1ddf9c73c.r2.dev',
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
type HtmlNode = ReturnType<typeof parseDocument>['children'][number];

// Node exposes the virtual filesystem on the instance; no runtime font files are needed.
const fontFileSystem = (pdfmake as typeof pdfmake & {
  virtualfs: { writeFileSync(filename: string, contents: Buffer): void };
}).virtualfs;
for (const [filename, data] of Object.entries(vfs)) fontFileSystem.writeFileSync(filename, Buffer.from(data, 'base64'));
pdfmake.addFonts({ Roboto: {
  normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf',
  italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf',
} });
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy(() => false);

export function getPdfImageUrl(source: string): URL | null {
  try {
    const url = new URL(source, SITE);
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && IMAGE_HOSTS.has(url.hostname) ? url : null;
  } catch { return null; }
}

async function loadImage(source: string): Promise<string | null> {
  const url = getPdfImageUrl(source);
  if (!url) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000), redirect: 'error' });
    if (!response.ok || !response.body || !response.headers.get('content-type')?.startsWith('image/')) return null;
    if (Number(response.headers.get('content-length')) > MAX_IMAGE_BYTES) { await response.body.cancel(); return null; }
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.byteLength;
      if (size > MAX_IMAGE_BYTES) throw new Error('Image too large');
      chunks.push(chunk);
    }
    const image = await sharp(Buffer.concat(chunks), { limitInputPixels: 25_000_000 })
      .rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${image.toString('base64')}`;
  } catch { return null; }
}

function inline(nodes: HtmlNode[], style: Partial<ContentText> = {}): ContentText[] {
  return nodes.flatMap(node => {
    if (node.type === 'text') return [{ ...style, text: node.data.replace(/\s+/g, ' ') }];
    if (!('name' in node) || !('children' in node) || ['script', 'style'].includes(node.name)) return [];
    if (node.name === 'br') return [{ ...style, text: '\n' }];
    const next = { ...style };
    if (['strong', 'b'].includes(node.name)) next.bold = true;
    if (['em', 'i'].includes(node.name)) next.italics = true;
    if (['s', 'del'].includes(node.name)) next.decoration = 'lineThrough';
    if (node.name === 'code') { next.background = '#edf3f6'; next.color = '#155e75'; }
    if (node.name === 'a') {
      try {
        const href = new URL(node.attribs.href, SITE);
        if (['https:', 'http:'].includes(href.protocol)) { next.link = href.href; next.color = '#006b7a'; next.decoration = 'underline'; }
      } catch { /* Keep the label when a link cannot be represented. */ }
    }
    return inline(node.children, next);
  });
}

function blocks(nodes: HtmlNode[], images: ReadonlyMap<string, string>): Content[] {
  return nodes.flatMap((node): Content[] => {
    if (node.type === 'text') return node.data.trim() ? [{ text: node.data, margin: [0, 0, 0, 12] }] : [];
    if (!('name' in node) || !('children' in node) || ['script', 'style'].includes(node.name)) return [];
    if (node.name === 'img') {
      const image = images.get(node.attribs.src);
      return image ? [{ image, fit: [483, 310], alignment: 'center', margin: [0, 12, 0, 16] }]
        : [{ text: node.attribs.alt || 'Imagem disponível na versão online.', fontSize: 9, color: '#526777', italics: true, margin: [0, 8, 0, 12] }];
    }
    if (/^h[1-6]$/.test(node.name)) return [{ text: inline(node.children), fontSize: node.name === 'h1' ? 19 : 16, bold: true, headlineLevel: Number(node.name[1]), margin: [0, 16, 0, 10] }];
    if (node.name === 'ul' || node.name === 'ol') {
      const items = node.children.filter(child => 'name' in child && child.name === 'li').map(child => ({ stack: blocks('children' in child ? child.children : [], images) }));
      return [node.name === 'ul' ? { ul: items, margin: [12, 0, 0, 12] } : { ol: items, margin: [12, 0, 0, 12] }];
    }
    if (node.name === 'blockquote') return [{ stack: blocks(node.children, images), italics: true, color: '#526777', margin: [18, 8, 8, 8] }];
    if (node.name === 'hr') return [{ canvas: [{ type: 'line', x1: 0, y1: 4, x2: 483, y2: 4, lineWidth: .5, lineColor: '#9ecbd1' }], margin: [0, 10, 0, 16] }];
    if (node.name === 'pre') return [{ text: DomUtils.textContent(node), fontSize: 9, preserveLeadingSpaces: true, margin: [8, 8, 8, 12] }];
    if (['figure', 'div', 'section'].includes(node.name)) return blocks(node.children, images);
    return [{ text: inline(node.children), margin: [0, 0, 0, 12] }];
  });
}

export function buildPostPdfDefinition(post: Post, images: ReadonlyMap<string, string>): TDocumentDefinitions {
  const url = `${SITE}/posts/${post.slug}`;
  const cover = images.get(getPostImageSrc(post));
  const body = blocks(parseDocument(post.contentHtml).children, images);
  const lastBlock = body.at(-1);
  if (lastBlock && typeof lastBlock === 'object' && 'margin' in lastBlock) lastBlock.margin = [0, 0, 0, 0];
  return {
    pageSize: 'A4', pageMargins: [56, 48, 56, 54],
    info: { title: post.title, author: post.author.name, subject: post.category, creator: 'Devs à Deriva', keywords: `Devs à Deriva, ${post.category}` },
    defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.45, color: '#1d2935' },
    content: [
      { text: 'DEVS À DERIVA', color: '#006b7a', bold: true, fontSize: 11, characterSpacing: 1.8, margin: [0, 0, 0, 22] },
      { text: post.category.toUpperCase(), color: '#9b238e', fontSize: 9, bold: true, margin: [0, 0, 0, 8] },
      { text: post.title, fontSize: 25, bold: true, lineHeight: 1.15, margin: [0, 0, 0, 16] },
      { text: `${post.author.name}${post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ''} · ${post.readTime} de leitura`, fontSize: 9, color: '#526777', margin: [0, 0, 0, 8] },
      { text: url, link: url, fontSize: 8, color: '#006b7a', margin: [0, 0, 0, 20] },
      ...(cover ? [{ image: cover, fit: [483, 260] as [number, number], alignment: 'center' as const, margin: [0, 0, 0, 24] as [number, number, number, number] }] : []),
      ...body,
    ],
    footer: (page, pages) => ({ columns: [{ text: 'Devs à Deriva · Leia também a versão online', link: url }, { text: `${page} / ${pages}`, alignment: 'right', width: 60 }], fontSize: 8, color: '#526777', margin: [56, 12, 56, 0] }),
    pageBreakBefore: (node, container) => Boolean(node.headlineLevel && container.getFollowingNodesOnPage().length === 0 && container.getNodesOnNextPage().length > 0),
  };
}

export async function createPostPdf(post: Post): Promise<Buffer> {
  const document = parseDocument(post.contentHtml);
  const sources = [...new Set([getPostImageSrc(post), ...DomUtils.findAll(node => node.name === 'img', document.children).map(node => node.attribs.src)])];
  const images = new Map<string, string>();
  // Limit concurrent image decoding; failed images never prevent the text download.
  for (let start = 0; start < sources.length; start += 4) {
    const batch = sources.slice(start, start + 4);
    const loaded = await Promise.allSettled(batch.map(loadImage));
    loaded.forEach((result, index) => { if (result.status === 'fulfilled' && result.value) images.set(batch[index], result.value); });
  }
  return pdfmake.createPdf(buildPostPdfDefinition(post, images)).getBuffer();
}
