"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorSchema = void 0;
const zod_1 = require("zod");
const VENDOR_CATEGORIES = [
    'COURIER_FREIGHT', 'FUEL', 'OFFICE_SUPPLIES',
    'UTILITIES', 'RENT', 'MAINTENANCE', 'OTHER',
];
exports.vendorSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(300),
    phone: zod_1.z.string().max(50).default(''),
    email: zod_1.z.string().email().max(200).or(zod_1.z.literal('')).default(''),
    city: zod_1.z.string().max(100).default(''),
    category: zod_1.z.enum(VENDOR_CATEGORIES).default('COURIER_FREIGHT'),
    creditDays: zod_1.z.coerce.number().int().min(0).default(30),
    accountCode: zod_1.z.string().max(50).default(''),
    branch: zod_1.z.string().max(50).default(''),
    openingBalance: zod_1.z.coerce.number().default(0),
});
//# sourceMappingURL=vendors.schema.js.map