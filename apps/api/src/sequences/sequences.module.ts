import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OutboundMailerModule } from '../outbound-mailer/outbound-mailer.module';
import { SequencesController } from './sequences.controller';
import { SequencesService } from './sequences.service';

@Module({
  imports: [AuthModule, OutboundMailerModule],
  controllers: [SequencesController],
  providers: [SequencesService],
})
export class SequencesModule {}

