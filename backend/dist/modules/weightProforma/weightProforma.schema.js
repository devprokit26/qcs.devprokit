"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWeightProformaSchema = exports.weightProformaSchema = exports.weightBoxSchema = void 0;
const zod_1 = require("zod");
exports.weightBoxSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    actWeight: zod_1.z.coerce.number(),
    l: zod_1.z.coerce.number(),
    w: zod_1.z.coerce.number(),
    h: zod_1.z.coerce.number(),
});
exports.weightProformaSchema = zod_1.z.object({
    cnNo: zod_1.z.string().min(1),
    shipper: zod_1.z.string().min(1),
    services: zod_1.z.string().default(''),
    date: zod_1.z.string(),
    divisor: zod_1.z.coerce.number().default(5000),
    shipmentId: zod_1.z.number().optional().nullable(),
    boxes: zod_1.z.array(exports.weightBoxSchema).default([]),
});
exports.updateWeightProformaSchema = exports.weightProformaSchema.partial();
//# sourceMappingURL=weightProforma.schema.js.map