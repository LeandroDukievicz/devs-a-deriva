import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchDevs, githubAvatarUrl, type Dev } from '../src/lib/devs';

function makeDev(name: string, overrides: Partial<Dev> = {}): Dev {
  return {
    name,
    role: 'Engenheiro',
    bio: `Bio de ${name}`,
    photoUrl: null,
    githubUrl: null,
    isOwner: false,
    ...overrides,
  };
}

describe('fetchDevs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns devs from API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ devs: [makeDev('Alice'), makeDev('Bob')] })));

    const devs = await fetchDevs();
    expect(devs).toHaveLength(2);
    expect(devs[0].name).toBe('Alice');
    expect(devs[1].name).toBe('Bob');
  });

  it('returns empty array when API returns empty devs list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ devs: [] })));

    await expect(fetchDevs()).resolves.toEqual([]);
  });

  it('returns empty array when API returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 500 })));

    await expect(fetchDevs()).resolves.toEqual([]);
  });

  it('returns empty array when network throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Network error'); }));

    await expect(fetchDevs()).resolves.toEqual([]);
  });

  it('returns empty array when response has no devs key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({})));

    await expect(fetchDevs()).resolves.toEqual([]);
  });

  it('only renders members returned by the API — revoked members absent from response are not shown', async () => {
    // The dashboard filters revoked members before responding.
    // The blog trusts the API and renders exactly what it receives.
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ devs: [makeDev('Alice')] })));

    const devs = await fetchDevs();
    expect(devs.map((d) => d.name)).toEqual(['Alice']);
    expect(devs.map((d) => d.name)).not.toContain('RevokedMember');
  });

  it('preserves all Dev fields from API response', async () => {
    const raw = makeDev('Charlie', {
      role: 'Designer',
      bio: 'Bio do Charlie',
      photoUrl: 'https://example.com/photo.jpg',
      githubUrl: 'https://github.com/charlie',
      isOwner: true,
    });
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ devs: [raw] })));

    const devs = await fetchDevs();
    expect(devs[0]).toMatchObject(raw);
  });
});

describe('githubAvatarUrl', () => {
  it('extracts avatar URL from a GitHub profile URL', () => {
    expect(githubAvatarUrl('https://github.com/alice')).toBe('https://github.com/alice.png?size=200');
  });

  it('handles GitHub URLs with trailing slash', () => {
    expect(githubAvatarUrl('https://github.com/alice/')).toBe('https://github.com/alice.png?size=200');
  });

  it('returns null for null input', () => {
    expect(githubAvatarUrl(null)).toBeNull();
  });

  it('returns null for an invalid URL string', () => {
    expect(githubAvatarUrl('not-a-url')).toBeNull();
  });

  it('returns null for empty username', () => {
    expect(githubAvatarUrl('https://github.com/')).toBeNull();
  });
});
