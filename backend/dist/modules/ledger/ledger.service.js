"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorAging = exports.getCustomerAging = void 0;
exports.getNextVoucherNo = getNextVoucherNo;
exports.getCustomerLedger = getCustomerLedger;
exports.getVendorLedger = getVendorLedger;
exports.addCustomerTransaction = addCustomerTransaction;
exports.addVendorTransaction = addVendorTransaction;
const client_1 = require("../../prisma/client");
const serialize_1 = require("../../lib/serialize");
const customers_service_1 = require("../customers/customers.service");
Object.defineProperty(exports, "getCustomerAging", { enumerable: true, get: function () { return customers_service_1.getCustomerAging; } });
const vendors_service_1 = require("../vendors/vendors.service");
Object.defineProperty(exports, "getVendorAging", { enumerable: true, get: function () { return vendors_service_1.getVendorAging; } });
const httpErrors_1 = require("../../lib/httpErrors");
async function getNextVoucherNo(tx, voucherType) {
    await tx.$executeRaw `SELECT pg_advisory_xact_lock(746352)`;
    const counter = await tx.voucherCounter.findUnique({
        where: { voucherType },
    });
    const nextNumber = counter ? counter.lastNumber + 1 : 1001;
    await tx.voucherCounter.upsert({
        where: { voucherType },
        update: { lastNumber: nextNumber },
        create: { voucherType, lastNumber: nextNumber },
    });
    return String(nextNumber);
}
async function getCustomerLedger(customerId) {
    const customer = await client_1.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer)
        throw (0, httpErrors_1.notFoundError)('Customer not found');
    const entries = await client_1.prisma.customerLedgerEntry.findMany({
        where: { customerId },
        orderBy: [{ date: 'asc' }, { id: 'asc' }]
    });
    return entries.map(serialize_1.serializeLedgerTransaction);
}
async function getVendorLedger(vendorId) {
    const vendor = await client_1.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor)
        throw (0, httpErrors_1.notFoundError)('Vendor not found');
    const entries = await client_1.prisma.vendorLedgerEntry.findMany({
        where: { vendorId },
        orderBy: [{ date: 'asc' }, { id: 'asc' }]
    });
    return entries.map(serialize_1.serializeLedgerTransaction);
}
async function addCustomerTransaction(customerId, input) {
    const customer = await client_1.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer)
        throw (0, httpErrors_1.notFoundError)('Customer not found');
    return client_1.prisma.$transaction(async (tx) => {
        let vNo = input.voucherNo;
        if (!vNo) {
            vNo = await getNextVoucherNo(tx, input.voucherType);
        }
        const entry = await tx.customerLedgerEntry.create({
            data: {
                customerId,
                date: input.date,
                description: input.description,
                type: input.type,
                amount: input.amount,
                voucherType: input.voucherType,
                voucherNo: vNo,
                jobNo: input.jobNo || null,
                shipInv: input.shipInv || null,
                branch: input.branch || null,
                orig: input.orig || null,
                dest: input.dest || null,
                pcsWeight: input.pcsWeight || null,
                chequeNo: input.chequeNo || null,
                chequeDate: input.chequeDate || null,
            },
        });
        return (0, serialize_1.serializeLedgerTransaction)(entry);
    });
}
async function addVendorTransaction(vendorId, input) {
    const vendor = await client_1.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor)
        throw (0, httpErrors_1.notFoundError)('Vendor not found');
    return client_1.prisma.$transaction(async (tx) => {
        let vNo = input.voucherNo;
        if (!vNo) {
            vNo = await getNextVoucherNo(tx, input.voucherType);
        }
        const entry = await tx.vendorLedgerEntry.create({
            data: {
                vendorId,
                date: input.date,
                description: input.description,
                type: input.type,
                amount: input.amount,
                voucherType: input.voucherType,
                voucherNo: vNo,
                jobNo: input.jobNo || null,
                chequeNo: input.chequeNo || null,
                chequeDate: input.chequeDate || null,
            },
        });
        return (0, serialize_1.serializeLedgerTransaction)(entry);
    });
}
//# sourceMappingURL=ledger.service.js.map