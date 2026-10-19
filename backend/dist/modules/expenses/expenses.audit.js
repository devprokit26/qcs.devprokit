"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotExpense = snapshotExpense;
const client_1 = require("../../prisma/client");
const serialize_1 = require("../../lib/serialize");
const enums_1 = require("../../lib/enums");
/** Flat, readable copy of an expense used for the audit log (before / after diffs). */
async function snapshotExpense(id) {
    const e = await client_1.prisma.expense.findUnique({ where: { id }, include: { category: true } });
    if (!e)
        return null;
    return {
        date: e.date,
        category: e.category?.name ?? '',
        amount: (0, serialize_1.toNumber)(e.amount),
        description: e.description,
        paidTo: e.paidTo ?? '',
        paymentMethod: (0, enums_1.mapExpensePaymentMethodToLabel)(e.paymentMethod),
        referenceNo: e.referenceNo ?? '',
    };
}
//# sourceMappingURL=expenses.audit.js.map