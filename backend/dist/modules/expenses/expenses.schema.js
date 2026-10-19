"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenseSchema = exports.expenseSchema = exports.expenseCategorySchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../lib/enums");
const paymentMethodTransform = zod_1.z.string().transform((val, ctx) => {
    const key = (0, enums_1.mapExpensePaymentMethodToKey)(val);
    if (!key) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: `Invalid payment method: ${val}` });
        return zod_1.z.NEVER;
    }
    return key;
});
exports.expenseCategorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'Category name is required'),
    isActive: zod_1.z.boolean().default(true)
});
exports.expenseSchema = zod_1.z.object({
    date: zod_1.z.string(),
    categoryId: zod_1.z.number(),
    amount: zod_1.z.coerce.number().min(0.01),
    description: zod_1.z.string().min(1),
    paidTo: zod_1.z.string().optional().nullable(),
    paymentMethod: paymentMethodTransform.default('Cash'),
    referenceNo: zod_1.z.string().optional().nullable()
});
exports.updateExpenseSchema = zod_1.z.object({
    date: zod_1.z.string().optional(),
    categoryId: zod_1.z.number().optional(),
    amount: zod_1.z.coerce.number().min(0.01).optional(),
    description: zod_1.z.string().min(1).optional(),
    paidTo: zod_1.z.string().optional().nullable(),
    paymentMethod: paymentMethodTransform.optional(),
    referenceNo: zod_1.z.string().optional().nullable()
});
exports.expenseSchema.partial = () => exports.updateExpenseSchema;
//# sourceMappingURL=expenses.schema.js.map