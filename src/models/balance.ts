import { Customer, Vendor, LedgerTransaction } from './types';

/**
 * Pure function: Customer balance = opening balance + sum(debits) - sum(credits)
 * Positive balance means customer owes money (Dr).
 */
export function calculateCustomerBalance(
  customer: Customer | null | undefined,
  transactions: LedgerTransaction[] = []
): number {
  const opening = customer?.openingBalance || 0;
  const txnSum = transactions.reduce((acc, t) => {
    return t.type === 'debit' ? acc + t.amount : acc - t.amount;
  }, 0);
  return Math.round(opening + txnSum);
}

/**
 * Pure function: Vendor balance = opening balance + sum(debits) - sum(credits)
 * Positive balance means we owe the vendor (payable / Dr).
 */
export function calculateVendorBalance(
  vendor: Vendor | null | undefined,
  transactions: LedgerTransaction[] = []
): number {
  const opening = vendor?.openingBalance || 0;
  const txnSum = transactions.reduce((acc, t) => {
    return t.type === 'debit' ? acc + t.amount : acc - t.amount;
  }, 0);
  return Math.round(opening + txnSum);
}
