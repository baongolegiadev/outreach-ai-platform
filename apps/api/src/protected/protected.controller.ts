import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser, WorkspaceContext } from '../auth/auth.types';
import { CurrentWorkspace } from '../workspace-access/decorators/workspace-context.decorator';
import { RequireWorkspaceRoles } from '../workspace-access/decorators/require-workspace-roles.decorator';
import { WorkspaceAccess } from '../workspace-access/decorators/workspace-access.decorator';
import { WorkspaceMembershipGuard } from '../workspace-access/guards/workspace-membership.guard';
import { WorkspaceRoleGuard } from '../workspace-access/guards/workspace-role.guard';

@Controller('protected')
export class ProtectedController {
  @Get('workspace')
  @UseGuards(JwtAuthGuard, WorkspaceMembershipGuard)
  @WorkspaceAccess()
  workspaceScoped(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspace() workspace: WorkspaceContext,
  ) {
    return {
      message: 'Workspace membership verified',
      userId: user.id,
      workspaceId: workspace.workspaceId,
      role: workspace.role,
    };
  }

  @Get('workspaces/:workspaceId/admin')
  @UseGuards(JwtAuthGuard, WorkspaceMembershipGuard, WorkspaceRoleGuard)
  @WorkspaceAccess({ source: 'param', paramKey: 'workspaceId' })
  @RequireWorkspaceRoles('ADMIN')
  adminOnly(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @CurrentWorkspace() workspace: WorkspaceContext,
  ) {
    return {
      message: 'Admin-level workspace access verified',
      userId: user.id,
      workspaceId,
      role: workspace.role,
    };
  }
}
