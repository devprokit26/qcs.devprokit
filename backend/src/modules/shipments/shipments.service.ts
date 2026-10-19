import { prisma } from '../../prisma/client';
import { ShipmentInput } from './shipments.schema';
import { serializeShipment, serializeCustomer, serializeVendor, serializeLedgerTransaction } from '../../lib/serialize';
import { checkCustomerCredit } from '../../lib/domain/credit';
import { generateShipmentCreateEntries, generateShipmentUpdateEntries } from '../../lib/domain/ledger';
import { getNextVoucherNo } from '../ledger/ledger.service';
import { conflictError, badRequestError, notFoundError } from '../../lib/httpErrors';
import { todayStr, shiftDateStr } from '../../lib/dates';
import { mapVoucherTypeToKey } from '../../lib/enums';

/** Builds the invoice row data from a saved shipment row */
function invoiceDataFromShipment(s: any) {
  return {
    invoiceNo: s.shipInv || `INV-${s.id}`,
    customerId: s.isWalkIn ? null : s.customerId ?? null,
    customerName: s.isWalkIn ? (s.walkInName || s.customerName || 'Walk-in Customer') : s.customerName,
    isWalkIn: Boolean(s.isWalkIn),
    date: s.date,
    awb: s.awb,
    jobNo: s.jobNo ?? null,
    courier: s.courier ?? '',
    service: s.service ?? '',
    productName: s.productName ?? null,
    origin: s.origin ?? '',
    destination: s.destination ?? '',
    destinationAddress: s.destinationAddress ?? null,
    // pieces: s.pieces ?? 1,
    weight: s.weight ?? 0,
    amount: s.revenue ?? 0,
    notes: s.notes ?? null,
    consignee: s.consignee ?? '',
pieces: s.pieces ?? 0,
  };
}

export interface ListShipmentsFilter {
  search?: string;
  status?: string;
  range?: 'today' | 'week' | 'month' | 'custom' | string;
  from?: string;
  to?: string;
}

