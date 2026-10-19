export declare function calculateCustomerBalance(customer: {
    openingBalance?: number;
} | null | undefined, transactions?: Array<{
    type: 'debit' | 'credit';
    amount: number;
}>): number;
export declare function calculateVendorBalance(vendor: {
    openingBalance?: number;
} | null | undefined, transactions?: Array<{
    type: 'debit' | 'credit';
    amount: number;
}>): number;
//# sourceMappingURL=balance.d.ts.map