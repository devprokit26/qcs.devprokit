import { ILedgerService } from '../api/interfaces';
import { Customer, LedgerTransaction, AgingBuckets, CreditLimitCheckResult } from '@/models/types';
import { storage } from './storage';
import { calculateCustomerAging } from '@/models/aging';
import { checkCustomerCredit } from '@/models/credit';
import { getNextVoucherNumber } from '@/models/vouchers';

export class LedgerMockService implements ILedgerService {
  async getCustomers(search: string = ''): Promise<Customer[]> {
    await new Promise(r => setTimeout(r, 40));
    const all = storage.getCustomers();
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.phone.includes(q));
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    await new Promise(r => setTimeout(r, 20));
    return storage.getCustomers().find(c => c.id === id) || null;
  }

  async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    await new Promise(r => setTimeout(r, 80));
    const customers = storage.getCustomers();
    const nextId = customers.length ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    const newCustomer: Customer = {
      id: nextId,
      ...data,
      creditLimit: Number(data.creditLimit) || 0,
      creditDays: Number(data.creditDays) || 30,
      openingBalance: Number(data.openingBalance) || 0,
    };
    customers.push(newCustomer);
    storage.setCustomers(customers);

    // Initialize ledger record
    const ledgers = storage.getCustomerLedger();
    if (!ledgers.some(l => l.customerId === nextId)) {
      ledgers.push({ customerId: nextId, transactions: [] });
      storage.setCustomerLedger(ledgers);
    }

    return newCustomer;
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    await new Promise(r => setTimeout(r, 60));
    const customers = storage.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');

    const updated: Customer = {
      ...customers[idx],
      ...data,
      creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : customers[idx].creditLimit,
      creditDays: data.creditDays !== undefined ? Number(data.creditDays) : customers[idx].creditDays,
      openingBalance: data.openingBalance !== undefined ? Number(data.openingBalance) : customers[idx].openingBalance,
    };
    customers[idx] = updated;
    storage.setCustomers(customers);
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await new Promise(r => setTimeout(r, 80));
    const customers = storage.getCustomers().filter(c => c.id !== id);
    storage.setCustomers(customers);

    const ledgers = storage.getCustomerLedger().filter(l => l.customerId !== id);
    storage.setCustomerLedger(ledgers);

    // Keep the customer's shipments (and their invoices) but unlink them
    const shipments = storage.getShipments().map(s =>
      s.customerId === id ? { ...s, customerId: null } : s
    );
    storage.setShipments(shipments);
    return true;
  }

  async getCustomerTransactions(customerId: number): Promise<LedgerTransaction[]> {
    await new Promise(r => setTimeout(r, 30));
    const ledgers = storage.getCustomerLedger();
    const record = ledgers.find(l => l.customerId === customerId);
    return record ? [...record.transactions] : [];
  }

  async addCustomerTransaction(
    customerId: number,
    txn: Omit<LedgerTransaction, 'voucherNo'> & { voucherNo?: string }
  ): Promise<LedgerTransaction> {
    await new Promise(r => setTimeout(r, 70));
    const ledgers = storage.getCustomerLedger();
    let record = ledgers.find(l => l.customerId === customerId);
    if (!record) {
      record = { customerId, transactions: [] };
      ledgers.push(record);
    }

    let voucherNo = txn.voucherNo;
    if (!voucherNo) {
      const counters = storage.getVoucherCounters();
      const { updatedCounters, voucherNoStr } = getNextVoucherNumber(counters, txn.voucherType);
      storage.setVoucherCounters(updatedCounters);
      voucherNo = voucherNoStr;
    }

    const fullTxn: LedgerTransaction = {
      ...txn,
      voucherNo,
    };

    record.transactions.unshift(fullTxn);
    storage.setCustomerLedger(ledgers);
    return fullTxn;
  }

  async getCustomerAging(customerId: number): Promise<AgingBuckets> {
    const customer = await this.getCustomerById(customerId);
    const txns = await this.getCustomerTransactions(customerId);
    return calculateCustomerAging(customer, txns);
  }

  async getAllCustomerAging(): Promise<Record<number, AgingBuckets>> {
    const customers = storage.getCustomers();
    const ledgers = storage.getCustomerLedger();
    const map: Record<number, AgingBuckets> = {};

    customers.forEach(c => {
      const record = ledgers.find(l => l.customerId === c.id);
      map[c.id] = calculateCustomerAging(c, record ? record.transactions : []);
    });

    return map;
  }

  async checkCredit(customerId: number, additionalAmount: number): Promise<CreditLimitCheckResult> {
    const customer = await this.getCustomerById(customerId);
    const txns = await this.getCustomerTransactions(customerId);
    return checkCustomerCredit(customer, txns, additionalAmount);
  }
}

export const ledgerService = new LedgerMockService();
