import { describe, expect, it } from 'vitest';
import { GET } from '../src/pages/api/posts.json';

async function requestPosts(query: string): Promise<Response> {
  return GET({ url: new URL(`https://devsaderiva.com.br/api/posts.json${query}`) } as Parameters<typeof GET>[0]);
}

describe('/api/posts.json pagination validation', () => {
  it('rejects PHP shell style page payloads', async () => {
    const response = await requestPosts('?page=%3C?php%20system($_GET%5Bc%5D);?%3E&limit=5');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid pagination parameters' });
  });

  it('rejects traversal and remote include style page payloads', async () => {
    await expect(requestPosts('?page=../../../../etc/passwd&limit=5')).resolves.toMatchObject({ status: 400 });
    await expect(requestPosts('?page=http://evil.test/shell.php&limit=5')).resolves.toMatchObject({ status: 400 });
  });

  it('rejects partial numeric page values', async () => {
    await expect(requestPosts('?page=2abc&limit=5')).resolves.toMatchObject({ status: 400 });
  });
});
