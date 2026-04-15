import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { WorkspaceContext } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspace } from '../workspace-access/decorators/workspace-context.decorator';
import { WorkspaceAccess } from '../workspace-access/decorators/workspace-access.decorator';
import { WorkspaceMembershipGuard } from '../workspace-access/guards/workspace-membership.guard';
import { LeadsService } from './leads.service';
import type { LeadListResponse, LeadResponse } from './leads.service';

@Controller('leads')
@UseGuards(JwtAuthGuard, WorkspaceMembershipGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @WorkspaceAccess()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() body: unknown,
  ): Promise<LeadResponse> {
    return this.leadsService.create(workspace.workspaceId, body);
  }

  @Get()
  @WorkspaceAccess()
  list(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Query() query: unknown,
  ): Promise<LeadListResponse> {
    return this.leadsService.list(workspace.workspaceId, query);
  }

  @Get(':leadId')
  @WorkspaceAccess()
  getById(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('leadId') leadId: string,
  ): Promise<LeadResponse> {
    return this.leadsService.getById(workspace.workspaceId, leadId);
  }

  @Patch(':leadId')
  @WorkspaceAccess()
  update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('leadId') leadId: string,
    @Body() body: unknown,
  ): Promise<LeadResponse> {
    return this.leadsService.update(workspace.workspaceId, leadId, body);
  }

  @Delete(':leadId')
  @WorkspaceAccess()
  remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('leadId') leadId: string,
  ): Promise<{ success: true }> {
    return this.leadsService.remove(workspace.workspaceId, leadId);
  }
}
