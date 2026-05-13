#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const errors = [];
const warnings = [];
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9_]{30,}\b/,
  /\b(?:password|passwd|secret|token|api_key)\s*=\s*['"][^'"]{12,}['"]/i,
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['node_modules', 'dist', '.git', 'test-results', 'lhci-report'].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

if (!existsSync(join(ROOT, '.env.example'))) {
  errors.push('.env.example ausente');
}

let tracked = '';
try {
  tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' });
} catch {
  warnings.push('nao foi possivel verificar arquivos rastreados pelo git');
}

for (const file of tracked.split('\n').filter(Boolean)) {
  if (/^\.env($|\.)/.test(file) && file !== '.env.example') {
    errors.push(`${file}: arquivo .env nao deve ser versionado`);
  }
}

const files = await walk(ROOT);
for (const file of files) {
  const rel = relative(ROOT, file);
  if (/\.(png|jpg|jpeg|webp|ico|svg|lock)$/i.test(rel)) continue;
  const content = await readFile(file, 'utf8').catch(() => '');
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`${rel}: possivel segredo encontrado`);
      break;
    }
  }
}

for (const warning of warnings) console.warn(`Aviso: ${warning}`);

if (errors.length) {
  console.error('Security check falhou:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Security check OK.');
