"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCustomers = listCustomers;
exports.getCustomer = getCustomer;
exports.createCustomer = createCustomer;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
const client_1 = require("../../prisma/client");
async function listCustomers() {
    return client_1.prisma.customer.findMany({ orderBy: { name: 'asc' } });
}
async function getCustomer(id) {
    return client_1.prisma.customer.findUniqueOrThrow({ where: { id } });
}
async function createCustomer(input) {
    return client_1.prisma.customer.create({ data: input });
}
async function updateCustomer(id, input) {
    return client_1.prisma.customer.update({ where: { id }, data: input });
}
async function deleteCustomer(id) {
    // Check for shipments
    const count = await client_1.prisma.shipment.count({ where: { customerId: id } });
    if (count > 0)
        throw new Error('Cannot delete customer with existing shipments');
    await client_1.prisma.customer.delete({ where: { id } });
}
//# sourceMappingURL=customers.service.js.map