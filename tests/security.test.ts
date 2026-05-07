import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/lib/posts';

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
