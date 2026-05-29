/**
 * Post-build script: extracts inline script hashes from all pre-rendered HTML
 * files in dist/client/ and writes them into vercel.json and nginx.conf.
 *
 * Run automatically via `npm run build` (see package.json postbuild).
 *
 * Why needed: Astro inlines bundled module scripts in static pages for
 * performance. Each build produces different hashes, so they can't be
 * hard-coded. This script re-derives them after every build.
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist', 'client');

// --- collect hashes from all built HTML files ---

function walk(dir, cb) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else if (entry.name.endsWith('.html')) cb(full);
  }
}

function extractHashes(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const hashes = new Set();
  for (const [, attrs, content] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!content.trim()) continue;
    if (attrs.includes('application/json') || attrs.includes('ld+json')) continue;
    if (!attrs.includes('src=')) {
      hashes.add(
        "'sha256-" + createHash('sha256').update(content).digest('base64') + "'"
      );
    }
  }
  return hashes;
}

const allHashes = new Set();
try {
  walk(DIST, (file) => {
    for (const h of extractHashes(file)) allHashes.add(h);
  });
} catch (err) {
  console.error('[update-csp-hashes] Could not read dist/client — run npm run build first.');
  process.exit(1);
}

const hashList = [...allHashes].sort().join(' ');
console.log(`[update-csp-hashes] Found ${allHashes.size} inline script hashes.`);

// --- build the new script-src value ---

const EXTERNAL_SOURCES = "https://www.googletagmanager.com https://va.vercel-scripts.com";
const SCRIPT_SRC = `'self' ${hashList} ${EXTERNAL_SOURCES}`;

// --- update vercel.json ---

const vercelPath = join(ROOT, 'vercel.json');
let vercel = readFileSync(vercelPath, 'utf8');
vercel = vercel.replace(
  /("Content-Security-Policy",\s*"value":\s*"default-src 'self'; script-src )[^;]+(;)/,
  `$1${SCRIPT_SRC}$2`
);
writeFileSync(vercelPath, vercel, 'utf8');
console.log('[update-csp-hashes] vercel.json updated.');

// --- update nginx.conf ---

const nginxPath = join(ROOT, 'nginx.conf');
let nginx = readFileSync(nginxPath, 'utf8');
nginx = nginx.replace(
  /(add_header Content-Security-Policy "default-src 'self'; script-src )[^;]+(;)/,
  `$1${SCRIPT_SRC}$2`
);
writeFileSync(nginxPath, nginx, 'utf8');
console.log('[update-csp-hashes] nginx.conf updated.');
