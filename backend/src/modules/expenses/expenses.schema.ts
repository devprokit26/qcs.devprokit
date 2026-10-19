import { z } from 'zod';
import { mapExpensePaymentMethodToKey } from '../../lib/enums';

const paymentMethodTransform = z.string().transform((val, ctx) => {
  const key = mapExpensePaymentMethodToKey(val);
  if (!key) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid payment method: ${val}` });
    return z.NEVER;
  }
  return key;
});

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  isActive: z.boolean().default(true)
});

export const expenseSchema = z.object({
  date: z.string(),
  categoryId: z.number(),
  amount: z.coerce.number().min(0.01),
  description: z.string().min(1),
  paidTo: z.string().optional().nullable(),
  paymentMethod: paymentMethodTransform.default('Cash'),
  referenceNo: z.string().optional().nullable()
});

export const updateExpenseSchema = z.object({
  date: z.string().optional(),
  categoryId: z.number().optional(),
  amount: z.coerce.number().min(0.01).optional(),
  description: z.string().min(1).optional(),
  paidTo: z.string().optional().nullable(),
  paymentMethod: paymentMethodTransform.optional(),
  referenceNo: z.string().optional().nullable()
});

(expenseSchema as any).partial = () => updateExpenseSchema;

export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
