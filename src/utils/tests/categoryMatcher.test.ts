import { describe, it, expect } from 'vitest';
import { matchCategory } from '../categoryMatcher';

describe('categoryMatcher', () => {
  it('matches exact category names', () => {
    expect(matchCategory('Documents')).toBe('Documents');
    expect(matchCategory('health')).toBe('Health');
    expect(matchCategory('CONTACTS')).toBe('Contacts');
  });

  it('matches common synonyms and tokens', () => {
    expect(matchCategory('docs')).toBe('Documents');
    expect(matchCategory('file')).toBe('Documents');
    expect(matchCategory('medical')).toBe('Health');
    expect(matchCategory('budget')).toBe('Finance');
    expect(matchCategory('friends')).toBe('Contacts');
    expect(matchCategory('personal')).toBe('Personal');
  });

  it('extracts category from sentences with whole words', () => {
    expect(matchCategory('please put this in the finance category')).toBe('Finance');
    expect(matchCategory('these are my personal notes')).toBe('Personal');
    expect(matchCategory('save under contacts list')).toBe('Contacts');
  });

  it('avoids over-permissive matches (e.g., person != personal)', () => {
    expect(matchCategory('person')).toBe(null);
  });

  it('returns null when ambiguous', () => {
    // Contacts and Personal have equal scores; choosing either would be arbitrary.
    expect(matchCategory('docs and contacts and personal')).toBe(null);
  });
});
