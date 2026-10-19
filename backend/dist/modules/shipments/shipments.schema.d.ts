import { z } from 'zod';
export declare const shipmentSchema: z.ZodObject<{
    date: z.ZodString;
    customerId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    customerName: z.ZodString;
    isWalkIn: z.ZodDefault<z.ZodBoolean>;
    walkInName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    courier: z.ZodString;
    service: z.ZodDefault<z.ZodString>;
    awb: z.ZodString;
    origin: z.ZodDefault<z.ZodString>;
    destination: z.ZodString;
    destinationAddress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    productName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    consignee: z.ZodString;
    pieces: z.ZodEffects<z.ZodNumber, number, unknown>;
    weight: z.ZodNumber;
    shipInv: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    jobNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    revenue: z.ZodNumber;
    cost: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["Pending", "Shipped", "Delivered", "Returned", "Unfinal"]>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    overrideCredit: z.ZodOptional<z.ZodBoolean>;
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
    status: "Pending" | "Shipped" | "Delivered" | "Returned" | "Unfinal";
    date: string;
    customerName: string;
    isWalkIn: boolean;
    courier: string;
    service: string;
    awb: string;
    origin: string;
    destination: string;
    pieces: number;
    weight: number;
    revenue: number;
    cost: number;
    consignee: string;
    walkInName?: string | null | undefined;
    destinationAddress?: string | null | undefined;
    productName?: string | null | undefined;
    shipInv?: string | null | undefined;
    jobNo?: string | null | undefined;
    notes?: string | null | undefined;
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
    customerId?: number | null | undefined;
    overrideCredit?: boolean | undefined;
}, {
    date: string;
    customerName: string;
    courier: string;
    awb: string;
    destination: string;
    weight: number;
    revenue: number;
    cost: number;
    consignee: string;
    status?: "Pending" | "Shipped" | "Delivered" | "Returned" | "Unfinal" | undefined;
    walkInName?: string | null | undefined;
    destinationAddress?: string | null | undefined;
    productName?: string | null | undefined;
    shipInv?: string | null | undefined;
    jobNo?: string | null | undefined;
    notes?: string | null | undefined;
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
    customerId?: number | null | undefined;
    isWalkIn?: boolean | undefined;
    service?: string | undefined;
    origin?: string | undefined;
    pieces?: unknown;
    overrideCredit?: boolean | undefined;
}>;
export declare const updateShipmentSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    customerName: z.ZodOptional<z.ZodString>;
    isWalkIn: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    walkInName: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    courier: z.ZodOptional<z.ZodString>;
    service: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    awb: z.ZodOptional<z.ZodString>;
    origin: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    destination: z.ZodOptional<z.ZodString>;
    destinationAddress: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    productName: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    consignee: z.ZodOptional<z.ZodString>;
    pieces: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, unknown>>;
    weight: z.ZodOptional<z.ZodNumber>;
    shipInv: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    jobNo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    revenue: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["Pending", "Shipped", "Delivered", "Returned", "Unfinal"]>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    overrideCredit: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    cartonsUsed: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        cartonTypeId: z.ZodNumber;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        cartonTypeId: number;
        quantity: number;
    }, {
        cartonTypeId: number;
        quantity: number;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    status?: "Pending" | "Shipped" | "Delivered" | "Returned" | "Unfinal" | undefined;
    date?: string | undefined;
    walkInName?: string | null | undefined;
    destinationAddress?: string | null | undefined;
    productName?: string | null | undefined;
    shipInv?: string | null | undefined;
    jobNo?: string | null | undefined;
    notes?: string | null | undefined;
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
    customerId?: number | null | undefined;
    customerName?: string | undefined;
    isWalkIn?: boolean | undefined;
    courier?: string | undefined;
    service?: string | undefined;
    awb?: string | undefined;
    origin?: string | undefined;
    destination?: string | undefined;
    pieces?: number | undefined;
    weight?: number | undefined;
    revenue?: number | undefined;
    cost?: number | undefined;
    consignee?: string | undefined;
    overrideCredit?: boolean | undefined;
}, {
    status?: "Pending" | "Shipped" | "Delivered" | "Returned" | "Unfinal" | undefined;
    date?: string | undefined;
    walkInName?: string | null | undefined;
    destinationAddress?: string | null | undefined;
    productName?: string | null | undefined;
    shipInv?: string | null | undefined;
    jobNo?: string | null | undefined;
    notes?: string | null | undefined;
    cartonsUsed?: {
        cartonTypeId: number;
        quantity: number;
    }[] | undefined;
    customerId?: number | null | undefined;
    customerName?: string | undefined;
    isWalkIn?: boolean | undefined;
    courier?: string | undefined;
    service?: string | undefined;
    awb?: string | undefined;
    origin?: string | undefined;
    destination?: string | undefined;
    pieces?: unknown;
    weight?: number | undefined;
    revenue?: number | undefined;
    cost?: number | undefined;
    consignee?: string | undefined;
    overrideCredit?: boolean | undefined;
}>;
export type ShipmentInput = z.infer<typeof shipmentSchema>;
//# sourceMappingURL=shipments.schema.d.ts.map