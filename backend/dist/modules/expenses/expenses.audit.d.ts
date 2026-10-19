/** Flat, readable copy of an expense used for the audit log (before / after diffs). */
export declare function snapshotExpense(id: number): Promise<{
    date: string;
    category: string;
    amount: number;
    description: string;
    paidTo: string;
    paymentMethod: string;
    referenceNo: string;
} | null>;
//# sourceMappingURL=expenses.audit.d.ts.map