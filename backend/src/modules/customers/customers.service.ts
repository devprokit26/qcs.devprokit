import { prisma } from '../../prisma/client';
import { CustomerInput } from './customers.schema';
import { serializeCustomer, serializeLedgerTransaction } from '../../lib/serialize';
import { calculateCustomerAging } from '../../lib/domain/aging';
import { checkCustomerCredit as domainCheckCredit } from '../../lib/domain/credit';
import { badRequestError, notFoundError } from '../../lib/httpErrors';

export async function listCustomers(search?: string) {
  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { phone: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
      { city: { contains: search, mode: 'insensitive' as const } },
      { accountCode: { contains: search, mode: 'insensitive' as const } },
    ],
  } : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  return customers.map(serializeCustomer);
}

export async function getCustomer(id: number) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw notFoundError('Customer not found');
  return serializeCustomer(customer);
}

export async function createCustomer(input: CustomerInput) {
  const customer = await prisma.customer.create({ data: input });
  return serializeCustomer(customer);
}

export async function updateCustomer(id: number, input: Partial<CustomerInput>) {
  const customer = await prisma.customer.update({ where: { id }, data: input });
  return serializeCustomer(customer);
}

/**
 * Deletes a customer together with all of their ledger (khata) entries.
 * Shipments and invoices are KEPT (they still show the customer name) but are
 * unlinked from the account so revenue reports stay correct.
 */
export async function deleteCustomer(id: number) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw notFoundError('Customer not found');

  await prisma.$transaction(async (tx) => {
    await tx.customerLedgerEntry.deleteMany({ where: { customerId: id } });
    await tx.shipment.updateMany({ where: { customerId: id }, data: { customerId: null } });
    await tx.invoice.updateMany({ where: { customerId: id }, data: { customerId: null } });
    await tx.customer.delete({ where: { id } });
  });
}

export async function getCustomerAging(id: number) {
  const customer = await getCustomer(id);
  const entries = await prisma.customerLedgerEntry.findMany({
    where: { customerId: id },
    orderBy: { date: 'asc' },
  });
  const txs = entries.map(serializeLedgerTransaction);
  return calculateCustomerAging(customer, txs);
}

export async function getAllCustomersAging() {
  const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
  const allEntries = await prisma.customerLedgerEntry.findMany({ orderBy: { date: 'asc' } });
  
  const entriesByCustomer = new Map<number, any[]>();
  for (const entry of allEntries) {
    const list = entriesByCustomer.get(entry.customerId) || [];
    list.push(serializeLedgerTransaction(entry));
    entriesByCustomer.set(entry.customerId, list);
  }

  const result: Record<number, any> = {};
  for (const c of customers) {
    const sc = serializeCustomer(c);
    const txs = entriesByCustomer.get(c.id) || [];
    result[c.id] = calculateCustomerAging(sc, txs);
  }
  return result;
}

export async function checkCustomerCredit(id: number, additionalAmount = 0) {
  const customer = await getCustomer(id);
  const entries = await prisma.customerLedgerEntry.findMany({
    where: { customerId: id },
    orderBy: { date: 'asc' },
  });
  const txs = entries.map(serializeLedgerTransaction);
  return domainCheckCredit(customer, txs, additionalAmount);
}
