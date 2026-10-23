import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPostPdfDefinition, createPostPdf, getPdfImageUrl } from '../src/lib/post-pdf';
import type { Post } from '../src/types/blog';

const post: Post = {
  slug: 'programacao-a-deriva', title: 'Programação à deriva', category: 'Tech', categorySlug: 'tech',
  content: '', excerpt: 'Uma história de programação.', readTime: '2 min', hashtag: '#tech', publishedAt: '2026-09-01T12:00:00Z',
  contentHtml: '<h2>Introdução</h2><p>Acentuação e <strong>ênfase</strong>, <em>itálico</em> e <a href="https://example.com">link</a>.</p><ul><li>Um</li><li>Dois</li></ul><blockquote><p>Citação</p></blockquote><figure><img src="https://example.com/blocked.png" alt="Ilustração" /></figure><p>Fim do artigo.</p>',
  author: { name: 'Autora de teste', role: 'Editorial', photo: '/logo-high-color.webp', socialLinks: { linkedin: null, github: null, instagram: null, twitter: null } },
};

afterEach(() => vi.unstubAllGlobals());

describe('post PDF', () => {
  it('preserves author, Unicode text, formatting, links, lists, and image descriptions', () => {
    const definition = buildPostPdfDefinition(post, new Map());
    expect(definition.info).toMatchObject({ title: post.title, author: post.author.name });
    const content = JSON.stringify(definition.content);
    expect(content).toContain('Acentuação');
    expect(content).toContain('"bold":true');
    expect(content).toContain('"italics":true');
    expect(content).toContain('"link":"https://example.com/"');
    expect(content).toContain('"ul":');
    expect(content).toContain('Ilustração');
    expect(content).toContain('Fim do artigo.');
    expect(content).not.toContain('comentários');
  });
  it('rejects private, untrusted, credentialed and redirect-oriented image sources', () => {
    for (const source of ['http://127.0.0.1/image.png', 'https://localhost/image.png', 'file:///etc/passwd', 'https://example.com/image.png', 'https://devsaderiva.com.br@127.0.0.1/x', 'https://devsaderiva.com.br:444/x']) {
      expect(getPdfImageUrl(source)).toBeNull();
    }
    expect(getPdfImageUrl('/tech-astronaut.webp')?.hostname).toBe('devsaderiva.com.br');
  });
  it('generates a real PDF even when images are unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const buffer = await createPostPdf(post);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.byteLength).toBeGreaterThan(2000);
    expect(buffer.subarray(-30).toString()).toContain('%%EOF');
    expect(buffer.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(1);
  });
});
