import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

const manifest = JSON.parse(read('public/manifest.webmanifest'));
const baseLayout = read('src/layouts/Base.astro');

// ── Manifesto ────────────────────────────────────────────────────────────────

describe('manifest.webmanifest', () => {
  it('declara os campos que o navegador exige pra oferecer a instalação', () => {
    expect(manifest.name).toBe('Devs à Deriva');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.lang).toBe('pt-BR');
  });

  it('usa as cores do tema Órbita Baixa', () => {
    expect(manifest.background_color).toBe('#020b18');
    expect(manifest.theme_color).toBe('#020b18');
  });

  it('traz ícones 192 e 512 em PNG — o mínimo pra instalar no Android', () => {
    const png = manifest.icons.filter(
      (icon: { type: string; purpose: string }) => icon.type === 'image/png' && icon.purpose === 'any',
    );
    expect(png.map((icon: { sizes: string }) => icon.sizes).sort()).toEqual(['192x192', '512x512']);
  });

  it('traz ícones maskable, que o Android recorta sem cortar o logo', () => {
    const maskable = manifest.icons.filter(
      (icon: { purpose: string }) => icon.purpose === 'maskable',
    );
    expect(maskable.map((icon: { sizes: string }) => icon.sizes).sort()).toEqual([
      '192x192',
      '512x512',
    ]);
  });

  it('aponta só para arquivos que existem em public/', () => {
    const sources: string[] = [
      ...manifest.icons.map((icon: { src: string }) => icon.src),
      ...manifest.shortcuts.flatMap((shortcut: { icons?: { src: string }[] }) =>
        (shortcut.icons ?? []).map((icon) => icon.src),
      ),
    ];

    for (const src of sources) {
      expect(existsSync(resolve(`public${src}`)), `${src} ausente em public/`).toBe(true);
    }
  });

  it('mantém os atalhos dentro do escopo do app', () => {
    for (const shortcut of manifest.shortcuts) {
      expect(shortcut.url.startsWith(manifest.scope)).toBe(true);
    }
  });
});

// ── Service worker ───────────────────────────────────────────────────────────
// O comportamento do sw.js é exercitado em tests/service-worker.test.ts.

describe('service worker', () => {
  it('existe junto com a página de fallback offline', () => {
    expect(existsSync(resolve('public/sw.js'))).toBe(true);
    expect(existsSync(resolve('public/offline.html'))).toBe(true);
  });
});

describe('offline.html', () => {
  const offline = read('public/offline.html');

  it('não é indexável', () => {
    expect(offline).toMatch(/<meta name="robots" content="noindex/);
  });

  it('não depende de JavaScript nem de CSS externo — sem rede nada disso carrega', () => {
    expect(offline).not.toMatch(/<script/i);
    expect(offline).not.toMatch(/<link[^>]+rel="stylesheet"/i);
    expect(offline).toMatch(/<style>/);
  });
});

// ── Integração no layout e nas políticas de segurança ────────────────────────

describe('Base.astro', () => {
  it('liga o manifesto, o theme-color e o ícone do iOS', () => {
    expect(baseLayout).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(baseLayout).toContain('<meta name="theme-color" content="#020b18" />');
    expect(baseLayout).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />');
  });

  it('renderiza o convite de instalação', () => {
    expect(baseLayout).toContain('<PwaInstall />');
  });
});

describe('CSP — service worker e manifesto', () => {
  it('libera worker-src e manifest-src na Vercel e no nginx', () => {
    for (const file of ['vercel.json', 'nginx.conf']) {
      const content = read(file);
      // Uma vez na política aplicada e outra na report-only.
      expect(content.match(/worker-src 'self'/g)).toHaveLength(2);
      expect(content.match(/manifest-src 'self'/g)).toHaveLength(2);
    }
  });

  it('mantém o script-src como primeira diretiva depois do default-src', () => {
    // scripts/update-csp-hashes.mjs reescreve exatamente esse trecho no postbuild.
    expect(read('vercel.json')).toMatch(
      /"Content-Security-Policy",\s*"value": "default-src 'self'; script-src [^;]+;/,
    );
    expect(read('nginx.conf')).toMatch(
      /add_header Content-Security-Policy "default-src 'self'; script-src [^;]+;/,
    );
  });

  it('evita que o sw.js fique preso em cache longo na Vercel', () => {
    const rule = JSON.parse(read('vercel.json')).headers.find(
      (entry: { source: string }) => entry.source === '/sw.js',
    );
    expect(rule).toBeDefined();
    expect(
      rule.headers.find((header: { key: string }) => header.key === 'Cache-Control').value,
    ).toContain('max-age=0');
  });
});
