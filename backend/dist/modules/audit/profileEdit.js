"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editPartyWithAudit = editPartyWithAudit;
const client_1 = require("../../prisma/client");
const serialize_1 = require("../../lib/serialize");
const httpErrors_1 = require("../../lib/httpErrors");
const audit_1 = require("../../lib/audit");
async function editPartyWithAudit(kind, id, body, userId, run) {
    const isCust = kind === 'customer';
    const find = () => (isCust ? client_1.prisma.customer.findUnique({ where: { id } }) : client_1.prisma.vendor.findUnique({ where: { id } }));
    const before = await find();
    if (!before)
        throw (0, httpErrors_1.notFoundError)(isCust ? 'Customer not found' : 'Vendor not found');
    // Opening balance is locked once the party has any entry, shipment or invoice
    // if (body.openingBalance !== undefined && Number(body.openingBalance) !== toNumber(before.openingBalance)) {
    //   const used = isCust
    //     ? (await prisma.customerLedgerEntry.count({ where: { customerId: id } })) +
    //       (await prisma.shipment.count({ where: { customerId: id } })) +
    //       (await prisma.invoice.count({ where: { customerId: id } }))
    //     : await prisma.vendorLedgerEntry.count({ where: { vendorId: id } });
    //   if (used > 0) {
    //     throw badRequestError('Opening balance is locked because this account already has transactions.');
    //   }
    // }
    const result = await run();
    const after = await find();
    const ser = isCust ? serialize_1.serializeCustomer : serialize_1.serializeVendor;
    const changes = (0, audit_1.diffObjects)(ser(before), ser(after));
    if (Object.keys(changes).length) {
        await (0, audit_1.writeAudit)(client_1.prisma, {
            userId,
            action: 'update',
            module: 'Ledger',
            entity: isCust ? 'Customer' : 'Vendor',
            entityId: id,
            label: after.name,
            changes,
        });
    }
    return result;
}
//# sourceMappingURL=profileEdit.js.map