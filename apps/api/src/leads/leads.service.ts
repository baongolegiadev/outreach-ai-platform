import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLeadDto,
  ListLeadsDto,
  UpdateLeadDto,
  createLeadSchema,
  listLeadsSchema,
  updateLeadSchema,
} from './dto/lead.dto';

type LeadWithTags = Prisma.LeadGetPayload<{
  include: {
    tags: {
      include: {
        tag: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

export interface LeadResponse {
  id: string;
  name: string;
  email: string;
  company: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{
    id: string;
    name: string;
  }>;
}

export interface LeadListResponse {
  data: LeadResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, input: unknown): Promise<LeadResponse> {
    const payload = this.parseCreateInput(input);
    await this.assertTagsInWorkspace(workspaceId, payload.tagIds);

    const lead = await this.prisma.lead.create({
      data: {
        workspaceId,
        name: payload.name,
        email: payload.email,
        company: payload.company ?? null,
        tags: {
          createMany: {
            data: payload.tagIds.map((tagId) => ({ tagId })),
            skipDuplicates: true,
          },
        },
      },
      include: this.leadTagInclude(),
    });

    return this.mapLead(lead);
  }

  async list(workspaceId: string, query: unknown): Promise<LeadListResponse> {
    const payload = this.parseListInput(query);
    const where = this.buildWhere(workspaceId, payload);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: payload.offset,
        take: payload.limit,
        include: this.leadTagInclude(),
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: data.map((lead) => this.mapLead(lead)),
      pagination: {
        limit: payload.limit,
        offset: payload.offset,
        total,
        hasMore: payload.offset + data.length < total,
      },
    };
  }

  async getById(workspaceId: string, leadId: string): Promise<LeadResponse> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId,
      },
      include: this.leadTagInclude(),
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return this.mapLead(lead);
  }

  async update(
    workspaceId: string,
    leadId: string,
    input: unknown,
  ): Promise<LeadResponse> {
    const payload = this.parseUpdateInput(input);

    const existing = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        workspaceId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Lead not found');
    }

    if (payload.tagIds) {
      await this.assertTagsInWorkspace(workspaceId, payload.tagIds);
    }

    const lead = await this.prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: leadId },
        data: {
          name: payload.name,
          email: payload.email,
          company: payload.company ?? undefined,
        },
      });

      if (payload.tagIds) {
        await tx.leadTag.deleteMany({
          where: {
            leadId,
          },
        });
        if (payload.tagIds.length > 0) {
          await tx.leadTag.createMany({
            data: payload.tagIds.map((tagId) => ({
              leadId,
              tagId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.lead.findFirst({
        where: {
          id: leadId,
          workspaceId,
        },
        include: this.leadTagInclude(),
      });
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return this.mapLead(lead);
  }

  async remove(workspaceId: string, leadId: string): Promise<{ success: true }> {
    const result = await this.prisma.lead.deleteMany({
      where: {
        id: leadId,
        workspaceId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Lead not found');
    }

    return { success: true };
  }

  private parseCreateInput(input: unknown): CreateLeadDto {
    const parsed = createLeadSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseUpdateInput(input: unknown): UpdateLeadDto {
    const parsed = updateLeadSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private parseListInput(input: unknown): ListLeadsDto {
    const parsed = listLeadsSchema.safeParse(input);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  private async assertTagsInWorkspace(
    workspaceId: string,
    tagIds: string[],
  ): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }

    const uniqueTagIds = Array.from(new Set(tagIds));
    const existingTags = await this.prisma.tag.findMany({
      where: {
        workspaceId,
        id: {
          in: uniqueTagIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingTags.length !== uniqueTagIds.length) {
      throw new UnprocessableEntityException(
        'One or more tags do not belong to the workspace',
      );
    }
  }

  private buildWhere(
    workspaceId: string,
    payload: ListLeadsDto,
  ): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = { workspaceId };

    if (payload.search) {
      where.OR = [
        { name: { contains: payload.search, mode: 'insensitive' } },
        { email: { contains: payload.search, mode: 'insensitive' } },
        { company: { contains: payload.search, mode: 'insensitive' } },
      ];
    }

    if (payload.company) {
      where.company = {
        contains: payload.company,
        mode: 'insensitive',
      };
    }

    if (payload.tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: payload.tagIds,
          },
        },
      };
    }

    return where;
  }

  private leadTagInclude() {
    return {
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    } satisfies Prisma.LeadInclude;
  }

  private mapLead(lead: LeadWithTags): LeadResponse {
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      company: lead.company,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      tags: lead.tags.map((leadTag) => ({
        id: leadTag.tag.id,
        name: leadTag.tag.name,
      })),
    };
  }
}
