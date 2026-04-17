import { Injectable, NotFoundException } from '@nestjs/common';
import {
  OutboundMessageEventType,
  OutboundMessageProvider,
  OutboundMessageStatus,
  SequenceEnrollmentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type DispatchSequenceResult = {
  accepted: true;
  sequenceId: string;
  queuedJobs: number;
};

@Injectable()
export class OutboundMailerService {
  constructor(private readonly prisma: PrismaService) {}

  async dispatchSequence(
    workspaceId: string,
    sequenceId: string,
    inboxIdentity: string,
  ): Promise<DispatchSequenceResult> {
    const sequence = await this.prisma.sequence.findFirst({
      where: { id: sequenceId, workspaceId },
      select: { id: true },
    });
    if (!sequence) {
      throw new NotFoundException('Sequence not found');
    }

    const enrollments = await this.prisma.sequenceEnrollment.findMany({
      where: {
        workspaceId,
        sequenceId,
        status: SequenceEnrollmentStatus.ACTIVE,
        OR: [{ nextSendAt: null }, { nextSendAt: { lte: new Date() } }],
      },
      include: {
        lead: { select: { id: true, email: true, name: true } },
        sequence: {
          include: {
            steps: {
              orderBy: [{ stepOrder: 'asc' }],
            },
          },
        },
      },
      take: 1000,
    });

    const toQueue = enrollments
      .map((enrollment) => {
        const step = enrollment.sequence.steps.find(
          (item) => item.stepOrder === enrollment.currentStep,
        );
        if (!step) {
          return null;
        }

        return {
          workspaceId,
          sequenceId,
          sequenceStepId: step.id,
          sequenceEnrollmentId: enrollment.id,
          leadId: enrollment.leadId,
          provider: OutboundMessageProvider.SMTP,
          inboxIdentity,
          toEmail: enrollment.lead.email,
          subject: step.subject,
          htmlBody: step.body,
          status: OutboundMessageStatus.QUEUED,
        };
      })
      .filter((item) => item !== null);

    if (toQueue.length === 0) {
      return { accepted: true, sequenceId, queuedJobs: 0 };
    }

    const createResult = await this.prisma.outboundMessageJob.createMany({
      data: toQueue,
      skipDuplicates: true,
    });

    if (createResult.count > 0) {
      const queuedJobs = await this.prisma.outboundMessageJob.findMany({
        where: {
          workspaceId,
          sequenceId,
          status: OutboundMessageStatus.QUEUED,
          sequenceEnrollmentId: {
            in: toQueue.map((item) => item.sequenceEnrollmentId),
          },
        },
        select: { id: true },
      });

      await this.prisma.outboundMessageEvent.createMany({
        data: queuedJobs.map((job) => ({
          outboundMessageId: job.id,
          type: OutboundMessageEventType.QUEUED,
          payload: { reason: 'manual_dispatch' },
        })),
      });
    }

    return { accepted: true, sequenceId, queuedJobs: createResult.count };
  }

  async listDeadLetters(workspaceId: string, sequenceId: string) {
    return this.prisma.outboundMessageJob.findMany({
      where: {
        workspaceId,
        sequenceId,
        status: OutboundMessageStatus.DEAD_LETTER,
      },
      orderBy: [{ deadLetteredAt: 'desc' }],
      select: {
        id: true,
        toEmail: true,
        subject: true,
        attemptCount: true,
        lastError: true,
        deadLetteredAt: true,
      },
      take: 100,
    });
  }
}
