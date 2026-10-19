import { useState, useEffect, useCallback } from 'react';
import {
  Customer,
  Vendor,
  LedgerTransaction,
  AgingBuckets,
  VoucherType,
  Shipment,
} from '@/models/types';
import { ledgerService, vendorService, shipmentService } from '@/services';
import { calculateCustomerBalance, calculateVendorBalance } from '@/models/balance';
import { calculateCustomerAging, calculateVendorAging } from '@/models/aging';
import { formatPKR } from '@/utils/formatters';
import { COMPANY } from '@/utils/branding';
import { exportGeneralLedgerPDF } from '@/utils/pdfExport';
import toast from 'react-hot-toast';

export function useLedgerController() {
  const [activeSubTab, setActiveSubTab] = useState<'customers' | 'vendors'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [shipmentLookup, setShipmentLookup] = useState<Record<string, Shipment>>({});

  const [customerTxnMap, setCustomerTxnMap] = useState<Record<number, LedgerTransaction[]>>({});
  const [vendorTxnMap, setVendorTxnMap] = useState<Record<number, LedgerTransaction[]>>({});

  const [customerShipmentCountMap, setCustomerShipmentCountMap] = useState<Record<number, number>>({});

  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [custList, vendList, allShipments] = await Promise.all([
        ledgerService.getCustomers(customerSearch),
        vendorService.getVendors(vendorSearch),
        shipmentService.getShipments(),
      ]);

      setCustomers(custList);
      setVendors(vendList);

      // Count shipments per customer
      const shipMap: Record<number, number> = {};
      allShipments.forEach(s => {
        if (!s.isWalkIn && s.customerId) {
          shipMap[s.customerId] = (shipMap[s.customerId] || 0) + 1;
        }
      });
      setCustomerShipmentCountMap(shipMap);
      const lookup: Record<string, Shipment> = {};
allShipments.forEach(s => {
  if (s.shipInv) lookup[`inv:${s.shipInv}`] = s;
  if (s.jobNo) lookup[`job:${s.jobNo}`] = s;
});
setShipmentLookup(lookup);

      // Load transactions for all customers
      const cTxns: Record<number, LedgerTransaction[]> = {};
      await Promise.all(
        custList.map(async c => {
          cTxns[c.id] = await ledgerService.getCustomerTransactions(c.id);
        })
      );
      setCustomerTxnMap(cTxns);

      // Load transactions for all vendors
      const vTxns: Record<number, LedgerTransaction[]> = {};
      await Promise.all(
        vendList.map(async v => {
          vTxns[v.id] = await vendorService.getVendorTransactions(v.id);
        })
      );
      setVendorTxnMap(vTxns);
    } catch {
      toast.error('Failed to load ledger records');
    } finally {
      setLoading(false);
    }
  }, [customerSearch, vendorSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Customer actions
  const createCustomer = async (data: Omit<Customer, 'id'>) => {
    try {
      const created = await ledgerService.createCustomer(data);
      toast.success(`Customer "${created.name}" created!`);
      await loadData();
      return created;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer');
      return null;
    }
  };

  const updateCustomer = async (id: number, data: Partial<Customer>) => {
    try {
      const updated = await ledgerService.updateCustomer(id, data);
      toast.success(`Customer "${updated.name}" updated!`);
      await loadData();
      return updated;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update customer');
      return null;
    }
  };

  const deleteCustomer = async (id: number) => {
    try {
      await ledgerService.deleteCustomer(id);
      toast.success('Customer deleted');
      await loadData();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer');
      return false;
    }
  };

  const receiveCustomerPayment = async (
    customerId: number,
    data: {
      amount: number;
      date: string;
      voucherType: VoucherType;
      voucherNo?: string;
      method: string;
      chequeNo?: string;
      chequeDate?: string;
      note?: string;
    }
  ) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      const desc = `${data.method} RCVD FRM ${customer?.name.toUpperCase() || 'CUSTOMER'}${data.note ? ' (' + data.note + ')' : ''}`;

      await ledgerService.addCustomerTransaction(customerId, {
        date: data.date,
        description: desc,
        type: 'credit',
        amount: data.amount,
        voucherType: data.voucherType,
        voucherNo: data.voucherNo,
        chequeNo: data.chequeNo || (data.method === 'Cash' ? 'CASH' : 'ONLINE'),
        chequeDate: data.chequeDate || data.date,
      });

      toast.success(`Payment of ${formatPKR(data.amount)} recorded!`);
      await loadData();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment');
      return false;
    }
  };

  const addCustomerDebit = async (
    customerId: number,
    data: {
      amount: number;
      date: string;
      voucherType: VoucherType;
      voucherNo?: string;
      shipInv?: string;
      jobNo?: string;
      branch?: string;
      orig?: string;
      dest?: string;
      pcsWeight?: string;
      description?: string;
    }
  ) => {
    try {
      const desc = data.description || `${data.voucherType} entry`;
      await ledgerService.addCustomerTransaction(customerId, {
        date: data.date,
        description: desc,
        type: 'debit',
        amount: data.amount,
        voucherType: data.voucherType,
        voucherNo: data.voucherNo,
        shipInv: data.shipInv,
        jobNo: data.jobNo,
        branch: data.branch,
        orig: data.orig,
        dest: data.dest,
        pcsWeight: data.pcsWeight,
      });

      toast.success(`Invoice / Debit of ${formatPKR(data.amount)} added!`);
      await loadData();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add debit entry');
      return false;
    }
  };

  // Vendor actions
  const createVendor = async (data: Omit<Vendor, 'id'>) => {
    try {
      const created = await vendorService.createVendor(data);
      toast.success(`Vendor "${created.name}" created!`);
      await loadData();
      return created;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create vendor');
      return null;
    }
  };

  const updateVendor = async (id: number, data: Partial<Vendor>) => {
    try {
      const updated = await vendorService.updateVendor(id, data);
      toast.success(`Vendor "${updated.name}" updated!`);
      await loadData();
      return updated;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update vendor');
      return null;
    }
  };

  const deleteVendor = async (id: number) => {
    try {
      await vendorService.deleteVendor(id);
      toast.success('Vendor deleted');
      await loadData();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete vendor');
      return false;
    }
  };

  const makeVendorPayment = async (
    vendorId: number,
    data: {
      amount: number;
      date: string;
      voucherType: VoucherType;
      voucherNo?: string;
      method: string;
      chequeNo?: string;
      chequeDate?: string;
      note?: string;
    }
  ) => {
    try {
      const vendor = vendors.find(v => v.id === vendorId);
      const desc = `${data.method} PAID TO ${vendor?.name.toUpperCase() || 'VENDOR'}${data.note ? ' (' + data.note + ')' : ''}`;

      await vendorService.addVendorTransaction(vendorId, {
        date: data.date,
        description: desc,
        type: 'credit', // Credit reduces payable
        amount: data.amount,
        voucherType: data.voucherType,
        voucherNo: data.voucherNo,
        chequeNo: data.chequeNo || (data.method === 'Cash' ? 'CASH' : 'ONLINE'),
        chequeDate: data.chequeDate || data.date,
      });

      toast.success(`Payment of ${formatPKR(data.amount)} recorded!`);
      await loadData();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record vendor payment');
      return false;
    }
  };

  const addVendorBill = async (
    vendorId: number,
    data: {
      amount: number;
      date: string;
      voucherType: VoucherType;
      voucherNo?: string;
      shipInv?: string;
      jobNo?: string;
      branch?: string;
      description?: string;
    }
  ) => {
    try {
      const desc = data.description || `${data.voucherType} bill entry`;
      await vendorService.addVendorTransaction(vendorId, {
        date: data.date,
        description: desc,
        type: 'debit', // Debit increases payable
        amount: data.amount,
        voucherType: data.voucherType,
        voucherNo: data.voucherNo,
        shipInv: data.shipInv,
        jobNo: data.jobNo,
        branch: data.branch,
      });

      toast.success(`Bill of ${formatPKR(data.amount)} recorded!`);
      await loadData();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record bill');
      return false;
    }
  };

  // Helper getters
  const getCustomerComputed = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    const txns = customerTxnMap[customerId] || [];
    const balance = calculateCustomerBalance(customer, txns);
    const aging: AgingBuckets = calculateCustomerAging(customer, txns);
    const shipmentCount = customerShipmentCountMap[customerId] || 0;
    return { customer, txns, balance, aging, shipmentCount };
  };

  const getVendorComputed = (vendorId: number) => {
    const vendor = vendors.find(v => v.id === vendorId);
    const txns = vendorTxnMap[vendorId] || [];
    const balance = calculateVendorBalance(vendor, txns);
    const aging: AgingBuckets = calculateVendorAging(vendor, txns);
    const billCount = txns.filter(t => t.type === 'debit').length;
    return { vendor, txns, balance, aging, billCount };
  };

  // Automated reminders
  const sendWhatsAppReminder = (customerId: number) => {
    const { customer, balance, aging } = getCustomerComputed(customerId);
    if (!customer) return;
    if (balance <= 0) {
      toast.error('Customer has no outstanding balance');
      return;
    }
    if (!customer.phone) {
      toast.error('No phone number on file for this customer');
      return;
    }

    let urgency = 'a friendly reminder that your account';
    if (aging.oldestDaysOverdue > 60) urgency = 'an urgent reminder that your account';
    else if (aging.oldestDaysOverdue > 0) urgency = 'a reminder that your account';

    const text = `Dear ${customer.name}, this is ${urgency} currently shows an outstanding balance of ${formatPKR(balance)}` +
      (aging.oldestDaysOverdue > 0 ? `, with an invoice ${aging.oldestDaysOverdue} day(s) past due (${customer.creditDays}d payment terms).` : '.') +
      ` Please arrange payment at your earliest convenience. Thank you — ${COMPANY.name}\n\nSoftware Developed by DevProKit\nwww.devprokit.com | 03246182743`;

    const phone = customer.phone.replace(/[^0-9]/g, '').replace(/^0/, '92');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    toast.success(`WhatsApp reminder drafted for ${customer.name}`);
  };

  const sendEmailReminder = (customerId: number) => {
    const { customer, balance, aging } = getCustomerComputed(customerId);
    if (!customer) return;
    if (balance <= 0) {
      toast.error('Customer has no outstanding balance');
      return;
    }
    if (!customer.email) {
      toast.error('No email on file for this customer');
      return;
    }

    const subject = `Payment Reminder — Outstanding Balance ${formatPKR(balance)}`;
    const body = `Dear ${customer.name},\n\nThis is a reminder regarding your account with ${COMPANY.name}.\n` +
      `Outstanding Balance: ${formatPKR(balance)}\n` +
      (aging.oldestDaysOverdue > 0 ? `Days Overdue: ${aging.oldestDaysOverdue} days\n` : '') +
      `\nPlease arrange payment at your earliest convenience.\n\nThank you,\n${COMPANY.name} Accounts Dept.`;

    window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.success(`Email drafted for ${customer.name}`);
  };

  // General Ledger Statement Builder
