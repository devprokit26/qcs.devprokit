import { VendorInput } from './vendors.schema';
export declare function listVendors(search?: string): Promise<{
    id: any;
    name: any;
    phone: any;
    email: any;
    city: any;
    category: any;
    creditDays: any;
    accountCode: any;
    branch: any;
    openingBalance: number;
    services: any;
}[]>;
export declare function getVendor(id: number): Promise<{
    id: any;
    name: any;
    phone: any;
    email: any;
    city: any;
    category: any;
    creditDays: any;
    accountCode: any;
    branch: any;
    openingBalance: number;
    services: any;
}>;
export declare function createVendor(input: VendorInput): Promise<{
    id: any;
    name: any;
    phone: any;
    email: any;
    city: any;
    category: any;
    creditDays: any;
    accountCode: any;
    branch: any;
    openingBalance: number;
    services: any;
}>;
export declare function updateVendor(id: number, input: Partial<VendorInput>): Promise<{
    id: any;
    name: any;
    phone: any;
    email: any;
    city: any;
    category: any;
    creditDays: any;
    accountCode: any;
    branch: any;
    openingBalance: number;
    services: any;
}>;
/**
 * Deletes a vendor together with all of their ledger entries (bills and
 * payments) — same behaviour as deleting a customer.
 */
export declare function deleteVendor(id: number): Promise<void>;
export declare function getVendorAging(id: number): Promise<import("../../lib/domain/aging").AgingBuckets>;
//# sourceMappingURL=vendors.service.d.ts.map