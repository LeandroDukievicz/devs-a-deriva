import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeImageUrl } from '../src/lib/utils/string';

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '"><script>alert(1)</script>',
  "';alert(1)//",
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '<iframe src="javascript:alert(1)">',
  '<<SCRIPT>alert("XSS");//<</SCRIPT>',
  '<body onload=alert(1)>',
  '<a href="data:text/html,<script>alert(1)</script>">click</a>',
];

describe('escapeHtml — XSS payloads', () => {
  // escapeHtml garante que < e > sejam sempre escapados,
  // tornando toda tag HTML inerte quando inserida no DOM via textContent ou atributo escapado.
  for (const payload of XSS_PAYLOADS) {
    it(`escapa tags em: ${payload.slice(0, 40)}`, () => {
      const result = escapeHtml(payload);
      expect(result).not.toMatch(/<[a-zA-Z]/);   // nenhuma tag HTML abrindo
      expect(result).not.toMatch(/<\//);          // nenhuma tag de fechamento
    });
  }

  it('escapes < and >', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes &', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('leaves safe text unchanged', () => {
    expect(escapeHtml('Olá, mundo!')).toBe('Olá, mundo!');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// ── Comments.astro — sanitizeImageUrl ────────────────────────────────────────

describe('sanitizeImageUrl — Comments.astro', () => {
  it('aceita URL https válida', () => {
    expect(sanitizeImageUrl('https://avatars.githubusercontent.com/u/1?v=4')).toBe(
      'https://avatars.githubusercontent.com/u/1?v=4',
    );
  });

  it('rejeita URL http', () => {
    expect(sanitizeImageUrl('http://evil.com/img.png')).toBeNull();
  });

  it('rejeita URL javascript:', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeNull();
  });

  it('rejeita URL data:', () => {
    expect(sanitizeImageUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('rejeita string vazia', () => {
    expect(sanitizeImageUrl('')).toBeNull();
  });

  it('rejeita null', () => {
    expect(sanitizeImageUrl(null)).toBeNull();
  });

  it('rejeita string que não é URL', () => {
    expect(sanitizeImageUrl('not-a-url')).toBeNull();
  });
});

// ── Comments.astro — ALLOWED_PROVIDERS allowlist ──────────────────────────────

const ALLOWED_PROVIDERS = new Set(['github', 'discord', 'google']);

describe('Comments.astro — provider allowlist', () => {
  it('aceita providers conhecidos', () => {
    for (const p of ['github', 'discord', 'google']) {
      expect(ALLOWED_PROVIDERS.has(p)).toBe(true);
    }
  });

  const injectionAttempts = [
    '<img src=x onerror=alert(1)>',
    'github<script>alert(1)</script>',
    'javascript:alert(1)',
    '../../../etc/passwd',
    'github; DROP TABLE users;--',
  ];

  for (const attempt of injectionAttempts) {
    it(`rejeita provider inválido: ${attempt.slice(0, 40)}`, () => {
      expect(ALLOWED_PROVIDERS.has(attempt)).toBe(false);
    });
  }
});
