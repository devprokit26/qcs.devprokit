"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseSchema = exports.expenseCategorySchema = void 0;
const zod_1 = require("zod");
exports.expenseCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    isActive: zod_1.z.boolean().default(true)
});
exports.expenseSchema = zod_1.z.object({
    date: zod_1.z.string(),
    categoryId: zod_1.z.number(),
    amount: zod_1.z.coerce.number().min(0.01),
    description: zod_1.z.string().min(1),
    paidTo: zod_1.z.string().optional().nullable(),
    paymentMethod: zod_1.z.enum(['Cash', 'Bank Transfer', 'Online', 'Easypaisa', 'JazzCash']).default('Cash'),
    referenceNo: zod_1.z.string().optional().nullable()
});
//# sourceMappingURL=expenses.schema.js.map