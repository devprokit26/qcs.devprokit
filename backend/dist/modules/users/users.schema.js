"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../../lib/enums");
const permissionItemTransform = zod_1.z.string().transform((val, ctx) => {
    const key = (0, enums_1.mapPageKeyToKey)(val);
    if (!key) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: `Invalid page permission key: ${val}` });
        return zod_1.z.NEVER;
    }
    return key;
});
const permissionsTransform = zod_1.z.array(permissionItemTransform);
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    username: zod_1.z.string().min(1).max(100).regex(/^[a-z0-9._-]+$/, 'Only lowercase letters, numbers, dots, underscores, hyphens'),
    password: zod_1.z.string().min(6).max(200),
    permissions: permissionsTransform.default(['dashboard']),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    password: zod_1.z.string().optional().transform(val => (val === '' || val === undefined ? undefined : val)).pipe(zod_1.z.string().min(6).max(200).optional()),
    permissions: permissionsTransform.optional(),
});
//# sourceMappingURL=users.schema.js.map