import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry } from '../src/lib/api';

function okResponse(body = '{}') {
  return new Response(body, { status: 200 });
}

function serverError() {
  return new Response('error', { status: 500 });
}

function clientError() {
  return new Response('not found', { status: 404 });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchWithRetry', () => {
  it('returns the response on first successful attempt', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => okResponse()));

    const promise = fetchWithRetry('http://example.com');
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('retries on network error and returns response on second attempt', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls++;
        if (calls === 1) throw new Error('Network error');
        return okResponse();
      }),
    );

    const promise = fetchWithRetry('http://example.com');
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(calls).toBe(2);
  });

  it('retries on 5xx and returns response on third attempt', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls++;
        if (calls < 3) return serverError();
        return okResponse();
      }),
    );

    const promise = fetchWithRetry('http://example.com');
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(calls).toBe(3);
  });

  it('does not retry on 4xx — returns response immediately', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => clientError()));

    const promise = fetchWithRetry('http://example.com');
    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(404);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting all retries', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('always fails'); }));

    const check = expect(fetchWithRetry('http://example.com')).rejects.toThrow('always fails');
    await vi.runAllTimersAsync();
    await check;

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(4);
  });

  it('throws after 4 attempts when server returns 5xx every time', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => serverError()));

    const check = expect(fetchWithRetry('http://example.com')).rejects.toThrow('HTTP 500');
    await vi.runAllTimersAsync();
    await check;

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(4);
  });
});
