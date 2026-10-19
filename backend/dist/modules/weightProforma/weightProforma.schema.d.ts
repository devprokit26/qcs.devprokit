import { z } from 'zod';
export declare const weightBoxSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    actWeight: z.ZodNumber;
    l: z.ZodNumber;
    w: z.ZodNumber;
    h: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    w: number;
    h: number;
    actWeight: number;
    l: number;
    id?: string | undefined;
}, {
    w: number;
    h: number;
    actWeight: number;
    l: number;
    id?: string | undefined;
}>;
export declare const weightProformaSchema: z.ZodObject<{
    cnNo: z.ZodString;
    shipper: z.ZodString;
    services: z.ZodDefault<z.ZodString>;
    date: z.ZodString;
    divisor: z.ZodDefault<z.ZodNumber>;
    shipmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    boxes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        actWeight: z.ZodNumber;
        l: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        w: number;
        h: number;
        actWeight: number;
        l: number;
        id?: string | undefined;
    }, {
        w: number;
        h: number;
        actWeight: number;
        l: number;
        id?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    date: string;
    services: string;
    cnNo: string;
    shipper: string;
    divisor: number;
    boxes: {
        w: number;
        h: number;
        actWeight: number;
        l: number;
        id?: string | undefined;
    }[];
    shipmentId?: number | null | undefined;
}, {
    date: string;
    cnNo: string;
    shipper: string;
    services?: string | undefined;
    shipmentId?: number | null | undefined;
    divisor?: number | undefined;
    boxes?: {
        w: number;
        h: number;
        actWeight: number;
        l: number;
        id?: string | undefined;
    }[] | undefined;
}>;
export declare const updateWeightProformaSchema: z.ZodObject<{
    cnNo: z.ZodOptional<z.ZodString>;
    shipper: z.ZodOptional<z.ZodString>;
    services: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    date: z.ZodOptional<z.ZodString>;
    divisor: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    shipmentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    boxes: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        actWeight: z.ZodNumber;
        l: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        w: number;
        h: number;
        actWeight: number;
        l: number;
        id?: string | undefined;
    }, {
        w: number;
        h: number;
        actWeight: number;
        l: number;
        id?: string | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
    services?: string | undefined;
    shipmentId?: number | null | undefined;
    cnNo?: string | undefined;
    shipper?: string | undefined;
    divisor?: number | undefined;
    boxes?: {
        w: number;
        h: number;
        actWeight: number;
        l: number;
        id?: string | undefined;
    }[] | undefined;
}, {
    date?: string | undefined;
    services?: string | undefined;
    shipmentId?: number | null | undefined;
    cnNo?: string | undefined;
    shipper?: string | undefined;
    divisor?: number | undefined;
    boxes?: {
        w: number;
        h: number;
        actWeight: number;
        l: number;
        id?: string | undefined;
    }[] | undefined;
}>;
export type WeightProformaInput = z.infer<typeof weightProformaSchema>;
//# sourceMappingURL=weightProforma.schema.d.ts.map