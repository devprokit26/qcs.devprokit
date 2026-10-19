import { ExpenseInput } from './expenses.schema';
export declare function listExpenseCategories(): Promise<{
    id: number;
    name: string;
    isActive: boolean;
}[]>;
export declare function listExpenses(): Promise<({
    category: {
        id: number;
        name: string;
        isActive: boolean;
    };
    createdBy: {
        username: string;
    } | null;
} & {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    date: string;
    description: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    categoryId: number;
    paidTo: string | null;
    paymentMethod: import(".prisma/client").$Enums.ExpensePaymentMethod;
    referenceNo: string | null;
    createdById: number | null;
})[]>;
export declare function createExpense(input: ExpenseInput, userId: number): Promise<{
    category: {
        id: number;
        name: string;
        isActive: boolean;
    };
} & {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    date: string;
    description: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    categoryId: number;
    paidTo: string | null;
    paymentMethod: import(".prisma/client").$Enums.ExpensePaymentMethod;
    referenceNo: string | null;
    createdById: number | null;
}>;
export declare function updateExpense(id: number, input: Partial<ExpenseInput>): Promise<{
    category: {
        id: number;
        name: string;
        isActive: boolean;
    };
} & {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    date: string;
    description: string;
    amount: import("@prisma/client/runtime/library").Decimal;
    categoryId: number;
    paidTo: string | null;
    paymentMethod: import(".prisma/client").$Enums.ExpensePaymentMethod;
    referenceNo: string | null;
    createdById: number | null;
}>;
export declare function deleteExpense(id: number): Promise<void>;
//# sourceMappingURL=expenses.service.d.ts.map