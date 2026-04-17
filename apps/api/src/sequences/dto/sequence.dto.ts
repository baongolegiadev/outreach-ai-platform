import { z } from 'zod';

export const sequenceIdSchema = z
  .string()
  .uuid('sequenceId must be a valid UUID');

export const stepIdSchema = z.string().uuid('stepId must be a valid UUID');

const templateAllowedMergeFields = new Set(['first_name', 'company']);
const mergeFieldRegex = /\{\{\s*([a-z_]+)\s*\}\}/gi;

function validateMergeFields(value: string): boolean {
  const matches = value.matchAll(mergeFieldRegex);
  for (const match of matches) {
    const field = (match[1] ?? '').toLowerCase();
    if (!templateAllowedMergeFields.has(field)) {
      return false;
    }
  }
  return true;
}

export const createSequenceSchema = z.object({
  name: z.string().trim().min(1).max(160),
});
export type CreateSequenceDto = z.infer<typeof createSequenceSchema>;

export const updateSequenceSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
});
export type UpdateSequenceDto = z.infer<typeof updateSequenceSchema>;

export const listSequencesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().min(1).max(160).optional(),
});
export type ListSequencesDto = z.infer<typeof listSequencesSchema>;

export const createSequenceStepSchema = z
  .object({
    stepOrder: z.number().int().min(0).max(1000),
    delayMinutes: z.number().int().min(0).max(60 * 24 * 365),
    subject: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(20_000),
  })
  .superRefine((val, ctx) => {
    // Product rule: delay between sends cannot be zero/negative.
    // We allow the first step (order 0) to have 0 delay; subsequent steps must be >= 1.
    if (val.stepOrder > 0 && val.delayMinutes < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'delayMinutes must be >= 1 for non-first steps',
        path: ['delayMinutes'],
      });
    }
    if (!validateMergeFields(val.subject) || !validateMergeFields(val.body)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Template contains unsupported merge fields',
        path: ['subject'],
      });
    }
  });
export type CreateSequenceStepDto = z.infer<typeof createSequenceStepSchema>;

export const updateSequenceStepSchema = z
  .object({
    stepOrder: z.number().int().min(0).max(1000).optional(),
    delayMinutes: z.number().int().min(0).max(60 * 24 * 365).optional(),
    subject: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(20_000).optional(),
  })
  .superRefine((val, ctx) => {
    if (
      typeof val.stepOrder === 'number' &&
      typeof val.delayMinutes === 'number' &&
      val.stepOrder > 0 &&
      val.delayMinutes < 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'delayMinutes must be >= 1 for non-first steps',
        path: ['delayMinutes'],
      });
    }

    if (typeof val.subject === 'string' && !validateMergeFields(val.subject)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Template contains unsupported merge fields',
        path: ['subject'],
      });
    }
    if (typeof val.body === 'string' && !validateMergeFields(val.body)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Template contains unsupported merge fields',
        path: ['body'],
      });
    }
  });
export type UpdateSequenceStepDto = z.infer<typeof updateSequenceStepSchema>;

export const enrollLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(10_000),
  batchSize: z.number().int().min(1).max(1000).optional(),
});
export type EnrollLeadsDto = z.infer<typeof enrollLeadsSchema>;

