const ONES = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function underThousand(value: number): string {
  const parts: string[] = [];
  if (value >= 100) {
    parts.push(`${ONES[Math.floor(value / 100)]} Hundred`);
    value %= 100;
  }
  if (value >= 20) {
    parts.push(TENS[Math.floor(value / 10)]);
    value %= 10;
  }
  if (value > 0) parts.push(ONES[value]);
  return parts.join(' ');
}

/** Formats a non-negative PKR amount as whole rupees in words. */
export function amountInWords(amount: number): string {
  const rupees = Math.round(Number.isFinite(amount) ? Math.max(0, amount) : 0);
  if (rupees === 0) return 'Rupees Zero Only';

  let remaining = rupees;
  const chunks: string[] = [];
  const units: Array<[number, string]> = [
    [10_000_000, 'Crore'],
    [100_000, 'Lakh'],
    [1_000, 'Thousand'],
  ];
  for (const [size, label] of units) {
    const count = Math.floor(remaining / size);
    if (count) {
      chunks.push(`${underThousand(count)} ${label}`);
      remaining %= size;
    }
  }
  if (remaining) chunks.push(underThousand(remaining));
  return `Rupees ${chunks.join(' ')} Only`;
}
