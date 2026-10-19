import { Customer, LedgerTransaction } from './types';

export interface CustomerDueInfo {
  invoiceDate: Date;
  dueDate: Date;
  termDays: number;
  daysLeft: number;
}

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function dateKey(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatCustomerListDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function getCustomerDueInfo(
  customer: Customer,
  transactions: LedgerTransaction[],
  today: string
): CustomerDueInfo | null {
  const termDays = customer.creditDays || 30;
  const validTransactions = transactions
    .map(transaction => ({ transaction, date: parseDate(transaction.date) }))
    .filter((item): item is { transaction: LedgerTransaction; date: Date } => item.date !== null);

  const debits = validTransactions
    .filter(item => item.transaction.type === 'debit' && item.transaction.amount > 0)
    .sort((a, b) => dateKey(a.date) - dateKey(b.date) || (Number(a.transaction.id) || 0) - (Number(b.transaction.id) || 0))
    .map(item => ({
      date: item.date,
      remaining: item.transaction.amount,
    }));

  if (customer.openingBalance > 0) {
    const openingDate = debits[0]?.date
      ?? validTransactions.sort((a, b) => dateKey(a.date) - dateKey(b.date))[0]?.date
      ?? parseDate(today);
    if (openingDate) debits.unshift({ date: openingDate, remaining: customer.openingBalance });
  }

  let creditPool = validTransactions
    .filter(item => item.transaction.type === 'credit')
    .reduce((sum, item) => sum + Math.max(0, item.transaction.amount), 0);

  for (const debit of debits) {
    const applied = Math.min(debit.remaining, creditPool);
    debit.remaining -= applied;
    creditPool -= applied;
    if (creditPool <= 0) break;
  }

  const oldestUnpaid = debits.find(debit => debit.remaining > 0.01);
  const todayDate = parseDate(today);
  if (!oldestUnpaid || !todayDate) return null;

  const invoiceDate = oldestUnpaid.date;
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + termDays);

  return {
    invoiceDate,
    dueDate,
    termDays,
    daysLeft: Math.round((dateKey(dueDate) - dateKey(todayDate)) / 86400000),
  };
}
