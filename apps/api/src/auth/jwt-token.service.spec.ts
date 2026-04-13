import { ConfigService } from '@nestjs/config';
import { JwtTokenService } from './jwt-token.service';

describe('JwtTokenService', () => {
  const configService = new ConfigService({
    JWT_SECRET: '12345678901234567890123456789012',
    JWT_ACCESS_TTL_SECONDS: 900,
  });
  const service = new JwtTokenService(configService);

  it('issues and verifies JWT access token', () => {
    const token = service.issueAccessToken({
      sub: 'user-id',
      email: 'user@example.com',
    });

    const payload = service.verifyAccessToken(token);
    expect(payload.sub).toBe('user-id');
    expect(payload.email).toBe('user@example.com');
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });
});
