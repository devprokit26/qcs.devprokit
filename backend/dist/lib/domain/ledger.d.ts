export interface LedgerPostingAction {
    target: 'customer' | 'vendor';
    entityId: number;
    transaction: {
        date: string;
        description: string;
        type: 'debit' | 'credit';
        amount: number;
        voucherType: string;
        voucherNo: string;
        jobNo?: string;
        shipInv?: string;
        branch?: string;
        orig?: string;
        dest?: string;
        pcsWeight?: string;
    };
}
export interface PostingResult {
    actions: LedgerPostingAction[];
    updatedCounters: Record<string, number>;
}
export declare function generateShipmentCreateEntries(shipment: any, customer: any, vendor: any, currentCounters?: Record<string, number>): PostingResult;
export declare function generateShipmentUpdateEntries(oldShipment: any, newShipment: any, oldCustomer: any, newCustomer: any, oldVendor: any, newVendor: any, currentCounters?: Record<string, number>): PostingResult;
//# sourceMappingURL=ledger.d.ts.map