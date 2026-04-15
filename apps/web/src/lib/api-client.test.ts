import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, ApiError } from './api-client';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.setAuthToken(null); // Reset auth token
  });

  describe('request method', () => {
    it('should make a GET request without auth token', async () => {
      const mockResponse = { data: 'test' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.get('/test');

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/v1/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should make a request with auth token when set', async () => {
      apiClient.setAuthToken('test-token');
      const mockResponse = { data: 'test' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiClient.get('/test');

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/v1/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      });
    });

    it('should throw ApiError on HTTP error', async () => {
      const errorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: [{ field: 'email' }],
        },
      };
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
      await expect(apiClient.get('/test')).rejects.toMatchObject({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: [{ field: 'email' }],
      });
    });
  });

  describe('convenience methods', () => {
    it('should make POST request', async () => {
      const mockResponse = { success: true };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.post('/test', { data: 'test' });

      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/v1/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});