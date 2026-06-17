import { describe, expect, it } from 'vitest';
import { parseTagIdsInput } from '@/lib/leads-api';

describe('parseTagIdsInput', () => {
  it('parses comma-separated tag ids', () => {
    expect(parseTagIdsInput('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('trims and removes empty values', () => {
    expect(parseTagIdsInput(' a, ,b ,, c ')).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for blank input', () => {
    expect(parseTagIdsInput('   ')).toEqual([]);
  });
});
