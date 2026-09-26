import z from 'zod';

export const InversionQuestion = z.object({
  id: z.string(),
  question: z.string(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
      }),
    )
    .min(2),
  required: z.boolean(),
  minComplete: z.number().min(0).max(1).optional(),
});

export type InversionQuestion = z.infer<typeof InversionQuestion>;

export const InversionPhase = z.object({
  id: z.string(),
  name: z.string(),
  questions: z.array(InversionQuestion).min(1),
  exitGate: z
    .object({
      allRequiredAnswered: z.boolean().optional(),
      minPhaseCompleteness: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export type InversionPhase = z.infer<typeof InversionPhase>;

export const InversionGateSpec = z
  .object({
    phases: z.array(InversionPhase).min(1),
    refuseActionWhenIncomplete: z.boolean().default(true),
  })
  .meta({ ref: 'CreationInversionGateSpec' });

export type InversionGateSpec = z.infer<typeof InversionGateSpec>;

export const PipelineEntryCondition = z.object({
  type: z.enum(['dependency-met', 'input-exists', 'permission-checked', 'custom']),
  check: z.string().optional(),
});

export const PipelineExitCondition = z.object({
  type: z.enum(['output-generated', 'review-passed', 'metric-threshold', 'manual-approve']),
  metric: z
    .object({
      name: z.string(),
      op: z.enum(['>=', '<=', '==', '!=']),
      value: z.number(),
    })
    .optional(),
});

export const PipelineOnFailure = z.object({
  action: z.enum(['abort', 'skip', 'retry']),
  maxRetries: z.number().int().positive().optional(),
  retryBackoff: z.enum(['linear', 'exponential']).optional(),
  rollback: z.boolean().optional(),
  notifyHuman: z.boolean().optional(),
});

export const PipelineStepKind = z.enum(['parse', 'transform', 'analyze', 'generate', 'review', 'deploy']);

export const PipelineReviewerRef = z.object({
  skillName: z.string(),
  checklistSection: z.string().optional(),
  onReviewFail: z.enum(['abort', 'warn-continue', 'human-review']),
});

export const PipelineStep = z.object({
  id: z.string(),
  name: z.string(),
  kind: PipelineStepKind,
  dependsOn: z.array(z.string()).optional(),
  reviewer: PipelineReviewerRef.optional(),
  gate: z.object({
    entryConditions: z.array(PipelineEntryCondition).min(1),
    exitConditions: z.array(PipelineExitCondition).min(1),
    onFailure: PipelineOnFailure,
  }),
});

export type PipelineStep = z.infer<typeof PipelineStep>;

export const PipelineSequenceSpec = z
  .object({
    steps: z.array(PipelineStep).min(2),
    policy: z
      .object({
        strictMode: z.boolean().default(true),
        rollbackOnAbort: z.boolean().default(false),
      })
      .optional(),
  })
  .meta({ ref: 'CreationPipelineSequenceSpec' });

export type PipelineSequenceSpec = z.infer<typeof PipelineSequenceSpec>;

export const BehaviorSpec = z
  .object({
    gate: InversionGateSpec.optional(),
    sequence: PipelineSequenceSpec.optional(),
  })
  .meta({ ref: 'CreationBehaviorSpec' });

export type BehaviorSpec = z.infer<typeof BehaviorSpec>;
