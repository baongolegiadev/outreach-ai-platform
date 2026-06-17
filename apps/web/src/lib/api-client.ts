import { API_BASE_URL } from '@/lib/env';
import { getAuthSession } from '@/lib/auth-storage';
import { toReadableApiError } from '@/lib/api-errors';

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, auth = false, ...init } = options;
  const resolvedHeaders = new Headers(headers);
  resolvedHeaders.set('Content-Type', 'application/json');

  if (auth) {
    const session = getAuthSession();
    if (session?.accessToken) {
      resolvedHeaders.set('Authorization', `Bearer ${session.accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: init.method ?? 'GET',
    credentials: 'include',
    headers: resolvedHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(toReadableApiError(payload), response.status, payload);
  }

  return payload as T;
}
