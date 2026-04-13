import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health/health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    healthController = moduleRef.get<HealthController>(HealthController);
  });

  it('should return health status payload', () => {
    expect(healthController.getHealth()).toEqual({ status: 'ok' });
  });
});
