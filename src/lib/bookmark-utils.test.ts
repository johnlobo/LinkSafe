import { describe, expect, it } from 'vitest';

import { collectMetadataValues, isHttpUrl, normalizeMetadataValues } from './bookmark-utils';

describe('isHttpUrl', () => {
  it.each([
    'https://example.com',
    'http://localhost:3000/path',
  ])('accepts web URL %s', (value) => {
    expect(isHttpUrl(value)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/plain,hello',
    'file:///tmp/example',
    'ftp://example.com',
    'not a URL',
  ])('rejects non-HTTP URL %s', (value) => {
    expect(isHttpUrl(value)).toBe(false);
  });
});

describe('normalizeMetadataValues', () => {
  it('trims values and removes case-insensitive duplicates', () => {
    expect(normalizeMetadataValues([' React ', 'react', 'TypeScript'])).toEqual([
      'React',
      'TypeScript',
    ]);
  });

  it('preserves the spelling already used by the current user', () => {
    expect(normalizeMetadataValues(['react', ' NEW '], ['React', 'Existing'])).toEqual([
      'React',
      'NEW',
    ]);
  });

  it('drops empty values', () => {
    expect(normalizeMetadataValues(['', '   ', 'Useful'])).toEqual(['Useful']);
  });
});

describe('collectMetadataValues', () => {
  it('returns a case-insensitive sorted unique collection', () => {
    expect(collectMetadataValues(['zeta', 'Alpha', 'alpha', ' beta '])).toEqual([
      'Alpha',
      'beta',
      'zeta',
    ]);
  });
});
