import { apiRequest } from '@/lib/api-client';
import type { AuthSession } from '@/lib/auth-storage';

interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  workspace: {
    id: string;
    name: string;
    role: 'ADMIN' | 'MEMBER';
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  workspaceName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  workspaceId?: string;
}

function toSession(response: AuthResponse): AuthSession {
  return {
    accessToken: response.accessToken,
    expiresIn: response.expiresIn,
    workspaceId: response.workspace.id,
    workspaceName: response.workspace.name,
    workspaceRole: response.workspace.role,
    user: response.user,
  };
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
  return toSession(response);
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
  return toSession(response);
}

export async function logout(): Promise<void> {
  await apiRequest('/auth/logout', {
    method: 'POST',
    auth: true,
  });
}
