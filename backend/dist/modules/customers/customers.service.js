"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCustomers = listCustomers;
exports.getCustomer = getCustomer;
exports.createCustomer = createCustomer;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
exports.getCustomerAging = getCustomerAging;
exports.getAllCustomersAging = getAllCustomersAging;
exports.checkCustomerCredit = checkCustomerCredit;
const client_1 = require("../../prisma/client");
const serialize_1 = require("../../lib/serialize");
const aging_1 = require("../../lib/domain/aging");
const credit_1 = require("../../lib/domain/credit");
const httpErrors_1 = require("../../lib/httpErrors");
async function listCustomers(search) {
    const where = search ? {
        OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { accountCode: { contains: search, mode: 'insensitive' } },
        ],
    } : {};
    const customers = await client_1.prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
    });
    return customers.map(serialize_1.serializeCustomer);
}
async function getCustomer(id) {
    const customer = await client_1.prisma.customer.findUnique({ where: { id } });
    if (!customer)
        throw (0, httpErrors_1.notFoundError)('Customer not found');
    return (0, serialize_1.serializeCustomer)(customer);
}
async function createCustomer(input) {
    const customer = await client_1.prisma.customer.create({ data: input });
    return (0, serialize_1.serializeCustomer)(customer);
}
async function updateCustomer(id, input) {
    const customer = await client_1.prisma.customer.update({ where: { id }, data: input });
    return (0, serialize_1.serializeCustomer)(customer);
}
/**
 * Deletes a customer together with all of their ledger (khata) entries.
 * Shipments and invoices are KEPT (they still show the customer name) but are
 * unlinked from the account so revenue reports stay correct.
 */
async function deleteCustomer(id) {
    const customer = await client_1.prisma.customer.findUnique({ where: { id } });
    if (!customer)
        throw (0, httpErrors_1.notFoundError)('Customer not found');
    await client_1.prisma.$transaction(async (tx) => {
        await tx.customerLedgerEntry.deleteMany({ where: { customerId: id } });
        await tx.shipment.updateMany({ where: { customerId: id }, data: { customerId: null } });
        await tx.invoice.updateMany({ where: { customerId: id }, data: { customerId: null } });
        await tx.customer.delete({ where: { id } });
    });
}
async function getCustomerAging(id) {
    const customer = await getCustomer(id);
    const entries = await client_1.prisma.customerLedgerEntry.findMany({
        where: { customerId: id },
        orderBy: { date: 'asc' },
    });
    const txs = entries.map(serialize_1.serializeLedgerTransaction);
    return (0, aging_1.calculateCustomerAging)(customer, txs);
}
async function getAllCustomersAging() {
    const customers = await client_1.prisma.customer.findMany({ orderBy: { name: 'asc' } });
    const allEntries = await client_1.prisma.customerLedgerEntry.findMany({ orderBy: { date: 'asc' } });
    const entriesByCustomer = new Map();
    for (const entry of allEntries) {
        const list = entriesByCustomer.get(entry.customerId) || [];
        list.push((0, serialize_1.serializeLedgerTransaction)(entry));
        entriesByCustomer.set(entry.customerId, list);
    }
    const result = {};
    for (const c of customers) {
        const sc = (0, serialize_1.serializeCustomer)(c);
        const txs = entriesByCustomer.get(c.id) || [];
        result[c.id] = (0, aging_1.calculateCustomerAging)(sc, txs);
    }
    return result;
}
async function checkCustomerCredit(id, additionalAmount = 0) {
    const customer = await getCustomer(id);
    const entries = await client_1.prisma.customerLedgerEntry.findMany({
        where: { customerId: id },
        orderBy: { date: 'asc' },
    });
    const txs = entries.map(serialize_1.serializeLedgerTransaction);
    return (0, credit_1.checkCustomerCredit)(customer, txs, additionalAmount);
}
//# sourceMappingURL=customers.service.js.map