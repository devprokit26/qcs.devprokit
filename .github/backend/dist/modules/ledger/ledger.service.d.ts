export declare function getCustomerLedger(customerId: number): Promise<{
    id: number;
    createdAt: Date;
    type: string;
    date: string;
    branch: string | null;
    customerId: number;
    shipInv: string | null;
    jobNo: string | null;
    description: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    voucherType: import(".prisma/client").$Enums.CustomerVoucherType;
    voucherNo: string;
    orig: string | null;
    dest: string | null;
    pcsWeight: string | null;
    chequeNo: string | null;
    chequeDate: string | null;
}[]>;
export declare function getVendorLedger(vendorId: number): Promise<{
    id: number;
    createdAt: Date;
    type: string;
    date: string;
    jobNo: string | null;
    vendorId: number;
    description: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    voucherType: import(".prisma/client").$Enums.VendorVoucherType;
    voucherNo: string;
    chequeNo: string | null;
    chequeDate: string | null;
}[]>;
//# sourceMappingURL=ledger.service.d.ts.map