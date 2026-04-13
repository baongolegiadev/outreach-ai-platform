import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { RequestWithAuth, WorkspaceContext } from '../../auth/auth.types';

export const CurrentWorkspace = createParamDecorator(
  (_: unknown, context: ExecutionContext): WorkspaceContext => {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    if (!request.workspaceContext) {
      throw new ForbiddenException(
        'Workspace context is missing on this route',
      );
    }
    return request.workspaceContext;
  },
);