export async function listShipments(filter?: ListShipmentsFilter) {
  const where: any = {};

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.trim();
    where.OR = [
      { awb: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { courier: { contains: q, mode: 'insensitive' } },
      { destination: { contains: q, mode: 'insensitive' } },
      { origin: { contains: q, mode: 'insensitive' } },
      { productName: { contains: q, mode: 'insensitive' } },
      { consignee: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (filter?.status && filter.status !== 'All' && filter.status !== '') {
    where.status = { equals: filter.status, mode: 'insensitive' };
  }

  const today = todayStr();
  let from: string | undefined = undefined;
  let to: string | undefined = undefined;

  if (filter?.range === 'today') {
    from = today;
    to = today;
  } else if (filter?.range === 'week') {
    from = shiftDateStr(today, -6);
    to = today;
  } else if (filter?.range === 'month') {
    from = shiftDateStr(today, -29);
    to = today;
  } else if (filter?.range === 'custom') {
    from = filter.from;
    to = filter.to;
  }

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  const list = await prisma.shipment.findMany({
    where,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    include: { cartonsUsed: true },
  });

  return list.map(serializeShipment);
}

export async function getShipment(id: number) {
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { cartonsUsed: true },
  });
  if (!shipment) throw notFoundError('Shipment not found');
  return serializeShipment(shipment);
}

export async function createShipment(input: ShipmentInput, username: string) {
  if (input.status === 'Unfinal') input = { ...input, revenue: 0, cost: 0 };
  const trimmedAwb = input.awb.trim();

  return prisma.$transaction(async (tx) => {
    // 1. Check AWB uniqueness inside transaction
    const existingAwb = await tx.shipment.findUnique({ where: { awb: trimmedAwb } });
    if (existingAwb) {
      throw conflictError(
        `AWB '${trimmedAwb}' already exists in shipment #${existingAwb.id} (${existingAwb.customerName}, ${existingAwb.date})`
      );
    }

    // 2. Fetch customer & evaluate credit limit
    let customer: any = null;
    let warning: string | undefined = undefined;

    if (!input.isWalkIn && input.customerId) {
      const dbCustomer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (dbCustomer) {
        customer = serializeCustomer(dbCustomer);
        const entries = await tx.customerLedgerEntry.findMany({
          where: { customerId: input.customerId },
          orderBy: { date: 'asc' },
        });
        const txs = entries.map(serializeLedgerTransaction);
        const check = checkCustomerCredit(customer, txs, input.revenue);

        if (check.daysLateBreach && !input.overrideCredit) {
          throw badRequestError(
            `Booking blocked: ${customer.name} has an overdue invoice ${check.oldestDaysOverdue} days past terms (${check.creditDays}d terms). Check override to proceed.`
          );
        }
        if (check.exceed && !input.overrideCredit) {
          throw badRequestError(
            `Credit limit exceeded: ${customer.name} limit is PKR ${check.creditLimit.toLocaleString()}, new balance will exceed by PKR ${check.exceedBy.toLocaleString()}. Check override to proceed.`
          );
        }
        if (check.exceed) {
          warning = `Customer exceeds credit limit by PKR ${check.exceedBy.toLocaleString()}`;
        }
      }
    }

    // 3. Find vendor by courier name (case-insensitive)
    const dbVendor = await tx.vendor.findFirst({
      where: { name: { equals: input.courier, mode: 'insensitive' } },
    });
    const vendor = dbVendor ? serializeVendor(dbVendor) : null;

    // 4. Get voucher counters & generate ledger entries
    const counterRows = await tx.voucherCounter.findMany();
    const counters: Record<string, number> = {};
    for (const row of counterRows) {
      counters[row.voucherType] = row.lastNumber;
    }

    const shipmentForPosting = {
      date: input.date,
      customerId: input.customerId ?? null,
      isWalkIn: Boolean(input.isWalkIn),
      awb: trimmedAwb,
      courier: input.courier,
      revenue: input.revenue,
      cost: input.cost,
      pieces: input.pieces,
      weight: input.weight,
      origin: input.origin,
      destination: input.destination,
      jobNo: input.jobNo || undefined,
      shipInv: input.shipInv || undefined,
    };

    const posting = generateShipmentCreateEntries(shipmentForPosting, customer, vendor, counters);

    // Save updated counters
    for (const [vType, lastNum] of Object.entries(posting.updatedCounters)) {
      await tx.voucherCounter.upsert({
        where: { voucherType: vType },
        update: { lastNumber: lastNum },
        create: { voucherType: vType, lastNumber: lastNum },
      });
    }

    // Apply ledger postings
    for (const action of posting.actions) {
      if (action.target === 'customer') {
        await tx.customerLedgerEntry.create({
          data: {
            customerId: action.entityId,
            date: action.transaction.date,
            description: action.transaction.description,
            type: action.transaction.type,
            amount: action.transaction.amount,
            voucherType: mapVoucherTypeToKey(action.transaction.voucherType) as any,
            voucherNo: action.transaction.voucherNo,
            jobNo: action.transaction.jobNo || null,
            shipInv: action.transaction.shipInv || null,
            branch: action.transaction.branch || null,
            orig: action.transaction.orig || null,
            dest: action.transaction.dest || null,
            pcsWeight: action.transaction.pcsWeight || null,
          },
        });
      } else if (action.target === 'vendor') {
        await tx.vendorLedgerEntry.create({
          data: {
            vendorId: action.entityId,
            date: action.transaction.date,
            description: action.transaction.description,
            type: action.transaction.type,
            amount: action.transaction.amount,
            voucherType: mapVoucherTypeToKey(action.transaction.voucherType) as any,
            voucherNo: action.transaction.voucherNo,
            jobNo: action.transaction.jobNo || null,
            chequeNo: null,
          },
        });
      }
    }

    // 5. Create shipment
    const { cartonsUsed, overrideCredit, ...shipmentData } = input;
    const shipment = await tx.shipment.create({
      data: {
        ...shipmentData,
        awb: trimmedAwb,
      },
    });

    // 6. Create the customer invoice for this shipment (shows on the Invoices page)
    if (shipment.status !== 'Unfinal') {
      await tx.invoice.create({
        data: { shipmentId: shipment.id, status: 'Issued', ...invoiceDataFromShipment(shipment) },
      });
    }

    // 7. Record cartons used
    if (cartonsUsed && cartonsUsed.length > 0) {
      for (const c of cartonsUsed) {
        await tx.cartonMovement.create({
          data: {
            cartonTypeId: c.cartonTypeId,
            date: input.date,
            movementType: 'USED',
            quantity: c.quantity,
            shipmentId: shipment.id,
            createdBy: username,
          },
        });
      }
    }

    const createdWithCartons = await tx.shipment.findUnique({
      where: { id: shipment.id },
      include: { cartonsUsed: true },
    });

    return {
      shipment: serializeShipment(createdWithCartons),
      warning,
    };
  });
}

export async function updateShipment(id: number, input: Partial<ShipmentInput>, username: string) {
  if (input.status === 'Unfinal') input = { ...input, revenue: 0, cost: 0 };
  return prisma.$transaction(async (tx) => {
    const oldShipmentDb = await tx.shipment.findUnique({
      where: { id },
      include: { cartonsUsed: true },
    });
    if (!oldShipmentDb) throw notFoundError('Shipment not found');

    const oldShipment = serializeShipment(oldShipmentDb);

    const existingInv = await tx.invoice.findUnique({ where: { shipmentId: id } });
if (existingInv?.status === 'Cancelled') {
  throw badRequestError('This invoice was cancelled. The shipment cannot be edited.');
}

    // 1. Check AWB uniqueness if AWB changed
    if (input.awb) {
      const trimmedAwb = input.awb.trim();
      if (trimmedAwb !== oldShipment.awb) {
        const existingAwb = await tx.shipment.findUnique({ where: { awb: trimmedAwb } });
        if (existingAwb && existingAwb.id !== id) {
          throw conflictError(
            `AWB '${trimmedAwb}' already exists in shipment #${existingAwb.id} (${existingAwb.customerName}, ${existingAwb.date})`
          );
        }
      }
    }

    const newAwb = input.awb ? input.awb.trim() : oldShipment.awb;
    const newIsWalkIn = input.isWalkIn !== undefined ? input.isWalkIn : oldShipment.isWalkIn;
    const newCustomerId = input.customerId !== undefined ? input.customerId : oldShipment.customerId;
    const newRevenue = input.revenue !== undefined ? input.revenue : oldShipment.revenue;
    const newCourier = input.courier !== undefined ? input.courier : oldShipment.courier;
    const newCost = input.cost !== undefined ? input.cost : oldShipment.cost;

    // 2. Credit check on update
    let warning: string | undefined = undefined;
    let newCustomer: any = null;

    if (!newIsWalkIn && newCustomerId) {
      const dbCust = await tx.customer.findUnique({ where: { id: newCustomerId } });
      if (dbCust) {
        newCustomer = serializeCustomer(dbCust);
        let revenueDelta = newRevenue;
        if (!oldShipment.isWalkIn && oldShipment.customerId === newCustomerId) {
          revenueDelta = newRevenue - oldShipment.revenue;
        }

        if (revenueDelta > 0) {
          const entries = await tx.customerLedgerEntry.findMany({
            where: { customerId: newCustomerId },
            orderBy: { date: 'asc' },
          });
          const txs = entries.map(serializeLedgerTransaction);
          const check = checkCustomerCredit(newCustomer, txs, revenueDelta);

          if (check.daysLateBreach && !input.overrideCredit) {
            throw badRequestError(
              `Booking blocked: ${newCustomer.name} has an overdue invoice ${check.oldestDaysOverdue} days past terms. Check override to proceed.`
            );
          }
          if (check.exceed && !input.overrideCredit) {
            throw badRequestError(
              `Credit limit exceeded: ${newCustomer.name} limit is PKR ${check.creditLimit.toLocaleString()}, will exceed by PKR ${check.exceedBy.toLocaleString()}. Check override to proceed.`
            );
          }
          if (check.exceed) {
            warning = `Customer exceeds credit limit by PKR ${check.exceedBy.toLocaleString()}`;
          }
        }
      }
    }

    const oldCustomerDb = !oldShipment.isWalkIn && oldShipment.customerId
      ? await tx.customer.findUnique({ where: { id: oldShipment.customerId } })
      : null;
    const oldCustomer = oldCustomerDb ? serializeCustomer(oldCustomerDb) : null;

    const oldVendorDb = await tx.vendor.findFirst({
      where: { name: { equals: oldShipment.courier, mode: 'insensitive' } },
    });
    const oldVendor = oldVendorDb ? serializeVendor(oldVendorDb) : null;

    const newVendorDb = await tx.vendor.findFirst({
      where: { name: { equals: newCourier, mode: 'insensitive' } },
    });
    const newVendor = newVendorDb ? serializeVendor(newVendorDb) : null;

    // 3. Ledger postings for update
    const counterRows = await tx.voucherCounter.findMany();
    const counters: Record<string, number> = {};
    for (const row of counterRows) {
      counters[row.voucherType] = row.lastNumber;
    }

    const updatedShipmentForPosting = {
      date: input.date || oldShipment.date,
      customerId: newCustomerId,
      isWalkIn: newIsWalkIn,
      awb: newAwb,
      courier: newCourier,
      revenue: newRevenue,
      cost: newCost,
      pieces: input.pieces !== undefined ? input.pieces : oldShipment.pieces,
      weight: input.weight !== undefined ? input.weight : oldShipment.weight,
      origin: input.origin !== undefined ? input.origin : oldShipment.origin,
      destination: input.destination !== undefined ? input.destination : oldShipment.destination,
      jobNo: input.jobNo !== undefined ? input.jobNo : oldShipment.jobNo,
      shipInv: input.shipInv !== undefined ? input.shipInv : oldShipment.shipInv,
    };

    const posting = generateShipmentUpdateEntries(
      oldShipment,
      updatedShipmentForPosting,
      oldCustomer,
      newCustomer,
      oldVendor,
      newVendor,
      counters
    );

    for (const [vType, lastNum] of Object.entries(posting.updatedCounters)) {
      await tx.voucherCounter.upsert({
        where: { voucherType: vType },
        update: { lastNumber: lastNum },
        create: { voucherType: vType, lastNumber: lastNum },
      });
    }

    for (const action of posting.actions) {
      if (action.target === 'customer') {
        await tx.customerLedgerEntry.create({
          data: {
            customerId: action.entityId,
            date: action.transaction.date,
            description: action.transaction.description,
            type: action.transaction.type,
            amount: action.transaction.amount,
            voucherType: mapVoucherTypeToKey(action.transaction.voucherType) as any,
            voucherNo: action.transaction.voucherNo,
            jobNo: action.transaction.jobNo || null,
          },
        });
      } else if (action.target === 'vendor') {
        await tx.vendorLedgerEntry.create({
          data: {
            vendorId: action.entityId,
            date: action.transaction.date,
            description: action.transaction.description,
            type: action.transaction.type,
            amount: action.transaction.amount,
            voucherType: mapVoucherTypeToKey(action.transaction.voucherType) as any,
            voucherNo: action.transaction.voucherNo,
            jobNo: action.transaction.jobNo || null,
          },
        });
      }
    }

    // 4. Update shipment row
    const { cartonsUsed, overrideCredit, ...dataToUpdate } = input;
    if (dataToUpdate.awb) {
      dataToUpdate.awb = dataToUpdate.awb.trim();
    }

    const updated = await tx.shipment.update({
      where: { id },
      data: dataToUpdate,
    });

    // 5. Keep the invoice in sync with the edited shipment
    if (updated.status !== 'Unfinal') {
      await tx.invoice.upsert({
        where: { shipmentId: id },
        update: { ...invoiceDataFromShipment(updated) },
        create: { shipmentId: id, status: 'Issued', ...invoiceDataFromShipment(updated) },
      });
    }

    // 6. Diff & sync cartons
    if (cartonsUsed) {
      const existingMovements = await tx.cartonMovement.findMany({ where: { shipmentId: id } });
      const currentNet = new Map<number, number>();
      for (const mov of existingMovements) {
        const cur = currentNet.get(mov.cartonTypeId) || 0;
        if (mov.movementType === 'USED') {
          currentNet.set(mov.cartonTypeId, cur + mov.quantity);
        } else if (mov.movementType === 'RETURNED') {
          currentNet.set(mov.cartonTypeId, cur - mov.quantity);
        }
      }

      const targetQty = new Map<number, number>();
      for (const line of cartonsUsed) {
        targetQty.set(line.cartonTypeId, (targetQty.get(line.cartonTypeId) || 0) + line.quantity);
      }

      const allCartonTypeIds = new Set([...currentNet.keys(), ...targetQty.keys()]);
      for (const cTypeId of allCartonTypeIds) {
        const cur = currentNet.get(cTypeId) || 0;
        const target = targetQty.get(cTypeId) || 0;
        const diff = target - cur;
        if (diff > 0) {
          await tx.cartonMovement.create({
            data: {
              cartonTypeId: cTypeId,
              date: updated.date,
              movementType: 'USED',
              quantity: diff,
              shipmentId: id,
              createdBy: username,
            },
          });
        } else if (diff < 0) {
          await tx.cartonMovement.create({
            data: {
              cartonTypeId: cTypeId,
              date: updated.date,
              movementType: 'RETURNED',
              quantity: Math.abs(diff),
              shipmentId: id,
              createdBy: username,
            },
          });
        }
      }
    }

    const finalShipment = await tx.shipment.findUnique({
      where: { id },
      include: { cartonsUsed: true },
    });

    return {
      shipment: serializeShipment(finalShipment),
      warning,
    };
  });
}

export async function updateShipmentStatus(id: number, status: string, username: string) {
  const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Returned', 'Unfinal'];
  if (!validStatuses.includes(status)) {
    throw badRequestError(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`);
  }

  const current = await getShipment(id);
  if (current.status === 'Unfinal' && status !== 'Unfinal') {
    throw badRequestError('Finalize this shipment from Alerts to enter revenue and cost.');
  }
  if (status === 'Unfinal') {
    const result = await updateShipment(id, { status: 'Unfinal', revenue: 0, cost: 0 }, username);
    return result.shipment;
  }

  const shipment = await prisma.shipment.update({
    where: { id },
    data: { status: status as any },
    include: { cartonsUsed: true },
  });

  return serializeShipment(shipment);
}

export async function deleteShipment(id: number) {
  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({ where: { id } });
    if (!shipment) throw notFoundError('Shipment not found');

    // Reversal JVR credit for customer if applicable
    const inv0 = await tx.invoice.findFirst({ where: { shipmentId: id } });
if (inv0?.status !== 'Cancelled' && !shipment.isWalkIn && shipment.customerId && Number(shipment.revenue) > 0) {
      const vNo = await getNextVoucherNo(tx, 'JVR');
      await tx.customerLedgerEntry.create({
        data: {
          customerId: shipment.customerId,
          date: todayStr(),
          description: `Reversal - ${shipment.awb} (deleted shipment)`,
          type: 'credit',
          amount: shipment.revenue,
          voucherType: 'JVR',
          voucherNo: vNo,
        },
      });
    }

    // Reversal JVR credit for vendor if applicable
    if (shipment.courier && Number(shipment.cost) > 0) {
      const vendor = await tx.vendor.findFirst({
        where: { name: { equals: shipment.courier, mode: 'insensitive' } },
      });
      if (vendor) {
        const vNo = await getNextVoucherNo(tx, 'JVR');
        await tx.vendorLedgerEntry.create({
          data: {
            vendorId: vendor.id,
            date: todayStr(),
            description: `Reversal - ${shipment.awb} (deleted shipment)`,
            type: 'credit',
            amount: shipment.cost,
            voucherType: 'JVR',
            voucherNo: vNo,
          },
        });
      }
    }

    // Keep the invoice for the audit trail, but mark it cancelled
    await tx.invoice.updateMany({
      where: { shipmentId: id },
      data: { status: 'Cancelled', shipmentId: null },
    });

    // Delete carton movements and shipment row
    await tx.cartonMovement.deleteMany({ where: { shipmentId: id } });
    await tx.shipment.delete({ where: { id } });
  });
}
