import { z } from 'zod';
export declare const cartonTypeSchema: z.ZodObject<{
    name: z.ZodString;
    lengthCm: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    widthCm: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    heightCm: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    lowStockThreshold: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    lowStockThreshold: number;
    isActive: boolean;
    lengthCm?: number | null | undefined;
    widthCm?: number | null | undefined;
    heightCm?: number | null | undefined;
}, {
    name: string;
    lengthCm?: number | null | undefined;
    widthCm?: number | null | undefined;
    heightCm?: number | null | undefined;
    lowStockThreshold?: number | undefined;
    isActive?: boolean | undefined;
}>;
export declare const cartonMovementSchema: z.ZodObject<{
    cartonTypeId: z.ZodNumber;
    date: z.ZodString;
    movementType: z.ZodEnum<["RECEIVED", "USED", "ADJUSTMENT_IN", "ADJUSTMENT_OUT", "RETURNED"]>;
    quantity: z.ZodNumber;
    shipmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    vendorId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    unitCost: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    cartonTypeId: number;
    quantity: number;
    movementType: "RECEIVED" | "USED" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "RETURNED";
    vendorId?: number | null | undefined;
    unitCost?: number | null | undefined;
    note?: string | null | undefined;
    shipmentId?: number | null | undefined;
}, {
    date: string;
    cartonTypeId: number;
    quantity: number;
    movementType: "RECEIVED" | "USED" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "RETURNED";
    vendorId?: number | null | undefined;
    unitCost?: number | null | undefined;
    note?: string | null | undefined;
    shipmentId?: number | null | undefined;
}>;
export type CartonTypeInput = z.infer<typeof cartonTypeSchema>;
export type CartonMovementInput = z.infer<typeof cartonMovementSchema>;
//# sourceMappingURL=cartons.schema.d.ts.map