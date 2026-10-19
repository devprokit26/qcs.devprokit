"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumber = toNumber;
exports.toNumberNullable = toNumberNullable;
exports.serializeCustomer = serializeCustomer;
exports.serializeVendor = serializeVendor;
exports.serializeShipment = serializeShipment;
exports.serializeLedgerTransaction = serializeLedgerTransaction;
exports.serializeUser = serializeUser;
exports.serializeExpense = serializeExpense;
exports.serializeExpenseCategory = serializeExpenseCategory;
exports.serializeCartonType = serializeCartonType;
exports.serializeCartonMovement = serializeCartonMovement;
exports.serializeWeightProforma = serializeWeightProforma;
exports.serializeInvoice = serializeInvoice;
const enums_1 = require("./enums");
function toNumber(val) {
    if (val === null || val === undefined)
        return 0;
    if (typeof val === 'number')
        return val;
    if (typeof val === 'object' && 'toNumber' in val && typeof val.toNumber === 'function') {
        return val.toNumber();
    }
    const n = Number(val);
    return isNaN(n) ? 0 : n;
}
function toNumberNullable(val) {
    if (val === null || val === undefined)
        return undefined;
    if (typeof val === 'number')
        return val;
    if (typeof val === 'object' && 'toNumber' in val && typeof val.toNumber === 'function') {
        return val.toNumber();
    }
    const n = Number(val);
    return isNaN(n) ? undefined : n;
}
function serializeCustomer(customer) {
    return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        city: customer.city ?? '',
        creditLimit: toNumber(customer.creditLimit),
        creditDays: customer.creditDays,
        accountCode: customer.accountCode ?? '',
        branch: customer.branch ?? '',
        openingBalance: toNumber(customer.openingBalance),
    };
}
function serializeVendor(vendor) {
    return {
        id: vendor.id,
        name: vendor.name,
        phone: vendor.phone ?? '',
        email: vendor.email ?? '',
        city: vendor.city ?? '',
        category: (0, enums_1.mapVendorCategoryToLabel)(vendor.category),
        creditDays: vendor.creditDays,
        accountCode: vendor.accountCode ?? '',
        branch: vendor.branch ?? '',
        openingBalance: toNumber(vendor.openingBalance),
        services: Array.isArray(vendor.services) ? vendor.services : [],
    };
}
function serializeShipment(shipment) {
    let cartonsUsed = undefined;
    if (Array.isArray(shipment.cartonsUsed)) {
        const netMap = new Map();
        for (const mov of shipment.cartonsUsed) {
            if (mov.cartonTypeId !== undefined && mov.movementType) {
                const current = netMap.get(mov.cartonTypeId) || 0;
                if (mov.movementType === 'USED') {
                    netMap.set(mov.cartonTypeId, current + mov.quantity);
                }
                else if (mov.movementType === 'RETURNED') {
                    netMap.set(mov.cartonTypeId, current - mov.quantity);
                }
            }
            else if (mov.cartonTypeId !== undefined && mov.quantity !== undefined) {
                netMap.set(mov.cartonTypeId, (netMap.get(mov.cartonTypeId) || 0) + mov.quantity);
            }
        }
        const lines = [];
        for (const [cartonTypeId, quantity] of netMap.entries()) {
            if (quantity > 0) {
                lines.push({ cartonTypeId, quantity });
            }
        }
        cartonsUsed = lines;
    }
    return {
        id: shipment.id,
        date: shipment.date,
        customerId: shipment.customerId ?? null,
        customerName: shipment.customerName,
        consignee: shipment.consignee ?? '',
        isWalkIn: Boolean(shipment.isWalkIn),
        ...(shipment.walkInName ? { walkInName: shipment.walkInName } : {}),
        courier: shipment.courier ?? '',
        service: shipment.service,
        awb: shipment.awb,
        origin: shipment.origin ?? '',
        destination: shipment.destination,
        ...(shipment.destinationAddress ? { destinationAddress: shipment.destinationAddress } : {}),
        ...(shipment.productName ? { productName: shipment.productName } : {}),
        pieces: shipment.pieces,
        weight: toNumber(shipment.weight),
        ...(shipment.shipInv ? { shipInv: shipment.shipInv } : {}),
        ...(shipment.jobNo ? { jobNo: shipment.jobNo } : {}),
        revenue: toNumber(shipment.revenue),
        cost: toNumber(shipment.cost),
        status: shipment.status,
        ...(shipment.notes ? { notes: shipment.notes } : {}),
        ...(cartonsUsed && cartonsUsed.length > 0 ? { cartonsUsed } : {}),
    };
}
function serializeLedgerTransaction(entry) {
    return {
        id: String(entry.id),
        date: entry.date,
        description: entry.description,
        type: entry.type,
        amount: toNumber(entry.amount),
        voucherType: (0, enums_1.mapVoucherTypeToLabel)(entry.voucherType),
        voucherNo: entry.voucherNo,
        ...(entry.jobNo ? { jobNo: entry.jobNo } : {}),
        ...(entry.shipInv ? { shipInv: entry.shipInv } : {}),
        ...(entry.branch ? { branch: entry.branch } : {}),
        ...(entry.orig ? { orig: entry.orig } : {}),
        ...(entry.dest ? { dest: entry.dest } : {}),
        ...(entry.pcsWeight ? { pcsWeight: entry.pcsWeight } : {}),
        ...(entry.chequeNo ? { chequeNo: entry.chequeNo } : {}),
        ...(entry.chequeDate ? { chequeDate: entry.chequeDate } : {}),
    };
}
function serializeUser(user) {
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        permissions: Array.isArray(user.permissions)
            ? user.permissions.map(enums_1.mapPageKeyToLabel)
            : [],
        protected: Boolean(user.isProtected),
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
    };
}
function serializeExpense(expense) {
    const createdByUsername = typeof expense.createdBy === 'object' && expense.createdBy?.username
        ? expense.createdBy.username
        : typeof expense.createdBy === 'string'
            ? expense.createdBy
            : 'system';
    return {
        id: expense.id,
        date: expense.date,
        categoryId: expense.categoryId,
        amount: toNumber(expense.amount),
        description: expense.description,
        ...(expense.paidTo ? { paidTo: expense.paidTo } : {}),
        paymentMethod: (0, enums_1.mapExpensePaymentMethodToLabel)(expense.paymentMethod),
        ...(expense.referenceNo ? { referenceNo: expense.referenceNo } : {}),
        createdBy: createdByUsername,
        createdAt: expense.createdAt instanceof Date ? expense.createdAt.toISOString() : String(expense.createdAt),
        updatedAt: expense.updatedAt instanceof Date ? expense.updatedAt.toISOString() : String(expense.updatedAt),
    };
}
function serializeExpenseCategory(cat) {
    return {
        id: cat.id,
        name: cat.name,
        isActive: Boolean(cat.isActive),
    };
}
function serializeCartonType(ct) {
    return {
        id: ct.id,
        name: ct.name,
        ...(ct.lengthCm !== null && ct.lengthCm !== undefined ? { lengthCm: toNumber(ct.lengthCm) } : {}),
        ...(ct.widthCm !== null && ct.widthCm !== undefined ? { widthCm: toNumber(ct.widthCm) } : {}),
        ...(ct.heightCm !== null && ct.heightCm !== undefined ? { heightCm: toNumber(ct.heightCm) } : {}),
        lowStockThreshold: ct.lowStockThreshold,
        isActive: Boolean(ct.isActive),
    };
}
function serializeCartonMovement(mov) {
    return {
        id: mov.id,
        cartonTypeId: mov.cartonTypeId,
        date: mov.date,
        movementType: mov.movementType,
        quantity: mov.quantity,
        shipmentId: mov.shipmentId ?? null,
        vendorId: mov.vendorId ?? null,
        unitCost: mov.unitCost !== null && mov.unitCost !== undefined ? toNumber(mov.unitCost) : null,
        note: mov.note ?? undefined,
        createdBy: mov.createdBy ?? 'system',
        createdAt: mov.createdAt instanceof Date ? mov.createdAt.toISOString() : String(mov.createdAt),
    };
}
function serializeWeightProforma(wp) {
    return {
        id: wp.id,
        cnNo: wp.cnNo,
        shipper: wp.shipper,
        services: wp.services,
        date: wp.date,
        divisor: wp.divisor,
        shipmentId: wp.shipmentId ?? null,
        boxes: Array.isArray(wp.boxes) ? wp.boxes : JSON.parse(String(wp.boxes || '[]')),
    };
}
function serializeInvoice(inv) {
    return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        shipmentId: inv.shipmentId ?? null,
        customerId: inv.customerId ?? null,
        customerName: inv.customerName,
        consignee: inv.consignee ?? '',
        isWalkIn: Boolean(inv.isWalkIn),
        date: inv.date,
        awb: inv.awb,
        ...(inv.jobNo ? { jobNo: inv.jobNo } : {}),
        courier: inv.courier ?? '',
        service: inv.service ?? '',
        ...(inv.productName ? { productName: inv.productName } : {}),
        origin: inv.origin ?? '',
        destination: inv.destination ?? '',
        ...(inv.destinationAddress ? { destinationAddress: inv.destinationAddress } : {}),
        pieces: inv.pieces,
        weight: toNumber(inv.weight),
        amount: toNumber(inv.amount),
        status: inv.status === 'Cancelled' ? 'Cancelled' : 'Issued',
        ...(inv.notes ? { notes: inv.notes } : {}),
    };
}
//# sourceMappingURL=serialize.js.map