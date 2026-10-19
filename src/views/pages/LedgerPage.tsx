import React, { useState } from 'react';
import { useLedgerController } from '@/controllers/useLedgerController';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { CustomerModal } from '../components/ledger/CustomerModal';
import { VendorModal } from '../components/ledger/VendorModal';
import { PaymentModal } from '../components/ledger/PaymentModal';
import { DebitModal } from '../components/ledger/DebitModal';
import { VendorPaymentModal } from '../components/ledger/VendorPaymentModal';
import { LedgerDetailModal } from '../components/ledger/LedgerDetailModal';
import { VendorDetailModal } from '../components/ledger/VendorDetailModal';
import { GeneralLedgerModal } from '../components/ledger/GeneralLedgerModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Customer, Vendor } from '@/models/types';
import { formatPKR } from '@/utils/formatters';
import { EditPartyModal } from '../components/ledger/EditPartyModal';
import { AuditLogModal } from '../components/common/AuditLogModal';
import { todayLocal } from '@/utils/dates';
import { formatCustomerListDate, getCustomerDueInfo } from '@/models/customerDue';
import { COMPANY, DOCUMENT_FOOTER_PHONE, DOCUMENT_FOOTER_TITLE, DOCUMENT_FOOTER_WEBSITE } from '@/utils/branding';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  MessageCircle,
  Mail,
  Users,
  Truck,
  AlertTriangle,
  Trash2,
  Edit2, History, Printer
} from 'lucide-react';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
}

export const LedgerPage: React.FC = () => {
  const {
    activeSubTab,
    setActiveSubTab,
    customers,
    vendors,
    customerSearch,
    setCustomerSearch,
    vendorSearch,
    setVendorSearch,
    createCustomer,
   updateCustomer,
    deleteCustomer,
    receiveCustomerPayment,
    addCustomerDebit,
    createVendor,
    updateVendor,
    deleteVendor,
    makeVendorPayment,
    getCustomerComputed,
    getVendorComputed,
    sendWhatsAppReminder,
    sendEmailReminder,
    buildGeneralLedgerData,
  } = useLedgerController();

  // Modal States
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentCustomer, setSelectedPaymentCustomer] = useState<Customer | null>(null);

  const [debitModalOpen, setDebitModalOpen] = useState(false);
  const [selectedDebitCustomer, setSelectedDebitCustomer] = useState<Customer | null>(null);

  const [vendorPaymentModalOpen, setVendorPaymentModalOpen] = useState(false);
  const [selectedPaymentVendor, setSelectedPaymentVendor] = useState<Vendor | null>(null);


  const [ledgerDetailOpen, setLedgerDetailOpen] = useState(false);
  const [selectedDetailCustomerId, setSelectedDetailCustomerId] = useState<number | null>(null);

  const [vendorDetailOpen, setVendorDetailOpen] = useState(false);
  const [selectedDetailVendorId, setSelectedDetailVendorId] = useState<number | null>(null);

  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<Customer | null>(null);
  const [deleteVendorTarget, setDeleteVendorTarget] = useState<Vendor | null>(null);

  const [glModalOpen, setGlModalOpen] = useState(false);
  const [glData, setGlData] = useState<ReturnType<typeof buildGeneralLedgerData> | null>(null);
  const [glType, setGlType] = useState<'customer' | 'vendor'>('customer');

  const [editParty, setEditParty] = useState<{ type: 'customer' | 'vendor'; party: Customer | Vendor } | null>(null);
const [auditTarget, setAuditTarget] = useState<{ entity: 'Customer' | 'Vendor'; id: number; name: string } | null>(null);

