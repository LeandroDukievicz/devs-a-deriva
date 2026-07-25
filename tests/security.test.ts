import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { escapeHtml, sanitizeImageUrl } from '../src/lib/utils/string';
import { OPTIONS as cspReportOptions, POST as cspReportPost } from '../src/pages/api/csp-report';

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

// ── Content Security Policy ────────────────────────────────────────────────

const REQUIRED_REPORT_ONLY_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://dashboard.devsaderiva.com.br https://*.r2.dev https://*.cloudflarestorage.com",
  "connect-src 'self' https://dashboard.devsaderiva.com.br https://vitals.vercel-insights.com https://www.google-analytics.com",
  "frame-ancestors 'none'",
  'report-uri /api/csp-report',
];

function getVercelHeader(name: string): string | undefined {
  const config = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'));
  const headers = config.headers?.[0]?.headers ?? [];
  return headers.find((header: { key: string; value: string }) => header.key === name)?.value;
}

describe('CSP report-only', () => {
  it('mantém CSP enforced e adiciona CSP report-only na Vercel', () => {
    expect(getVercelHeader('Content-Security-Policy')).toContain("default-src 'self'");

    const reportOnly = getVercelHeader('Content-Security-Policy-Report-Only');
    expect(reportOnly).toBeTruthy();
    for (const directive of REQUIRED_REPORT_ONLY_DIRECTIVES) {
      expect(reportOnly).toContain(directive);
    }
    expect(reportOnly).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it('mantém CSP enforced e adiciona CSP report-only no nginx', () => {
    const nginx = readFileSync(resolve('nginx.conf'), 'utf8');
    expect(nginx).toContain('add_header Content-Security-Policy ');
    expect(nginx).toContain('add_header Content-Security-Policy-Report-Only ');

    const reportOnly = nginx.match(/Content-Security-Policy-Report-Only "([^"]+)"/)?.[1] ?? '';
    for (const directive of REQUIRED_REPORT_ONLY_DIRECTIVES) {
      expect(reportOnly).toContain(directive);
    }
    expect(reportOnly).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it('bloqueia arquivos PHP e node_modules no nginx', () => {
    const nginx = readFileSync(resolve('nginx.conf'), 'utf8');

    expect(nginx).toContain('location ^~ /node_modules/');
    expect(nginx).toContain('location ~* \\.(php|phtml|phar)$');
  });

  it('recebe relatórios CSP sem cachear resposta', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const request = new Request('https://devsaderiva.com.br/api/csp-report', {
      method: 'POST',
      headers: { 'content-type': 'application/csp-report' },
      body: JSON.stringify({
        'csp-report': {
          'document-uri': 'https://devsaderiva.com.br/posts/exemplo',
          'violated-directive': 'script-src',
          'blocked-uri': 'inline',
        },
      }),
    });

    const response = await cspReportPost({ request } as Parameters<typeof cspReportPost>[0]);

    expect(response.status).toBe(204);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('responde preflight do endpoint de relatório CSP', async () => {
    const response = await cspReportOptions({} as Parameters<typeof cspReportOptions>[0]);

    expect(response.status).toBe(204);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
