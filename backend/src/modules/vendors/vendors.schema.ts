import { z } from 'zod';
import { mapVendorCategoryToKey } from '../../lib/enums';

const categoryTransform = z.string().transform((val, ctx) => {
  const key = mapVendorCategoryToKey(val);
  if (!key) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid vendor category: ${val}` });
    return z.NEVER;
  }
  return key;
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  phone: z.string().regex(/^\d{11}$/).or(z.literal('')).optional(),
  email: z.string().email().max(200).or(z.literal('')).optional(),
  city: z.string().max(100).optional(),
  category: categoryTransform.optional(),
  creditDays: z.coerce.number().int().min(0).max(365).optional(),
  accountCode: z.string().max(50).optional(),
  branch: z.string().max(50).optional(),
  openingBalance: z.coerce.number().min(0).optional(),
  services: z.array(z.string()).optional(),
});

export const vendorSchema = z.object({
  name: z.string().min(1).max(300),
  phone: z.string().regex(/^\d{11}$/).or(z.literal('')).default(''),
  email: z.string().email().max(200).or(z.literal('')).default(''),
  city: z.string().max(100).default(''),
  category: categoryTransform.default('Courier / Freight'),
  creditDays: z.coerce.number().int().min(0).max(365).default(30),
  accountCode: z.string().max(50).default(''),
  branch: z.string().max(50).default(''),
  openingBalance: z.coerce.number().min(0).default(0),
  services: z.array(z.string()).default([]),
});

(vendorSchema as any).partial = () => updateVendorSchema;

export type VendorInput = z.infer<typeof vendorSchema>;
