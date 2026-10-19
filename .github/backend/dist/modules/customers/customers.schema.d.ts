import { z } from 'zod';
export declare const customerSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    city: z.ZodDefault<z.ZodString>;
    creditLimit: z.ZodDefault<z.ZodNumber>;
    creditDays: z.ZodDefault<z.ZodNumber>;
    accountCode: z.ZodDefault<z.ZodString>;
    branch: z.ZodDefault<z.ZodString>;
    openingBalance: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    email: string;
    city: string;
    creditLimit: number;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: number;
}, {
    name: string;
    phone?: string | undefined;
    email?: string | undefined;
    city?: string | undefined;
    creditLimit?: number | undefined;
    creditDays?: number | undefined;
    accountCode?: string | undefined;
    branch?: string | undefined;
    openingBalance?: number | undefined;
}>;
export type CustomerInput = z.infer<typeof customerSchema>;
//# sourceMappingURL=customers.schema.d.ts.map