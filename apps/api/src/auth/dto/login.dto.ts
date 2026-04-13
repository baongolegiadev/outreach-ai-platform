import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  workspaceId: z.string().uuid().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
