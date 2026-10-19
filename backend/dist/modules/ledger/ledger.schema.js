"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLedgerEntrySchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../lib/enums");
exports.createLedgerEntrySchema = zod_1.z.object({
    date: zod_1.z.string(),
    description: zod_1.z.string(),
    type: zod_1.z.enum(['debit', 'credit']),
    amount: zod_1.z.coerce.number().min(0.01),
    voucherType: zod_1.z.string().transform(enums_1.mapVoucherTypeToKey),
    voucherNo: zod_1.z.string().optional().nullable(),
    jobNo: zod_1.z.string().optional().nullable(),
    shipInv: zod_1.z.string().optional().nullable(),
    branch: zod_1.z.string().optional().nullable(),
    orig: zod_1.z.string().optional().nullable(),
    dest: zod_1.z.string().optional().nullable(),
    pcsWeight: zod_1.z.string().optional().nullable(),
    chequeNo: zod_1.z.string().optional().nullable(),
    chequeDate: zod_1.z.string().optional().nullable(),
});
//# sourceMappingURL=ledger.schema.js.map