import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1).max(300),
  phone: z.string().regex(/^\d{11}$/).or(z.literal('')).default(''),
  email: z.string().email().max(200).or(z.literal('')).default(''),
  city: z.string().max(100).default(''),
  creditLimit: z.coerce.number().min(0).default(0),
  creditDays: z.coerce.number().int().min(0).max(365).default(30),
  accountCode: z.string().max(50).default(''),
  branch: z.string().max(50).default(''),
  openingBalance: z.coerce.number().min(0).default(0),
});

export type CustomerInput = z.infer<typeof customerSchema>;
