import { Request } from 'express';

export type WorkspaceRole = 'ADMIN' | 'MEMBER';

export interface JwtAuthPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface WorkspaceContext {
  workspaceId: string;
  role: WorkspaceRole;
}

export interface RequestWithAuth extends Request {
  user?: AuthenticatedUser;
  workspaceContext?: WorkspaceContext;
}
