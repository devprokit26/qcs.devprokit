import { z } from 'zod';
export declare const updateVendorSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    city: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEffects<z.ZodString, "COURIER_FREIGHT" | "FUEL" | "OFFICE_SUPPLIES" | "UTILITIES" | "RENT" | "MAINTENANCE" | "OTHER", string>>;
    creditDays: z.ZodOptional<z.ZodNumber>;
    accountCode: z.ZodOptional<z.ZodString>;
    branch: z.ZodOptional<z.ZodString>;
    openingBalance: z.ZodOptional<z.ZodNumber>;
    services: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    branch?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    city?: string | undefined;
    creditDays?: number | undefined;
    accountCode?: string | undefined;
    openingBalance?: number | undefined;
    category?: "COURIER_FREIGHT" | "FUEL" | "OFFICE_SUPPLIES" | "UTILITIES" | "RENT" | "MAINTENANCE" | "OTHER" | undefined;
    services?: string[] | undefined;
}, {
    name?: string | undefined;
    branch?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    city?: string | undefined;
    creditDays?: number | undefined;
    accountCode?: string | undefined;
    openingBalance?: number | undefined;
    category?: string | undefined;
    services?: string[] | undefined;
}>;
export declare const vendorSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    email: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    city: z.ZodDefault<z.ZodString>;
    category: z.ZodDefault<z.ZodEffects<z.ZodString, "COURIER_FREIGHT" | "FUEL" | "OFFICE_SUPPLIES" | "UTILITIES" | "RENT" | "MAINTENANCE" | "OTHER", string>>;
    creditDays: z.ZodDefault<z.ZodNumber>;
    accountCode: z.ZodDefault<z.ZodString>;
    branch: z.ZodDefault<z.ZodString>;
    openingBalance: z.ZodDefault<z.ZodNumber>;
    services: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    branch: string;
    phone: string;
    email: string;
    city: string;
    creditDays: number;
    accountCode: string;
    openingBalance: number;
    category: "COURIER_FREIGHT" | "FUEL" | "OFFICE_SUPPLIES" | "UTILITIES" | "RENT" | "MAINTENANCE" | "OTHER";
    services: string[];
}, {
    name: string;
    branch?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    city?: string | undefined;
    creditDays?: number | undefined;
    accountCode?: string | undefined;
    openingBalance?: number | undefined;
    category?: string | undefined;
    services?: string[] | undefined;
}>;
export type VendorInput = z.infer<typeof vendorSchema>;
//# sourceMappingURL=vendors.schema.d.ts.map