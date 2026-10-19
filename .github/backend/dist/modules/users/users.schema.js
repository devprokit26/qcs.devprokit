"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const PAGE_KEYS = [
    'dashboard', 'shipments', 'weightproforma', 'ledger',
    'alerts', 'reports', 'cartons', 'expenses', 'users_management',
];
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    username: zod_1.z.string().min(1).max(100).regex(/^[a-z0-9._-]+$/, 'Only lowercase letters, numbers, dots, underscores, hyphens'),
    password: zod_1.z.string().min(6).max(200),
    permissions: zod_1.z.array(zod_1.z.enum(PAGE_KEYS)).default(['dashboard']),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    password: zod_1.z.string().min(6).max(200).optional(),
    permissions: zod_1.z.array(zod_1.z.enum(PAGE_KEYS)).optional(),
});
//# sourceMappingURL=users.schema.js.map