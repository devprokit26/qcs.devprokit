import { z } from 'zod';
import { mapVoucherTypeToKey } from '../../lib/enums';

export const createLedgerEntrySchema = z.object({
  date: z.string(),
  description: z.string(),
  type: z.enum(['debit', 'credit']),
  amount: z.coerce.number().min(0.01),
  voucherType: z.string().transform(mapVoucherTypeToKey),
  voucherNo: z.string().optional().nullable(),
  jobNo: z.string().optional().nullable(),
  shipInv: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  orig: z.string().optional().nullable(),
  dest: z.string().optional().nullable(),
  pcsWeight: z.string().optional().nullable(),
  chequeNo: z.string().optional().nullable(),
  chequeDate: z.string().optional().nullable(),
});

export type CreateLedgerEntryInput = z.infer<typeof createLedgerEntrySchema>;
