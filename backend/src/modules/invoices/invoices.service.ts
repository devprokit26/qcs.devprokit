import { prisma } from '../../prisma/client';
import { serializeInvoice, toNumber } from '../../lib/serialize';
import { mapVoucherTypeToLabel } from '../../lib/enums';
import { getNextVoucherNo } from '../ledger/ledger.service';
import { badRequestError, notFoundError } from '../../lib/httpErrors';
import { todayStr } from '../../lib/dates';
import { writeAudit } from '../../lib/audit';

export interface ListInvoicesFilter {
  search?: string;
  from?: string;
  to?: string;
  status?: string;
}

export async function listInvoices(filter: ListInvoicesFilter = {}) {
  const where: any = {
    AND: [{
      OR: [
      { shipmentId: null },
      { shipment: { is: { status: { not: 'Unfinal' } } } },
      ],
    }],
  };
  if (filter.search && filter.search.trim()) {
    const q = filter.search.trim();
    where.OR = [
      { invoiceNo: { contains: q, mode: 'insensitive' } },
      { customerName: { contains: q, mode: 'insensitive' } },
      { awb: { contains: q, mode: 'insensitive' } },
      { jobNo: { contains: q, mode: 'insensitive' } },
      { productName: { contains: q, mode: 'insensitive' } },
      { destination: { contains: q, mode: 'insensitive' } },
      { consignee: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (filter.status) where.status = filter.status;
  if (filter.from || filter.to) {
    where.date = {};
    if (filter.from) where.date.gte = filter.from;
    if (filter.to) where.date.lte = filter.to;
  }

  const rows = await prisma.invoice.findMany({
    where,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });
  const invoices = rows.map(serializeInvoice).map((i: any) => ({ ...i, kind: 'invoice' as const }));

  // A status filter only applies to invoices, so skip payments in that case
  if (filter.status) return invoices;

  // Customer payments received = BRV / CRV credits in customer ledgers
  const receiptWhere: any = {
    type: 'credit',
    voucherType: { in: ['BRV', 'CRV'] },
  };
  if (filter.from || filter.to) {
    receiptWhere.date = {};
    if (filter.from) receiptWhere.date.gte = filter.from;
    if (filter.to) receiptWhere.date.lte = filter.to;
  }
  if (filter.search && filter.search.trim()) {
    const q = filter.search.trim();
    receiptWhere.OR = [
      { description: { contains: q, mode: 'insensitive' } },
      { voucherNo: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const receipts = await prisma.customerLedgerEntry.findMany({
    where: receiptWhere,
    include: { customer: { select: { id: true, name: true } } },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });

  const payments = receipts.map((r: any) => ({
    id: r.id,
    invoiceNo: `${String(r.voucherType)} ${r.voucherNo}`.trim(),
    shipmentId: null,
    customerId: r.customerId,
    customerName: r.customer?.name ?? `Customer #${r.customerId}`,
    isWalkIn: false,
    date: r.date,
    awb: '',
    courier: '',
    service: '',
    origin: '',
    destination: '',
    pieces: 0,
    weight: 0,
    amount: toNumber(r.amount),
    status: r.voided ? 'Cancelled' : 'Issued',
    notes: r.description,
    chequeNo: r.chequeNo ?? undefined,
    paymentMethod: String(r.description).split(/\s+(?:RCVD FRM|PAID TO)\s+/i)[0] || undefined,
    kind: 'payment' as const,
  }));

  return [...invoices, ...payments].sort(
    (a: any, b: any) =>
      String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id)
  );
}

/** Vendor bills (PINV / EXP-INV debits) plus vendor payments (BPV / CPV credits).
 *
 * Auto-generated PINV entries that are created when a shipment is booked
 * (description contains "— courier cost") are intentionally excluded from
 * the Bills tab. They still exist in the vendor ledger for accounting purposes
 * but should not appear on the Payments / Bills page — only manual bills
 * and actual vendor payment vouchers (BPV / CPV) are shown here.
 */
export async function listBills(filter: { from?: string; to?: string } = {}) {
  const where: any = { type: 'credit', voucherType: { in: ['BPV', 'CPV'] } };
  if (filter.from || filter.to) {
    where.date = {};
    if (filter.from) where.date.gte = filter.from;
    if (filter.to) where.date.lte = filter.to;
  }
  const rows = await prisma.vendorLedgerEntry.findMany({
    where,
    include: { vendor: { select: { id: true, name: true } } },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });
  return rows.map((r: any) => ({
    id: String(r.id),
    vendorId: r.vendorId,
    vendorName: r.vendor?.name ?? `Vendor #${r.vendorId}`,
    date: r.date,
    voucherType: mapVoucherTypeToLabel(r.voucherType),
    voucherNo: r.voucherNo,
    description: r.description,
    amount: toNumber(r.amount),
    chequeNo: r.chequeNo ?? undefined,
    paymentMethod: String(r.description).split(/\s+PAID TO\s+/i)[0] || undefined,
    kind: 'payment' as const,
    voided: Boolean(r.voided),
    ...(r.jobNo ? { jobNo: r.jobNo } : {}),
  }));
}

export async function voidInvoice(id: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.findUnique({ where: { id } });
    if (!inv) throw notFoundError('Invoice not found');
    if (inv.status === 'Cancelled') throw badRequestError('Invoice is already cancelled');
    if (!inv.isWalkIn && inv.customerId && Number(inv.amount) > 0) {
      const vNo = await getNextVoucherNo(tx, 'JVR');
      await tx.customerLedgerEntry.create({
        data: {
          customerId: inv.customerId,
          date: todayStr(),
          description: `Reversal - Invoice ${inv.invoiceNo} (${inv.awb}) cancelled`,
          type: 'credit',
          amount: inv.amount,
          voucherType: 'JVR',
          voucherNo: vNo,
          jobNo: inv.jobNo,
        },
      });
    }
    await tx.invoice.update({ where: { id }, data: { status: 'Cancelled' } });
    await writeAudit(tx, { userId, action: 'void', module: 'Payments', entity: 'Invoice', entityId: id,
      label: `${inv.invoiceNo} · ${inv.customerName} · PKR ${Number(inv.amount)}` });
  });
}

export async function voidReceipt(id: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const e = await tx.customerLedgerEntry.findUnique({ where: { id } });
    if (!e || e.type !== 'credit' || !['BRV', 'CRV'].includes(String(e.voucherType))) throw notFoundError('Receipt not found');
    if (e.voided) throw badRequestError('Receipt is already cancelled');
    const vNo = await getNextVoucherNo(tx, 'JVR');
    await tx.customerLedgerEntry.create({
      data: {
        customerId: e.customerId, date: todayStr(),
        description: `Reversal - ${e.voucherType} ${e.voucherNo} cancelled`,
        type: 'debit', amount: e.amount, voucherType: 'JVR', voucherNo: vNo,
      },
    });
    await tx.customerLedgerEntry.update({ where: { id }, data: { voided: true } });
    await writeAudit(tx, { userId, action: 'void', module: 'Payments', entity: 'Receipt', entityId: id,
      label: `${e.voucherType} ${e.voucherNo} · PKR ${Number(e.amount)}` });
  });
}

export async function voidBillPayment(id: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const e = await tx.vendorLedgerEntry.findUnique({ where: { id } });
    if (!e || e.type !== 'credit' || !['BPV', 'CPV'].includes(String(e.voucherType))) throw notFoundError('Payment not found');
    if (e.voided) throw badRequestError('Payment is already cancelled');
    const vNo = await getNextVoucherNo(tx, 'JVR');
    await tx.vendorLedgerEntry.create({
      data: {
        vendorId: e.vendorId, date: todayStr(),
        description: `Reversal - ${e.voucherType} ${e.voucherNo} cancelled`,
        type: 'debit', amount: e.amount, voucherType: 'JVR', voucherNo: vNo,
      },
    });
    await tx.vendorLedgerEntry.update({ where: { id }, data: { voided: true } });
    await writeAudit(tx, { userId, action: 'void', module: 'Payments', entity: 'VendorPayment', entityId: id,
      label: `${e.voucherType} ${e.voucherNo} · PKR ${Number(e.amount)}` });
  });
}
