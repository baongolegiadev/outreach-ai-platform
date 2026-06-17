import { Module } from '@nestjs/common';
import { OutboundMailerService } from './outbound-mailer.service';
import { OutboundMailerWorker } from './outbound-mailer.worker';
import { SmtpMailAdapter } from './smtp-mail.adapter';
import { GmailStubAdapter } from './gmail-stub.adapter';

@Module({
  providers: [
    OutboundMailerService,
    OutboundMailerWorker,
    SmtpMailAdapter,
    GmailStubAdapter,
  ],
  exports: [OutboundMailerService],
})
export class OutboundMailerModule {}
