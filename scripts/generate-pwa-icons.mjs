#!/usr/bin/env node
/**
 * Gera os ícones do PWA a partir de public/helmet.svg.
 *
 * Rode com `npm run icons:pwa` sempre que o logo mudar. A saída é versionada
 * em public/icons/ — o build não depende deste script.
 *
 * Ícones `maskable` precisam de margem: o sistema operacional recorta o ícone
 * em círculo/squircle e só garante o círculo interno de 80%. Por isso o logo
 * ocupa MASKABLE_SCALE do quadrado, centralizado sobre o fundo do tema.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = join(ROOT, 'public', 'helmet.svg');
const OUT_DIR = join(ROOT, 'public', 'icons');

const BACKGROUND = '#020b18';
const ANY_SCALE = 0.88;
const MASKABLE_SCALE = 0.6;

/** Renderiza o logo centralizado num quadrado opaco de `size` pixels. */
async function render(size, scale) {
  const inner = Math.round(size * scale);
  const logo = await sharp(SOURCE).resize(inner, inner, { fit: 'contain' }).png().toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, scale: ANY_SCALE },
  { file: 'icon-512.png', size: 512, scale: ANY_SCALE },
  { file: 'icon-maskable-192.png', size: 192, scale: MASKABLE_SCALE },
  { file: 'icon-maskable-512.png', size: 512, scale: MASKABLE_SCALE },
  { file: 'apple-touch-icon.png', size: 180, scale: ANY_SCALE },
];

await mkdir(OUT_DIR, { recursive: true });

for (const { file, size, scale } of TARGETS) {
  await writeFile(join(OUT_DIR, file), await render(size, scale));
  console.log(`[icons:pwa] public/icons/${file} (${size}x${size})`);
}

console.log(`[icons:pwa] ${TARGETS.length} ícones gerados.`);
