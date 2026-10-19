import { Customer, LedgerTransaction, CreditLimitCheckResult } from './types';
import { calculateCustomerBalance } from './balance';
import { calculateCustomerAging } from './aging';

/**
 * Pure function: Evaluates credit limits and overdue terms before booking.
 * - Warns if newBalance > customer.creditLimit
 * - Flags daysLateBreach if oldestDaysOverdue > 0 (booking blocked unless overridden)
 */
export function checkCustomerCredit(
  customer: Customer | null | undefined,
  transactions: LedgerTransaction[] = [],
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
