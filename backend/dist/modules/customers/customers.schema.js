"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerSchema = void 0;
const zod_1 = require("zod");
exports.customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(300),
    phone: zod_1.z.string().regex(/^\d{11}$/).or(zod_1.z.literal('')).default(''),
    email: zod_1.z.string().email().max(200).or(zod_1.z.literal('')).default(''),
    city: zod_1.z.string().max(100).default(''),
    creditLimit: zod_1.z.coerce.number().min(0).default(0),
    creditDays: zod_1.z.coerce.number().int().min(0).max(365).default(30),
    accountCode: zod_1.z.string().max(50).default(''),
    branch: zod_1.z.string().max(50).default(''),
    openingBalance: zod_1.z.coerce.number().min(0).default(0),
});
//# sourceMappingURL=customers.schema.js.map