import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithAuth } from '../../auth/auth.types';
import type { WorkspaceRole } from '../../auth/auth.types';
import { WORKSPACE_ROLE_META_KEY } from '../workspace-access.constants';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<WorkspaceRole[]>(
        WORKSPACE_ROLE_META_KEY,
        context.getHandler(),
      ) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const role = request.workspaceContext?.role;
    if (!role) {
      throw new ForbiddenException('Workspace role context is missing');
    }

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient workspace role');
    }

    return true;
  }
}
