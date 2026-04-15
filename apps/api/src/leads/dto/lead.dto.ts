import { z } from 'zod';

const uuidSchema = z.string().uuid();

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }
      return value;
    });

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().email().toLowerCase(),
  company: optionalTrimmedString(160),
  tagIds: z.array(uuidSchema).max(100).optional().default([]),
});

export const updateLeadSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    email: z.string().email().toLowerCase().optional(),
    company: optionalTrimmedString(160),
    tagIds: z.array(uuidSchema).max(100).optional(),
  })
  .refine(
    (payload) =>
      payload.name !== undefined ||
      payload.email !== undefined ||
      payload.company !== undefined ||
      payload.tagIds !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

const listTagIdsSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value) => {
    if (!value) {
      return [];
    }

    const rawValues = Array.isArray(value) ? value : value.split(',');
    return rawValues
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  })
  .pipe(z.array(uuidSchema).max(100));

export const listLeadsSchema = z.object({
  search: z.string().trim().min(1).max(160).optional(),
  company: z.string().trim().min(1).max(160).optional(),
  tagIds: listTagIdsSchema,
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateLeadDto = z.infer<typeof createLeadSchema>;
export type UpdateLeadDto = z.infer<typeof updateLeadSchema>;
export type ListLeadsDto = z.infer<typeof listLeadsSchema>;
