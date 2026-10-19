import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Receipt, Search, Eye, RefreshCw, X, Printer, Wallet, Trash2 } from 'lucide-react';
import { invoiceService, ledgerService, vendorService,  } from '@/services';
import { Customer, Invoice, Shipment, Vendor, VendorBill } from '@/models/types';
import { formatDate, formatPKR } from '@/utils/formatters';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ShipmentInvoiceModal } from '../components/shipments/ShipmentInvoiceModal';
// import { ShipmentModal } from '../components/shipments/ShipmentModal';
import { VendorBillViewModal } from '../components/ledger/VendorBillViewModal';
import { PaymentModal } from '../components/ledger/PaymentModal';
import { CustomerReceiptModal } from '../components/ledger/CustomerReceiptModal';
import { useLedgerController } from '@/controllers/useLedgerController';
// import { useShipmentsController } from '@/controllers/useShipmentsController';

type Tab = 'invoices' | 'bills';

/** The printable invoice view expects a Shipment-shaped object. */
function invoiceToShipment(inv: Invoice): Shipment {
  return {
    id: inv.shipmentId ?? inv.id,
    consignee: inv.consignee ?? '',
    date: inv.date,
    customerId: inv.customerId,
    customerName: inv.customerName,
    isWalkIn: inv.isWalkIn,
    walkInName: inv.isWalkIn ? inv.customerName : undefined,
    courier: inv.courier,
    service: inv.service,
    awb: inv.awb,
    origin: inv.origin,
    destination: inv.destination,
    destinationAddress: inv.destinationAddress,
    productName: inv.productName,
    pieces: inv.pieces,
    weight: inv.weight,
    shipInv: inv.invoiceNo,
    jobNo: inv.jobNo,
    revenue: inv.amount,
    cost: 0,
    status: 'Pending',
    notes: inv.notes,
  };
}

const thCls = 'py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap';

