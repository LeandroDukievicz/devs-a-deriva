const RETRY_DELAYS_MS = import.meta.env.PROD ? [100, 250] as const : [500, 1000, 2000] as const;
const PER_ATTEMPT_TIMEOUT_MS = import.meta.env.PROD ? 750 : 5_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
    }
  }
  throw lastError;
}
