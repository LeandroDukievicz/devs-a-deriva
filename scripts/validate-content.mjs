#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIRS = ['src/content', 'content', 'posts'];
const ALLOWED_CATEGORIES = new Set(['tech', 'carreira', 'livros', 'musica', 'aleatoriedades', 'noticias']);
const VALID_STATUS = new Set(['draft', 'published']);
const errors = [];
const warnings = [];

async function walk(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (['.md', '.mdx'].includes(extname(entry.name))) files.push(path);
  }
  return files;
}

function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) return { data: {}, hasFrontmatter: false };
  const end = normalized.indexOf('\n---', 4);
  if (end === -1) return { data: {}, hasFrontmatter: false };

  const raw = normalized.slice(4, end).split('\n');
  const data = {};
  for (const line of raw) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    const clean = value.replace(/^['"]|['"]$/g, '').trim();
    if (clean === 'true') data[key] = true;
    else if (clean === 'false') data[key] = false;
    else data[key] = clean;
  }
  return { data, hasFrontmatter: true };
}

function isPublished(data) {
  if (data.status) return data.status === 'published';
  if (data.published === true) return true;
  if (data.publicado === true) return true;
  return false;
}

function isValidDate(value) {
  if (!value) return true;
  return !Number.isNaN(new Date(value).getTime());
}

const files = (await Promise.all(CONTENT_DIRS.map((dir) => walk(join(ROOT, dir))))).flat();
const slugs = new Map();

for (const file of files) {
  const rel = relative(ROOT, file);
  const content = await readFile(file, 'utf8');
  const { data, hasFrontmatter } = parseFrontmatter(content);

  if (!hasFrontmatter) {
    warnings.push(`${rel}: sem frontmatter; tratado como draft`);
    continue;
  }

  const status = data.status ?? 'draft';
  if (data.status && !VALID_STATUS.has(data.status)) {
    errors.push(`${rel}: status invalido "${data.status}". Use draft ou published.`);
  }

  const slug = typeof data.slug === 'string' ? data.slug.trim() : '';
  if (slug) {
    if (slugs.has(slug)) errors.push(`${rel}: slug duplicado "${slug}" tambem usado em ${slugs.get(slug)}`);
    else slugs.set(slug, rel);
  }

  if (data.category && !ALLOWED_CATEGORIES.has(data.category)) {
    errors.push(`${rel}: categoria invalida "${data.category}"`);
  }

  for (const field of ['date', 'publishedAt', 'updatedAt']) {
    if (!isValidDate(data[field])) errors.push(`${rel}: ${field} invalida "${data[field]}"`);
  }

  if (!isPublished(data)) continue;

  if (!slug) errors.push(`${rel}: post published precisa de slug`);
  if (!data.title) errors.push(`${rel}: post published precisa de title`);
  if (!data.description && !data.excerpt && !data.summary) {
    errors.push(`${rel}: post published precisa de description, excerpt ou summary`);
  }
}

for (const warning of warnings) console.warn(`Aviso: ${warning}`);

if (errors.length) {
  console.error('Validacao de conteudo falhou:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(files.length ? `Conteudo OK: ${files.length} arquivos verificados.` : 'Conteudo OK: nenhum markdown local para validar.');
