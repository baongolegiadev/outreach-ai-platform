import { describe, expect, it } from 'vitest';
import { toReadableApiError } from '@/lib/api-errors';

describe('toReadableApiError', () => {
  it('returns envelope message when present', () => {
    expect(
      toReadableApiError({
        error: {
          message: 'Request validation failed',
        },
      }),
    ).toBe('Request validation failed');
  });

  it('falls back to generic message', () => {
    expect(toReadableApiError({})).toBe('Request failed. Please try again.');
  });
});
