import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';
import type { Env } from '../config/env.validation';

function extractBearerToken(authorization: unknown): string | null {
  if (typeof authorization !== 'string') {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  const raw = match?.[1]?.trim();
  return raw && raw.length > 0 ? raw : null;
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class InboundReplyWebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedSecret = this.config.get('INBOUND_REPLY_WEBHOOK_SECRET', {
      infer: true,
    });
    const token = extractBearerToken(request.headers.authorization);
    if (!token || !timingSafeEqualString(token, expectedSecret)) {
      throw new UnauthorizedException('Invalid inbound reply webhook credentials');
    }
    return true;
  }
}
