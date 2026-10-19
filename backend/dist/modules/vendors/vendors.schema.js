"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorSchema = exports.updateVendorSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../lib/enums");
const categoryTransform = zod_1.z.string().transform((val, ctx) => {
    const key = (0, enums_1.mapVendorCategoryToKey)(val);
    if (!key) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: `Invalid vendor category: ${val}` });
        return zod_1.z.NEVER;
    }
    return key;
});
exports.updateVendorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(300).optional(),
    phone: zod_1.z.string().regex(/^\d{11}$/).or(zod_1.z.literal('')).optional(),
    email: zod_1.z.string().email().max(200).or(zod_1.z.literal('')).optional(),
    city: zod_1.z.string().max(100).optional(),
    category: categoryTransform.optional(),
    creditDays: zod_1.z.coerce.number().int().min(0).max(365).optional(),
    accountCode: zod_1.z.string().max(50).optional(),
    branch: zod_1.z.string().max(50).optional(),
    openingBalance: zod_1.z.coerce.number().min(0).optional(),
    services: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.vendorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(300),
    phone: zod_1.z.string().regex(/^\d{11}$/).or(zod_1.z.literal('')).default(''),
    email: zod_1.z.string().email().max(200).or(zod_1.z.literal('')).default(''),
    city: zod_1.z.string().max(100).default(''),
    category: categoryTransform.default('Courier / Freight'),
    creditDays: zod_1.z.coerce.number().int().min(0).max(365).default(30),
    accountCode: zod_1.z.string().max(50).default(''),
    branch: zod_1.z.string().max(50).default(''),
    openingBalance: zod_1.z.coerce.number().min(0).default(0),
    services: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.vendorSchema.partial = () => exports.updateVendorSchema;
//# sourceMappingURL=vendors.schema.js.map