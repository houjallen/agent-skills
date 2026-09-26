import z from 'zod';

export const ReviewerChecklist = z.object({
  filePath: z.string(),
  itemCount: z.number().int().nonnegative().optional(),
  severityLevels: z.array(z.string()).min(1),
  scoringRubric: z.string().optional(),
});

export type ReviewerChecklist = z.infer<typeof ReviewerChecklist>;

export const ReviewerProcess = z.object({
  entry: z.string(),
  steps: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        checklistSection: z.string().optional(),
      }),
    )
    .min(1),
  exit: z.string(),
});

export type ReviewerProcess = z.infer<typeof ReviewerProcess>;

export const ReviewerSpec = z
  .object({
    checklist: ReviewerChecklist,
    process: ReviewerProcess,
  })
  .meta({ ref: 'CreationReviewerSpec' });

export type ReviewerSpec = z.infer<typeof ReviewerSpec>;
