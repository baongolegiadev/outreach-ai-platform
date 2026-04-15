import { describe, it, expect } from 'vitest';
import { apiClient } from './lib/api-client';

describe('smoke', () => {
  it('runs Vitest in the web workspace', () => {
    expect(1 + 1).toBe(2);
  });

  it('apiClient is properly instantiated', () => {
    expect(apiClient).toBeDefined();
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
  });
});
