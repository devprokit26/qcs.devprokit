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
    paymentMethod: z.ZodDefault<z.ZodEnum<["Cash", "Bank Transfer", "Online", "Easypaisa", "JazzCash"]>>;
    referenceNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    description: string;
    amount: number;
    categoryId: number;
    paymentMethod: "Cash" | "Bank Transfer" | "Online" | "Easypaisa" | "JazzCash";
    paidTo?: string | null | undefined;
    referenceNo?: string | null | undefined;
}, {
    date: string;
    description: string;
    amount: number;
    categoryId: number;
    paidTo?: string | null | undefined;
    paymentMethod?: "Cash" | "Bank Transfer" | "Online" | "Easypaisa" | "JazzCash" | undefined;
    referenceNo?: string | null | undefined;
}>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
//# sourceMappingURL=expenses.schema.d.ts.map