export const InvoicesPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [invoiceType, setInvoiceType] = useState<'all' | 'account' | 'walkin' | 'cancelled'>('all');

  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewBill, setViewBill] = useState<VendorBill | null>(null);
  const [viewReceipt, setViewReceipt] = useState<Invoice | null>(null);

  const ledger = useLedgerController();
  const [receiveCustomer, setReceiveCustomer] = useState<Customer | null>(null);

  // Edit shipment (from an invoice row) and delete / cancel
  // const shipCtl = useShipmentsController();
  // const [editShipment, setEditShipment] = useState<Shipment | null>(null);
  const [voidTarget, setVoidTarget] = useState<{
    kind: 'invoice' | 'receipt' | 'bill';
    id: number | string;
    label: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, bl, cust, vend] = await Promise.all([
        invoiceService.getInvoices(),
        invoiceService.getBills(),
        ledgerService.getCustomers(),
        vendorService.getVendors().catch(() => [] as Vendor[]),
      ]);
      setInvoices(inv);
      setBills(bl);
      setCustomers(cust);
      setVendors(vend);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // const openEdit = async (inv: Invoice) => {
  //   if (!inv.shipmentId) { toast.error('The shipment of this invoice no longer exists'); return; }
  //   const all = await shipmentService.getShipments();
  //   const s = all.find(x => x.id === inv.shipmentId);
  //   if (!s) { toast.error('Shipment not found'); return; }
  //   setEditShipment(s);
  // };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    try {
      if (voidTarget.kind === 'invoice') await invoiceService.voidInvoice(Number(voidTarget.id));
      else if (voidTarget.kind === 'receipt') await invoiceService.voidReceipt(Number(voidTarget.id));
      else await invoiceService.voidBillPayment(String(voidTarget.id));
      toast.success('Cancelled and reversed in the ledger');
      await Promise.all([load(), ledger.refresh()]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setVoidTarget(null);
    }
  };

  const inRange = useCallback(
    (d: string) => (!from || d >= from) && (!to || d <= to),
    [from, to]
  );

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter(i => {
      if (!inRange(i.date)) return false;
      if (invoiceType === 'account' && (i.isWalkIn || i.status === 'Cancelled')) return false;
      if (invoiceType === 'walkin' && (!i.isWalkIn || i.status === 'Cancelled')) return false;
      if (invoiceType === 'cancelled' && i.status !== 'Cancelled') return false;
      if (!q) return true;
      return [i.invoiceNo, i.customerName, i.consignee, i.awb, i.jobNo, i.productName, i.destination, i.destinationAddress, i.courier]
        .some(v => (v || '').toLowerCase().includes(q));
    });
  }, [invoices, search, inRange, invoiceType]);

  const filteredBills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter(b => {
      if (!inRange(b.date)) return false;
      if (!q) return true;
      return [b.vendorName, b.voucherNo, b.voucherType, b.description, b.jobNo]
        .some(v => (v || '').toLowerCase().includes(q));
    });
  }, [bills, search, inRange]);

  const invoiceTotal = filteredInvoices
    .filter(i => i.kind !== 'payment' && i.status !== 'Cancelled')
    .reduce((s, i) => s + i.amount, 0);
  const receivedTotal = filteredInvoices
    .filter(i => i.kind === 'payment' && i.status !== 'Cancelled')
    .reduce((s, i) => s + i.amount, 0);
  const invCount = filteredInvoices.filter(i => i.kind !== 'payment').length;
  const receiptCount = filteredInvoices.length - invCount;

  const paymentCount = filteredBills.filter(b => !b.voided).length;
  const paidTotal = filteredBills.filter(b => !b.voided).reduce((s, b) => s + b.amount, 0);
  const payableNow = ledger.vendors.reduce((s, v) => s + Math.max(0, ledger.getVendorComputed(v.id).balance), 0);

  // Balance owed to the vendor right after each entry (forward from the opening balance, full ledger)
  const runningBalance = new Map<string, number>();
  ledger.vendors.forEach(v => {
    let bal = v.openingBalance || 0;
    [...ledger.getVendorComputed(v.id).txns]
      .sort((a, b) => a.date.localeCompare(b.date) || (Number(a.id) || 0) - (Number(b.id) || 0))
      .forEach(t => {
        bal += t.type === 'debit' ? t.amount : -t.amount;
        runningBalance.set(`${t.type === 'credit' ? 'payment' : 'bill'}-${t.id}`, bal);
      });
  });

  // What each customer still owes right after each entry (walks back from the real current balance)
  const customerRemaining = new Map<string, number>();
  {
    const current = new Map<number, number>();
    const newestFirst = [...invoices]
      .filter(i => i.customerId != null && i.status !== 'Cancelled')
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    for (const i of newestFirst) {
      const cid = i.customerId as number;
      if (!current.has(cid)) current.set(cid, ledger.getCustomerComputed(cid).balance);
      const after = current.get(cid) as number;
      customerRemaining.set(`${i.kind ?? 'invoice'}-${i.id}`, after);
      current.set(cid, i.kind === 'payment' ? after + i.amount : after - i.amount);
    }
  }

  const hasFilters = !!(search || from || to || invoiceType !== 'all');
  const clearFilters = () => { setSearch(''); setFrom(''); setTo(''); setInvoiceType('all'); };

  const tabBtn = (key: Tab, label: string, count: number, Icon: React.ComponentType<{ className?: string }>) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      data-testid={`invoices-tab-${key}`}
      className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex-1 sm:flex-none ${
        tab === key ? 'bg-white text-[#292929] shadow-sm' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label} ({count})</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {tab === 'invoices' ? 'Customer Invoices' : 'Vendor Payments'}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {tab === 'invoices'
              ? 'Every invoice generated automatically when a shipment is booked'
              : 'Payments made to couriers / suppliers from the Vendor Ledger (BPV / CPV)'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-slate-200/80 bg-white shadow-card p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            {tab === 'invoices' ? 'Invoices (filtered)' : 'Payments (filtered)'}
          </div>
          <div className="text-2xl font-black text-[#292929] mt-1 mono">{tab === 'invoices' ? invCount : paymentCount}</div>
        </div>
        <div className="rounded-card border border-slate-200/80 bg-white shadow-card p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            {tab === 'invoices' ? 'Total Invoiced' : 'Total Paid'}
          </div>
          <div className="text-2xl font-black mt-1 mono text-emerald-600">{formatPKR(tab === 'invoices' ? invoiceTotal : paidTotal)}</div>
        </div>
        <div className="rounded-card border border-slate-200/80 bg-white shadow-card p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            {tab === 'invoices' ? 'Total Received' : 'Vendor Payable (current)'}
          </div>
          <div className={`text-2xl font-black mt-1 mono ${tab === 'invoices' ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatPKR(tab === 'invoices' ? receivedTotal : payableNow)}
          </div>
        </div>
      </div>

      {/* Tabs + filters */}
      <div className="bg-white p-3.5 rounded-card border border-slate-200/80 shadow-card space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-full lg:w-auto">
            {tabBtn('invoices', 'Invoices', invoices.filter(i => i.kind !== 'payment').length, FileText)}
            {tabBtn('bills', 'Bills', bills.filter(b => !b.voided).length, Receipt)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-end gap-2 w-full lg:w-auto">
            <div className="relative lg:w-64">
              <Input
                placeholder={tab === 'invoices' ? 'Search invoice #, customer, consignee, AWB...' : 'Search vendor, voucher, description...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-xs py-2"
                data-testid="invoices-search-input"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            {tab === 'invoices' && (
              <div className="lg:w-40">
                <Select value={invoiceType} onChange={e => setInvoiceType(e.target.value as typeof invoiceType)} className="text-xs py-2">
                  <option value="all">All invoices</option>
                  <option value="account">Account (credit)</option>
                  <option value="walkin">Walk-in (cash)</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
            )}
            <div className="lg:w-36"><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="text-xs py-2" title="From date" /></div>
            <div className="lg:w-36"><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="text-xs py-2" title="To date" /></div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="w-4 h-4" />}>Clear</Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#292929] border-t-[#F21624] rounded-full animate-spin" />
          </div>
        ) : tab === 'invoices' ? (
          filteredInvoices.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">No invoices found</p>
              <p className="text-xs text-slate-300 mt-1">Invoices are created automatically when you book a shipment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Invoice #</th>
                    <th className={thCls}>Customer</th>
                    <th className={thCls}>AWB / Job</th>
                    <th className={thCls}>Product</th>
                    <th className={thCls}>Destination</th>
                    <th className={`${thCls} text-right`}>Amount</th>
                    <th className={`${thCls} text-right`}>Remaining</th>
                    <th className={`${thCls} text-center`}>Status</th>
                    <th className={`${thCls} text-right`}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map(inv => {
                    const isReceipt = inv.kind === 'payment';
                    const cancelled = inv.status === 'Cancelled';
                    const remaining = customerRemaining.get(`${inv.kind ?? 'invoice'}-${inv.id}`);
                    return (
                      <tr key={`${inv.kind ?? 'invoice'}-${inv.id}`} className={`hover:bg-slate-50/60 ${cancelled ? 'opacity-60' : ''}`}>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">{formatDate(inv.date)}</td>
                        <td className="py-3 px-4 mono font-bold whitespace-nowrap">
                          <span className={isReceipt ? 'text-emerald-700' : 'text-[#00A6BD]'}>{inv.invoiceNo}</span>
                          {isReceipt && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                              RECEIVED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {inv.customerName}
                          {inv.consignee && <div className="text-[10.5px] text-slate-400 font-semibold">Consignee: {inv.consignee}</div>}
                          {inv.isWalkIn && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">CASH</span>
                          )}
                        </td>
                        <td className="py-3 px-4 mono text-xs whitespace-nowrap">
                          {isReceipt ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <>
                              <div className="font-bold text-slate-800">{inv.awb}</div>
                              {inv.jobNo && <div className="text-slate-400">{inv.jobNo}</div>}
                            </>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 max-w-[180px] truncate" title={isReceipt ? inv.notes : inv.productName}>
                          {isReceipt ? (inv.notes || 'Payment received') : (inv.productName || '—')}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 max-w-[220px]">
                          {isReceipt ? (
                            <span className="text-slate-400">—</span>
                          ) : (
                            <>
                              <div className="font-semibold">{inv.origin || '-'} &rarr; {inv.destination}</div>
                              {inv.destinationAddress && (
                                <div className="text-slate-400 truncate" title={inv.destinationAddress}>{inv.destinationAddress}</div>
                              )}
                            </>
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right mono font-extrabold whitespace-nowrap ${
                          cancelled ? 'line-through text-slate-400' : isReceipt ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                          {isReceipt ? '− ' : ''}{formatPKR(inv.amount)}
                        </td>
                        <td className={`py-3 px-4 text-right mono font-extrabold whitespace-nowrap ${
                          remaining === undefined ? 'text-slate-300'
                            : remaining > 0 ? 'text-red-600'
                            : remaining < 0 ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`}>
                          {remaining === undefined
                            ? '—'
                            : remaining > 0
                              ? formatPKR(remaining)
                              : remaining < 0
                                ? `Adv ${formatPKR(Math.abs(remaining))}`
                                : 'Settled'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {cancelled ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10.5px] font-extrabold">Cancelled</span>
                          ) : isReceipt ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold">Received</span>
                          ) : inv.isWalkIn ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold">Paid (Cash)</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10.5px] font-extrabold">On Account</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {inv.customerId != null && !cancelled && (
                              <Button variant="primary" size="sm"
                                onClick={() => {
                                  const c = customers.find(x => x.id === inv.customerId);
                                  if (!c) { toast.error('This customer no longer exists — payment cannot be received from here'); return; }
                                  setReceiveCustomer(c);
                                }}
                                icon={<Wallet className="w-3.5 h-3.5" />}
                                data-testid={`receive-payment-${inv.kind ?? 'invoice'}-${inv.id}`}>
                                Receive
                              </Button>
                            )}
                            {/* {!isReceipt && !cancelled && inv.shipmentId && (
                              <Button variant="secondary" size="sm" onClick={() => openEdit(inv)} icon={<Edit2 className="w-3.5 h-3.5" />}
                                data-testid={`edit-invoice-${inv.id}`}>
                                Edit
                              </Button>
                            )} */}
                            <Button variant="secondary" size="sm"
                              onClick={() => (isReceipt ? setViewReceipt(inv) : setViewInvoice(inv))}
                              icon={isReceipt ? <Printer className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              data-testid={`view-invoice-${inv.kind ?? 'invoice'}-${inv.id}`}>
                              View / Print
                            </Button>
                            {!cancelled && (
                              <button type="button" title="Delete (reverses in ledger)"
                                onClick={() => setVoidTarget({ kind: isReceipt ? 'receipt' : 'invoice', id: inv.id, label: inv.invoiceNo })}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                data-testid={`delete-invoice-${inv.kind ?? 'invoice'}-${inv.id}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      Total ({filteredInvoices.filter(i => i.kind !== 'payment' && i.status !== 'Cancelled').length} active invoices, {receiptCount} payments)
                    </td>
                    <td className="px-4 py-3 text-right mono font-black text-slate-900 whitespace-nowrap">{formatPKR(invoiceTotal)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        ) : filteredBills.length === 0 ? (
          <div className="py-20 text-center">
            <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No vendor payments found</p>
            <p className="text-xs text-slate-300 mt-1">Payments made from the Vendor Ledger appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Voucher</th>
                  <th className={thCls}>Vendor</th>
                  <th className={thCls}>Description</th>
                  <th className={thCls}>Job No.</th>
                  <th className={`${thCls} text-right`}>Amount</th>
                  <th className={`${thCls} text-right`}>Remaining</th>
                  <th className={`${thCls} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map(b => {
                  const isPayment = b.kind === 'payment';
                  const remaining = runningBalance.get(`${b.kind ?? 'bill'}-${b.id}`) ?? 0;
                  return (
                    <tr key={`${b.kind ?? 'bill'}-${b.id}`} className={`hover:bg-slate-50/60 ${b.voided ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">{formatDate(b.date)}</td>
                      <td className="py-3 px-4 mono font-bold whitespace-nowrap">
                        <span className={isPayment ? 'text-emerald-700' : 'text-[#00A6BD]'}>
                          {b.voucherType} {b.voucherNo}
                        </span>
                        {isPayment && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            PAID
                          </span>
                        )}
                        {b.voided && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-extrabold">CANCELLED</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{b.vendorName}</td>
                      <td className="py-3 px-4 text-xs text-slate-700">{b.description}</td>
                      <td className="py-3 px-4 mono text-xs text-slate-500 whitespace-nowrap">{b.jobNo || '—'}</td>
                      <td className={`py-3 px-4 text-right mono font-extrabold whitespace-nowrap ${b.voided ? 'line-through text-slate-400' : 'text-emerald-600'}`}>
                        {isPayment ? '− ' : ''}{formatPKR(b.amount)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right mono font-extrabold whitespace-nowrap ${
                          remaining > 0 ? 'text-red-600' : remaining < 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {remaining > 0
                          ? formatPKR(remaining)
                          : remaining < 0
                            ? `Adv ${formatPKR(Math.abs(remaining))}`
                            : 'Settled'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setViewBill(b)} icon={<Printer className="w-3.5 h-3.5" />}
                            data-testid={`view-bill-${b.id}`}>
                            View / Print
                          </Button>
                          {!b.voided && (
                            <button type="button" title="Delete (reverses in ledger)"
                              onClick={() => setVoidTarget({ kind: 'bill', id: b.id, label: `${b.voucherType} ${b.voucherNo}` })}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              data-testid={`delete-bill-${b.id}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Total ({paymentCount} payments)
                  </td>
                  <td className="px-4 py-3 text-right mono font-black text-emerald-600 whitespace-nowrap">{formatPKR(paidTotal)}</td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={!!receiveCustomer}
        onClose={() => setReceiveCustomer(null)}
        customer={receiveCustomer}
        currentBalance={receiveCustomer ? ledger.getCustomerComputed(receiveCustomer.id).balance : 0}
        onSave={async (customerId, data) => {
          const ok = await ledger.receiveCustomerPayment(customerId, data);
          if (ok) await load();
          return ok;
        }}
      />

      <VendorBillViewModal
        isOpen={!!viewBill}
        onClose={() => setViewBill(null)}
        bill={viewBill}
        vendor={viewBill ? vendors.find(v => v.id === viewBill.vendorId) || null : null}
        balanceAfter={viewBill?.kind === 'payment' ? runningBalance.get(`payment-${viewBill.id}`) : undefined}
      />

      <ShipmentInvoiceModal
        isOpen={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        shipment={viewInvoice ? invoiceToShipment(viewInvoice) : null}
        customer={viewInvoice?.customerId ? customers.find(c => c.id === viewInvoice.customerId) || null : null}
      />

      <CustomerReceiptModal
        isOpen={!!viewReceipt}
        onClose={() => setViewReceipt(null)}
        receipt={viewReceipt}
        customer={viewReceipt?.customerId ? customers.find(c => c.id === viewReceipt.customerId) || null : null}
        balanceAfter={viewReceipt ? customerRemaining.get(`payment-${viewReceipt.id}`) : undefined}
      />

      {/* <ShipmentModal
        isOpen={!!editShipment}
        onClose={() => setEditShipment(null)}
        shipmentToEdit={editShipment}
        customers={shipCtl.customers}
        vendors={shipCtl.vendors}
        onSave={async (data, overrideCredit) => {
          const r = await shipCtl.updateShipment(editShipment!.id, data, overrideCredit);
          if (r) await Promise.all([load(), ledger.refresh()]);
          return r;
        }}
      /> */}

      <ConfirmDialog
        isOpen={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        onConfirm={confirmVoid}
        title="Delete / Cancel entry"
        message={voidTarget ? `Cancel ${voidTarget.label}? A reversal entry is posted to the ledger so the balance is corrected. The record stays visible as Cancelled. This cannot be undone.` : ''}
        confirmText="Yes, cancel it"
      />
    </div>
  );
};