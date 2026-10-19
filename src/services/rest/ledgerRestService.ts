import { ILedgerService } from '../api/interfaces';
import { Customer, LedgerTransaction, AgingBuckets, CreditLimitCheckResult } from '@/models/types';
import { apiFetch } from './apiClient';

export class LedgerRestService implements ILedgerService {
  async getCustomers(search: string = ''): Promise<Customer[]> {
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    return apiFetch<Customer[]>(`/customers?${q.toString()}`);
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return apiFetch<Customer>(`/customers/${id}`);
  }

  async createCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
    return apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    return apiFetch<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: number): Promise<boolean> {
    await apiFetch(`/customers/${id}`, { method: 'DELETE' });
    return true;
  }

  async getCustomerTransactions(customerId: number): Promise<LedgerTransaction[]> {
    return apiFetch<LedgerTransaction[]>(`/ledger/customer/${customerId}`);
  }

  async addCustomerTransaction(
    customerId: number,
    txn: Omit<LedgerTransaction, 'voucherNo'> & { voucherNo?: string }
  ): Promise<LedgerTransaction> {
    return apiFetch<LedgerTransaction>(`/ledger/customer/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(txn),
    });
  }

  async getCustomerAging(customerId: number): Promise<AgingBuckets> {
    return apiFetch<AgingBuckets>(`/ledger/customer/${customerId}/aging`);
  }

  async getAllCustomerAging(): Promise<Record<number, AgingBuckets>> {
    return apiFetch<Record<number, AgingBuckets>>('/customers/aging/all');
  }

  async checkCredit(customerId: number, additionalAmount: number): Promise<CreditLimitCheckResult> {
    return apiFetch<CreditLimitCheckResult>(`/customers/${customerId}/check-credit`, {
      method: 'POST',
      body: JSON.stringify({ additionalAmount }),
    });
  }
}

export const ledgerService = new LedgerRestService();
