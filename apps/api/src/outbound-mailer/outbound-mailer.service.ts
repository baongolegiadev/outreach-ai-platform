import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  OutboundMessageEventType,
  OutboundMessageProvider,
  OutboundMessageStatus,
  Prisma,
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

    const createdIds: string[] = [];
    for (const item of toQueue) {
      try {
        const job = await this.prisma.outboundMessageJob.create({
          data: {
            ...item,
            openTrackingToken: randomBytes(24).toString('hex'),
          },
        });
        createdIds.push(job.id);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }

    if (createdIds.length > 0) {
      await this.prisma.outboundMessageEvent.createMany({
        data: createdIds.map((outboundMessageId) => ({
          outboundMessageId,
          type: OutboundMessageEventType.QUEUED,
          payload: { reason: 'manual_dispatch' },
        })),
      });
    }

    return { accepted: true, sequenceId, queuedJobs: createdIds.length };
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
