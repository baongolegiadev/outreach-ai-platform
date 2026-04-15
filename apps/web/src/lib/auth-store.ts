import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { AuthState, AuthResponse, User, Workspace } from './auth-types';
import { apiClient } from './api-client';

const TOKEN_COOKIE_KEY = 'auth_token';
const TOKEN_COOKIE_OPTIONS = {
  expires: 30, // 30 days
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  httpOnly: false, // We need to read it in the browser
};

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string, workspaceId?: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name?: string;
    workspaceName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      workspace: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (email: string, password: string, workspaceId?: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<AuthResponse>('/auth/login', {
            email,
            password,
            workspaceId,
          });

          const { accessToken, user, workspace } = response;

          // Store token in cookie
          Cookies.set(TOKEN_COOKIE_KEY, accessToken, TOKEN_COOKIE_OPTIONS);

          // Set token in API client
          apiClient.setAuthToken(accessToken);

          // Update state
          set({
            user,
            workspace,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post<AuthResponse>('/auth/register', data);

          const { accessToken, user, workspace } = response;

          // Store token in cookie
          Cookies.set(TOKEN_COOKIE_KEY, accessToken, TOKEN_COOKIE_OPTIONS);

          // Set token in API client
          apiClient.setAuthToken(accessToken);

          // Update state
          set({
            user,
            workspace,
            token: accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint if authenticated
          if (get().isAuthenticated) {
            await apiClient.post('/auth/logout');
          }
        } catch (error) {
          // Ignore logout errors
          console.warn('Logout API call failed:', error);
        } finally {
          // Clear token from cookie
          Cookies.remove(TOKEN_COOKIE_KEY);

          // Clear token from API client
          apiClient.setAuthToken(null);

          // Clear state
          set({
            user: null,
            workspace: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      refreshAuth: () => {
        const token = Cookies.get(TOKEN_COOKIE_KEY);
        if (token) {
          apiClient.setAuthToken(token);
          // Note: In a real app, you might want to validate the token
          // For now, we'll assume it's valid if it exists
          set({
            token,
            isAuthenticated: true,
            // user and workspace would need to be restored from token or separate storage
            // For simplicity, we'll keep them null and let the app redirect to login
          });
        }
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist user and workspace, not token (token is in cookie)
      partialize: (state) => ({
        user: state.user,
        workspace: state.workspace,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on app start
if (typeof window !== 'undefined') {
  useAuthStore.getState().refreshAuth();
}