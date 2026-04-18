import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProtectedController } from './protected/protected.controller';
import { LeadsModule } from './leads/leads.module';
import { SequencesModule } from './sequences/sequences.module';
import { OpenTrackingModule } from './open-tracking/open-tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    LeadsModule,
    SequencesModule,
    OpenTrackingModule,
  ],
  controllers: [HealthController, ProtectedController],
  providers: [],
})
export class AppModule {}
