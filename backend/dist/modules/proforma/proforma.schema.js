"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProformaSchema = exports.proformaSchema = void 0;
const zod_1 = require("zod");
const item = zod_1.z.object({
    description: zod_1.z.string().default(''), // product name
    madeOf: zod_1.z.string().default(''), // description with made-of detail
    hsCode: zod_1.z.string().default(''),
    originCountry: zod_1.z.string().default('Pakistan'),
    sizesColors: zod_1.z.string().default(''),
    gender: zod_1.z.string().default(''),
    qty: zod_1.z.coerce.number().min(0).default(0),
    unit: zod_1.z.string().default('PCS'),
    unitPrice: zod_1.z.coerce.number().min(0).default(0),
});
const box = zod_1.z.object({
    contents: zod_1.z.string().default(''),
    l: zod_1.z.coerce.number().min(0).default(0),
    w: zod_1.z.coerce.number().min(0).default(0),
    h: zod_1.z.coerce.number().min(0).default(0),
    grossWeight: zod_1.z.coerce.number().min(0).default(0),
    netWeight: zod_1.z.coerce.number().min(0).default(0),
});
exports.proformaSchema = zod_1.z.object({
    shipmentId: zod_1.z.number().int().nullable().optional(),
    type: zod_1.z.enum(['COMMERCIAL', 'GIFT', 'DOX']),
    invoiceDate: zod_1.z.string().min(1),
    shipperName: zod_1.z.string().trim().default(''),
    shipperCnic: zod_1.z.string().trim().default(''),
    shipperAddress: zod_1.z.string().trim().default(''),
    shipperPhone: zod_1.z.string().trim().regex(/^\d{11}$/).or(zod_1.z.literal('')).default(''),
    demoConsigneeName: zod_1.z.string().trim().default(''),
    demoConsigneeAddress: zod_1.z.string().trim().default(''),
    demoConsigneePhone: zod_1.z.string().trim().regex(/^\d{11}$/).or(zod_1.z.literal('')).default(''),
    cartonNo: zod_1.z.string().trim().default(''),
    currency: zod_1.z.string().trim().min(1).default('USD'),
    exchangeRate: zod_1.z.coerce.number().min(0).nullable().optional(),
    incoterm: zod_1.z.string().trim().default('CFR'),
    reasonForExport: zod_1.z.string().trim().default('Sale'),
    freight: zod_1.z.coerce.number().min(0).default(0),
    items: zod_1.z.array(item).default([]),
    packages: zod_1.z.array(box).default([]),
    notes: zod_1.z.string().optional().nullable(),
    realShipperName: zod_1.z.string().trim().default(''),
    soldTo: zod_1.z.string().trim().default(''),
    departure: zod_1.z.string().trim().default('Sialkot, Pakistan'),
    invoiceHsCode: zod_1.z.string().trim().default(''),
    awb: zod_1.z.string().trim().optional().default(''),
    destination: zod_1.z.string().trim().optional().default(''),
    origin: zod_1.z.string().trim().optional().default('Pakistan'),
    shipDate: zod_1.z.string().trim().optional().default(''),
    pieces: zod_1.z.coerce.number().min(0).optional().default(0),
    weight: zod_1.z.coerce.number().min(0).optional().default(0),
});
exports.updateProformaSchema = exports.proformaSchema.omit({ shipmentId: true }).partial();
//# sourceMappingURL=proforma.schema.js.map