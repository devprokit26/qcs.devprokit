import { Customer, Vendor, LedgerTransaction, AgingBuckets } from './types';

/**
 * Pure function: Calculates aging with FIFO credit allocation against oldest debits.
 * Remainder falls into buckets:
 * - Current (not due, <= termDays)
 * - 1-30 days overdue
 * - 31-60 days overdue
 * - 60+ days overdue
 * Opening balance counts as the oldest debit.
 */
export function calculateCustomerAging(
  customer: Customer | null | undefined,
  transactions: LedgerTransaction[] = [],
  asOfDate: Date = new Date()
): AgingBuckets {
  const termDays = customer?.creditDays ?? 30;
  
  // Clone debits and sort chronologically (oldest first)
  const debits: Array<{ date: string; description: string; remaining: number }> = transactions
    .filter(t => t.type === 'debit')
    .map(t => ({ date: t.date, description: t.description, remaining: t.amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Opening balance counts as the oldest debit
  if (customer && customer.openingBalance > 0) {
    const earliestDate = debits.length
      ? debits[0].date
      : (transactions.length ? transactions[0].date : asOfDate.toISOString().split('T')[0]);
    debits.unshift({
      date: earliestDate,
      description: 'Opening Balance',
      remaining: customer.openingBalance,
    });
  }

  // Sum all credits (payments / adjustments)
  let creditPool = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Allocate credits FIFO against oldest debits
  for (const d of debits) {
    if (creditPool <= 0) break;
    const applied = Math.min(d.remaining, creditPool);
    d.remaining -= applied;
    creditPool -= applied;
  }

  const buckets = {
    current: 0,
    d1_30: 0,
    d31_60: 0,
    d60plus: 0,
  };

  let oldestDaysOverdue = 0;
  const overdueInvoices: Array<{
    date: string;
    description: string;
    amount: number;
    daysOverdue: number;
  }> = [];

  const asOfTime = asOfDate.getTime();

  debits.forEach(d => {
    if (d.remaining <= 0.01) return;
    const invoiceDate = new Date(d.date + 'T00:00:00').getTime();
    const daysSince = Math.floor((asOfTime - invoiceDate) / (1000 * 60 * 60 * 24));
    const daysOverdue = daysSince - termDays;

    if (daysOverdue <= 0) {
      buckets.current += d.remaining;
    } else if (daysOverdue <= 30) {
      buckets.d1_30 += d.remaining;
    } else if (daysOverdue <= 60) {
      buckets.d31_60 += d.remaining;
    } else {
      buckets.d60plus += d.remaining;
    }

    if (daysOverdue > 0) {
      if (daysOverdue > oldestDaysOverdue) oldestDaysOverdue = daysOverdue;
      overdueInvoices.push({
        date: d.date,
        description: d.description,
        amount: Math.round(d.remaining),
        daysOverdue,
      });
    }
  });

  overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);
  const totalOverdue = buckets.d1_30 + buckets.d31_60 + buckets.d60plus;

  return {
    current: Math.round(buckets.current),
    d1_30: Math.round(buckets.d1_30),
    d31_60: Math.round(buckets.d31_60),
    d60plus: Math.round(buckets.d60plus),
    totalOverdue: Math.round(totalOverdue),
    oldestDaysOverdue,
    termDays,
    overdueInvoices,
  };
}

export function calculateVendorAging(
  vendor: Vendor | null | undefined,
  transactions: LedgerTransaction[] = [],
  asOfDate: Date = new Date()
): AgingBuckets {
  const termDays = vendor?.creditDays ?? 30;

  const debits: Array<{ date: string; description: string; remaining: number }> = transactions
    .filter(t => t.type === 'debit')
    .map(t => ({ date: t.date, description: t.description, remaining: t.amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (vendor && vendor.openingBalance > 0) {
    const earliestDate = debits.length
      ? debits[0].date
      : (transactions.length ? transactions[0].date : asOfDate.toISOString().split('T')[0]);
    debits.unshift({
      date: earliestDate,
      description: 'Opening Balance',
      remaining: vendor.openingBalance,
    });
  }

  let creditPool = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  for (const d of debits) {
    if (creditPool <= 0) break;
    const applied = Math.min(d.remaining, creditPool);
    d.remaining -= applied;
    creditPool -= applied;
  }

  const buckets = { current: 0, d1_30: 0, d31_60: 0, d60plus: 0 };
  let oldestDaysOverdue = 0;
  const overdueInvoices: Array<{
    date: string;
    description: string;
    amount: number;
    daysOverdue: number;
  }> = [];

  const asOfTime = asOfDate.getTime();

  debits.forEach(d => {
    if (d.remaining <= 0.01) return;
    const billDate = new Date(d.date + 'T00:00:00').getTime();
    const daysSince = Math.floor((asOfTime - billDate) / (1000 * 60 * 60 * 24));
    const daysOverdue = daysSince - termDays;

    if (daysOverdue <= 0) buckets.current += d.remaining;
    else if (daysOverdue <= 30) buckets.d1_30 += d.remaining;
    else if (daysOverdue <= 60) buckets.d31_60 += d.remaining;
    else buckets.d60plus += d.remaining;

    if (daysOverdue > 0) {
      if (daysOverdue > oldestDaysOverdue) oldestDaysOverdue = daysOverdue;
      overdueInvoices.push({
        date: d.date,
        description: d.description,
        amount: Math.round(d.remaining),
        daysOverdue,
      });
    }
  });

  overdueInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return {
    current: Math.round(buckets.current),
    d1_30: Math.round(buckets.d1_30),
    d31_60: Math.round(buckets.d31_60),
    d60plus: Math.round(buckets.d60plus),
    totalOverdue: Math.round(buckets.d1_30 + buckets.d31_60 + buckets.d60plus),
    oldestDaysOverdue,
    termDays,
    overdueInvoices,
  };
}
