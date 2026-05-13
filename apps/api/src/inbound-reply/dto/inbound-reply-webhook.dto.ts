import { z } from 'zod';

export const inboundReplyWebhookBodySchema = z.object({
  workspaceId: z.string().uuid(),
  leadEmail: z.string().email().transform((v) => v.toLowerCase()),
  /** When set (e.g. provider Message-Id), duplicate deliveries are ignored for the same workspace. */
  externalMessageId: z
    .string()
    .trim()
    .min(1)
    .max(512)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type InboundReplyWebhookBody = z.infer<typeof inboundReplyWebhookBodySchema>;
