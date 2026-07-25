import { describe, expect, it } from 'vitest';
import { isPositiveIntegerString, parsePositiveInteger } from '../src/lib/post-listing';

describe('parsePositiveInteger', () => {
  it('accepts only positive decimal integers', () => {
    expect(parsePositiveInteger('1', 99)).toBe(1);
    expect(parsePositiveInteger('25', 99)).toBe(25);
    expect(parsePositiveInteger(' 3 ', 99)).toBe(3);
  });

  it('rejects partial numeric input instead of accepting parseInt prefixes', () => {
    expect(parsePositiveInteger('1.php', 99)).toBe(99);
    expect(parsePositiveInteger('2abc', 99)).toBe(99);
    expect(parsePositiveInteger('2.5', 99)).toBe(99);
  });

  it('rejects shell, traversal, and remote include style payloads', () => {
    expect(parsePositiveInteger('<?php system($_GET["c"]); ?>', 99)).toBe(99);
    expect(parsePositiveInteger('../../../../etc/passwd', 99)).toBe(99);
    expect(parsePositiveInteger('http://evil.test/shell.php', 99)).toBe(99);
  });

  it('rejects non-positive and missing values', () => {
    expect(parsePositiveInteger(null, 99)).toBe(99);
    expect(parsePositiveInteger('', 99)).toBe(99);
    expect(parsePositiveInteger('0', 99)).toBe(99);
    expect(parsePositiveInteger('-1', 99)).toBe(99);
    expect(parsePositiveInteger('+1', 99)).toBe(99);
  });
});

describe('isPositiveIntegerString', () => {
  it('identifies safe positive decimal integers', () => {
    expect(isPositiveIntegerString('1')).toBe(true);
    expect(isPositiveIntegerString('25')).toBe(true);
    expect(isPositiveIntegerString(' 3 ')).toBe(true);
  });

  it('rejects unsafe or non-decimal values', () => {
    expect(isPositiveIntegerString('1.php')).toBe(false);
    expect(isPositiveIntegerString('<?php phpinfo(); ?>')).toBe(false);
    expect(isPositiveIntegerString('999999999999999999999999999999')).toBe(false);
  });
});
