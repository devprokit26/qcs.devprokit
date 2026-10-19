export function getNextVoucherNumber(
  counters: Record<string, number>,
  voucherType: string
): { updatedCounters: Record<string, number>; nextNumber: number; voucherNoStr: string } {
  const current = counters[voucherType] || 0;
  const nextNumber = current + 1;
  const updatedCounters = {
    ...counters,
    [voucherType]: nextNumber,
  };
  return {
    updatedCounters,
    nextNumber,
    voucherNoStr: String(nextNumber),
  };
}

export function formatVoucherDisplay(voucherType: string, voucherNo?: string | number): string {
  if (!voucherNo) return voucherType;
  return `${voucherType} ${voucherNo}`;
}
