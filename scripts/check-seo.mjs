#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist/client');
const REQUIRED_PAGES = [
  '/',
  '/manifesto/',
  '/devs/',
  '/categorias/tech/',
  '/categorias/carreira/',
  '/categorias/livros/',
  '/categorias/musica/',
  '/categorias/noticias/',
  '/categorias/aleatoriedades/',
  '/termos/',
  '/privacidade/',
];

const errors = [];

function pageFile(route) {
  return route === '/' ? join(DIST, 'index.html') : join(DIST, route.replace(/^\/|\/$/g, ''), 'index.html');
}

function hasMeta(html, name) {
  return new RegExp(`<meta\\s+[^>]*(?:name|property)=["']${name}["'][^>]*content=["'][^"']+["'][^>]*>`, 'i').test(html);
}

function hasLink(html, rel) {
  return new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*href=["'][^"']+["'][^>]*>`, 'i').test(html);
}

for (const route of REQUIRED_PAGES) {
  const file = pageFile(route);
  if (!existsSync(file)) continue;
  const html = await readFile(file, 'utf8');
  const label = route;

  if (!/<title>[^<]{8,}<\/title>/i.test(html)) errors.push(`${label}: title ausente ou curto`);
  if (!hasMeta(html, 'description')) errors.push(`${label}: meta description ausente`);
  if (!hasLink(html, 'canonical')) errors.push(`${label}: canonical ausente`);
  if (!hasMeta(html, 'og:title')) errors.push(`${label}: og:title ausente`);
  if (!hasMeta(html, 'og:description')) errors.push(`${label}: og:description ausente`);
  if (!hasMeta(html, 'og:image')) errors.push(`${label}: og:image ausente`);
  if (!/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html)) errors.push(`${label}: JSON-LD ausente`);
}

for (const file of ['robots.txt', 'llms.txt', 'docs.json']) {
  if (!existsSync(join(DIST, file))) errors.push(`/${file}: arquivo ausente no build`);
}

if (errors.length) {
  console.error('SEO check falhou:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('SEO check OK.');
