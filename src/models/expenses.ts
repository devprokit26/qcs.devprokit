import { Expense } from './types';

/** Sum all expenses for a given date string (YYYY-MM-DD) */
export function dailyTotal(expenses: Expense[], date: string): number {
  return expenses
    .filter(e => e.date === date)
    .reduce((s, e) => s + e.amount, 0);
}

/** Sum all expenses within a date range (inclusive) */
export function periodTotal(expenses: Expense[], from: string, to: string): number {
  return expenses
    .filter(e => e.date >= from && e.date <= to)
    .reduce((s, e) => s + e.amount, 0);
}

/** Group expenses by category ID and return totals */
export function totalsByCategory(expenses: Expense[]): Record<number, number> {
  return expenses.reduce<Record<number, number>>((acc, e) => {
    acc[e.categoryId] = (acc[e.categoryId] ?? 0) + e.amount;
    return acc;
  }, {});
}

/** Group daily totals for sparkline/chart data */
export function dailyBreakdown(
  expenses: Expense[],
  from: string,
  to: string
): Array<{ date: string; total: number }> {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    if (e.date >= from && e.date <= to) {
      map[e.date] = (map[e.date] ?? 0) + e.amount;
    }
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
}

/** Net profit = revenue - cost - expenses */
export function netProfitAfterExpenses(
  revenue: number,
  cost: number,
  expenses: number
): number {
  return revenue - cost - expenses;
}
