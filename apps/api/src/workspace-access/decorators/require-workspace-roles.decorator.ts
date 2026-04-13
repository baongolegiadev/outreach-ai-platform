import { SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '../../auth/auth.types';
import { WORKSPACE_ROLE_META_KEY } from '../workspace-access.constants';

export const RequireWorkspaceRoles = (
  ...roles: WorkspaceRole[]
): MethodDecorator => SetMetadata(WORKSPACE_ROLE_META_KEY, roles);
