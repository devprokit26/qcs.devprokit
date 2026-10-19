import { prisma } from '../../prisma/client';
import { toNumber } from '../../lib/serialize';
import { mapExpensePaymentMethodToLabel } from '../../lib/enums';

/** Flat, readable copy of an expense used for the audit log (before / after diffs). */
export async function snapshotExpense(id: number) {
  const e = await prisma.expense.findUnique({ where: { id }, include: { category: true } });
  if (!e) return null;
  return {
    date: e.date,
    category: e.category?.name ?? '',
    amount: toNumber(e.amount),
    description: e.description,
    paidTo: e.paidTo ?? '',
    paymentMethod: mapExpensePaymentMethodToLabel(e.paymentMethod),
    referenceNo: e.referenceNo ?? '',
  };
}