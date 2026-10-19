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
export declare function checkCustomerCredit(customer: {
    name: string;
    creditLimit: number;
    creditDays: number;
    openingBalance?: number;
} | null | undefined, transactions?: Array<{
    date: string;
    description: string;
    type: 'debit' | 'credit';
    amount: number;
}>, additionalAmount?: number, asOfDate?: Date): CreditLimitCheckResult;
//# sourceMappingURL=credit.d.ts.map