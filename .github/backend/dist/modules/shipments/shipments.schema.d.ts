import { z } from 'zod';
export declare const shipmentSchema: z.ZodObject<{
    date: z.ZodString;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    customerName: z.ZodString;
    isWalkIn: z.ZodDefault<z.ZodBoolean>;
    walkInName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    courier: z.ZodString;
    service: z.ZodDefault<z.ZodEnum<["Express", "Economy", "Standard", "Overnight"]>>;
    awb: z.ZodString;
    origin: z.ZodDefault<z.ZodString>;
    destination: z.ZodString;
    pieces: z.ZodDefault<z.ZodNumber>;
    weight: z.ZodNumber;
    shipInv: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    jobNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    revenue: z.ZodNumber;
    cost: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["Pending", "Shipped", "Delivered", "Returned"]>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cartonsUsed: z.ZodOptional<z.ZodArray<z.ZodObject<{
        cartonTypeId: z.ZodNumber;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        cartonTypeId: number;
        quantity: number;
    }, {
        cartonTypeId: number;
        quantity: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "Pending" | "Shipped" | "Delivered" | "Returned";
    date: string;
    customerName: string;
    isWalkIn: boolean;
    courier: string;
    service: "Express" | "Economy" | "Standard" | "Overnight";
    awb: string;
    origin: string;
    destination: string;
    pieces: number;
    weight: number;
    revenue: number;
    cost: number;
    customerId?: number | null | undefined;
    walkInName?: string | null | undefined;
    shipInv?: string | null | undefined;
    jobNo?: string | null | undefined;
    notes?: string | null | undefined;
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
}, {
    date: string;
    customerName: string;
    courier: string;
    awb: string;
    destination: string;
    weight: number;
    revenue: number;
    cost: number;
    status?: "Pending" | "Shipped" | "Delivered" | "Returned" | undefined;
    customerId?: number | null | undefined;
    isWalkIn?: boolean | undefined;
    walkInName?: string | null | undefined;
    service?: "Express" | "Economy" | "Standard" | "Overnight" | undefined;
    origin?: string | undefined;
    pieces?: number | undefined;
    shipInv?: string | null | undefined;
    jobNo?: string | null | undefined;
    notes?: string | null | undefined;
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
}>;
export type ShipmentInput = z.infer<typeof shipmentSchema>;
//# sourceMappingURL=shipments.schema.d.ts.map