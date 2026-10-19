export function calculateCustomerBalance(
  customer: { openingBalance?: number } | null | undefined,
  transactions: Array<{ type: 'debit' | 'credit'; amount: number }> = []
): number {
  const opening = customer?.openingBalance || 0;
  const txnSum = transactions.reduce((acc, t) => {
    return t.type === 'debit' ? acc + t.amount : acc - t.amount;
  }, 0);
  return Math.round(opening + txnSum);
}

export function calculateVendorBalance(
  vendor: { openingBalance?: number } | null | undefined,
  transactions: Array<{ type: 'debit' | 'credit'; amount: number }> = []
): number {
  const opening = vendor?.openingBalance || 0;
  const txnSum = transactions.reduce((acc, t) => {
    return t.type === 'debit' ? acc + t.amount : acc - t.amount;
  }, 0);
  return Math.round(opening + txnSum);
}
