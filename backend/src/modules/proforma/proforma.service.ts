import { prisma } from '../../prisma/client';
import { ProformaInput } from './proforma.schema';
import { toNumber } from '../../lib/serialize';
import { getNextVoucherNo } from '../ledger/ledger.service';
import { notFoundError, badRequestError } from '../../lib/httpErrors';
import { writeAudit, diffObjects } from '../../lib/audit';

// The real consignee / customer name are intentionally NOT returned anywhere.
function serialize(r: any) {
  return {
    id: r.id,
    serialNo: r.serialNo,
    type: r.type,
    shipmentId: r.shipmentId,
    invoiceDate: r.invoiceDate,
    shipperName: r.shipperName,
    shipperCnic: r.shipperCnic,
    shipperAddress: r.shipperAddress,
    shipperPhone: r.shipperPhone,
    demoConsigneeName: r.demoConsigneeName,
    demoConsigneeAddress: r.demoConsigneeAddress,
    demoConsigneePhone: r.demoConsigneePhone,
    cartonNo: r.cartonNo,
    currency: r.currency,
    exchangeRate: r.exchangeRate == null ? null : toNumber(r.exchangeRate),
    incoterm: r.incoterm,
    reasonForExport: r.reasonForExport,
    freight: toNumber(r.freight),
    items: Array.isArray(r.items) ? r.items : [],
    packages: Array.isArray(r.packages) ? r.packages : [],
    notes: r.notes ?? '',
    awb: r.awb,
    shipDate: r.shipDate,
    origin: r.origin,
    destination: r.destination,
    pieces: r.pieces,
    weight: toNumber(r.weight),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    realShipperName: r.realShipperName, soldTo: r.soldTo, departure: r.departure, invoiceHsCode: r.invoiceHsCode,
  };
}

// Flat, readable version for the audit log (only demo names, never the real ones).
function auditSnapshot(r: any) {
  const s = serialize(r);
  return {
    type: s.type,
    invoiceDate: s.invoiceDate,
    shipperName: s.shipperName,
    shipperCnic: s.shipperCnic,
    shipperAddress: s.shipperAddress,
    shipperPhone: s.shipperPhone,
    consigneeName: s.demoConsigneeName,
    consigneeAddress: s.demoConsigneeAddress,
    consigneePhone: s.demoConsigneePhone,
    cartonNo: s.cartonNo,
    currency: s.currency,
    exchangeRate: s.exchangeRate,
    incoterm: s.incoterm,
    reasonForExport: s.reasonForExport,
    freight: s.freight,
    items: s.items
      .map((i: any, n: number) => `${n + 1}. ${i.description} | HS ${i.hsCode || '-'} | ${i.qty} ${i.unit} @ ${i.unitPrice}`)
      .join('\n'),
    boxes: s.packages
      .map((b: any, n: number) => `Box ${n + 1}: ${b.contents || '-'} | ${b.l}x${b.w}x${b.h} | gross ${b.grossWeight} / net ${b.netWeight}`)
      .join('\n'),
    notes: s.notes,
    realShipperName: s.realShipperName, soldTo: s.soldTo, departure: s.departure, invoiceHsCode: s.invoiceHsCode,
  };
}

export async function listProformas() {
  const rows = await prisma.proformaInvoice.findMany({ orderBy: { serialNo: 'desc' } });
  return rows.map(serialize);
}

/** Shipments that don't have a proforma yet. No customer or consignee names. */
export async function listAvailableShipments() {
  const used = (await prisma.proformaInvoice.findMany({ where: { shipmentId: { not: null } }, select: { shipmentId: true } }))
    .map(u => u.shipmentId)
    .filter((id): id is number => id !== null);
  const rows = await prisma.shipment.findMany({
    where: { id: { notIn: used } },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });
  return rows.map(s => ({
    id: s.id, awb: s.awb, date: s.date, origin: s.origin, destination: s.destination,
    courier: s.courier, productName: s.productName ?? '', pieces: s.pieces, weight: toNumber(s.weight),
  }));
}

export async function createProforma(input: ProformaInput, user: { id: number; username: string }) {
  return prisma.$transaction(async (tx) => {
    let ship: any = null;
    if (input.shipmentId) {
      ship = await tx.shipment.findUnique({ where: { id: input.shipmentId } });
      if (!ship) throw notFoundError('Shipment not found');
      const exists = await tx.proformaInvoice.findUnique({ where: { shipmentId: input.shipmentId } });
      if (exists) throw badRequestError(`This shipment already has proforma invoice ${exists.serialNo}`);
    }

    const serial = Number(await getNextVoucherNo(tx, 'PROFORMA'));
    if (serial < 5700001) throw badRequestError('Proforma counter is missing. Run the SQL step first.');

    const { shipmentId, items, packages, ...rest } = input;
    const row = await tx.proformaInvoice.create({
      data: {
        ...rest,
        serialNo: serial,
        shipmentId: shipmentId || null,
        items: items as any,
        packages: packages as any,
        exchangeRate: input.currency === 'PKR' ? null : input.exchangeRate ?? null,
        notes: input.notes ?? null,
        realConsignee: ship ? ((ship as any).consignee ?? '') : '',
        realCustomerName: ship ? (ship.isWalkIn ? (ship.walkInName || ship.customerName) : ship.customerName) : (input.realShipperName || ''),
        awb: ship ? ship.awb : (rest.awb || ''),
        shipDate: ship ? ship.date : (rest.shipDate || input.invoiceDate),
        origin: ship ? ship.origin : (rest.origin || 'Pakistan'),
        destination: ship ? ship.destination : (rest.destination || ''),
        pieces: ship ? ship.pieces : (rest.pieces || 0),
        weight: ship ? ship.weight : (rest.weight || 0),
        createdBy: user.username,
      },
    });
    await writeAudit(tx, {
      userId: user.id, action: 'create', module: 'Proforma', entity: 'Proforma',
      entityId: row.id, label: `${row.serialNo} · ${row.type} · ${row.awb || 'No AWB'}`,
    });
    return serialize(row);
  });
}

export async function updateProforma(id: number, input: any, userId: number) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.proformaInvoice.findUnique({ where: { id } });
    if (!old) throw notFoundError('Proforma not found');
    const data: any = { ...input };
    if (data.currency === 'PKR') data.exchangeRate = null;
    const row = await tx.proformaInvoice.update({ where: { id }, data });

    const changes = diffObjects(auditSnapshot(old), auditSnapshot(row));
    if (Object.keys(changes).length) {
      await writeAudit(tx, {
        userId, action: 'update', module: 'Proforma', entity: 'Proforma',
        entityId: id, label: `${row.serialNo} · ${row.type} · ${row.awb}`, changes,
      });
    }
    return serialize(row);
  });
}

export async function deleteProforma(id: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.proformaInvoice.findUnique({ where: { id } });
    if (!old) throw notFoundError('Proforma not found');
    await tx.proformaInvoice.delete({ where: { id } });
    await writeAudit(tx, {
      userId, action: 'delete', module: 'Proforma', entity: 'Proforma',
      entityId: id, label: `${old.serialNo} · ${old.type} · ${old.awb || 'No AWB'}`,
    });
    return { success: true, id };
  });
}