import { IVendorService } from '../api/interfaces';
import { Vendor, LedgerTransaction, AgingBuckets } from '@/models/types';
import { storage } from './storage';
import { calculateVendorAging } from '@/models/aging';
import { getNextVoucherNumber } from '@/models/vouchers';

export class VendorMockService implements IVendorService {
  async getVendors(search: string = ''): Promise<Vendor[]> {
    await new Promise(r => setTimeout(r, 40));
    const all = storage.getVendors();
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(v => v.name.toLowerCase().includes(q) || v.city.toLowerCase().includes(q) || v.category.toLowerCase().includes(q));
  }

  async getVendorById(id: number): Promise<Vendor | null> {
    await new Promise(r => setTimeout(r, 20));
    return storage.getVendors().find(v => v.id === id) || null;
  }

  async createVendor(data: Omit<Vendor, 'id'>): Promise<Vendor> {
    await new Promise(r => setTimeout(r, 70));
    const vendors = storage.getVendors();
    const nextId = vendors.length ? Math.max(...vendors.map(v => v.id)) + 1 : 1;
    const newVendor: Vendor = {
      id: nextId,
      ...data,
      creditDays: Number(data.creditDays) || 30,
      openingBalance: Number(data.openingBalance) || 0,
    };
    vendors.push(newVendor);
    storage.setVendors(vendors);

    const ledgers = storage.getVendorLedger();
    if (!ledgers.some(l => l.vendorId === nextId)) {
      ledgers.push({ vendorId: nextId, transactions: [] });
      storage.setVendorLedger(ledgers);
    }

    return newVendor;
  }

  async updateVendor(id: number, data: Partial<Vendor>): Promise<Vendor> {
    await new Promise(r => setTimeout(r, 60));
    const vendors = storage.getVendors();
    const idx = vendors.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Vendor not found');

    const updated: Vendor = {
      ...vendors[idx],
      ...data,
      creditDays: data.creditDays !== undefined ? Number(data.creditDays) : vendors[idx].creditDays,
      openingBalance: data.openingBalance !== undefined ? Number(data.openingBalance) : vendors[idx].openingBalance,
    };
    vendors[idx] = updated;
    storage.setVendors(vendors);
    return updated;
  }

  async deleteVendor(id: number): Promise<boolean> {
    await new Promise(r => setTimeout(r, 80));
    const vendors = storage.getVendors().filter(v => v.id !== id);
    storage.setVendors(vendors);

    const ledgers = storage.getVendorLedger().filter(l => l.vendorId !== id);
    storage.setVendorLedger(ledgers);
    return true;
  }

  async getVendorTransactions(vendorId: number): Promise<LedgerTransaction[]> {
    await new Promise(r => setTimeout(r, 30));
    const ledgers = storage.getVendorLedger();
    const record = ledgers.find(l => l.vendorId === vendorId);
    return record ? [...record.transactions] : [];
  }

  async addVendorTransaction(
    vendorId: number,
    txn: Omit<LedgerTransaction, 'voucherNo'> & { voucherNo?: string }
  ): Promise<LedgerTransaction> {
    await new Promise(r => setTimeout(r, 70));
    const ledgers = storage.getVendorLedger();
    let record = ledgers.find(l => l.vendorId === vendorId);
    if (!record) {
      record = { vendorId, transactions: [] };
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
    storage.setVendorLedger(ledgers);
    return fullTxn;
  }

  async getVendorAging(vendorId: number): Promise<AgingBuckets> {
    const vendor = await this.getVendorById(vendorId);
    const txns = await this.getVendorTransactions(vendorId);
    return calculateVendorAging(vendor, txns);
  }
}

export const vendorService = new VendorMockService();
