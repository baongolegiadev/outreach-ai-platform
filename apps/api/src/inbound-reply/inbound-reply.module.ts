import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InboundReplyWebhookController } from './inbound-reply-webhook.controller';
import { InboundReplyWebhookGuard } from './inbound-reply-webhook.guard';
import { InboundReplyWebhookService } from './inbound-reply-webhook.service';

@Module({
  imports: [PrismaModule],
  controllers: [InboundReplyWebhookController],
  providers: [InboundReplyWebhookService, InboundReplyWebhookGuard],
})
export class InboundReplyModule {}
