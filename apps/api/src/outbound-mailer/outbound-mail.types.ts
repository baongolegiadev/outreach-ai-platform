import { OutboundMessageProvider } from '@prisma/client';

export type OutboundSendPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export type OutboundSendResult = {
  messageId: string;
};

export class OutboundAdapterError extends Error {
  readonly transient: boolean;

  constructor(message: string, transient: boolean) {
    super(message);
    this.name = 'OutboundAdapterError';
    this.transient = transient;
  }
}

export interface OutboundMailAdapter {
  readonly provider: OutboundMessageProvider;
  send(payload: OutboundSendPayload): Promise<OutboundSendResult>;
}
