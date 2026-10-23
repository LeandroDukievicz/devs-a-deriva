import { afterEach, describe, expect, it, vi } from 'vitest';
import { shuffle } from '../src/lib/shuffle';

afterEach(() => vi.restoreAllMocks());

describe('carousel shuffle', () => {
  it('includes every article exactly once and preserves the chronological source', () => {
    const posts = Object.freeze(['newest', 'middle', 'oldest', 'archive']);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const shuffled = shuffle(posts);
    expect(shuffled).toEqual(['middle', 'oldest', 'archive', 'newest']);
    expect(new Set(shuffled)).toEqual(new Set(posts));
    expect(posts).toEqual(['newest', 'middle', 'oldest', 'archive']);
  });
  it('handles an empty catalog or a single article', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['only'])).toEqual(['only']);
  });
});
