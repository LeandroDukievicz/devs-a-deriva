#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist/client');
const errors = [];
const checked = new Set();

// SSR endpoints: served at runtime but never generate static files in dist/
const SSR_PATHS = new Set(['/ai-index.json', '/sitemap.xml', '/rss.xml', '/busca']);

async function walk(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function stripQuery(value) {
  return value.split('?')[0].split('#')[0];
}

function isIgnored(value) {
  return /^(https?:)?\/\//i.test(value) ||
    /^(mailto|tel|data|javascript):/i.test(value) ||
    value.includes('${') ||
    value.startsWith('{') ||
    value === '#' ||
    SSR_PATHS.has(stripQuery(value));
}

function targetForLink(fromFile, raw) {
  const clean = stripQuery(raw);
  if (!clean) return null;
  if (clean.startsWith('/')) return join(DIST, clean);
  return normalize(join(dirname(fromFile), clean));
}

function existsAsStaticTarget(path) {
  if (existsSync(path)) return true;
  if (existsSync(`${path}.html`)) return true;
  if (existsSync(join(path, 'index.html'))) return true;
  return false;
}

function checkAnchor(html, raw, fromFile) {
  const anchor = raw.split('#')[1]?.split('?')[0];
  if (!anchor) return;
  const decoded = decodeURIComponent(anchor);
  if (new RegExp(`\\sid=["']${decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html)) return;
  if (new RegExp(`\\sname=["']${decoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i').test(html)) return;
  errors.push(`${relative(DIST, fromFile)}: ancora #${decoded} nao encontrada`);
}

const htmlFiles = await walk(DIST);
for (const file of htmlFiles) {
  const relFile = relative(DIST, file);
  if (['404.html', '500.html'].includes(relFile)) continue;

  const html = await readFile(file, 'utf8');
  const attrs = html.matchAll(/\s(?:href|src|action)=["']([^"']+)["']/gi);

  for (const match of attrs) {
    const raw = match[1].trim();
    if (!raw || isIgnored(raw)) continue;
    const key = `${relative(DIST, file)} -> ${raw}`;
    if (checked.has(key)) continue;
    checked.add(key);

    if (raw.startsWith('#')) {
      checkAnchor(html, raw, file);
      continue;
    }

    const target = targetForLink(file, raw);
    if (!target || !target.startsWith(DIST)) continue;
    if (!existsAsStaticTarget(target)) {
      errors.push(`${relative(DIST, file)}: link interno quebrado ${raw}`);
      continue;
    }

    if (raw.includes('#')) {
      const targetFile = existsSync(target)
        ? target
        : existsSync(`${target}.html`)
          ? `${target}.html`
          : join(target, 'index.html');
      if (targetFile.endsWith('.html')) {
        checkAnchor(await readFile(targetFile, 'utf8'), raw, targetFile);
      }
    }
  }
}

if (errors.length) {
  console.error('Broken link check falhou:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Broken link check OK: ${checked.size} links internos verificados.`);
