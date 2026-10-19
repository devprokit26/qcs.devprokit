import { prisma } from '../../prisma/client';
import { VendorInput } from './vendors.schema';
import { serializeVendor, serializeLedgerTransaction } from '../../lib/serialize';
import { calculateVendorAging } from '../../lib/domain/aging';
import { notFoundError } from '../../lib/httpErrors';

export async function listVendors(search?: string) {
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { city: { contains: search, mode: 'insensitive' as const } },
      { accountCode: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {};

  const vendors = await prisma.vendor.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return vendors.map(serializeVendor);
}

export async function getVendor(id: number) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw notFoundError('Vendor not found');
  return serializeVendor(vendor);
}

export async function createVendor(input: VendorInput) {
  const vendor = await prisma.vendor.create({ data: input as any });
  return serializeVendor(vendor);
}

export async function updateVendor(id: number, input: Partial<VendorInput>) {
  const vendor = await prisma.vendor.update({ where: { id }, data: input as any });
  return serializeVendor(vendor);
}

/**
 * Deletes a vendor together with all of their ledger entries (bills and
 * payments) — same behaviour as deleting a customer.
 */
export async function deleteVendor(id: number) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw notFoundError('Vendor not found');

  await prisma.$transaction([
    prisma.vendorLedgerEntry.deleteMany({ where: { vendorId: id } }),
    prisma.vendor.delete({ where: { id } }),
  ]);
}

export async function getVendorAging(id: number) {
  const vendor = await getVendor(id);
  const entries = await prisma.vendorLedgerEntry.findMany({
    where: { vendorId: id },
    orderBy: { date: 'asc' },
  });
  const txs = entries.map(serializeLedgerTransaction);
  return calculateVendorAging(vendor, txs);
}
