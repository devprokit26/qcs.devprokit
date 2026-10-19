import { IInvoiceService } from '../api/interfaces';
import { Invoice, VendorBill } from '@/models/types';
import { apiFetch } from './apiClient';

function mapInvoice(r: any): Invoice {
  return {
    id: r.id,
    invoiceNo: r.invoiceNo,
    shipmentId: r.shipmentId ?? null,
    customerId: r.customerId ?? null,
    customerName: r.customerName,
    consignee: r.consignee ?? '',
    isWalkIn: !!r.isWalkIn,
    date: r.date,
    awb: r.awb,
    jobNo: r.jobNo ?? undefined,
    courier: r.courier ?? '',
    service: r.service ?? '',
    productName: r.productName ?? undefined,
    origin: r.origin ?? '',
    destination: r.destination ?? '',
    destinationAddress: r.destinationAddress ?? undefined,
    pieces: Number(r.pieces) || 1,
    weight: Number(r.weight) || 0,
    amount: Number(r.amount) || 0,
    status: r.status === 'Cancelled' ? 'Cancelled' : 'Issued',
    notes: r.notes ?? undefined,
        kind: r.kind === 'payment' ? 'payment' : 'invoice',
  };
}

export class InvoiceRestService implements IInvoiceService {
  async getInvoices(): Promise<Invoice[]> {
    const rows = await apiFetch<any[]>('/invoices');
    return (rows || []).map(mapInvoice);
  }

  async getBills(): Promise<VendorBill[]> {
    const rows = await apiFetch<any[]>('/invoices/bills');
    return (rows || []).map(r => ({ ...r, amount: Number(r.amount) || 0 }));
  }

  async voidInvoice(id: number): Promise<void> { await apiFetch(`/invoices/${id}`, { method: 'DELETE' }); }
async voidReceipt(id: number): Promise<void> { await apiFetch(`/invoices/receipts/${id}`, { method: 'DELETE' }); }
async voidBillPayment(id: string): Promise<void> { await apiFetch(`/invoices/bills/${id}`, { method: 'DELETE' }); }
}

export const invoiceService = new InvoiceRestService();
