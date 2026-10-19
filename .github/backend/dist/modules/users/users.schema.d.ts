import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    permissions: z.ZodDefault<z.ZodArray<z.ZodEnum<["dashboard", "shipments", "weightproforma", "ledger", "alerts", "reports", "cartons", "expenses", "users_management"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    username: string;
    name: string;
    permissions: ("dashboard" | "shipments" | "weightproforma" | "ledger" | "alerts" | "reports" | "cartons" | "expenses" | "users_management")[];
    password: string;
}, {
    username: string;
    name: string;
    password: string;
    permissions?: ("dashboard" | "shipments" | "weightproforma" | "ledger" | "alerts" | "reports" | "cartons" | "expenses" | "users_management")[] | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodEnum<["dashboard", "shipments", "weightproforma", "ledger", "alerts", "reports", "cartons", "expenses", "users_management"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    permissions?: ("dashboard" | "shipments" | "weightproforma" | "ledger" | "alerts" | "reports" | "cartons" | "expenses" | "users_management")[] | undefined;
    password?: string | undefined;
}, {
    name?: string | undefined;
    permissions?: ("dashboard" | "shipments" | "weightproforma" | "ledger" | "alerts" | "reports" | "cartons" | "expenses" | "users_management")[] | undefined;
    password?: string | undefined;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
//# sourceMappingURL=users.schema.d.ts.map