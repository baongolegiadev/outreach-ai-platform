import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://postgres:postgres@localhost:5432/outreach_test';
    process.env.WEB_ORIGIN ??= 'http://localhost:3000';
    process.env.JWT_SECRET ??=
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.API_PUBLIC_URL ??= 'http://localhost:3001';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1', {
      exclude: [
        'health',
        { path: 'track/opens/:token', method: RequestMethod.GET },
      ],
    });
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/track/opens/:token (GET) returns a transparent GIF', () => {
    return request(app.getHttpServer())
      .get('/track/opens/not-a-real-token')
      .expect(200)
      .expect('Content-Type', /image\/gif/)
      .expect('Cache-Control', /no-store/);
  });

  afterEach(async () => {
    await app.close();
  });
});
