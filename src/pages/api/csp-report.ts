import type { APIRoute } from 'astro';

export const prerender = false;

const MAX_REPORT_BYTES = 64 * 1024;

export const OPTIONS: APIRoute = () => new Response(null, {
  status: 204,
  headers: {
    'Cache-Control': 'no-store',
  },
});

export const POST: APIRoute = async ({ request }) => {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_REPORT_BYTES) {
    return new Response(null, {
      status: 413,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const body = await request.text();
  if (body.length > MAX_REPORT_BYTES) {
    return new Response(null, {
      status: 413,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const report = JSON.parse(body);
    const cspReport = report?.['csp-report'] ?? report;
    console.warn('[csp-report]', JSON.stringify({
      documentUri: cspReport?.['document-uri'] ?? cspReport?.url,
      violatedDirective: cspReport?.['violated-directive'] ?? cspReport?.effectiveDirective,
      blockedUri: cspReport?.['blocked-uri'] ?? cspReport?.blockedURL,
    }));
  } catch {
    console.warn('[csp-report] invalid JSON payload');
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
};
