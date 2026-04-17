import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OutboundMessageEventType,
  OutboundMessageProvider,
  OutboundMessageStatus,
  SequenceEnrollmentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GmailStubAdapter } from './gmail-stub.adapter';
import { OutboundAdapterError, OutboundMailAdapter } from './outbound-mail.types';
import { SmtpMailAdapter } from './smtp-mail.adapter';

@Injectable()
export class OutboundMailerWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboundMailerWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private processing = false;
  private readonly pollMs: number;
  private readonly ratePerMinute: number;
  private readonly retryBaseSeconds: number;
  private readonly defaultFrom: string;
  private readonly adapters: Map<OutboundMessageProvider, OutboundMailAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
    smtpAdapter: SmtpMailAdapter,
    gmailStubAdapter: GmailStubAdapter,
  ) {
    this.pollMs = config.get<number>('OUTBOUND_WORKER_POLL_MS') ?? 5000;
    this.ratePerMinute = config.get<number>('OUTBOUND_RATE_LIMIT_PER_MINUTE') ?? 30;
    this.retryBaseSeconds = config.get<number>('OUTBOUND_RETRY_BASE_SECONDS') ?? 30;
    this.defaultFrom =
      config.get<string>('OUTBOUND_DEFAULT_FROM_EMAIL') ?? 'no-reply@example.com';
    this.adapters = new Map<OutboundMessageProvider, OutboundMailAdapter>([
      [smtpAdapter.provider, smtpAdapter],
      [gmailStubAdapter.provider, gmailStubAdapter],
    ]);
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, this.pollMs);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.processSingleJob();
    } finally {
      this.processing = false;
    }
  }

  private async processSingleJob(): Promise<void> {
    const now = new Date();
    const job = await this.prisma.outboundMessageJob.findFirst({
      where: {
        status: OutboundMessageStatus.QUEUED,
        nextAttemptAt: { lte: now },
      },
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      include: {
        sequence: {
          include: {
            steps: {
              orderBy: [{ stepOrder: 'asc' }],
            },
          },
        },
      },
    });

    if (!job) return;

    const sentInLastMinute = await this.prisma.outboundMessageJob.count({
      where: {
        inboxIdentity: job.inboxIdentity,
        status: OutboundMessageStatus.SENT,
        sentAt: { gte: new Date(Date.now() - 60_000) },
      },
    });

    if (sentInLastMinute >= this.ratePerMinute) {
      await this.prisma.outboundMessageJob.update({
        where: { id: job.id },
        data: { nextAttemptAt: new Date(Date.now() + 60_000) },
      });
      await this.prisma.outboundMessageEvent.create({
        data: {
          outboundMessageId: job.id,
          type: OutboundMessageEventType.RETRY_SCHEDULED,
          payload: { reason: 'rate_limited' },
        },
      });
      return;
    }

    const lock = await this.prisma.outboundMessageJob.updateMany({
      where: { id: job.id, status: OutboundMessageStatus.QUEUED },
      data: { status: OutboundMessageStatus.PROCESSING },
    });
    if (lock.count === 0) return;

    try {
      const adapter = this.adapters.get(job.provider);
      if (!adapter) {
        throw new OutboundAdapterError(`Adapter ${job.provider} not configured`, false);
      }

      const result = await adapter.send({
        from: this.defaultFrom,
        to: job.toEmail,
        subject: job.subject,
        html: job.htmlBody,
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.outboundMessageAttempt.create({
          data: {
            outboundMessageId: job.id,
            attemptNumber: job.attemptCount + 1,
            success: true,
            transientError: false,
            providerMessageId: result.messageId,
          },
        });

        await tx.outboundMessageJob.update({
          where: { id: job.id },
          data: {
            status: OutboundMessageStatus.SENT,
            attemptCount: job.attemptCount + 1,
            sentAt: new Date(),
            lastError: null,
          },
        });

        await tx.outboundMessageEvent.create({
          data: {
            outboundMessageId: job.id,
            type: OutboundMessageEventType.SENT,
            payload: { providerMessageId: result.messageId },
          },
        });

        const currentStep = job.sequence.steps.find((item) => item.id === job.sequenceStepId);
        const nextStep = currentStep
          ? job.sequence.steps.find((item) => item.stepOrder === currentStep.stepOrder + 1)
          : null;

        if (!nextStep) {
          await tx.sequenceEnrollment.update({
            where: { id: job.sequenceEnrollmentId },
            data: {
              status: SequenceEnrollmentStatus.COMPLETED,
              completedAt: new Date(),
              nextSendAt: null,
            },
          });
          return;
        }

        await tx.sequenceEnrollment.update({
          where: { id: job.sequenceEnrollmentId },
          data: {
            currentStep: nextStep.stepOrder,
            nextSendAt: new Date(Date.now() + nextStep.delayMinutes * 60_000),
          },
        });
      });
    } catch (error) {
      await this.handleFailure(job.id, job.attemptCount, error);
    }
  }

  private async handleFailure(
    jobId: string,
    currentAttemptCount: number,
    error: unknown,
  ): Promise<void> {
    const isAdapterError = error instanceof OutboundAdapterError;
    const message = error instanceof Error ? error.message : 'Unknown send error';
    const transientError = isAdapterError ? error.transient : true;
    const attemptCount = currentAttemptCount + 1;
    const maxAttempts = 3;

    await this.prisma.outboundMessageAttempt.create({
      data: {
        outboundMessageId: jobId,
        attemptNumber: attemptCount,
        success: false,
        transientError,
        errorMessage: message,
      },
    });

    if (transientError && attemptCount < maxAttempts) {
      const backoffSeconds = this.retryBaseSeconds * 2 ** (attemptCount - 1);
      await this.prisma.outboundMessageJob.update({
        where: { id: jobId },
        data: {
          status: OutboundMessageStatus.QUEUED,
          attemptCount,
          lastError: message,
          nextAttemptAt: new Date(Date.now() + backoffSeconds * 1000),
        },
      });
      await this.prisma.outboundMessageEvent.create({
        data: {
          outboundMessageId: jobId,
          type: OutboundMessageEventType.RETRY_SCHEDULED,
          payload: { attemptCount, backoffSeconds, reason: message },
        },
      });
      return;
    }

    await this.prisma.outboundMessageJob.update({
      where: { id: jobId },
      data: {
        status: OutboundMessageStatus.DEAD_LETTER,
        attemptCount,
        lastError: message,
        deadLetteredAt: new Date(),
      },
    });
    await this.prisma.outboundMessageEvent.create({
      data: {
        outboundMessageId: jobId,
        type: OutboundMessageEventType.DEAD_LETTER,
        payload: { attemptCount, reason: message },
      },
    });
    this.logger.warn(`Outbound job moved to dead-letter: ${jobId} (${message})`);
  }
}
