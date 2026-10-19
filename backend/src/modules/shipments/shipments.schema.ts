import { z } from 'zod';

export const shipmentSchema = z.object({
  date: z.string(),
  customerId: z.number().optional().nullable(),
  customerName: z.string().min(1),
  isWalkIn: z.boolean().default(false),
  walkInName: z.string().optional().nullable(),
  courier: z.string().min(1),
  service: z.string().trim().min(1, 'Service is required').default('Express'),
  awb: z.string().trim().min(1, 'AWB cannot be blank'),
  origin: z.string().default(''),
  destination: z.string().trim().min(1, 'Destination country is required'),
  destinationAddress: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  consignee: z.string().trim().min(1, 'Consignee is required'),
  pieces: z.preprocess(
  v => (v === '' || v === null || v === undefined || Number.isNaN(v) ? 0 : v),
  z.coerce.number().int().min(0)
),
  weight: z.coerce.number().min(0),
  shipInv: z.string().optional().nullable(),
  jobNo: z.string().optional().nullable(),
  revenue: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
  status: z.enum(['Pending', 'Shipped', 'Delivered', 'Returned', 'Unfinal']).default('Pending'),
  notes: z.string().optional().nullable(),
  overrideCredit: z.boolean().optional(),
  cartonsUsed: z.array(z.object({
    cartonTypeId: z.number(),
    quantity: z.number().int().min(1),
  })).optional(),
});

export const updateShipmentSchema = shipmentSchema.partial();

export type ShipmentInput = z.infer<typeof shipmentSchema>;