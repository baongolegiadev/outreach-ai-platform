import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  const workspaceId = '7f65cfc8-1ca9-470f-93bf-6c0d969cccf9';
  const otherWorkspaceId = '8e986db2-4c0d-4d8c-ad05-6ca53ee15f44';
  const leadId = '4d3f2207-bd2d-426e-bb5f-c42f161f73f3';
  const tagId = '6c909f1c-7a28-45e4-b243-2e8f93f92fc8';

  const createPrismaMock = () => ({
    lead: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
    },
    leadTag: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  it('creates a lead with workspace-scoped tags', async () => {
    const prismaMock = createPrismaMock();
    const service = new LeadsService(prismaMock as never);

    prismaMock.tag.findMany.mockResolvedValue([{ id: tagId }]);
    prismaMock.lead.create.mockResolvedValue({
      id: leadId,
      workspaceId,
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme',
      createdAt: new Date('2026-04-15T00:00:00.000Z'),
      updatedAt: new Date('2026-04-15T00:00:00.000Z'),
      tags: [{ tag: { id: tagId, name: 'ICP' } }],
    });

    const result = await service.create(workspaceId, {
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme',
      tagIds: [tagId],
    });

    expect(prismaMock.tag.findMany).toHaveBeenCalledWith({
      where: { workspaceId, id: { in: [tagId] } },
      select: { id: true },
    });
    expect(prismaMock.lead.create).toHaveBeenCalled();
    expect(result.tags).toEqual([{ id: tagId, name: 'ICP' }]);
  });

  it('rejects create when tag is outside workspace', async () => {
    const prismaMock = createPrismaMock();
    const service = new LeadsService(prismaMock as never);

    prismaMock.tag.findMany.mockResolvedValue([]);

    await expect(
      service.create(workspaceId, {
        name: 'Jane Doe',
        email: 'jane@example.com',
        tagIds: [tagId],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('lists leads with default pagination', async () => {
    const prismaMock = createPrismaMock();
    const service = new LeadsService(prismaMock as never);

    prismaMock.$transaction.mockResolvedValue([
      [
        {
          id: leadId,
          workspaceId,
          name: 'Jane Doe',
          email: 'jane@example.com',
          company: null,
          createdAt: new Date('2026-04-15T00:00:00.000Z'),
          updatedAt: new Date('2026-04-15T00:00:00.000Z'),
          tags: [],
        },
      ],
      1,
    ]);

    const result = await service.list(workspaceId, {});

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(result.pagination).toEqual({
      limit: 25,
      offset: 0,
      total: 1,
      hasMore: false,
    });
  });

  it('returns not found when lead does not exist in workspace', async () => {
    const prismaMock = createPrismaMock();
    const service = new LeadsService(prismaMock as never);

    prismaMock.lead.findFirst.mockResolvedValue(null);

    await expect(service.getById(otherWorkspaceId, leadId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
