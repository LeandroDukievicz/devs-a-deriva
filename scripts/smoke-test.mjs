#!/usr/bin/env node
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:4321').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 8000);

const routes = [
  '/',
  '/manifesto/',
  '/devs/',
  '/categorias/tech/',
  '/categorias/carreira/',
  '/sitemap.xml',
  '/robots.txt',
  '/health.json',
];

const errors = [];

async function request(path) {
  const url = `${BASE_URL}${path}`;
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    const elapsed = Math.round(performance.now() - started);
    const ok = res.status >= 200 && res.status < 400;
    console.log(`${ok ? 'OK ' : 'ERR'} ${path} -> ${res.status} (${elapsed}ms)`);
    if (!ok) errors.push(`${path}: HTTP ${res.status}`);
    return { res, elapsed };
  } catch (error) {
    const elapsed = Math.round(performance.now() - started);
    console.log(`ERR ${path} -> ${error.name ?? 'Error'} (${elapsed}ms)`);
    errors.push(`${path}: ${error.message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

for (const route of routes) {
  const result = await request(route);
  if (route === '/health.json' && result?.res?.ok) {
    const data = await result.res.json().catch(() => null);
    if (data?.status !== 'ok' || data?.app !== 'devs-a-deriva') {
      errors.push('/health.json: payload invalido');
    }
  }
}

const home = await fetch(`${BASE_URL}/`).then((res) => res.text()).catch(() => '');
const assetMatches = [...home.matchAll(/\s(?:src|href)=["'](\/(?:_astro|logo|helmet|favicon)[^"']+)["']/g)]
  .map((match) => match[1])
  .slice(0, 5);

for (const asset of assetMatches) {
  await request(asset);
}

if (errors.length) {
  console.error('Smoke test falhou:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Smoke test OK em ${BASE_URL}`);
