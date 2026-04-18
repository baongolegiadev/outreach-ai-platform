import { Injectable } from '@nestjs/common';
import {
  OutboundMessageEventType,
  OutboundMessageStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OpenTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records the first successful open for a sent job. Duplicate or invalid requests are no-ops.
   * Invalid or unknown tokens are ignored without throwing (same UX as duplicate opens).
   */
  async recordFirstOpen(token: string): Promise<void> {
    const trimmed = token.trim();
    if (trimmed.length === 0) {
      return;
    }

    const job = await this.prisma.outboundMessageJob.findUnique({
      where: { openTrackingToken: trimmed },
      select: { id: true, status: true },
    });

    if (!job || job.status !== OutboundMessageStatus.SENT) {
      return;
    }

    const stamp = await this.prisma.outboundMessageJob.updateMany({
      where: { id: job.id, openedAt: null },
      data: { openedAt: new Date() },
    });

    if (stamp.count === 0) {
      return;
    }

    await this.prisma.outboundMessageEvent.create({
      data: {
        outboundMessageId: job.id,
        type: OutboundMessageEventType.OPENED,
        payload: { source: 'tracking_pixel' },
      },
    });
  }
}
