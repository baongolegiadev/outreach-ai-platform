import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url(),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  OUTBOUND_DEFAULT_FROM_EMAIL: z.string().email().default('no-reply@example.com'),
  OUTBOUND_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(30),
  OUTBOUND_RETRY_BASE_SECONDS: z.coerce.number().int().positive().default(30),
  OUTBOUND_WORKER_POLL_MS: z.coerce.number().int().positive().default(5000),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): Env => {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  return parsed.data;
};
