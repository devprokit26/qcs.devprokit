"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVendors = listVendors;
exports.getVendor = getVendor;
exports.createVendor = createVendor;
exports.updateVendor = updateVendor;
exports.deleteVendor = deleteVendor;
exports.getVendorAging = getVendorAging;
const client_1 = require("../../prisma/client");
const serialize_1 = require("../../lib/serialize");
const aging_1 = require("../../lib/domain/aging");
const httpErrors_1 = require("../../lib/httpErrors");
async function listVendors(search) {
    const where = search ? {
        OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { accountCode: { contains: search, mode: 'insensitive' } },
        ],
    } : {};
    const vendors = await client_1.prisma.vendor.findMany({
        where,
        orderBy: { name: 'asc' },
    });
    return vendors.map(serialize_1.serializeVendor);
}
async function getVendor(id) {
    const vendor = await client_1.prisma.vendor.findUnique({ where: { id } });
    if (!vendor)
        throw (0, httpErrors_1.notFoundError)('Vendor not found');
    return (0, serialize_1.serializeVendor)(vendor);
}
async function createVendor(input) {
    const vendor = await client_1.prisma.vendor.create({ data: input });
    return (0, serialize_1.serializeVendor)(vendor);
}
async function updateVendor(id, input) {
    const vendor = await client_1.prisma.vendor.update({ where: { id }, data: input });
    return (0, serialize_1.serializeVendor)(vendor);
}
/**
 * Deletes a vendor together with all of their ledger entries (bills and
 * payments) — same behaviour as deleting a customer.
 */
async function deleteVendor(id) {
    const vendor = await client_1.prisma.vendor.findUnique({ where: { id } });
    if (!vendor)
        throw (0, httpErrors_1.notFoundError)('Vendor not found');
    await client_1.prisma.$transaction([
        client_1.prisma.vendorLedgerEntry.deleteMany({ where: { vendorId: id } }),
        client_1.prisma.vendor.delete({ where: { id } }),
    ]);
}
async function getVendorAging(id) {
    const vendor = await getVendor(id);
    const entries = await client_1.prisma.vendorLedgerEntry.findMany({
        where: { vendorId: id },
        orderBy: { date: 'asc' },
    });
    const txs = entries.map(serialize_1.serializeLedgerTransaction);
    return (0, aging_1.calculateVendorAging)(vendor, txs);
}
//# sourceMappingURL=vendors.service.js.map