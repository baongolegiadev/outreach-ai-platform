import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenTrackingController } from './open-tracking.controller';
import { OpenTrackingService } from './open-tracking.service';

@Module({
  imports: [PrismaModule],
  controllers: [OpenTrackingController],
  providers: [OpenTrackingService],
})
export class OpenTrackingModule {}
