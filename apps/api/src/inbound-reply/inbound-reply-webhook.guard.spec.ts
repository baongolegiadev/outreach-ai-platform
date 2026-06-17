import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { InboundReplyWebhookGuard } from './inbound-reply-webhook.guard';

describe('InboundReplyWebhookGuard', () => {
  const secret = 'a'.repeat(32);

  const createGuard = async (): Promise<InboundReplyWebhookGuard> => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        InboundReplyWebhookGuard,
        {
          provide: ConfigService,
          useValue: {
            get: (_key: 'INBOUND_REPLY_WEBHOOK_SECRET', _opts: { infer: true }) =>
              secret,
          },
        },
      ],
    }).compile();
    return moduleRef.get(InboundReplyWebhookGuard);
  };

  const mockContext = (req: Partial<Request>) => ({
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  });

  it('allows valid Bearer secret', async () => {
    const guard = await createGuard();
    const ok = guard.canActivate(
      mockContext({
        headers: { authorization: `Bearer ${secret}` },
      }) as never,
    );
    expect(ok).toBe(true);
  });

  it('rejects missing Authorization', async () => {
    const guard = await createGuard();
    expect(() =>
      guard.canActivate(mockContext({ headers: {} }) as never),
    ).toThrow(UnauthorizedException);
  });

  it('rejects wrong secret', async () => {
    const guard = await createGuard();
    expect(() =>
      guard.canActivate(
        mockContext({
          headers: { authorization: `Bearer ${'b'.repeat(32)}` },
        }) as never,
      ),
    ).toThrow(UnauthorizedException);
  });

  it('rejects malformed Authorization header', async () => {
    const guard = await createGuard();
    expect(() =>
      guard.canActivate(
        mockContext({
          headers: { authorization: 'Basic xyz' },
        }) as never,
      ),
    ).toThrow(UnauthorizedException);
  });
});
