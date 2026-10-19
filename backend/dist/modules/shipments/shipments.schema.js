"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShipmentSchema = exports.shipmentSchema = void 0;
const zod_1 = require("zod");
exports.shipmentSchema = zod_1.z.object({
    date: zod_1.z.string(),
    customerId: zod_1.z.number().optional().nullable(),
    customerName: zod_1.z.string().min(1),
    isWalkIn: zod_1.z.boolean().default(false),
    walkInName: zod_1.z.string().optional().nullable(),
    courier: zod_1.z.string().min(1),
    service: zod_1.z.string().trim().min(1, 'Service is required').default('Express'),
    awb: zod_1.z.string().trim().min(1, 'AWB cannot be blank'),
    origin: zod_1.z.string().default(''),
    destination: zod_1.z.string().trim().min(1, 'Destination country is required'),
    destinationAddress: zod_1.z.string().optional().nullable(),
    productName: zod_1.z.string().optional().nullable(),
    consignee: zod_1.z.string().trim().min(1, 'Consignee is required'),
    pieces: zod_1.z.preprocess(v => (v === '' || v === null || v === undefined || Number.isNaN(v) ? 0 : v), zod_1.z.coerce.number().int().min(0)),
    weight: zod_1.z.coerce.number().min(0),
    shipInv: zod_1.z.string().optional().nullable(),
    jobNo: zod_1.z.string().optional().nullable(),
    revenue: zod_1.z.coerce.number().min(0),
    cost: zod_1.z.coerce.number().min(0),
    status: zod_1.z.enum(['Pending', 'Shipped', 'Delivered', 'Returned', 'Unfinal']).default('Pending'),
    notes: zod_1.z.string().optional().nullable(),
    overrideCredit: zod_1.z.boolean().optional(),
    cartonsUsed: zod_1.z.array(zod_1.z.object({
        cartonTypeId: zod_1.z.number(),
        quantity: zod_1.z.number().int().min(1),
    })).optional(),
});
exports.updateShipmentSchema = exports.shipmentSchema.partial();
//# sourceMappingURL=shipments.schema.js.map