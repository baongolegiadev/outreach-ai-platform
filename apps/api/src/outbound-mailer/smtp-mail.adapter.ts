import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OutboundMessageProvider } from '@prisma/client';
import nodemailer from 'nodemailer';
import {
  OutboundAdapterError,
  OutboundMailAdapter,
  OutboundSendPayload,
  OutboundSendResult,
} from './outbound-mail.types';

@Injectable()
export class SmtpMailAdapter implements OutboundMailAdapter {
  readonly provider = OutboundMessageProvider.SMTP;
  private readonly transport: nodemailer.Transporter;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const port = config.get<number>('SMTP_PORT') ?? 587;
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    const secure = config.get<boolean>('SMTP_SECURE') ?? false;

    // In dev/test, fallback to a JSON transport so queue flow can be exercised
    // without external SMTP credentials.
    if (!host) {
      this.transport = nodemailer.createTransport({ jsonTransport: true });
      return;
    }

    this.transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(payload: OutboundSendPayload): Promise<OutboundSendResult> {
    try {
      const info = await this.transport.sendMail({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      return { messageId: info.messageId };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'SMTP delivery failed';
      throw new OutboundAdapterError(message, true);
    }
  }
}
