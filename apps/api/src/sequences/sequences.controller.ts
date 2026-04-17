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
import { SequencesService } from './sequences.service';
import type { EnrollLeadsResponse, SequenceListResponse } from './sequences.service';

@Controller('sequences')
@UseGuards(JwtAuthGuard, WorkspaceMembershipGuard)
export class SequencesController {
  constructor(private readonly sequencesService: SequencesService) {}

  @Post()
  @WorkspaceAccess()
  create(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Body() body: unknown,
  ) {
    return this.sequencesService.createSequence(workspace.workspaceId, body);
  }

  @Get()
  @WorkspaceAccess()
  list(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Query() query: unknown,
  ): Promise<SequenceListResponse> {
    return this.sequencesService.listSequences(workspace.workspaceId, query);
  }

  @Get(':sequenceId')
  @WorkspaceAccess()
  getById(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('sequenceId') sequenceId: string,
  ) {
    return this.sequencesService.getSequence(workspace.workspaceId, sequenceId);
  }

  @Patch(':sequenceId')
  @WorkspaceAccess()
  update(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('sequenceId') sequenceId: string,
    @Body() body: unknown,
  ) {
    return this.sequencesService.updateSequence(
      workspace.workspaceId,
      sequenceId,
      body,
    );
  }

  @Delete(':sequenceId')
  @WorkspaceAccess()
  async remove(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('sequenceId') sequenceId: string,
  ): Promise<{ success: true }> {
    await this.sequencesService.deleteSequence(workspace.workspaceId, sequenceId);
    return { success: true };
  }

  @Post(':sequenceId/steps')
  @WorkspaceAccess()
  createStep(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('sequenceId') sequenceId: string,
    @Body() body: unknown,
  ) {
    return this.sequencesService.createStep(workspace.workspaceId, sequenceId, body);
  }

  @Get(':sequenceId/steps')
  @WorkspaceAccess()
  listSteps(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('sequenceId') sequenceId: string,
  ) {
    return this.sequencesService.listSteps(workspace.workspaceId, sequenceId);
  }

  @Patch(':sequenceId/steps/:stepId')
  @WorkspaceAccess()
  updateStep(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('sequenceId') sequenceId: string,
    @Param('stepId') stepId: string,
    @Body() body: unknown,
  ) {
    return this.sequencesService.updateStep(
      workspace.workspaceId,
      sequenceId,
      stepId,
      body,
    );
  }

  @Delete(':sequenceId/steps/:stepId')
  @WorkspaceAccess()
  async removeStep(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('sequenceId') sequenceId: string,
    @Param('stepId') stepId: string,
  ): Promise<{ success: true }> {
    await this.sequencesService.deleteStep(
      workspace.workspaceId,
      sequenceId,
      stepId,
    );
    return { success: true };
  }

  @Post(':sequenceId/enroll')
  @WorkspaceAccess()
  enroll(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param('sequenceId') sequenceId: string,
    @Body() body: unknown,
  ): Promise<EnrollLeadsResponse> {
    return this.sequencesService.enrollLeads(workspace.workspaceId, sequenceId, body);
  }
}

