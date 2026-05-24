import { describe, expect, it } from 'vitest';
import { ALLOWED_PROVIDERS, providerIconSvg } from '../src/lib/comments';
import { initials } from '../src/lib/utils/string';

describe('ALLOWED_PROVIDERS', () => {
  it('contains github, discord and google', () => {
    expect(ALLOWED_PROVIDERS.has('github')).toBe(true);
    expect(ALLOWED_PROVIDERS.has('discord')).toBe(true);
    expect(ALLOWED_PROVIDERS.has('google')).toBe(true);
  });

  it('does not contain unknown providers', () => {
    expect(ALLOWED_PROVIDERS.has('twitter')).toBe(false);
    expect(ALLOWED_PROVIDERS.has('<img src=x>')).toBe(false);
    expect(ALLOWED_PROVIDERS.has('')).toBe(false);
  });
});

describe('providerIconSvg', () => {
  it('returns non-empty SVG string for github', () => {
    const svg = providerIconSvg('github');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('returns non-empty SVG string for discord', () => {
    const svg = providerIconSvg('discord');
    expect(svg).toContain('<svg');
    expect(svg).toContain('#5865F2');
  });

  it('returns non-empty SVG string for google', () => {
    const svg = providerIconSvg('google');
    expect(svg).toContain('<svg');
    expect(svg).toContain('#4285F4');
  });

  it('returns empty string for unknown provider', () => {
    expect(providerIconSvg('twitter')).toBe('');
    expect(providerIconSvg('')).toBe('');
    expect(providerIconSvg('<script>alert(1)</script>')).toBe('');
  });
});

describe('initials (used for comment avatars)', () => {
  it('returns first two initials uppercased', () => {
    expect(initials('João Silva')).toBe('JS');
    expect(initials('Maria')).toBe('M');
    expect(initials('Ana Paula Rocha')).toBe('AP');
  });

  it('handles multiple spaces between words', () => {
    expect(initials('João   Silva')).toBe('JS');
  });

  it('returns empty string for empty input', () => {
    expect(initials('')).toBe('');
  });
});
