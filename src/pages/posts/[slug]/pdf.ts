export const prerender = false;

import type { APIRoute } from 'astro';
import { getPost, isApiOffline, slugText } from '../../../lib/posts';
import { createPostPdf } from '../../../lib/post-pdf';

export const GET: APIRoute = async ({ params }) => {
  const post = params.slug ? await getPost(params.slug) : undefined;
  if (!post) return Response.json({ error: isApiOffline() ? 'Artigos indisponíveis no momento. Tente novamente.' : 'Post não encontrado.' }, { status: isApiOffline() ? 503 : 404, headers: { 'Cache-Control': 'no-store' } });
  try {
    const pdf = await createPostPdf(post);
    const filename = `devs-a-deriva-${slugText(post.slug).slice(0, 160)}.pdf`;
    return new Response(new Uint8Array(pdf), { headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=30, s-maxage=30',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    } });
  } catch (error) {
    console.error('[post-pdf] Failed to generate PDF', params.slug, error);
    return Response.json({ error: 'Não foi possível gerar o PDF. Tente novamente.' }, { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '30' } });
  }
};
