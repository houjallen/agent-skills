import z from 'zod';

export const WorkflowType = z.enum(['sequential', 'parallel', 'conditional']);
export type WorkflowType = z.infer<typeof WorkflowType>;

export const WorkflowStepKind = z.enum(['skill', 'tool', 'condition']);
export type WorkflowStepKind = z.infer<typeof WorkflowStepKind>;

export const WorkflowStep = z.object({
  id: z.string(),
  kind: WorkflowStepKind,
  ref: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
  dependsOn: z.array(z.string()).optional(),
});

export type WorkflowStep = z.infer<typeof WorkflowStep>;

export const WorkflowSpec = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: WorkflowType,
    steps: z.array(WorkflowStep).min(1),
    origin: z.object({
      kind: z.enum(['created', 'evolved']),
      fromSpecId: z.string().optional(),
    }),
    version: z.string(),
    createdAt: z.string().datetime(),
  })
  .meta({ ref: 'CreationWorkflowSpec' });

export type WorkflowSpec = z.infer<typeof WorkflowSpec>;
