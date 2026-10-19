import { z } from 'zod';
export declare const expenseCategorySchema: z.ZodObject<{
    name: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
}, {
    name: string;
    isActive?: boolean | undefined;
}>;
export declare const expenseSchema: z.ZodObject<{
    date: z.ZodString;
    categoryId: z.ZodNumber;
    amount: z.ZodNumber;
    description: z.ZodString;
    paidTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    paymentMethod: z.ZodDefault<z.ZodEffects<z.ZodString, "Cash" | "Bank_Transfer" | "Online" | "Easypaisa" | "JazzCash", string>>;
    referenceNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    amount: number;
    description: string;
    paymentMethod: "Cash" | "Bank_Transfer" | "Online" | "Easypaisa" | "JazzCash";
    categoryId: number;
    paidTo?: string | null | undefined;
    referenceNo?: string | null | undefined;
}, {
    date: string;
    amount: number;
    description: string;
    categoryId: number;
    paidTo?: string | null | undefined;
    referenceNo?: string | null | undefined;
    paymentMethod?: string | undefined;
}>;
export declare const updateExpenseSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodOptional<z.ZodNumber>;
    amount: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    paidTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    paymentMethod: z.ZodOptional<z.ZodEffects<z.ZodString, "Cash" | "Bank_Transfer" | "Online" | "Easypaisa" | "JazzCash", string>>;
    referenceNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
    paidTo?: string | null | undefined;
    referenceNo?: string | null | undefined;
    amount?: number | undefined;
    description?: string | undefined;
    paymentMethod?: "Cash" | "Bank_Transfer" | "Online" | "Easypaisa" | "JazzCash" | undefined;
    categoryId?: number | undefined;
}, {
    date?: string | undefined;
    paidTo?: string | null | undefined;
    referenceNo?: string | null | undefined;
    amount?: number | undefined;
    description?: string | undefined;
    paymentMethod?: string | undefined;
    categoryId?: number | undefined;
}>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
//# sourceMappingURL=expenses.schema.d.ts.map