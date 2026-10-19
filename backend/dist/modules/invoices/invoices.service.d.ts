export interface ListInvoicesFilter {
    search?: string;
    from?: string;
    to?: string;
    status?: string;
}
export declare function listInvoices(filter?: ListInvoicesFilter): Promise<any[]>;
/** Vendor bills (PINV / EXP-INV debits) plus vendor payments (BPV / CPV credits).
 *
 * Auto-generated PINV entries that are created when a shipment is booked
 * (description contains "— courier cost") are intentionally excluded from
 * the Bills tab. They still exist in the vendor ledger for accounting purposes
 * but should not appear on the Payments / Bills page — only manual bills
 * and actual vendor payment vouchers (BPV / CPV) are shown here.
 */
export declare function listBills(filter?: {
    from?: string;
    to?: string;
}): Promise<{
    jobNo?: any;
    id: string;
    vendorId: any;
    vendorName: any;
    date: any;
    voucherType: string;
    voucherNo: any;
    description: any;
    amount: number;
    chequeNo: any;
    paymentMethod: string | undefined;
    kind: "payment";
    voided: boolean;
}[]>;
export declare function voidInvoice(id: number, userId: number): Promise<void>;
export declare function voidReceipt(id: number, userId: number): Promise<void>;
export declare function voidBillPayment(id: number, userId: number): Promise<void>;
//# sourceMappingURL=invoices.service.d.ts.map