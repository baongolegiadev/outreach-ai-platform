import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(120).optional(),
  workspaceName: z.string().trim().min(1).max(120),
});

export type RegisterDto = z.infer<typeof registerSchema>;
