import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { LeadReplyStatus, Prisma, SequenceEnrollmentStatus } from '@prisma/client';
import { InboundReplyWebhookService } from './inbound-reply-webhook.service';

describe('InboundReplyWebhookService', () => {
  const workspaceId = '7f65cfc8-1ca9-470f-93bf-6c0d969cccf9';
  const leadId = '4d3f2207-bd2d-426e-bb5f-c42f161f73f3';

  const createService = (prisma: {
    $transaction: jest.Mock;
    processedInboundReply?: { create: jest.Mock };
    lead?: { findFirst: jest.Mock; updateMany: jest.Mock };
    sequenceEnrollment?: { updateMany: jest.Mock };
  }) => new InboundReplyWebhookService(prisma as never);

  it('rejects invalid body', () => {
    const prisma = { $transaction: jest.fn() };
    const service = createService(prisma);
    expect(() => service.parseBody({})).toThrow(UnprocessableEntityException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('throws when lead is missing', async () => {
    const prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          lead: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return fn(tx);
      }),
    };
    const service = createService(prisma);
    await expect(
      service.handle({
        workspaceId,
        leadEmail: 'nobody@example.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('applies reply: dedupe row, stops ACTIVE enrollments, marks lead REPLIED', async () => {
    const tx = {
      lead: {
        findFirst: jest.fn().mockResolvedValue({ id: leadId }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      processedInboundReply: {
        create: jest.fn().mockResolvedValue({ id: 'dedupe-1' }),
      },
      sequenceEnrollment: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const service = createService(prisma);
    const result = await service.handle({
      workspaceId,
      leadEmail: 'Lead@Example.com',
      externalMessageId: 'msg-abc',
    });
    expect(result).toEqual({ status: 'applied', stoppedEnrollments: 2 });
    expect(tx.processedInboundReply.create).toHaveBeenCalledWith({
      data: {
        workspaceId,
        externalMessageId: 'msg-abc',
        leadId,
      },
    });
    expect(tx.sequenceEnrollment.updateMany).toHaveBeenCalledWith({
      where: {
        workspaceId,
        leadId,
        status: SequenceEnrollmentStatus.ACTIVE,
      },
      data: expect.objectContaining({
        status: SequenceEnrollmentStatus.STOPPED,
      }),
    });
    expect(tx.lead.updateMany).toHaveBeenCalledWith({
      where: { id: leadId, replyStatus: LeadReplyStatus.NONE },
      data: expect.objectContaining({
        replyStatus: LeadReplyStatus.REPLIED,
      }),
    });
  });

  it('returns duplicate when externalMessageId collides', async () => {
    const dup = new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const tx = {
      lead: {
        findFirst: jest.fn().mockResolvedValue({ id: leadId }),
      },
      processedInboundReply: {
        create: jest.fn().mockRejectedValue(dup),
      },
      sequenceEnrollment: { updateMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const service = createService(prisma);
    const result = await service.handle({
      workspaceId,
      leadEmail: 'lead@example.com',
      externalMessageId: 'same-id',
    });
    expect(result).toEqual({ status: 'duplicate' });
    expect(tx.sequenceEnrollment.updateMany).not.toHaveBeenCalled();
    expect(tx.lead.updateMany).not.toHaveBeenCalled();
  });
});
