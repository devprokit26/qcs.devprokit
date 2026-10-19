"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartonMovementSchema = exports.cartonTypeSchema = void 0;
const zod_1 = require("zod");
exports.cartonTypeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    lengthCm: zod_1.z.coerce.number().optional().nullable(),
    widthCm: zod_1.z.coerce.number().optional().nullable(),
    heightCm: zod_1.z.coerce.number().optional().nullable(),
    lowStockThreshold: zod_1.z.coerce.number().int().min(0).default(10),
    isActive: zod_1.z.boolean().default(true)
});
exports.cartonMovementSchema = zod_1.z.object({
    cartonTypeId: zod_1.z.number(),
    date: zod_1.z.string(),
    movementType: zod_1.z.enum(['RECEIVED', 'USED', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURNED']),
    quantity: zod_1.z.number().int().min(1),
    shipmentId: zod_1.z.number().optional().nullable(),
    vendorId: zod_1.z.number().optional().nullable(),
    unitCost: zod_1.z.coerce.number().optional().nullable(),
    note: zod_1.z.string().optional().nullable()
});
//# sourceMappingURL=cartons.schema.js.map