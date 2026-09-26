import z from 'zod';

export const BundleSkillRef = z.object({
  skillName: z.string(),
  required: z.boolean().default(true),
  loadMode: z.enum(['inline', 'reference']).default('inline'),
});

export type BundleSkillRef = z.infer<typeof BundleSkillRef>;

export const BundleSpec = z
  .object({
    name: z.string(),
    description: z.string(),
    skills: z.array(BundleSkillRef).min(1),
    origin: z.object({
      kind: z.literal('created'),
      fromSpecId: z.string().optional(),
    }),
    createdAt: z.string().datetime(),
  })
  .meta({ ref: 'CreationBundleSpec' });

export type BundleSpec = z.infer<typeof BundleSpec>;

// P2-9（2026-09-26 评审）：`InversionBundleSpec` 在评审时全仓零引用，
// 属于"预留 API"且 spec/ 子模块没有 re-export 它。删除避免误导后续维护者。
// 未来真要做 inversion + pipeline 组合时再从 git history 恢复。
