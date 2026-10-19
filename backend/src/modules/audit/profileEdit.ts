import { prisma } from '../../prisma/client';
import { serializeCustomer, serializeVendor, toNumber } from '../../lib/serialize';
import { badRequestError, notFoundError } from '../../lib/httpErrors';
import { diffObjects, writeAudit } from '../../lib/audit';

export async function editPartyWithAudit(
  kind: 'customer' | 'vendor',
  id: number,
  body: any,
  userId: number,
  run: () => Promise<any>
) {
  const isCust = kind === 'customer';
  const find = () => (isCust ? prisma.customer.findUnique({ where: { id } }) : prisma.vendor.findUnique({ where: { id } })) as Promise<any>;

  const before = await find();
  if (!before) throw notFoundError(isCust ? 'Customer not found' : 'Vendor not found');

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
  const ser: any = isCust ? serializeCustomer : serializeVendor;
  const changes = diffObjects(ser(before), ser(after));
  if (Object.keys(changes).length) {
    await writeAudit(prisma, {
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