const buildGeneralLedgerData = (id: number, type: 'customer' | 'vendor') => {
  const isVendor = type === 'vendor';
  const entity = isVendor ? vendors.find(v => v.id === id) : customers.find(c => c.id === id);
  const txns = (isVendor ? vendorTxnMap[id] : customerTxnMap[id]) || [];
  if (!entity) return null;

  // Oldest first, newest at the bottom; same date -> by entry id
  const sortedTxns = [...txns].sort(
    (a, b) => a.date.localeCompare(b.date) || (Number(a.id) || 0) - (Number(b.id) || 0)
  );

  const findShip = (t: LedgerTransaction): Shipment | null =>
    (t.shipInv && shipmentLookup[`inv:${t.shipInv}`]) || (t.jobNo && shipmentLookup[`job:${t.jobNo}`]) || null;

  let runningBalance = entity.openingBalance || 0;
  let totalDebit = 0;
  let totalCredit = 0;
  let totalPcs = 0;
  let totalWeight = 0;
  const seenShip = new Set<number>(); // count each shipment's weight once

  const rows = sortedTxns.map(t => {
    if (t.type === 'debit') { runningBalance += t.amount; totalDebit += t.amount; }
    else { runningBalance -= t.amount; totalCredit += t.amount; }

    const ship = findShip(t);
    let weightText = '';
    let pieces = 0;
    if (ship) {
      if (!seenShip.has(ship.id)) {
        seenShip.add(ship.id);
        if (ship.weight > 0) { totalWeight += ship.weight; weightText = `${ship.weight.toFixed(2)} KG`; }
        if (ship.pieces > 0) {
          totalPcs += ship.pieces;
          pieces = ship.pieces;
        }
      }
    } else if (t.pcsWeight) {
      const parts = t.pcsWeight.split('/').map(p => parseFloat(p.trim()));
      if (!isNaN(parts[0]) && parts[0] > 0) {
        totalPcs += parts[0];
        pieces = parts[0];
      }
      if (!isNaN(parts[1]) && parts[1] > 0) { totalWeight += parts[1]; weightText = `${parts[1].toFixed(2)} KG`; }
    }

    const subParts: string[] = [];
    if (t.shipInv) subParts.push(`Ship.Inv#: ${t.shipInv}`);
    if (ship?.consignee) subParts.push(`Consignee: ${ship.consignee}`);
    if (t.chequeNo) subParts.push(`Ref: ${t.chequeNo}`);
    if (t.orig || t.dest) subParts.push(`${t.orig || '-'} → ${t.dest || '-'}`);
    if (t.jobNo) subParts.push(`Job#: ${t.jobNo}`);

    return {
      date: t.date,
      voucherType: t.voucherType,
      voucherNo: t.voucherNo || '',
      description: t.description,
      sub: subParts.join(' • '),
      weightText,
      jobNo: t.jobNo || '',
      branch: t.branch || entity.branch || '',
      trackingNo: ship?.awb || '',
      serviceName: ship?.courier || '',
      serviceType: ship?.service || '',
      consignee: ship?.consignee || '',
      destination: ship?.destination || t.dest || '',
      pieces,
      debit: t.type === 'debit' ? t.amount : 0,
      credit: t.type === 'credit' ? t.amount : 0,
      balance: runningBalance,
      dc: runningBalance >= 0 ? 'Dr' : 'Cr',
    };
  });

  const periodFrom = rows.length ? rows[0].date : null;
  const periodTo = rows.length ? rows[rows.length - 1].date : null;

  return {
    entity,
    rows,
    totals: { opening: entity.openingBalance || 0, totalDebit, totalCredit, totalPcs, totalWeight, closing: runningBalance, periodFrom, periodTo },
  };
};

  const exportGeneralLedger = async (id: number, type: 'customer' | 'vendor') => {
    const data = buildGeneralLedgerData(id, type);
    if (!data) return;
    await exportGeneralLedgerPDF(data.entity, data.rows, data.totals, type);
  };

  return {
    activeSubTab,
    setActiveSubTab,
    customers,
    vendors,
    customerSearch,
    setCustomerSearch,
    vendorSearch,
    setVendorSearch,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    receiveCustomerPayment,
    addCustomerDebit,
    createVendor,
    updateVendor,
    deleteVendor,
    makeVendorPayment,
    addVendorBill,
    getCustomerComputed,
    getVendorComputed,
    sendWhatsAppReminder,
    sendEmailReminder,
    buildGeneralLedgerData,
    exportGeneralLedger,
    refresh: loadData,
  };
}
