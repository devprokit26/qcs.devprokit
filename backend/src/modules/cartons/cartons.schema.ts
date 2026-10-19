import { z } from 'zod';

export const cartonTypeSchema = z.object({
  name: z.string().min(1),
  lengthCm: z.coerce.number().optional().nullable(),
  widthCm: z.coerce.number().optional().nullable(),
  heightCm: z.coerce.number().optional().nullable(),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  isActive: z.boolean().default(true)
});

/** Creating a NEW carton type may also record its first stock (opening quantity + unit price). */
export const cartonTypeCreateSchema = cartonTypeSchema.extend({
  openingQuantity: z.coerce.number().int().min(0).optional().nullable(),
  openingUnitCost: z.coerce.number().min(0).optional().nullable(),
});

export const cartonMovementSchema = z.object({
  cartonTypeId: z.number(),
  date: z.string(),
  movementType: z.enum(['RECEIVED', 'USED', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURNED']),
  quantity: z.number().int().min(1),
  shipmentId: z.number().optional().nullable(),
  vendorId: z.number().optional().nullable(),
  unitCost: z.coerce.number().optional().nullable(),
  note: z.string().optional().nullable()
});

export type CartonTypeInput = z.infer<typeof cartonTypeSchema>;
export type CartonTypeCreateInput = z.infer<typeof cartonTypeCreateSchema>;
export type CartonMovementInput = z.infer<typeof cartonMovementSchema>;
