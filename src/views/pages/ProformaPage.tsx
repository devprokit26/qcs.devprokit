import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Printer, Package, Edit2, RefreshCw, Search, FileText, History, Trash2, Calendar } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { AuditLogModal } from '../components/common/AuditLogModal';
import { ProformaModal } from '../components/proforma/ProformaModal';
import { CommercialInvoiceViewModal, hasPackingValues } from '../components/proforma/CommercialInvoiceViewModal';
import { proformaService } from '@/services';
import { AvailableShipment, ProformaDraft, ProformaInvoice } from '@/models/types';
import { getProformaMissing } from '@/utils/proformaMissing';
import { exportProformaPDF } from '@/utils/proformaPdf';
import { formatDate } from '@/utils/formatters';

const TYPE_LABEL = { COMMERCIAL: 'Commercial', GIFT: 'Gift', DOX: 'Dox' } as const;
const TYPE_CLS = {
  COMMERCIAL: 'bg-blue-100 text-blue-800',
  GIFT: 'bg-amber-100 text-amber-800',
  DOX: 'bg-slate-200 text-slate-700',
} as const;
const th = 'py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap';

export const ProformaPage: React.FC = () => {
  const [rows, setRows] = useState<ProformaInvoice[]>([]);
  const [available, setAvailable] = useState<AvailableShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProformaInvoice | null>(null);
  const [blocked, setBlocked] = useState<{ p: ProformaInvoice; missing: string[] } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [viewing, setViewing] = useState<ProformaInvoice | null>(null);
  const [deleting, setDeleting] = useState<ProformaInvoice | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([proformaService.list(), proformaService.available()]);
      setRows(r); setAvailable(a);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load proforma invoices');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const total = (p: ProformaInvoice) =>
    p.type === 'DOX' ? 0 : p.items.reduce((s, i) => s + i.qty * i.unitPrice, 0) + (p.type === 'COMMERCIAL' ? p.freight : 0);

  const print = (p: ProformaInvoice, part: 'invoice' | 'packing' | 'both') => {
    const missing = getProformaMissing(p, part);
    if (missing.length) { setBlocked({ p, missing }); return; }
    if (part === 'invoice' && p.type === 'COMMERCIAL') {
      setViewing(p);
      return;
    }
    if (part === 'packing' && !hasPackingValues(p.packages)) {
      toast.error('No packing list values added for this invoice');
      return;
    }
    void exportProformaPDF(p, part);
  };

  const save = async (draft: ProformaDraft, id?: number) => {
    try {
      const saved = id ? await proformaService.update(id, draft) : await proformaService.create(draft);
      toast.success(`Proforma ${saved.serialNo} saved`);
      await load();
      const miss = getProformaMissing(saved, 'both');
      if (miss.length) toast(`Saved, but not printable yet. Missing: ${miss.slice(0, 3).join(', ')}${miss.length > 3 ? '…' : ''}`, { icon: '⚠️' });
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
      return false;
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await proformaService.delete(deleting.id);
      toast.success(`Proforma ${deleting.serialNo} deleted`);
      setDeleting(null);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const q = search.trim().toLowerCase();
  const shown = rows.filter(r => {
    if (fromDate && r.invoiceDate < fromDate) return false;
    if (toDate && r.invoiceDate > toDate) return false;
    if (!q) return true;
    return [String(r.serialNo), r.demoConsigneeName, r.destination, r.realShipperName, r.shipperName].some(v => (v || '').toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Proforma</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Commercial, Gift and Dox invoices with packing list. Serial numbers start at 5700001</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAuditOpen(true)} icon={<History className="w-4 h-4" />}>Audit Log</Button>
          <Button variant="secondary" size="sm" onClick={load} icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>Refresh</Button>
          <Button variant="gold" size="sm" onClick={() => { setEditing(null); setModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>New Proforma</Button>
        </div>
      </div>

      <div className="bg-white p-3.5 rounded-card border border-slate-200/80 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Search serial, consignee, destination..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-xs py-2" />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="text-xs font-semibold bg-transparent text-slate-800 focus:outline-none"
            />
          </div>
          {(fromDate || toDate) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-xs py-1"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
        {shown.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No proforma invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={th}>Serial</th><th className={th}>Date</th><th className={th}>Type</th>
                  <th className={th}>Shipper</th>
                  <th className={th}>Consignee</th><th className={th}>Destination</th>
                  <th className={`${th} text-right`}>Total</th><th className={`${th} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 mono font-bold text-[#00A6BD]">{p.serialNo}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">{formatDate(p.invoiceDate)}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${TYPE_CLS[p.type]}`}>{TYPE_LABEL[p.type]}</span></td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.realShipperName || p.shipperName || '—'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.demoConsigneeName || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-700">{p.destination}</td>
                    <td className="py-3 px-4 text-right mono font-extrabold">{p.type === 'DOX' ? '—' : `${p.currency} ${total(p).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="secondary" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => { setEditing(p); setModalOpen(true); }}>Edit</Button>
                        <Button variant="primary" size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => print(p, 'invoice')}>Invoice</Button>
                        {p.type !== 'DOX' && (
                          <Button variant="secondary" size="sm" icon={<Package className="w-3.5 h-3.5" />} onClick={() => print(p, 'packing')}>Packing List</Button>
                        )}
                        <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleting(p)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProformaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} editing={editing} available={available} onSave={save} />

      <CommercialInvoiceViewModal isOpen={!!viewing} onClose={() => setViewing(null)} proforma={viewing} />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title={`Delete Proforma ${deleting?.serialNo}`}
        message={`Are you sure you want to delete proforma invoice ${deleting?.serialNo}? This action cannot be undone.`}
        confirmText={deleteLoading ? 'Deleting...' : 'Delete'}
        isDestructive
      />

      <Modal
        isOpen={!!blocked}
        onClose={() => setBlocked(null)}
        title="Cannot print yet"
        subtitle={blocked ? `Proforma ${blocked.p.serialNo}: these details are missing` : ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setBlocked(null)}>Close</Button>
            <Button variant="gold" size="sm" onClick={() => { setEditing(blocked!.p); setBlocked(null); setModalOpen(true); }}>Add missing details</Button>
          </>
        }
      >
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 font-medium">
          {blocked?.missing.map(m => <li key={m}>{m}</li>)}
        </ul>
      </Modal>

      <AuditLogModal isOpen={auditOpen} onClose={() => setAuditOpen(false)} title="Proforma Audit Log" module="Proforma" />
    </div>
  );
};