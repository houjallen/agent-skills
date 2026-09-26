import z from 'zod';

export const PortabilitySpec = z
  .object({
    platforms: z.array(z.string()),
    tools: z.array(z.string()),
  })
  .meta({ ref: 'CreationPortabilitySpec' });

export type PortabilitySpec = z.infer<typeof PortabilitySpec>;
