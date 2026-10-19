import { VendorInput } from './vendors.schema';
export declare function listVendors(): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    email: string;
    city: string;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: import("@prisma/client/runtime/library").Decimal;
    category: import(".prisma/client").$Enums.VendorCategory;
}[]>;
export declare function getVendor(id: number): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    email: string;
    city: string;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: import("@prisma/client/runtime/library").Decimal;
    category: import(".prisma/client").$Enums.VendorCategory;
}>;
export declare function createVendor(input: VendorInput): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    email: string;
    city: string;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: import("@prisma/client/runtime/library").Decimal;
    category: import(".prisma/client").$Enums.VendorCategory;
}>;
export declare function updateVendor(id: number, input: Partial<VendorInput>): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    email: string;
    city: string;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: import("@prisma/client/runtime/library").Decimal;
    category: import(".prisma/client").$Enums.VendorCategory;
}>;
export declare function deleteVendor(id: number): Promise<void>;
//# sourceMappingURL=vendors.service.d.ts.map