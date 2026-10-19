"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentSchema = void 0;
const zod_1 = require("zod");
exports.shipmentSchema = zod_1.z.object({
    date: zod_1.z.string(),
    customerId: zod_1.z.number().optional().nullable(),
    customerName: zod_1.z.string(),
    isWalkIn: zod_1.z.boolean().default(false),
    walkInName: zod_1.z.string().optional().nullable(),
    courier: zod_1.z.string(),
    service: zod_1.z.enum(['Express', 'Economy', 'Standard', 'Overnight']).default('Express'),
    awb: zod_1.z.string().min(1),
    origin: zod_1.z.string().default(''),
    destination: zod_1.z.string().min(1),
    pieces: zod_1.z.coerce.number().int().min(1).default(1),
    weight: zod_1.z.coerce.number().min(0),
    shipInv: zod_1.z.string().optional().nullable(),
    jobNo: zod_1.z.string().optional().nullable(),
    revenue: zod_1.z.coerce.number().min(0),
    cost: zod_1.z.coerce.number().min(0),
    status: zod_1.z.enum(['Pending', 'Shipped', 'Delivered', 'Returned']).default('Pending'),
    notes: zod_1.z.string().optional().nullable(),
    cartonsUsed: zod_1.z.array(zod_1.z.object({
        cartonTypeId: zod_1.z.number(),
        quantity: zod_1.z.number().int().min(1)
    })).optional()
});
//# sourceMappingURL=shipments.schema.js.map