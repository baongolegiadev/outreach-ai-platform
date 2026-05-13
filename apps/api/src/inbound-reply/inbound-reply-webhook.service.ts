import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LeadReplyStatus, Prisma, SequenceEnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  inboundReplyWebhookBodySchema,
  type InboundReplyWebhookBody,
} from './dto/inbound-reply-webhook.dto';

export type InboundReplyWebhookResult =
  | { status: 'duplicate' }
  | { status: 'applied'; stoppedEnrollments: number };

@Injectable()
export class InboundReplyWebhookService {
  private readonly logger = new Logger(InboundReplyWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  parseBody(body: unknown): InboundReplyWebhookBody {
    const parsed = inboundReplyWebhookBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error.flatten());
    }
    return parsed.data;
  }

  async handle(body: unknown): Promise<InboundReplyWebhookResult> {
    const payload = this.parseBody(body);
    return this.applyReply(payload);
  }

  private async applyReply(payload: InboundReplyWebhookBody): Promise<InboundReplyWebhookResult> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const lead = await tx.lead.findFirst({
          where: {
            workspaceId: payload.workspaceId,
            email: { equals: payload.leadEmail, mode: 'insensitive' },
          },
          select: { id: true },
        });

        if (!lead) {
          this.logger.warn(
            `Inbound reply webhook: lead not found (workspaceId=${payload.workspaceId}, leadEmail=${payload.leadEmail})`,
          );
          throw new NotFoundException('Lead not found in workspace');
        }

        if (payload.externalMessageId) {
          try {
            await tx.processedInboundReply.create({
              data: {
                workspaceId: payload.workspaceId,
                externalMessageId: payload.externalMessageId,
                leadId: lead.id,
              },
            });
          } catch (err: unknown) {
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === 'P2002'
            ) {
              this.logger.log(
                `Inbound reply webhook: duplicate externalMessageId for workspace ${payload.workspaceId}`,
              );
              return { status: 'duplicate' };
            }
            throw err;
          }
        }

        const stopped = await tx.sequenceEnrollment.updateMany({
          where: {
            workspaceId: payload.workspaceId,
            leadId: lead.id,
            status: SequenceEnrollmentStatus.ACTIVE,
          },
          data: {
            status: SequenceEnrollmentStatus.STOPPED,
            stoppedAt: new Date(),
          },
        });

        await tx.lead.updateMany({
          where: {
            id: lead.id,
            replyStatus: LeadReplyStatus.NONE,
          },
          data: {
            replyStatus: LeadReplyStatus.REPLIED,
            repliedAt: new Date(),
          },
        });

        return {
          status: 'applied',
          stoppedEnrollments: stopped.count,
        };
      });
    } catch (err: unknown) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(
        `Inbound reply webhook: transaction failed (workspaceId=${payload.workspaceId})`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }
}
