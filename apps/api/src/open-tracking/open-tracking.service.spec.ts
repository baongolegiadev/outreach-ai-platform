import { OutboundMessageStatus } from '@prisma/client';
import { OpenTrackingService } from './open-tracking.service';

describe('OpenTrackingService', () => {
  it('no-ops for blank token', async () => {
    const prisma = {
      outboundMessageJob: { findUnique: jest.fn(), updateMany: jest.fn() },
      outboundMessageEvent: { create: jest.fn() },
    };
    const service = new OpenTrackingService(prisma as never);
    await service.recordFirstOpen('   ');
    expect(prisma.outboundMessageJob.findUnique).not.toHaveBeenCalled();
  });

  it('writes openedAt and OPENED event only on first open', async () => {
    const prisma = {
      outboundMessageJob: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'job-1',
          status: OutboundMessageStatus.SENT,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      outboundMessageEvent: { create: jest.fn() },
    };
    const service = new OpenTrackingService(prisma as never);
    await service.recordFirstOpen('tok1');
    expect(prisma.outboundMessageJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-1', openedAt: null },
      }),
    );
    expect(prisma.outboundMessageEvent.create).toHaveBeenCalled();
  });

  it('skips event when job was already opened', async () => {
    const prisma = {
      outboundMessageJob: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'job-1',
          status: OutboundMessageStatus.SENT,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      outboundMessageEvent: { create: jest.fn() },
    };
    const service = new OpenTrackingService(prisma as never);
    await service.recordFirstOpen('tok1');
    expect(prisma.outboundMessageEvent.create).not.toHaveBeenCalled();
  });

  it('does not record open when job is not yet sent', async () => {
    const prisma = {
      outboundMessageJob: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'job-1',
          status: OutboundMessageStatus.QUEUED,
        }),
        updateMany: jest.fn(),
      },
      outboundMessageEvent: { create: jest.fn() },
    };
    const service = new OpenTrackingService(prisma as never);
    await service.recordFirstOpen('tok1');
    expect(prisma.outboundMessageJob.updateMany).not.toHaveBeenCalled();
    expect(prisma.outboundMessageEvent.create).not.toHaveBeenCalled();
  });

  it('ignores unknown token without throwing', async () => {
    const prisma = {
      outboundMessageJob: {
        findUnique: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(),
      },
      outboundMessageEvent: { create: jest.fn() },
    };
    const service = new OpenTrackingService(prisma as never);
    await expect(service.recordFirstOpen('nope')).resolves.toBeUndefined();
    expect(prisma.outboundMessageEvent.create).not.toHaveBeenCalled();
  });
});
