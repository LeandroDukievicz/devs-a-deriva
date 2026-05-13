#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TARGETS = ['src', 'scripts', 'tests', '.github'];
const EXTENSIONS = new Set(['.astro', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.yml', '.yaml', '.json']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', 'test-results', 'lhci-report']);

const errors = [];

async function walk(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
      continue;
    }
    const ext = entry.name.slice(entry.name.lastIndexOf('.'));
    if (EXTENSIONS.has(ext)) files.push(path);
  }
  return files;
}

function checkFile(path, content) {
  const rel = relative(ROOT, path);

  const conflictStart = '<'.repeat(7);
  const conflictMiddle = '='.repeat(7);
  const conflictEnd = '>'.repeat(7);

  if (content.includes(conflictStart) || content.includes(conflictMiddle) || content.includes(conflictEnd)) {
    errors.push(`${rel}: contem marcador de conflito Git`);
  }

  if (/\r\n?/.test(content)) {
    errors.push(`${rel}: use LF em vez de CRLF`);
  }

  if (!content.endsWith('\n')) {
    errors.push(`${rel}: arquivo deve terminar com newline`);
  }

  if (/\bTODO_PASSWORD\b|\bCHANGEME_SECRET\b/.test(content)) {
    errors.push(`${rel}: placeholder sensivel deve ser removido ou documentado`);
  }
}

const files = (await Promise.all(TARGETS.map((target) => walk(join(ROOT, target))))).flat();

for (const file of files) {
  const content = await readFile(file, 'utf8');
  checkFile(file, content);
}

if (errors.length) {
  console.error('Lint encontrou problemas:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Lint OK: ${files.length} arquivos verificados.`);