// const isLocked = () => {
//   if (!editParty) return false;
//   if (editParty.type === 'customer') {
//     const c = getCustomerComputed(editParty.party.id);
//     return c.txns.length > 0 || c.shipmentCount > 0;
//   }
//   return getVendorComputed(editParty.party.id).txns.length > 0;
// };

  const handleOpenGL = (id: number, type: 'customer' | 'vendor') => {
    const data = buildGeneralLedgerData(id, type);
    if (!data) return;
    setGlData(data);
    setGlType(type);
    setGlModalOpen(true);
  };

  const handlePrintCustomerList = () => {
    const today = todayLocal();
    const rows = customers.map(customer => {
      const { balance, txns } = getCustomerComputed(customer.id);
      const due = balance > 0 ? getCustomerDueInfo(customer, txns, today) : null;
      const daysLeft = due?.daysLeft ?? null;
      const dueLabel = !due
        ? '—'
        : daysLeft === null
        ? '—'
        : daysLeft < 0
          ? `${Math.abs(daysLeft)} days overdue`
          : daysLeft === 0
            ? 'Due today'
            : `${daysLeft} days remaining`;
      const dueStyle = daysLeft !== null && daysLeft < 0
        ? 'color:#C22F49;font-weight:700'
        : daysLeft === 0
          ? 'color:#B85C10;font-weight:700'
          : '';

      return {
        customer,
        balance,
        due,
        dueLabel,
        dueStyle,
      };
    });
    const totalReceivable = rows.reduce((sum, row) => sum + Math.max(0, row.balance), 0);

    const frame = document.createElement('iframe');
    frame.title = 'Customer List print document';
    frame.setAttribute('aria-hidden', 'true');
    Object.assign(frame.style, {
      position: 'fixed',
      width: '0',
      height: '0',
      border: '0',
      right: '0',
      bottom: '0',
    });
    document.body.appendChild(frame);

    try {
      const printWindow = frame.contentWindow;
      const printDocument = frame.contentDocument;
      if (!printWindow || !printDocument) throw new Error('Could not open the print document');

      const tableRows = rows.map((row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(row.customer.name)}</td>
          <td>${escapeHtml(row.customer.phone || '—')}</td>
          <td class="number">${row.balance === 0 ? '0' : `${row.balance < 0 ? 'Adv. ' : ''}${Math.round(Math.abs(row.balance)).toLocaleString('en-PK')}`}</td>
          <td class="center">${row.due ? formatCustomerListDate(row.due.invoiceDate) : '—'}</td>
          <td class="center">${row.due?.termDays ?? row.customer.creditDays ?? 30}</td>
          <td class="center"><strong>${row.due ? formatCustomerListDate(row.due.dueDate) : '—'}</strong></td>
          <td style="${row.dueStyle}">${row.dueLabel}</td>
        </tr>
      `).join('');

      printDocument.open();
      printDocument.write(`<!doctype html>
        <html><head><meta charset="utf-8"><title>List Of Balance (LOB)</title>
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 10mm 10mm 20mm; font-family: Arial, Helvetica, sans-serif; color: #292929; font-size: 12px; }
          .brand { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #292929; padding-bottom: 8px; margin-bottom: 10px; }
          .brand img { width: 84px; height: 48px; object-fit: contain; }
          h1 { font-size: 18px; margin: 0 0 3px; }
          .identity { color: #555; font-size: 10px; line-height: 1.5; }
          .sub { color: #555; margin-bottom: 12px; font-size: 11.5px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 5px 7px; }
          th { background: #292929; color: white; text-align: center; font-size: 11.5px; }
          td.center { text-align: center; white-space: nowrap; }
          td.number { text-align: right; white-space: nowrap; font-weight: 700; }
          tfoot td { font-weight: 800; background: #e6f9fc; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          .foot { position: fixed; bottom: 4mm; left: 10mm; right: 10mm; font-size: 9px; line-height: 1.35; color: #64748b; }
          .foot-row { display: flex; align-items: center; justify-content: space-between; }
        </style></head><body>
        <div class="brand">
          <img src="/logo.png" alt="${escapeHtml(COMPANY.network)} logo">
          <div>
            <h1>${escapeHtml(COMPANY.name)} — List Of Balance (LOB)</h1>
            <div class="identity">${escapeHtml(COMPANY.network)} · ${escapeHtml(COMPANY.owner)} · ${escapeHtml(COMPANY.role)} · ${escapeHtml(COMPANY.phone)}<br>
              ${escapeHtml(COMPANY.address)}</div>
          </div>
        </div>
        <div class="sub">Printed: ${formatCustomerListDate(new Date())} &nbsp;|&nbsp; Last Date = Entry Date + Terms (days)</div>
        <table><thead><tr>
          <th>#</th><th>Customer</th><th>Phone</th><th>Balance (PKR)</th>
          <th>Entry Date</th><th>Terms (Days)</th><th>Last Date</th><th>Days Left/Over</th>
        </tr></thead><tbody>${tableRows}</tbody>
        <tfoot><tr><td colspan="3">TOTAL RECEIVABLE</td>
          <td class="number">${Math.round(totalReceivable).toLocaleString('en-PK')}</td><td colspan="4"></td>
        </tr></tfoot></table>
        <div class="foot">
          <div class="foot-row">
            <span>${escapeHtml(DOCUMENT_FOOTER_WEBSITE)}</span>
            <span>${escapeHtml(DOCUMENT_FOOTER_TITLE)}</span>
            <span>${escapeHtml(DOCUMENT_FOOTER_PHONE)}</span>
          </div>
        </div>
        </body></html>`);
      printDocument.close();
      printWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        window.setTimeout(() => frame.remove(), 1_500);
      }, 250);
    } catch (err) {
      frame.remove();
      toast.error(err instanceof Error ? err.message : 'Could not print customer list');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {activeSubTab === 'customers' ? 'Customer Ledger (Khata)' : 'Vendor Ledger (Payables)'}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {activeSubTab === 'customers'
              ? 'Balances, credit limits, aging analysis, and payment history'
              : 'Supplier accounts, freight carrier liabilities, and bills'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {activeSubTab === 'customers' ? (
            <>
              <div className="relative w-full sm:w-52 lg:w-56">
                <Input
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="pl-9 text-xs py-2"
                  data-testid="search-customer-input"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <Button
                variant="secondary"
                onClick={handlePrintCustomerList}
                icon={<Printer className="w-4 h-4" />}
                data-testid="print-customer-list-btn"
              >
                Print Customers
              </Button>
              <Button
                variant="gold"
                onClick={() => setCustomerModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                data-testid="add-customer-btn"
              >
                New Customer
              </Button>
            </>
          ) : (
            <>
              <div className="relative w-full sm:w-52 lg:w-56">
                <Input
                  placeholder="Search vendor..."
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="pl-9 text-xs py-2"
                  data-testid="search-vendor-input"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <Button
                variant="gold"
                onClick={() => setVendorModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                data-testid="add-vendor-btn"
              >
                New Vendor
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-2">
        {/* Pill Subtabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('customers')}
            data-testid="subtab-customers"
            className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex-1 sm:flex-none ${
              activeSubTab === 'customers'
                ? 'bg-white text-[#292929] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('vendors')}
            data-testid="subtab-vendors"
            className={`flex items-center justify-center gap-2 px-5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex-1 sm:flex-none ${
              activeSubTab === 'vendors'
                ? 'bg-white text-[#292929] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Vendors ({vendors.length})</span>
          </button>
        </div>

      </div>

      {/* CUSTOMERS TABLE */}
      {activeSubTab === 'customers' && customers.length === 0 && (
        <div className="bg-white rounded-card border border-slate-200/80 p-12 text-center text-sm font-bold text-slate-400">
          {customerSearch ? `No customers match "${customerSearch}"` : 'No customers yet — click "New Customer" to add one.'}
        </div>
      )}
      {activeSubTab === 'customers' && customers.length > 0 && (
        <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  {['Customer', 'Phone', 'Balance (Khata)', 'Aging', 'Shipments', 'Credit Limit', 'Terms', 'Actions'].map(label => (
                    <th key={label} className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
          {customers.map(c => {
            const { balance, aging, shipmentCount } = getCustomerComputed(c.id);
            const isOverLimit = balance > c.creditLimit;
            const isLate = aging.oldestDaysOverdue > 0 && balance > 0;

            let agingLabel = 'Current (Not due)';
            let agingBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            if (aging.oldestDaysOverdue > 60) {
              agingLabel = `${aging.oldestDaysOverdue}d overdue (60+)`;
              agingBadgeColor = 'bg-red-100 text-red-800 border-red-200';
            } else if (aging.oldestDaysOverdue > 30) {
              agingLabel = `${aging.oldestDaysOverdue}d overdue (31–60)`;
              agingBadgeColor = 'bg-orange-100 text-orange-800 border-orange-200';
            } else if (aging.oldestDaysOverdue > 0) {
              agingLabel = `${aging.oldestDaysOverdue}d overdue (1–30)`;
              agingBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
            }

            return (
              <tr
                key={c.id}
                data-testid={`customer-row-${c.id}`}
                className={`hover:bg-slate-50/70 transition-colors ${
                  isOverLimit || isLate ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <td className="py-3.5 px-4 min-w-[210px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDetailCustomerId(c.id);
                      setLedgerDetailOpen(true);
                    }}
                    className="text-left text-sm font-extrabold text-slate-900 hover:text-[#292929]"
                  >
                    {c.name}
                  </button>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {c.city || '—'}{c.accountCode ? ` · ${c.accountCode}` : ''}
                  </div>
                  {isOverLimit && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> Credit limit exceeded
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{c.phone || '—'}</span>
                    {c.phone && (
                      <button
                        type="button"
                        onClick={() => sendWhatsAppReminder(c.id)}
                        className="p-1 rounded-md border border-slate-200 text-emerald-600 hover:bg-emerald-50"
                        title="Send WhatsApp Reminder"
                        data-testid={`whatsapp-remind-${c.id}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {c.email && (
                      <button
                        type="button"
                        onClick={() => sendEmailReminder(c.id)}
                        className="p-1 rounded-md border border-slate-200 text-blue-600 hover:bg-blue-50"
                        title="Send Email Reminder"
                        data-testid={`email-remind-${c.id}`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className={`py-3.5 px-4 mono text-xs font-black whitespace-nowrap ${
                  balance > 0 ? 'text-red-600' : balance < 0 ? 'text-emerald-600' : 'text-slate-700'
                }`}>
                  {balance > 0 ? `Owes: ${formatPKR(balance)}` : balance < 0 ? `Adv.: ${formatPKR(Math.abs(balance))}` : 'PKR 0'}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border ${agingBadgeColor}`}>
                    {balance > 0 ? agingLabel : 'Current'}
                  </span>
                </td>
                <td className="py-3.5 px-4 mono text-xs font-bold text-slate-800 text-center">{shipmentCount}</td>
                <td className="py-3.5 px-4 mono text-xs font-bold text-slate-800 text-right whitespace-nowrap">{formatPKR(c.creditLimit)}</td>
                <td className="py-3.5 px-4 mono text-xs font-bold text-slate-700 text-center whitespace-nowrap">{c.creditDays || 30}d</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-[300px]">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-[11px] px-2.5"
                    onClick={() => {
                      setSelectedPaymentCustomer(c);
                      setPaymentModalOpen(true);
                    }}
                    data-testid={`customer-payment-btn-${c.id}`}
                  >
                    Payment
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[11px] px-2.5"
                    onClick={() => handleOpenGL(c.id, 'customer')}
                    data-testid={`customer-statement-btn-${c.id}`}
                  >
                    Statement
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-[11px] px-2.5"
                    icon={<Edit2 className="w-3.5 h-3.5" />}
                    onClick={() => setEditParty({ type: 'customer', party: c })}
                    data-testid={`customer-edit-btn-${c.id}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-[11px] px-2.5"
                    onClick={() => setDeleteCustomerTarget(c)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    data-testid={`customer-delete-btn-${c.id}`}
                  >
                    Delete
                  </Button>
                  <button
                    type="button"
                    onClick={() => setAuditTarget({ entity: 'Customer', id: c.id, name: c.name })}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    title="View Logs"
                    data-testid={`customer-log-btn-${c.id}`}
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                  </div>
                </td>
              </tr>
            );
          })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VENDORS TABLE */}
      {activeSubTab === 'vendors' && vendors.length === 0 && (
        <div className="bg-white rounded-card border border-slate-200/80 p-12 text-center text-sm font-bold text-slate-400">
          {vendorSearch ? `No vendors match "${vendorSearch}"` : 'No vendors yet — click "New Vendor" to add one.'}
        </div>
      )}
      {activeSubTab === 'vendors' && vendors.length > 0 && (
        <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  {['Vendor', 'Phone', 'Balance (Payable)', 'Aging', 'Bills', 'Category', 'Terms', 'Actions'].map(label => (
                    <th key={label} className="py-3 px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
          {vendors.map(v => {
            const { balance, aging, billCount } = getVendorComputed(v.id);
            const isLate = aging.oldestDaysOverdue > 0 && balance > 0;

            let agingLabel = 'Current';
            let agingBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            if (aging.oldestDaysOverdue > 60) {
              agingLabel = `${aging.oldestDaysOverdue}d overdue (60+)`;
              agingBadgeColor = 'bg-red-100 text-red-800 border-red-200';
            } else if (aging.oldestDaysOverdue > 30) {
              agingLabel = `${aging.oldestDaysOverdue}d overdue (31–60)`;
              agingBadgeColor = 'bg-orange-100 text-orange-800 border-orange-200';
            } else if (aging.oldestDaysOverdue > 0) {
              agingLabel = `${aging.oldestDaysOverdue}d overdue (1–30)`;
              agingBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
            }

            return (
              <tr
                key={v.id}
                data-testid={`vendor-row-${v.id}`}
                className={`hover:bg-slate-50/70 transition-colors ${isLate ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <td className="py-3.5 px-4 min-w-[210px]">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDetailVendorId(v.id);
                      setVendorDetailOpen(true);
                    }}
                    className="text-left text-sm font-extrabold text-slate-900 hover:text-[#292929]"
                  >
                    {v.name}
                  </button>
                  <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {v.city || '—'}{v.accountCode ? ` · ${v.accountCode}` : ''}
                  </div>
                  {v.services && v.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {v.services.map(srv => (
                        <span key={srv} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 whitespace-nowrap">{v.phone || '—'}</td>
                <td className={`py-3.5 px-4 mono text-xs font-black whitespace-nowrap ${
                  balance > 0 ? 'text-red-600' : balance < 0 ? 'text-emerald-600' : 'text-slate-700'
                }`}>
                  {balance > 0 ? `Payable: ${formatPKR(balance)}` : balance < 0 ? `Adv.: ${formatPKR(Math.abs(balance))}` : 'PKR 0'}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full border ${agingBadgeColor}`}>
                    {balance > 0 ? agingLabel : 'Current'}
                  </span>
                </td>
                <td className="py-3.5 px-4 mono text-xs font-bold text-slate-800 text-center">{billCount}</td>
                <td className="py-3.5 px-4 text-xs font-bold text-slate-800">{v.category}</td>
                <td className="py-3.5 px-4 mono text-xs font-bold text-slate-700 text-center whitespace-nowrap">{v.creditDays || 30}d</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-[360px]">
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-[11px] px-2.5"
                      onClick={() => {
                        setSelectedPaymentVendor(v);
                        setVendorPaymentModalOpen(true);
                      }}
                      data-testid={`vendor-payment-btn-${v.id}`}
                    >
                      Payment
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-[11px] px-2.5"
                      onClick={() => handleOpenGL(v.id, 'vendor')}
                      data-testid={`vendor-statement-btn-${v.id}`}
                    >
                      Statement
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-[11px] px-2.5"
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => setEditParty({ type: 'vendor', party: v })}
                      data-testid={`vendor-edit-btn-${v.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="text-[11px] px-2.5"
                      onClick={() => setDeleteVendorTarget(v)}
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      data-testid={`vendor-delete-btn-${v.id}`}
                    >
                      Delete
                    </Button>
                    <button
                      type="button"
                      onClick={() => setAuditTarget({ entity: 'Vendor', id: v.id, name: v.name })}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      title="View Logs"
                      data-testid={`vendor-log-btn-${v.id}`}
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Create/Edit Modal */}
      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSave={createCustomer}
      />

      {/* Vendor Create/Edit Modal */}
      <VendorModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSave={createVendor}
      />

      {/* Customer Receive Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        customer={selectedPaymentCustomer}
        currentBalance={selectedPaymentCustomer ? getCustomerComputed(selectedPaymentCustomer.id).balance : 0}
        onSave={receiveCustomerPayment}
      />

      {/* Customer Add Invoice/Debit Modal */}
      <DebitModal
        isOpen={debitModalOpen}
        onClose={() => setDebitModalOpen(false)}
        customer={selectedDebitCustomer}
        onSave={addCustomerDebit}
      />

      {/* Vendor Make Payment Modal */}
      <VendorPaymentModal
        isOpen={vendorPaymentModalOpen}
        onClose={() => setVendorPaymentModalOpen(false)}
        vendor={selectedPaymentVendor}
        currentBalance={selectedPaymentVendor ? getVendorComputed(selectedPaymentVendor.id).balance : 0}
        onSave={makeVendorPayment}
      />


      {/* Customer Detail Modal */}
      {selectedDetailCustomerId && (
        <LedgerDetailModal
          isOpen={ledgerDetailOpen}
          onClose={() => setLedgerDetailOpen(false)}
          customer={getCustomerComputed(selectedDetailCustomerId).customer || null}
          transactions={getCustomerComputed(selectedDetailCustomerId).txns}
          balance={getCustomerComputed(selectedDetailCustomerId).balance}
          aging={getCustomerComputed(selectedDetailCustomerId).aging}
          shipmentCount={getCustomerComputed(selectedDetailCustomerId).shipmentCount}
          onOpenPayment={() => {
            const c = getCustomerComputed(selectedDetailCustomerId).customer;
            if (c) {
              setSelectedPaymentCustomer(c);
              setPaymentModalOpen(true);
            }
          }}
          onOpenDebit={() => {
            const c = getCustomerComputed(selectedDetailCustomerId).customer;
            if (c) {
              setSelectedDebitCustomer(c);
              setDebitModalOpen(true);
            }
          }}
        />
      )}

      {/* Vendor Detail Modal */}
      {selectedDetailVendorId && (
        <VendorDetailModal
          isOpen={vendorDetailOpen}
          onClose={() => setVendorDetailOpen(false)}
          vendor={getVendorComputed(selectedDetailVendorId).vendor || null}
          transactions={getVendorComputed(selectedDetailVendorId).txns}
          balance={getVendorComputed(selectedDetailVendorId).balance}
          aging={getVendorComputed(selectedDetailVendorId).aging}
          billCount={getVendorComputed(selectedDetailVendorId).billCount}
          onOpenPayment={() => {
            const v = getVendorComputed(selectedDetailVendorId).vendor;
            if (v) {
              setSelectedPaymentVendor(v);
              setVendorPaymentModalOpen(true);
            }
          }}
        />
      )}

      {/* Delete Customer Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCustomerTarget}
        onClose={() => setDeleteCustomerTarget(null)}
        onConfirm={() => {
          if (deleteCustomerTarget) deleteCustomer(deleteCustomerTarget.id);
        }}
        title="Delete Customer"
        message={
          deleteCustomerTarget
            ? `Delete "${deleteCustomerTarget.name}" permanently? All of this customer's ledger (khata) entries will also be deleted. Their shipments and invoices are kept but will no longer be linked to an account. This cannot be undone.`
            : ''
        }
        confirmText="Yes, delete customer"
      />

      {/* Delete Vendor Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteVendorTarget}
        onClose={() => setDeleteVendorTarget(null)}
        onConfirm={() => {
          if (deleteVendorTarget) void deleteVendor(deleteVendorTarget.id);
        }}
        title="Delete Vendor"
        message={
          deleteVendorTarget
            ? `Delete "${deleteVendorTarget.name}" permanently? All of this vendor's ledger entries (bills and payments) will also be deleted. Shipments booked with this courier are kept. This cannot be undone.`
            : ''
        }
        confirmText="Yes, delete vendor"
      />

      {/* General Ledger Statement Modal */}
      <GeneralLedgerModal
        isOpen={glModalOpen}
        onClose={() => setGlModalOpen(false)}
        data={glData}
        type={glType}
      />

        <EditPartyModal
  isOpen={!!editParty}
  onClose={() => setEditParty(null)}
  type={editParty?.type ?? 'customer'}
  party={editParty?.party ?? null}
//  locked={false}
  onSave={(id, data) => (editParty?.type === 'customer' ? updateCustomer(id, data) : updateVendor(id, data))}
/>
<AuditLogModal
  isOpen={!!auditTarget}
  onClose={() => setAuditTarget(null)}
  title={auditTarget ? `Change Log · ${auditTarget.name}` : 'Change Log'}
  module="Ledger"
  entity={auditTarget?.entity}
  entityId={auditTarget?.id}
/>

    </div>
  );
};
