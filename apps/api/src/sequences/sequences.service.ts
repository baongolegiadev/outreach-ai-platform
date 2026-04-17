import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSequenceDto,
  CreateSequenceStepDto,
  EnrollLeadsDto,
  ListSequencesDto,
  UpdateSequenceDto,
  UpdateSequenceStepDto,
  createSequenceSchema,
  createSequenceStepSchema,
  enrollLeadsSchema,
  listSequencesSchema,
  sequenceIdSchema,
  stepIdSchema,
  updateSequenceSchema,
  updateSequenceStepSchema,
} from './dto/sequence.dto';

type SequenceResponse = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type SequenceStepResponse = {
  id: string;
  sequenceId: string;
  stepOrder: number;
  delayMinutes: number;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SequenceListResponse = {
  data: SequenceResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

export type EnrollLeadsResponse = {
  totals: {
    requested: number;
    validLeads: number;
    created: number;
    skippedAlreadyEnrolled: number;
    invalidLeadIds: number;
  };
  progress: Array<{
    batch: number;
    attempted: number;
    created: number;
    skippedAlreadyEnrolled: number;
  }>;
};

@Injectable()
export class SequencesService {
  constructor(private readonly prisma: PrismaService) {}

  async createSequence(
    workspaceId: string,
    input: unknown,
  ): Promise<SequenceResponse> {
    const payload = this.parseCreateSequence(input);
    const sequence = await this.prisma.sequence.create({
      data: { workspaceId, name: payload.name },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    return sequence;
  }

  async listSequences(
    workspaceId: string,
    query: unknown,
  ): Promise<SequenceListResponse> {
    const payload = this.parseListSequences(query);
    const where: Prisma.SequenceWhereInput = { workspaceId };
    if (payload.search) {
      where.name = { contains: payload.search, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sequence.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: payload.offset,
        take: payload.limit,
        select: { id: true, name: true, createdAt: true, updatedAt: true },
      }),
      this.prisma.sequence.count({ where }),
    ]);

    return {
      data,
      pagination: {
        limit: payload.limit,
        offset: payload.offset,
        total,
        hasMore: payload.offset + data.length < total,
      },
    };
  }

  async getSequence(
    workspaceId: string,
    sequenceId: string,
  ): Promise<SequenceResponse> {
    this.assertSequenceId(sequenceId);
    const sequence = await this.prisma.sequence.findFirst({
      where: { id: sequenceId, workspaceId },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    if (!sequence) throw new NotFoundException('Sequence not found');
    return sequence;
  }

  async updateSequence(
    workspaceId: string,
    sequenceId: string,
    input: unknown,
  ): Promise<SequenceResponse> {
    this.assertSequenceId(sequenceId);
    const payload = this.parseUpdateSequence(input);
    const existing = await this.prisma.sequence.findFirst({
      where: { id: sequenceId, workspaceId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Sequence not found');

    const sequence = await this.prisma.sequence.update({
      where: { id: sequenceId },
      data: { name: payload.name },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
    return sequence;
  }

  async deleteSequence(workspaceId: string, sequenceId: string): Promise<void> {
    this.assertSequenceId(sequenceId);
    const result = await this.prisma.sequence.deleteMany({
      where: { id: sequenceId, workspaceId },
    });
    if (result.count === 0) throw new NotFoundException('Sequence not found');
  }

  async createStep(
    workspaceId: string,
    sequenceId: string,
    input: unknown,
  ): Promise<SequenceStepResponse> {
    this.assertSequenceId(sequenceId);
    const payload = this.parseCreateStep(input);
    await this.assertSequenceExists(workspaceId, sequenceId);
    this.assertDelayRules(payload.stepOrder, payload.delayMinutes);

    const step = await this.prisma.sequenceStep.create({
      data: {
        workspaceId,
        sequenceId,
        stepOrder: payload.stepOrder,
        delayMinutes: payload.delayMinutes,
        subject: payload.subject,
        body: payload.body,
      },
      select: {
        id: true,
        sequenceId: true,
        stepOrder: true,
        delayMinutes: true,
        subject: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return step;
  }

  async listSteps(
    workspaceId: string,
    sequenceId: string,
  ): Promise<SequenceStepResponse[]> {
    this.assertSequenceId(sequenceId);
    await this.assertSequenceExists(workspaceId, sequenceId);
    return this.prisma.sequenceStep.findMany({
      where: { workspaceId, sequenceId },
      orderBy: [{ stepOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        sequenceId: true,
        stepOrder: true,
        delayMinutes: true,
        subject: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateStep(
    workspaceId: string,
    sequenceId: string,
    stepId: string,
    input: unknown,
  ): Promise<SequenceStepResponse> {
    this.assertSequenceId(sequenceId);
    this.assertStepId(stepId);
    const payload = this.parseUpdateStep(input);

    const step = await this.prisma.sequenceStep.findFirst({
      where: { id: stepId, workspaceId, sequenceId },
      select: { id: true, stepOrder: true, delayMinutes: true },
    });
    if (!step) throw new NotFoundException('Step not found');

    const nextOrder = payload.stepOrder ?? step.stepOrder;
    const nextDelay = payload.delayMinutes ?? step.delayMinutes;
    this.assertDelayRules(nextOrder, nextDelay);

    const updated = await this.prisma.sequenceStep.update({
      where: { id: stepId },
      data: {
        stepOrder: payload.stepOrder,
        delayMinutes: payload.delayMinutes,
        subject: payload.subject,
        body: payload.body,
      },
      select: {
        id: true,
        sequenceId: true,
        stepOrder: true,
        delayMinutes: true,
        subject: true,
        body: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  async deleteStep(
    workspaceId: string,
    sequenceId: string,
    stepId: string,
  ): Promise<void> {
    this.assertSequenceId(sequenceId);
    this.assertStepId(stepId);
    const result = await this.prisma.sequenceStep.deleteMany({
      where: { id: stepId, workspaceId, sequenceId },
    });
    if (result.count === 0) throw new NotFoundException('Step not found');
  }

  async enrollLeads(
    workspaceId: string,
    sequenceId: string,
    input: unknown,
  ): Promise<EnrollLeadsResponse> {
    this.assertSequenceId(sequenceId);
    const payload = this.parseEnrollLeads(input);
    await this.assertSequenceExists(workspaceId, sequenceId);

    const batchSize = payload.batchSize ?? 500;
    const uniqueLeadIds = Array.from(new Set(payload.leadIds));

    const validLeads = await this.prisma.lead.findMany({
      where: {
        workspaceId,
        id: { in: uniqueLeadIds },
      },
      select: { id: true },
    });
    const validLeadIdSet = new Set(validLeads.map((l) => l.id));
    const invalidLeadIds = uniqueLeadIds.filter((id) => !validLeadIdSet.has(id));

    const leadIdsToEnroll = uniqueLeadIds.filter((id) => validLeadIdSet.has(id));

    let createdTotal = 0;
    let skippedTotal = 0;
    const progress: EnrollLeadsResponse['progress'] = [];

    for (let i = 0; i < leadIdsToEnroll.length; i += batchSize) {
      const batch = leadIdsToEnroll.slice(i, i + batchSize);

      // createMany doesn't report skipped count directly; infer using pre-check.
      const existing = await this.prisma.sequenceEnrollment.findMany({
        where: { workspaceId, sequenceId, leadId: { in: batch } },
        select: { leadId: true },
      });
      const already = new Set(existing.map((e) => e.leadId));
      const toCreate = batch.filter((id) => !already.has(id));

      let created = 0;
      if (toCreate.length > 0) {
        const result = await this.prisma.sequenceEnrollment.createMany({
          data: toCreate.map((leadId) => ({
            workspaceId,
            sequenceId,
            leadId,
            status: 'ACTIVE',
            currentStep: 0,
            nextSendAt: null,
          })),
          skipDuplicates: true,
        });
        created = result.count;
      }

      const skippedAlreadyEnrolled = batch.length - toCreate.length;
      createdTotal += created;
      skippedTotal += skippedAlreadyEnrolled;
      progress.push({
        batch: Math.floor(i / batchSize) + 1,
        attempted: batch.length,
        created,
        skippedAlreadyEnrolled,
      });
    }

    return {
      totals: {
        requested: payload.leadIds.length,
        validLeads: leadIdsToEnroll.length,
        created: createdTotal,
        skippedAlreadyEnrolled: skippedTotal,
        invalidLeadIds: invalidLeadIds.length,
      },
      progress,
    };
  }

  private parseCreateSequence(input: unknown): CreateSequenceDto {
    const parsed = createSequenceSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseUpdateSequence(input: unknown): UpdateSequenceDto {
    const parsed = updateSequenceSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseListSequences(input: unknown): ListSequencesDto {
    const parsed = listSequencesSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseCreateStep(input: unknown): CreateSequenceStepDto {
    const parsed = createSequenceStepSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseUpdateStep(input: unknown): UpdateSequenceStepDto {
    const parsed = updateSequenceStepSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseEnrollLeads(input: unknown): EnrollLeadsDto {
    const parsed = enrollLeadsSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private assertSequenceId(sequenceId: string): void {
    const parsed = sequenceIdSchema.safeParse(sequenceId);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
  }

  private assertStepId(stepId: string): void {
    const parsed = stepIdSchema.safeParse(stepId);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
  }

  private assertDelayRules(stepOrder: number, delayMinutes: number): void {
    if (stepOrder > 0 && delayMinutes < 1) {
      throw new UnprocessableEntityException({
        delayMinutes: 'delayMinutes must be >= 1 for non-first steps',
      });
    }
    if (delayMinutes < 0) {
      throw new UnprocessableEntityException({
        delayMinutes: 'delayMinutes must be >= 0',
      });
    }
  }

  private async assertSequenceExists(
    workspaceId: string,
    sequenceId: string,
  ): Promise<void> {
    const sequence = await this.prisma.sequence.findFirst({
      where: { id: sequenceId, workspaceId },
      select: { id: true },
    });
    if (!sequence) throw new NotFoundException('Sequence not found');
  }
}

