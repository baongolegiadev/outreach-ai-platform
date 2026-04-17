import { Injectable } from '@nestjs/common';
import { OutboundMessageProvider } from '@prisma/client';
import {
  OutboundMailAdapter,
  OutboundSendPayload,
  OutboundSendResult,
} from './outbound-mail.types';

@Injectable()
export class GmailStubAdapter implements OutboundMailAdapter {
  readonly provider = OutboundMessageProvider.GMAIL_STUB;

  async send(payload: OutboundSendPayload): Promise<OutboundSendResult> {
    return {
      messageId: `gmail-stub:${payload.to}:${Date.now().toString()}`,
    };
  }
}
