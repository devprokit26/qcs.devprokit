import { z } from 'zod';

export const weightBoxSchema = z.object({
  id: z.string().optional(),
  actWeight: z.coerce.number(),
  l: z.coerce.number(),
  w: z.coerce.number(),
  h: z.coerce.number(),
});

export const weightProformaSchema = z.object({
  cnNo: z.string().min(1),
  shipper: z.string().min(1),
  services: z.string().default(''),
  date: z.string(),
  divisor: z.coerce.number().default(5000),
  shipmentId: z.number().optional().nullable(),
  boxes: z.array(weightBoxSchema).default([]),
});

export const updateWeightProformaSchema = weightProformaSchema.partial();

export type WeightProformaInput = z.infer<typeof weightProformaSchema>;
