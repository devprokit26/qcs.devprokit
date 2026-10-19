"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVendors = listVendors;
exports.getVendor = getVendor;
exports.createVendor = createVendor;
exports.updateVendor = updateVendor;
exports.deleteVendor = deleteVendor;
const client_1 = require("../../prisma/client");
async function listVendors() {
    return client_1.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
}
async function getVendor(id) {
    return client_1.prisma.vendor.findUniqueOrThrow({ where: { id } });
}
async function createVendor(input) {
    return client_1.prisma.vendor.create({ data: input });
}
async function updateVendor(id, input) {
    return client_1.prisma.vendor.update({ where: { id }, data: input });
}
async function deleteVendor(id) {
    await client_1.prisma.vendor.delete({ where: { id } });
}
//# sourceMappingURL=vendors.service.js.map