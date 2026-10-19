import { ExpenseCategoryInput, ExpenseInput } from './expenses.schema';
export declare function listExpenseCategories(): Promise<{
    id: any;
    name: any;
    isActive: boolean;
}[]>;
export declare function createExpenseCategory(input: ExpenseCategoryInput): Promise<{
    id: any;
    name: any;
    isActive: boolean;
}>;
/**
 * Deletes a category. If any expense still uses it, the category is archived
 * (isActive = false) instead so existing expenses keep their category name.
 */
export declare function deleteExpenseCategory(id: number): Promise<{
    archived: boolean;
    usedBy: number;
}>;
export declare function updateExpenseCategory(id: number, input: Partial<ExpenseCategoryInput>): Promise<{
    id: any;
    name: any;
    isActive: boolean;
}>;
export declare function listExpenses(): Promise<{
    createdBy: any;
    createdAt: any;
    updatedAt: any;
    referenceNo?: any;
    paymentMethod: any;
    paidTo?: any;
    id: any;
    date: any;
    categoryId: any;
    amount: number;
    description: any;
}[]>;
export declare function createExpense(input: ExpenseInput, userId: number): Promise<{
    createdBy: any;
    createdAt: any;
    updatedAt: any;
    referenceNo?: any;
    paymentMethod: any;
    paidTo?: any;
    id: any;
    date: any;
    categoryId: any;
    amount: number;
    description: any;
}>;
export declare function updateExpense(id: number, input: Partial<ExpenseInput>): Promise<{
    createdBy: any;
    createdAt: any;
    updatedAt: any;
    referenceNo?: any;
    paymentMethod: any;
    paidTo?: any;
    id: any;
    date: any;
    categoryId: any;
    amount: number;
    description: any;
}>;
export declare function deleteExpense(id: number): Promise<void>;
//# sourceMappingURL=expenses.service.d.ts.map