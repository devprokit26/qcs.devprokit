import { z } from 'zod';

const item = z.object({
  description: z.string().default(''),      // product name
  madeOf: z.string().default(''),           // description with made-of detail
  hsCode: z.string().default(''),
  originCountry: z.string().default('Pakistan'),
  sizesColors: z.string().default(''),
  gender: z.string().default(''),
  qty: z.coerce.number().min(0).default(0),
  unit: z.string().default('PCS'),
  unitPrice: z.coerce.number().min(0).default(0),
});
const box = z.object({
  contents: z.string().default(''),
  l: z.coerce.number().min(0).default(0),
  w: z.coerce.number().min(0).default(0),
  h: z.coerce.number().min(0).default(0),
  grossWeight: z.coerce.number().min(0).default(0),
  netWeight: z.coerce.number().min(0).default(0),
});

export const proformaSchema = z.object({
  shipmentId: z.number().int().nullable().optional(),
  type: z.enum(['COMMERCIAL', 'GIFT', 'DOX']),
  invoiceDate: z.string().min(1),
  shipperName: z.string().trim().default(''),
  shipperCnic: z.string().trim().default(''),
  shipperAddress: z.string().trim().default(''),
  shipperPhone: z.string().trim().regex(/^\d{11}$/).or(z.literal('')).default(''),
  demoConsigneeName: z.string().trim().default(''),
  demoConsigneeAddress: z.string().trim().default(''),
  demoConsigneePhone: z.string().trim().regex(/^\d{11}$/).or(z.literal('')).default(''),
  cartonNo: z.string().trim().default(''),
  currency: z.string().trim().min(1).default('USD'),
  exchangeRate: z.coerce.number().min(0).nullable().optional(),
  incoterm: z.string().trim().default('CFR'),
  reasonForExport: z.string().trim().default('Sale'),
  freight: z.coerce.number().min(0).default(0),
  items: z.array(item).default([]),
  packages: z.array(box).default([]),
  notes: z.string().optional().nullable(),
  realShipperName: z.string().trim().default(''),
  soldTo: z.string().trim().default(''),
  departure: z.string().trim().default('Sialkot, Pakistan'),
  invoiceHsCode: z.string().trim().default(''),
  awb: z.string().trim().optional().default(''),
  destination: z.string().trim().optional().default(''),
  origin: z.string().trim().optional().default('Pakistan'),
  shipDate: z.string().trim().optional().default(''),
  pieces: z.coerce.number().min(0).optional().default(0),
  weight: z.coerce.number().min(0).optional().default(0),
});
export const updateProformaSchema = proformaSchema.omit({ shipmentId: true }).partial();
export type ProformaInput = z.infer<typeof proformaSchema>;