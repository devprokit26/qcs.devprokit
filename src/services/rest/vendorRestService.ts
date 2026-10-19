import { IVendorService } from '../api/interfaces';
import { Vendor, LedgerTransaction, AgingBuckets } from '@/models/types';
import { apiFetch } from './apiClient';

export class VendorRestService implements IVendorService {
  async getVendors(search: string = ''): Promise<Vendor[]> {
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    return apiFetch<Vendor[]>(`/vendors?${q.toString()}`);
  }

  async getVendorById(id: number): Promise<Vendor | null> {
    return apiFetch<Vendor>(`/vendors/${id}`);
  }

  async createVendor(data: Omit<Vendor, 'id'>): Promise<Vendor> {
    return apiFetch<Vendor>('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVendor(id: number, data: Partial<Vendor>): Promise<Vendor> {
    return apiFetch<Vendor>(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVendor(id: number): Promise<boolean> {
    await apiFetch(`/vendors/${id}`, { method: 'DELETE' });
    return true;
  }

  async getVendorTransactions(vendorId: number): Promise<LedgerTransaction[]> {
    return apiFetch<LedgerTransaction[]>(`/ledger/vendor/${vendorId}`);
  }

  async addVendorTransaction(
    vendorId: number,
    txn: Omit<LedgerTransaction, 'voucherNo'> & { voucherNo?: string }
  ): Promise<LedgerTransaction> {
    return apiFetch<LedgerTransaction>(`/ledger/vendor/${vendorId}`, {
      method: 'POST',
      body: JSON.stringify(txn),
    });
  }

  async getVendorAging(vendorId: number): Promise<AgingBuckets> {
    return apiFetch<AgingBuckets>(`/ledger/vendor/${vendorId}/aging`);
  }
}

export const vendorService = new VendorRestService();
