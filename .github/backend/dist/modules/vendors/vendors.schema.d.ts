import { z } from 'zod';
export declare const vendorSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodDefault<z.ZodString>;
    email: z.ZodDefault<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>>;
    city: z.ZodDefault<z.ZodString>;
    category: z.ZodDefault<z.ZodEnum<["COURIER_FREIGHT", "FUEL", "OFFICE_SUPPLIES", "UTILITIES", "RENT", "MAINTENANCE", "OTHER"]>>;
    creditDays: z.ZodDefault<z.ZodNumber>;
    accountCode: z.ZodDefault<z.ZodString>;
    branch: z.ZodDefault<z.ZodString>;
    openingBalance: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    email: string;
    city: string;
    creditDays: number;
    accountCode: string;
    branch: string;
    openingBalance: number;
    category: "COURIER_FREIGHT" | "FUEL" | "OFFICE_SUPPLIES" | "UTILITIES" | "RENT" | "MAINTENANCE" | "OTHER";
}, {
    name: string;
    phone?: string | undefined;
    email?: string | undefined;
    city?: string | undefined;
    creditDays?: number | undefined;
    accountCode?: string | undefined;
    branch?: string | undefined;
    openingBalance?: number | undefined;
    category?: "COURIER_FREIGHT" | "FUEL" | "OFFICE_SUPPLIES" | "UTILITIES" | "RENT" | "MAINTENANCE" | "OTHER" | undefined;
}>;
export type VendorInput = z.infer<typeof vendorSchema>;
//# sourceMappingURL=vendors.schema.d.ts.map