import { calculateCustomerBalance } from './balance';
import { calculateCustomerAging } from './aging';

export interface CreditLimitCheckResult {
  exceed: boolean;
  customer: string;
  creditLimit: number;
  currentBalance: number;
  newBalance: number;
  exceedBy: number;
  daysLateBreach: boolean;
  oldestDaysOverdue: number;
  creditDays: number;
}

export function checkCustomerCredit(
  customer: { name: string; creditLimit: number; creditDays: number; openingBalance?: number } | null | undefined,
  transactions: Array<{ date: string; description: string; type: 'debit' | 'credit'; amount: number }> = [],
  additionalAmount: number = 0,
  asOfDate: Date = new Date()
): CreditLimitCheckResult {
  if (!customer) {
    return {
      exceed: false,
      customer: 'Unknown',
      creditLimit: 0,
      currentBalance: 0,
      newBalance: 0,
      exceedBy: 0,
      daysLateBreach: false,
      oldestDaysOverdue: 0,
      creditDays: 30,
    };
  }

  const currentBalance = calculateCustomerBalance(customer, transactions);
  const newBalance = currentBalance + additionalAmount;
  const exceed = newBalance > customer.creditLimit;
  const exceedBy = Math.max(0, newBalance - customer.creditLimit);

  const aging = calculateCustomerAging(customer, transactions, asOfDate);
  const daysLateBreach = aging.oldestDaysOverdue > 0;

  return {
    exceed,
    customer: customer.name,
    creditLimit: customer.creditLimit,
    currentBalance,
    newBalance,
    exceedBy,
    daysLateBreach,
    oldestDaysOverdue: aging.oldestDaysOverdue,
    creditDays: customer.creditDays || 30,
  };
}
