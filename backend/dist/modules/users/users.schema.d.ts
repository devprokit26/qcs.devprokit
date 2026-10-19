import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    username: z.ZodString;
    password: z.ZodString;
    permissions: z.ZodDefault<z.ZodArray<z.ZodEffects<z.ZodString, "dashboard" | "shipments" | "weightproforma" | "ledger" | "alerts" | "reports" | "cartons" | "expenses" | "invoice_proforma" | "users_management", string>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    username: string;
    permissions: ("dashboard" | "shipments" | "weightproforma" | "ledger" | "alerts" | "reports" | "cartons" | "expenses" | "invoice_proforma" | "users_management")[];
    password: string;
}, {
    name: string;
    username: string;
    password: string;
    permissions?: string[] | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    password: z.ZodPipeline<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>, z.ZodOptional<z.ZodString>>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodString, "dashboard" | "shipments" | "weightproforma" | "ledger" | "alerts" | "reports" | "cartons" | "expenses" | "invoice_proforma" | "users_management", string>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    permissions?: ("dashboard" | "shipments" | "weightproforma" | "ledger" | "alerts" | "reports" | "cartons" | "expenses" | "invoice_proforma" | "users_management")[] | undefined;
    password?: string | undefined;
}, {
    name?: string | undefined;
    permissions?: string[] | undefined;
    password?: string | undefined;
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
//# sourceMappingURL=users.schema.d.ts.map