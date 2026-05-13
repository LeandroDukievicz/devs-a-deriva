import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const body = {
    status: 'ok',
    app: 'devs-a-deriva',
    version: import.meta.env.PUBLIC_COMMIT_SHA ?? 'local',
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
