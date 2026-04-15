import { z } from 'zod';

/**
 * Auth-related type definitions and schemas
 */

// User schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

// Workspace schema
export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['ADMIN', 'MEMBER']),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;

// Auth response schemas
export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number(),
  user: UserSchema,
  workspace: WorkspaceSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Register request schema
export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be less than 128 characters'),
  name: z.string().optional(),
  workspaceName: z.string().min(1, 'Workspace name is required'),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// Login request schema
export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  workspaceId: z.string().optional(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Auth state for the store
export interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}