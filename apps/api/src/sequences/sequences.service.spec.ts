import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { SequencesService } from './sequences.service';

describe('SequencesService', () => {
  const workspaceId = '7f65cfc8-1ca9-470f-93bf-6c0d969cccf9';
  const sequenceId = '4d3f2207-bd2d-426e-bb5f-c42f161f73f3';
  const stepId = '6c909f1c-7a28-45e4-b243-2e8f93f92fc8';
  const leadA = '11111111-1111-4111-8111-111111111111';
  const leadB = '22222222-2222-4222-8222-222222222222';
  const leadC = '33333333-3333-4333-8333-333333333333';

  const createPrismaMock = () => ({
    sequence: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    sequenceStep: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    lead: {
      findMany: jest.fn(),
    },
    sequenceEnrollment: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  it('creates a sequence', async () => {
    const prismaMock = createPrismaMock();
    const service = new SequencesService(prismaMock as never);

    prismaMock.sequence.create.mockResolvedValue({
      id: sequenceId,
      name: 'Q2 Outbound',
      createdAt: new Date('2026-04-17T00:00:00.000Z'),
      updatedAt: new Date('2026-04-17T00:00:00.000Z'),
    });

    const result = await service.createSequence(workspaceId, { name: 'Q2 Outbound' });
    expect(result.id).toBe(sequenceId);
    expect(prismaMock.sequence.create).toHaveBeenCalled();
  });

  it('rejects step create with zero delay for non-first step', async () => {
    const prismaMock = createPrismaMock();
    const service = new SequencesService(prismaMock as never);

    prismaMock.sequence.findFirst.mockResolvedValue({ id: sequenceId });

    await expect(
      service.createStep(workspaceId, sequenceId, {
        stepOrder: 1,
        delayMinutes: 0,
        subject: 'Hi {{first_name}}',
        body: 'Hello {{company}}',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('returns not found when enrolling to missing sequence', async () => {
    const prismaMock = createPrismaMock();
    const service = new SequencesService(prismaMock as never);

    prismaMock.sequence.findFirst.mockResolvedValue(null);

    await expect(
      service.enrollLeads(workspaceId, sequenceId, { leadIds: [leadA] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('enrolls leads in batches with progress reporting', async () => {
    const prismaMock = createPrismaMock();
    const service = new SequencesService(prismaMock as never);

    prismaMock.sequence.findFirst.mockResolvedValue({ id: sequenceId });
    prismaMock.lead.findMany.mockResolvedValue([
      { id: leadA },
      { id: leadB },
      { id: leadC },
    ]);

    prismaMock.sequenceEnrollment.findMany
      .mockResolvedValueOnce([{ leadId: leadA }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    prismaMock.sequenceEnrollment.createMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });

    const result = await service.enrollLeads(workspaceId, sequenceId, {
      leadIds: [leadA, leadB, leadC],
      batchSize: 2,
    });

    expect(result.totals.requested).toBe(3);
    expect(result.totals.validLeads).toBe(3);
    expect(result.totals.created).toBe(2);
    expect(result.totals.skippedAlreadyEnrolled).toBe(1);
    expect(result.progress.length).toBe(2);
  });
});

