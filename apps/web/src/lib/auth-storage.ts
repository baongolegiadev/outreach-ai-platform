const AUTH_STORAGE_KEY = 'oap_auth_session';
export const AUTH_COOKIE_KEY = 'oap_access_token';

export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  workspaceId: string;
  workspaceName: string;
  workspaceRole: 'ADMIN' | 'MEMBER';
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined';
}

export function getAuthSession(): AuthSession | null {
  if (!canUseBrowserStorage()) {
    return null;
  }
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }
  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(session.accessToken)}; Path=/; SameSite=Lax; Max-Age=${session.expiresIn}; ${isSecure ? 'Secure;' : ''}`;
}

export function clearAuthSession(): void {
  if (!canUseBrowserStorage()) {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
