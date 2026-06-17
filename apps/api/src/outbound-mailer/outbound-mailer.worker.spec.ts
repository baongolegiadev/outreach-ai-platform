import {
  OutboundMessageProvider,
  OutboundMessageStatus,
} from '@prisma/client';
import { OutboundMailerWorker } from './outbound-mailer.worker';
import { OutboundAdapterError } from './outbound-mail.types';

describe('OutboundMailerWorker', () => {
  const createPrismaMock = () => ({
    outboundMessageJob: {
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    outboundMessageEvent: {
      create: jest.fn(),
    },
    outboundMessageAttempt: {
      create: jest.fn(),
    },
    sequenceEnrollment: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<void>) => {
      await cb({
        outboundMessageAttempt: { create: jest.fn() },
        outboundMessageJob: { update: jest.fn() },
        outboundMessageEvent: { create: jest.fn() },
        sequenceEnrollment: { update: jest.fn() },
      });
    }),
  });

  const configMock = {
    get: jest.fn((key: string) => {
      if (key === 'OUTBOUND_RATE_LIMIT_PER_MINUTE') return 1;
      if (key === 'OUTBOUND_RETRY_BASE_SECONDS') return 5;
      if (key === 'OUTBOUND_WORKER_POLL_MS') return 10_000;
      if (key === 'OUTBOUND_DEFAULT_FROM_EMAIL') return 'sender@acme.io';
      return undefined;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'API_PUBLIC_URL') return 'https://api.acme.test';
      throw new Error(`missing ${key}`);
    }),
  };

  it('reschedules when per-inbox rate limit is reached', async () => {
    const prisma = createPrismaMock();
    const smtpAdapter = {
      provider: OutboundMessageProvider.SMTP,
      send: jest.fn(),
    };
    const gmailAdapter = {
      provider: OutboundMessageProvider.GMAIL_STUB,
      send: jest.fn(),
    };

    prisma.outboundMessageJob.findFirst.mockResolvedValue({
      id: 'job-1',
      provider: OutboundMessageProvider.SMTP,
      inboxIdentity: 'sender@acme.io',
      toEmail: 'lead@acme.io',
      subject: 'Hello',
      htmlBody: '<p>Hi</p>',
      attemptCount: 0,
      sequenceEnrollmentId: 'enroll-1',
      sequenceStepId: 'step-1',
      sequence: { steps: [] },
    });
    prisma.outboundMessageJob.count.mockResolvedValue(1);

    const worker = new OutboundMailerWorker(
      prisma as never,
      configMock as never,
      smtpAdapter as never,
      gmailAdapter as never,
    );

    await worker.tick();

    expect(prisma.outboundMessageJob.update).toHaveBeenCalled();
    expect(smtpAdapter.send).not.toHaveBeenCalled();
  });

  it('dead-letters after max retries on transient failures', async () => {
    const prisma = createPrismaMock();
    const smtpAdapter = {
      provider: OutboundMessageProvider.SMTP,
      send: jest.fn(async () => {
        throw new OutboundAdapterError('Temporary network issue', true);
      }),
    };
    const gmailAdapter = {
      provider: OutboundMessageProvider.GMAIL_STUB,
      send: jest.fn(),
    };

    prisma.outboundMessageJob.findFirst.mockResolvedValue({
      id: 'job-2',
      provider: OutboundMessageProvider.SMTP,
      status: OutboundMessageStatus.QUEUED,
      inboxIdentity: 'sender@acme.io',
      toEmail: 'lead@acme.io',
      subject: 'Hello',
      htmlBody: '<p>Hi</p>',
      attemptCount: 2,
      sequenceEnrollmentId: 'enroll-2',
      sequenceStepId: 'step-2',
      sequence: { steps: [] },
    });
    prisma.outboundMessageJob.count.mockResolvedValue(0);
    prisma.outboundMessageJob.updateMany.mockResolvedValue({ count: 1 });

    const worker = new OutboundMailerWorker(
      prisma as never,
      configMock as never,
      smtpAdapter as never,
      gmailAdapter as never,
    );

    await worker.tick();

    expect(prisma.outboundMessageJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OutboundMessageStatus.DEAD_LETTER,
          attemptCount: 3,
        }),
      }),
    );
  });
});
