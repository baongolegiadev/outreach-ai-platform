import { describe, expect, it } from 'vitest';
import {
  delayToMinutes,
  extractMergeFields,
  minutesToDelay,
  previewTemplate,
} from '@/lib/sequences-api';

describe('delay conversions', () => {
  it('converts hours/days to minutes', () => {
    expect(delayToMinutes(2, 'hours')).toBe(120);
    expect(delayToMinutes(1, 'days')).toBe(1440);
    expect(delayToMinutes(15, 'minutes')).toBe(15);
  });

  it('normalizes non-positive values', () => {
    expect(delayToMinutes(0, 'minutes')).toBe(0);
    expect(delayToMinutes(-3, 'days')).toBe(0);
  });

  it('picks a friendly unit for minutes', () => {
    expect(minutesToDelay(1440)).toEqual({ value: 1, unit: 'days' });
    expect(minutesToDelay(120)).toEqual({ value: 2, unit: 'hours' });
    expect(minutesToDelay(45)).toEqual({ value: 45, unit: 'minutes' });
  });
});

describe('merge fields', () => {
  it('extracts unique merge fields', () => {
    expect(extractMergeFields('Hi {{first_name}} at {{company}} {{first_name}}')).toEqual(
      ['first_name', 'company'],
    );
  });

  it('previews supported merge fields', () => {
    expect(
      previewTemplate('Hello {{first_name}} from {{company}}', {
        first_name: 'Jane',
        company: 'Acme',
      }),
    ).toBe('Hello Jane from Acme');
  });
});

