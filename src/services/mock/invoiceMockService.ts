import { IInvoiceService } from '../api/interfaces';
import { Invoice, VendorBill, Shipment } from '@/models/types';
import { storage } from './storage';

/** Builds an invoice view of a shipment (mock mode keeps no separate table). */
export function shipmentToInvoice(s: Shipment): Invoice {
  return {
    id: s.id,
    invoiceNo: s.shipInv || `INV-${s.id}`,
    shipmentId: s.id,
    customerId: s.customerId,
    customerName: s.isWalkIn ? (s.walkInName || s.customerName || 'Walk-in Customer') : s.customerName,
    isWalkIn: !!s.isWalkIn,
    date: s.date,
    awb: s.awb,
    jobNo: s.jobNo,
    courier: s.courier,
    service: s.service,
    productName: s.productName,
    origin: s.origin,
    destination: s.destination,
    destinationAddress: s.destinationAddress,
    pieces: s.pieces,
    weight: s.weight,
    amount: s.revenue,
    status: 'Issued',
    notes: s.notes,
  };
}

const BILL_TYPES = ['PINV', 'EXP-INV'];

export class InvoiceMockService implements IInvoiceService {
  async getInvoices(): Promise<Invoice[]> {
    await new Promise(r => setTimeout(r, 30));
    const invoices = storage
      .getShipments()
      .filter(s => s.status !== 'Unfinal')
      .map(shipmentToInvoice);
    const customers = storage.getCustomers();
    const receipts: Invoice[] = storage.getCustomerLedger().flatMap(record => {
      const customer = customers.find(c => c.id === record.customerId);
      return record.transactions
        .filter(t => t.type === 'credit' && ['BRV', 'CRV'].includes(t.voucherType))
        .map((t, index) => ({
          id: Number(t.id) || record.customerId * 1_000_000 + index,
          invoiceNo: `${t.voucherType} ${t.voucherNo}`.trim(),
          shipmentId: null,
          customerId: record.customerId,
          customerName: customer?.name || `Customer #${record.customerId}`,
          isWalkIn: false,
          date: t.date,
          awb: '',
          courier: '',
          service: '',
          origin: '',
          destination: '',
          pieces: 0,
          weight: 0,
          amount: t.amount,
          status: 'Issued' as const,
          notes: t.description,
          chequeNo: t.chequeNo,
          paymentMethod: t.description.split(/\s+RCVD FRM\s+/i)[0] || undefined,
          kind: 'payment' as const,
        }));
    });
    return [...invoices, ...receipts]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }

  async getBills(): Promise<VendorBill[]> {
    await new Promise(r => setTimeout(r, 30));
    const vendors = storage.getVendors();
    const bills: VendorBill[] = [];
    storage.getVendorLedger().forEach(rec => {
      const vendor = vendors.find(v => v.id === rec.vendorId);
      rec.transactions.forEach((t, i) => {
        const isBill = t.type === 'debit' && BILL_TYPES.includes(t.voucherType);
        const isPayment = t.type === 'credit' && ['BPV', 'CPV'].includes(t.voucherType);
        if (!isBill && !isPayment) return;
        bills.push({
          id: t.id || `${rec.vendorId}-${t.voucherType}-${t.voucherNo}-${i}`,
          vendorId: rec.vendorId,
          vendorName: vendor?.name || `Vendor #${rec.vendorId}`,
          date: t.date,
          voucherType: t.voucherType,
          voucherNo: t.voucherNo,
          description: t.description,
          amount: t.amount,
          jobNo: t.jobNo,
          chequeNo: t.chequeNo,
          paymentMethod: isPayment ? t.description.split(/\s+PAID TO\s+/i)[0] || undefined : undefined,
          kind: isPayment ? 'payment' : 'bill',
        });
      });
    });
    return bills.sort((a, b) => b.date.localeCompare(a.date));
  }

  async voidInvoice(_id: number): Promise<void> {}
async voidReceipt(_id: number): Promise<void> {}
async voidBillPayment(_id: string): Promise<void> {}
}

export const invoiceService = new InvoiceMockService();
