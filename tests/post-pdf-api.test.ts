import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/posts', () => ({ getPost: vi.fn(), isApiOffline: vi.fn(), slugText: (value: string) => value.replace(/[^a-z0-9-]/g, '') }));
vi.mock('../src/lib/post-pdf', () => ({ createPostPdf: vi.fn() }));

import { getPost, isApiOffline } from '../src/lib/posts';
import { createPostPdf } from '../src/lib/post-pdf';
import { GET } from '../src/pages/posts/[slug]/pdf';

const request = () => GET({ params: { slug: 'artigo' } } as unknown as Parameters<typeof GET>[0]);
beforeEach(() => vi.resetAllMocks());

describe('post PDF endpoint', () => {
  it('downloads a PDF with a safe filename and excludes it from search indexing', async () => {
    vi.mocked(getPost).mockResolvedValue({ slug: 'artigo' } as Awaited<ReturnType<typeof getPost>>);
    vi.mocked(createPostPdf).mockResolvedValue(Buffer.from('%PDF-example'));
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="devs-a-deriva-artigo.pdf"');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(await response.text()).toBe('%PDF-example');
  });
  it('does not export an unpublished or missing article', async () => {
    const response = await request();
    expect(response.status).toBe(404);
    expect(createPostPdf).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
  it('distinguishes an unavailable dashboard from an unknown article', async () => {
    vi.mocked(isApiOffline).mockReturnValue(true);
    expect((await request()).status).toBe(503);
  });
});
