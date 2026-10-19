import { CustomerInput } from './customers.schema';
export declare function listCustomers(): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    email: string;
    city: string;
    creditLimit: import("@prisma/client/runtime/library").Decimal;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: import("@prisma/client/runtime/library").Decimal;
}[]>;
export declare function getCustomer(id: number): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    email: string;
    city: string;
    creditLimit: import("@prisma/client/runtime/library").Decimal;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: import("@prisma/client/runtime/library").Decimal;
}>;
export declare function createCustomer(input: CustomerInput): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    email: string;
    city: string;
    creditLimit: import("@prisma/client/runtime/library").Decimal;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: import("@prisma/client/runtime/library").Decimal;
}>;
export declare function updateCustomer(id: number, input: Partial<CustomerInput>): Promise<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    phone: string;
    email: string;
    city: string;
    creditLimit: import("@prisma/client/runtime/library").Decimal;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: import("@prisma/client/runtime/library").Decimal;
}>;
export declare function deleteCustomer(id: number): Promise<void>;
//# sourceMappingURL=customers.service.d.ts.map