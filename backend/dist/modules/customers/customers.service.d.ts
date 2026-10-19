import { CustomerInput } from './customers.schema';
export declare function listCustomers(search?: string): Promise<{
    id: any;
    name: any;
    phone: any;
    email: any;
    city: any;
    creditLimit: number;
    creditDays: any;
    accountCode: any;
    branch: any;
    openingBalance: number;
}[]>;
export declare function getCustomer(id: number): Promise<{
    id: any;
    name: any;
    phone: any;
    email: any;
    city: any;
    creditLimit: number;
    creditDays: any;
    accountCode: any;
    branch: any;
    openingBalance: number;
}>;
export declare function createCustomer(input: CustomerInput): Promise<{
    id: any;
    name: any;
    phone: any;
    email: any;
    city: any;
    creditLimit: number;
    creditDays: any;
    accountCode: any;
    branch: any;
    openingBalance: number;
}>;
export declare function updateCustomer(id: number, input: Partial<CustomerInput>): Promise<{
    id: any;
    name: any;
    phone: any;
    email: any;
    city: any;
    creditLimit: number;
    creditDays: any;
    accountCode: any;
    branch: any;
    openingBalance: number;
}>;
/**
 * Deletes a customer together with all of their ledger (khata) entries.
 * Shipments and invoices are KEPT (they still show the customer name) but are
 * unlinked from the account so revenue reports stay correct.
 */
export declare function deleteCustomer(id: number): Promise<void>;
export declare function getCustomerAging(id: number): Promise<import("../../lib/domain/aging").AgingBuckets>;
export declare function getAllCustomersAging(): Promise<Record<number, any>>;
export declare function checkCustomerCredit(id: number, additionalAmount?: number): Promise<import("../../lib/domain/credit").CreditLimitCheckResult>;
//# sourceMappingURL=customers.service.d.ts.map