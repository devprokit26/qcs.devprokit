import { z } from 'zod';
export declare const createLedgerEntrySchema: z.ZodObject<{
    date: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["debit", "credit"]>;
    amount: z.ZodNumber;
    voucherType: z.ZodEffects<z.ZodString, string, string>;
    voucherNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    jobNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    shipInv: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    branch: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    orig: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dest: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pcsWeight: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    chequeNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    chequeDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "debit" | "credit";
    date: string;
    amount: number;
    description: string;
    voucherType: string;
    shipInv?: string | null | undefined;
    jobNo?: string | null | undefined;
    branch?: string | null | undefined;
    orig?: string | null | undefined;
    dest?: string | null | undefined;
    pcsWeight?: string | null | undefined;
    chequeNo?: string | null | undefined;
    chequeDate?: string | null | undefined;
    voucherNo?: string | null | undefined;
}, {
    type: "debit" | "credit";
    date: string;
    amount: number;
    description: string;
    voucherType: string;
    shipInv?: string | null | undefined;
    jobNo?: string | null | undefined;
    branch?: string | null | undefined;
    orig?: string | null | undefined;
    dest?: string | null | undefined;
    pcsWeight?: string | null | undefined;
    chequeNo?: string | null | undefined;
    chequeDate?: string | null | undefined;
    voucherNo?: string | null | undefined;
}>;
export type CreateLedgerEntryInput = z.infer<typeof createLedgerEntrySchema>;
//# sourceMappingURL=ledger.schema.d.ts.map