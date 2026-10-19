export interface AgingBuckets {
    current: number;
    d1_30: number;
    d31_60: number;
    d60plus: number;
    totalOverdue: number;
    oldestDaysOverdue: number;
    termDays: number;
    overdueInvoices: Array<{
        date: string;
        description: string;
        amount: number;
        daysOverdue: number;
    }>;
}
export declare function calculateCustomerAging(customer: {
    creditDays?: number;
    openingBalance?: number;
} | null | undefined, transactions?: Array<{
    date: string;
    description: string;
    type: 'debit' | 'credit';
    amount: number;
}>, asOfDate?: Date): AgingBuckets;
export declare function calculateVendorAging(vendor: {
    creditDays?: number;
    openingBalance?: number;
} | null | undefined, transactions?: Array<{
    date: string;
    description: string;
    type: 'debit' | 'credit';
    amount: number;
}>, asOfDate?: Date): AgingBuckets;
//# sourceMappingURL=aging.d.ts.map