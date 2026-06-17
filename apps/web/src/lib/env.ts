const fallbackApiBaseUrl = 'http://localhost:3001';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? fallbackApiBaseUrl;
