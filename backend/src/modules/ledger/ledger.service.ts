import { prisma } from '../../prisma/client';
import { CreateLedgerEntryInput } from './ledger.schema';
import { serializeLedgerTransaction } from '../../lib/serialize';
import { getCustomerAging } from '../customers/customers.service';
import { getVendorAging } from '../vendors/vendors.service';
import { notFoundError } from '../../lib/httpErrors';

export async function getNextVoucherNo(tx: any, voucherType: string): Promise<string> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(746352)`;
  const counter = await tx.voucherCounter.findUnique({
    where: { voucherType },
  });
  const nextNumber = counter ? counter.lastNumber + 1 : 1001;
  await tx.voucherCounter.upsert({
    where: { voucherType },
    update: { lastNumber: nextNumber },
    create: { voucherType, lastNumber: nextNumber },
  });
  return String(nextNumber);
}

export async function getCustomerLedger(customerId: number) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw notFoundError('Customer not found');
  const entries = await prisma.customerLedgerEntry.findMany({
    where: { customerId },
    orderBy: [{ date: 'asc' }, { id: 'asc' }]
  });
  return entries.map(serializeLedgerTransaction);
}

export async function getVendorLedger(vendorId: number) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw notFoundError('Vendor not found');
  const entries = await prisma.vendorLedgerEntry.findMany({
    where: { vendorId },
    orderBy: [{ date: 'asc' }, { id: 'asc' }]
  });
  return entries.map(serializeLedgerTransaction);
}

export async function addCustomerTransaction(customerId: number, input: CreateLedgerEntryInput) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw notFoundError('Customer not found');

  return prisma.$transaction(async (tx) => {
    let vNo = input.voucherNo;
    if (!vNo) {
      vNo = await getNextVoucherNo(tx, input.voucherType);
    }

    const entry = await tx.customerLedgerEntry.create({
      data: {
        customerId,
        date: input.date,
        description: input.description,
        type: input.type,
        amount: input.amount,
        voucherType: input.voucherType as any,
        voucherNo: vNo,
        jobNo: input.jobNo || null,
        shipInv: input.shipInv || null,
        branch: input.branch || null,
        orig: input.orig || null,
        dest: input.dest || null,
        pcsWeight: input.pcsWeight || null,
        chequeNo: input.chequeNo || null,
        chequeDate: input.chequeDate || null,
      },
    });

    return serializeLedgerTransaction(entry);
  });
}

export async function addVendorTransaction(vendorId: number, input: CreateLedgerEntryInput) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw notFoundError('Vendor not found');

  return prisma.$transaction(async (tx) => {
    let vNo = input.voucherNo;
    if (!vNo) {
      vNo = await getNextVoucherNo(tx, input.voucherType);
    }

    const entry = await tx.vendorLedgerEntry.create({
      data: {
        vendorId,
        date: input.date,
        description: input.description,
        type: input.type,
        amount: input.amount,
        voucherType: input.voucherType as any,
        voucherNo: vNo,
        jobNo: input.jobNo || null,
        chequeNo: input.chequeNo || null,
        chequeDate: input.chequeDate || null,
      },
    });

    return serializeLedgerTransaction(entry);
  });
}

export { getCustomerAging, getVendorAging };
