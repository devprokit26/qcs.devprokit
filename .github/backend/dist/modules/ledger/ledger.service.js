"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerLedger = getCustomerLedger;
exports.getVendorLedger = getVendorLedger;
const client_1 = require("../../prisma/client");
async function getCustomerLedger(customerId) {
    return client_1.prisma.customerLedgerEntry.findMany({
        where: { customerId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }]
    });
}
async function getVendorLedger(vendorId) {
    return client_1.prisma.vendorLedgerEntry.findMany({
        where: { vendorId },
        orderBy: [{ date: 'desc' }, { id: 'desc' }]
    });
}
//# sourceMappingURL=ledger.service.js.map