import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SequencesController } from './sequences.controller';
import { SequencesService } from './sequences.service';

@Module({
  imports: [AuthModule],
  controllers: [SequencesController],
  providers: [SequencesService],
})
export class SequencesModule {}

