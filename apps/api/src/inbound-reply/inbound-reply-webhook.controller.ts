import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InboundReplyWebhookGuard } from './inbound-reply-webhook.guard';
import {
  InboundReplyWebhookService,
  type InboundReplyWebhookResult,
} from './inbound-reply-webhook.service';

@Controller('webhooks/inbound-replies')
@UseGuards(InboundReplyWebhookGuard)
export class InboundReplyWebhookController {
  constructor(private readonly inboundReplyWebhook: InboundReplyWebhookService) {}

  @Post()
  ingest(@Body() body: unknown): Promise<InboundReplyWebhookResult> {
    return this.inboundReplyWebhook.handle(body);
  }
}
