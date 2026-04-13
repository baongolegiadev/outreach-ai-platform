import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithAuth } from '../../auth/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import {
  WORKSPACE_ACCESS_META_KEY,
  WorkspaceAccessMeta,
} from '../workspace-access.constants';

@Injectable()
export class WorkspaceMembershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    if (!request.user) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    const meta =
      this.reflector.get<WorkspaceAccessMeta>(
        WORKSPACE_ACCESS_META_KEY,
        context.getHandler(),
      ) ?? {};
    const workspaceId = this.resolveWorkspaceId(request, meta);

    if (!workspaceId) {
      throw new ForbiddenException('Workspace context is required');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: request.user.id,
          workspaceId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    request.workspaceContext = {
      workspaceId,
      role: membership.role,
    };
    return true;
  }

  private resolveWorkspaceId(
    request: RequestWithAuth,
    meta: WorkspaceAccessMeta,
  ): string | null {
    const source = meta.source ?? 'header';
    if (source === 'param') {
      const paramKey = meta.paramKey ?? 'workspaceId';
      const value = request.params[paramKey];
      return typeof value === 'string' && value.length > 0 ? value : null;
    }

    const headerName = (meta.headerName ?? 'x-workspace-id').toLowerCase();
    const raw = request.headers[headerName];
    if (Array.isArray(raw)) {
      return raw[0] ?? null;
    }
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  }
}
