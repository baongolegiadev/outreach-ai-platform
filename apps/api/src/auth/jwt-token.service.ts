import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { JwtAuthPayload } from './auth.types';

interface TokenPayloadInput {
  sub: string;
  email: string;
}

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

@Injectable()
export class JwtTokenService {
  private readonly accessTokenTtlSeconds: number;
  private readonly jwtSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.accessTokenTtlSeconds =
      this.configService.get<number>('JWT_ACCESS_TTL_SECONDS') ?? 900;
  }

  issueAccessToken(input: TokenPayloadInput): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload: JwtAuthPayload = {
      sub: input.sub,
      email: input.email,
      iat: issuedAt,
      exp: issuedAt + this.accessTokenTtlSeconds,
    };

    const header: JwtHeader = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = this.sign(signingInput);
    return `${signingInput}.${signature}`;
  }

  verifyAccessToken(token: string): JwtAuthPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid access token');
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.sign(signingInput);
    if (expectedSignature !== signature) {
      throw new UnauthorizedException('Invalid access token');
    }

    let payload: Partial<JwtAuthPayload>;
    try {
      const payloadJson = this.base64UrlDecode(encodedPayload);
      payload = JSON.parse(payloadJson) as Partial<JwtAuthPayload>;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
    if (!payload.sub || !payload.email || !payload.exp || !payload.iat) {
      throw new UnauthorizedException('Invalid access token');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp <= currentTime) {
      throw new UnauthorizedException('Access token expired');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      exp: payload.exp,
      iat: payload.iat,
    };
  }

  getAccessTokenTtlSeconds(): number {
    return this.accessTokenTtlSeconds;
  }

  private sign(input: string): string {
    return createHmac('sha256', this.jwtSecret)
      .update(input)
      .digest('base64url');
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  private base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
  }
}
