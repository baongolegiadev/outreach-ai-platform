import { Injectable, INestApplication, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    super({
      datasourceUrl: configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  enableShutdownHooks(app: INestApplication): void {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
