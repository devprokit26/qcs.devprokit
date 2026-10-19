import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import {
  AvailableShipment, ProformaDraft, ProformaInvoice, ProformaItem, ProformaPackage, ProformaType,
} from '@/models/types';
import { todayLocal } from '@/utils/dates';
import { getProformaMissing } from '@/utils/proformaMissing';
import { checkPhone } from '@/utils/validation';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'PKR'];
const emptyItem = (description = ''): ProformaItem => ({
  description, madeOf: '', hsCode: '', originCountry: 'Pakistan', sizesColors: '', gender: '',
  qty: 0, unit: 'PCS', unitPrice: 0,
});
const emptyBox = (grossWeight = 0): ProformaPackage => ({ contents: '', l: 0, w: 0, h: 0, grossWeight, netWeight: 0 });

// Bigger inputs for the Items and Packing List tables
const cell =
  'w-full px-3 py-2.5 text-sm font-medium text-slate-900 border border-slate-200 rounded-xl bg-slate-50 ' +
  'placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#292929]/20 focus:border-[#292929] transition-colors';
const thCls = 'px-1.5 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap';
const num = (v: string) => (v === '' ? 0 : Math.max(0, Number(v) || 0));
const money = (n: number) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const blank = (): ProformaDraft => ({
  shipmentId: 0, type: 'COMMERCIAL', invoiceDate: todayLocal(),
  realShipperName: '', shipperName: '', shipperCnic: '', shipperAddress: '', shipperPhone: '',
  demoConsigneeName: '', demoConsigneeAddress: '', demoConsigneePhone: '', soldTo: '', cartonNo: '',
  departure: 'Sialkot, Pakistan', invoiceHsCode: '',
  currency: 'USD', exchangeRate: null, incoterm: 'CFR', reasonForExport: 'Sale', freight: 0,
  items: [emptyItem()], packages: [emptyBox()], notes: '',
  awb: '', shipDate: '', origin: '', destination: '', pieces: 0, weight: 0,
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editing: ProformaInvoice | null;
  available?: AvailableShipment[];
  onSave: (draft: ProformaDraft, id?: number) => Promise<boolean>;
}

export const ProformaModal: React.FC<Props> = ({ isOpen, onClose, editing, available = [], onSave }) => {
  const [f, setF] = useState<ProformaDraft>(blank());
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ProformaDraft>(k: K, v: ProformaDraft[K]) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      const { id: _i, serialNo: _s, createdAt: _c, ...rest } = editing;
      setF({ ...blank(), ...rest });
    } else setF(blank());
  }, [isOpen, editing]);

  const pickShipment = (idStr: string) => {
    const s = available.find(x => x.id === Number(idStr));
    if (!s) { setF(blank()); return; }
    setF(p => ({
      ...p, shipmentId: s.id, awb: s.awb, shipDate: s.date, origin: s.origin, destination: s.destination,
      pieces: s.pieces, weight: s.weight,
      items: [emptyItem(s.productName)], packages: [emptyBox(s.weight)],
    }));
  };

  const missing = useMemo(() => getProformaMissing(f), [f]);
  const isDox = f.type === 'DOX';
  const isGift = f.type === 'GIFT';
  const isCommercial = f.type === 'COMMERCIAL';

  const updItem = (i: number, patch: Partial<ProformaItem>) =>
    set('items', f.items.map((it, n) => (n === i ? { ...it, ...patch } : it)));
  const updBox = (i: number, patch: Partial<ProformaPackage>) =>
    set('packages', f.packages.map((b, n) => (n === i ? { ...b, ...patch } : b)));

  const subtotal = f.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);

  const submit = async () => {
    if (!f.realShipperName.trim()) { toast.error('Real shipper name is required'); return; }
    const phoneError = checkPhone(f.shipperPhone) || checkPhone(f.demoConsigneePhone);
    if (phoneError) { toast.error(phoneError); return; }
    const numericValues = [
      f.exchangeRate, f.freight, f.pieces, f.weight,
      ...f.items.flatMap(item => [item.qty, item.unitPrice]),
      ...f.packages.flatMap(box => [box.l, box.w, box.h, box.grossWeight, box.netWeight]),
    ];
    if (numericValues.some(value => value != null && (!Number.isFinite(Number(value)) || Number(value) < 0))) {
      toast.error('Quantities, rates, freight, dimensions and weights cannot be negative');
      return;
    }
    setBusy(true);
    try {
      const ok = await onSave(f, editing?.id);
      if (ok) onClose();
    } finally { setBusy(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Edit Proforma ${editing.serialNo}` : 'New Proforma Invoice'}
      subtitle="Only the printed shipper and consignee typed here appear on the invoice. The real names stay in the system."
      size="xl"
      footer={
        <div className="flex justify-end w-full">
          <Button variant="gold" onClick={submit} loading={busy}>
            {editing ? 'Save Changes' : 'Create Proforma'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {missing.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <div className="font-extrabold mb-1">Missing, so it cannot be printed yet:</div>
            <div className="font-semibold leading-relaxed">{missing.join(' • ')}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Invoice Type" required value={f.type}
            onChange={e => {
              const t = e.target.value as ProformaType;
              setF(p => ({
                ...p, type: t,
                reasonForExport: t === 'GIFT' && p.reasonForExport === 'Sale' ? 'Gift'
                  : t === 'COMMERCIAL' && ['Gift', 'Sample', 'Personal use'].includes(p.reasonForExport) ? 'Sale'
                  : p.reasonForExport,
              }));
            }}
          >
            <option value="COMMERCIAL">Commercial Invoice</option>
            <option value="GIFT">Gift Invoice</option>
            <option value="DOX">Dox (Documents)</option>
          </Select>
          <Input label="Invoice Date" type="date" required value={f.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Shipper</div>
            <Input
              label="Real Shipper Name (not printed)" required
              value={f.realShipperName} onChange={e => set('realShipperName', e.target.value)}
              hint="Saved in the system and used for search. Never printed."
            />
            <Input
              label="Shipper Name (printed on invoice)" required
              value={f.shipperName} onChange={e => set('shipperName', e.target.value)}
              hint="Only this name appears on the invoice and packing list."
            />
            <Input label="Shipper CNIC / NTN" value={f.shipperCnic} onChange={e => set('shipperCnic', e.target.value)} />
            <Input label="Shipper Address" required value={f.shipperAddress} onChange={e => set('shipperAddress', e.target.value)} />
            <Input label="Shipper Phone" type="tel" maxLength={11} inputMode="numeric" value={f.shipperPhone} onChange={e => set('shipperPhone', e.target.value.replace(/\D/g, '').slice(0, 11))} hint="Enter 11 digits, e.g. 03001234567." />
          </div>
          <div className="space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Consignee / Ship To (printed on this invoice)</div>
            <Input label="Consignee Name" required value={f.demoConsigneeName} onChange={e => set('demoConsigneeName', e.target.value)} />
            <Input label="Consignee Address" required value={f.demoConsigneeAddress} onChange={e => set('demoConsigneeAddress', e.target.value)} />
            <Input label="Consignee Phone" type="tel" maxLength={11} inputMode="numeric" value={f.demoConsigneePhone} onChange={e => set('demoConsigneePhone', e.target.value.replace(/\D/g, '').slice(0, 11))} hint="Enter 11 digits, e.g. 03001234567." />
            <Input label="Destination Country" required value={f.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. USA, UK, Germany" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Carton No. (CTN #)" value={f.cartonNo} onChange={e => set('cartonNo', e.target.value)} />
              <Input label="AWB / Tracking (opt.)" value={f.awb} onChange={e => set('awb', e.target.value)} />
            </div>
          </div>
        </div>

        {isCommercial && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Departure" value={f.departure} onChange={e => set('departure', e.target.value)} placeholder="Sialkot, Pakistan" />
            <Input label="HS Code (invoice level)" value={f.invoiceHsCode} onChange={e => set('invoiceHsCode', e.target.value)} hint="Optional. Item HS codes are entered below." />
          </div>
        )}

        {!isDox && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select label="Currency" value={f.currency} onChange={e => set('currency', e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            {f.currency !== 'PKR' && (
              <Input label={`1 ${f.currency} = PKR (opt.)`} type="number" min={0} step={0.01}
                value={f.exchangeRate ?? ''} onChange={e => set('exchangeRate', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} />
            )}
            {!isGift && <Input label="Incoterm" value={f.incoterm} onChange={e => set('incoterm', e.target.value)} hint="CFR, CIF, FOB, DAP..." />}
            {isGift ? (
              <Select label="Purpose" value={f.reasonForExport} onChange={e => set('reasonForExport', e.target.value)}>
                <option value="Gift">Gift (not for sale)</option>
                <option value="Sample">Sample (not for sale)</option>
                <option value="Personal use">Personal use</option>
              </Select>
            ) : (
              <Input label="Reason for Export" value={f.reasonForExport} onChange={e => set('reasonForExport', e.target.value)} />
            )}
            {!isGift && <Input label={`Shipping & Freight (${f.currency})`} type="number" min={0} value={f.freight || ''} onChange={e => set('freight', num(e.target.value))} />}
          </div>
        )}

        {isDox ? (
          <Input label="Description of Documents" required value={f.items[0]?.description || ''}
            onChange={e => set('items', [{ ...(f.items[0] || emptyItem()), description: e.target.value }])}
            placeholder="e.g. Business documents, Academic certificates" />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{isGift ? 'Gift Items' : 'Items'}</div>
              <Button variant="secondary" size="sm" type="button" icon={<Plus className="w-3 h-3" />} onClick={() => set('items', [...f.items, emptyItem()])}>Add Item</Button>
            </div>
            <div className="overflow-x-auto pb-2">
              <table className={`w-full text-left ${isGift ? 'min-w-[900px]' : 'min-w-[1600px]'}`}>
                <thead>
                  <tr>
                    <th className={`${thCls} min-w-[180px]`}>Product Name</th>
                    {!isGift && <th className={`${thCls} min-w-[280px]`}>Description of goods (with made-of detail)</th>}
                    {!isGift && <th className={`${thCls} min-w-[140px]`}>Country of Origin</th>}
                    <th className={`${thCls} min-w-[140px]`}>H.T.S Code{isGift ? ' (opt.)' : ''}</th>
                    <th className={`${thCls} min-w-[90px]`}>Unit</th>
                    {!isGift && <th className={`${thCls} min-w-[160px]`}>Sizes &amp; Colours</th>}
                    {!isGift && <th className={`${thCls} min-w-[120px]`}>Gender</th>}
                    <th className={`${thCls} min-w-[100px]`}>Qty</th>
                    <th className={`${thCls} min-w-[130px]`}>{isGift ? 'Declared Value' : 'Unit Price'}</th>
                    {!isGift && <th className={`${thCls} min-w-[130px] text-right`}>Total Value {f.currency}</th>}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {f.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-1.5"><input className={cell} value={it.description} onChange={e => updItem(i, { description: e.target.value })} /></td>
                      {!isGift && <td className="p-1.5"><input className={cell} value={it.madeOf} onChange={e => updItem(i, { madeOf: e.target.value })} placeholder="M/O POLYESTER KNITTED 100%" /></td>}
                      {!isGift && <td className="p-1.5"><input className={cell} value={it.originCountry} onChange={e => updItem(i, { originCountry: e.target.value })} /></td>}
                      <td className="p-1.5"><input className={cell} value={it.hsCode} onChange={e => updItem(i, { hsCode: e.target.value })} /></td>
                      <td className="p-1.5"><input className={cell} value={it.unit} onChange={e => updItem(i, { unit: e.target.value })} /></td>
                      {!isGift && <td className="p-1.5"><input className={cell} value={it.sizesColors} onChange={e => updItem(i, { sizesColors: e.target.value })} placeholder="ASSORTED" /></td>}
                      {!isGift && <td className="p-1.5"><input className={cell} value={it.gender} onChange={e => updItem(i, { gender: e.target.value })} placeholder="UNISEX" /></td>}
                      <td className="p-1.5"><input type="number" min={0} className={cell} value={it.qty || ''} onChange={e => updItem(i, { qty: num(e.target.value) })} /></td>
                      <td className="p-1.5"><input type="number" min={0} step={0.01} className={cell} value={it.unitPrice || ''} onChange={e => updItem(i, { unitPrice: num(e.target.value) })} /></td>
                      {!isGift && (
                        <td className="p-1.5 text-right mono text-sm font-extrabold text-slate-900 whitespace-nowrap">
                          {money((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))}
                        </td>
                      )}
                      <td className="p-1.5">
                        {f.items.length > 1 && (
                          <button type="button" onClick={() => set('items', f.items.filter((_, n) => n !== i))} className="p-1.5 text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {isCommercial && (
                  <tfoot>
                    <tr className="text-sm">
                      <td colSpan={9} className="px-2 pt-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Subtotal</td>
                      <td className="px-2 pt-3 text-right mono font-extrabold text-slate-900 whitespace-nowrap">{money(subtotal)}</td>
                      <td />
                    </tr>
                    <tr className="text-sm">
                      <td colSpan={9} className="px-2 pt-1 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Shipping &amp; Freight</td>
                      <td className="px-2 pt-1 text-right mono font-extrabold text-slate-900 whitespace-nowrap">{money(f.freight)}</td>
                      <td />
                    </tr>
                    <tr className="text-sm">
                      <td colSpan={9} className="px-2 pt-1 text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Grand Total Value {f.incoterm}</td>
                      <td className="px-2 pt-1 text-right mono font-black text-[#292929] whitespace-nowrap">{money(subtotal + (Number(f.freight) || 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {!isDox && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Packing List (boxes)</div>
              <Button variant="secondary" size="sm" type="button" icon={<Plus className="w-3 h-3" />} onClick={() => set('packages', [...f.packages, emptyBox()])}>Add Box</Button>
            </div>
            <div className="overflow-x-auto pb-2">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr>
                    <th className={`${thCls} min-w-[260px]`}>Contents</th>
                    <th className={`${thCls} min-w-[90px]`}>L (cm)</th>
                    <th className={`${thCls} min-w-[90px]`}>W (cm)</th>
                    <th className={`${thCls} min-w-[90px]`}>H (cm)</th>
                    <th className={`${thCls} min-w-[130px]`}>Gross KG</th>
                    <th className={`${thCls} min-w-[130px]`}>Net KG</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {f.packages.map((b, i) => (
                    <tr key={i}>
                      <td className="p-1.5"><input className={cell} value={b.contents} onChange={e => updBox(i, { contents: e.target.value })} /></td>
                      {(['l', 'w', 'h'] as const).map(k => (
                        <td key={k} className="p-1.5"><input type="number" min={0} className={cell} value={b[k] || ''} onChange={e => updBox(i, { [k]: num(e.target.value) })} /></td>
                      ))}
                      <td className="p-1.5"><input type="number" min={0} step={0.01} className={cell} value={b.grossWeight || ''} onChange={e => updBox(i, { grossWeight: num(e.target.value) })} /></td>
                      <td className="p-1.5"><input type="number" min={0} step={0.01} className={cell} value={b.netWeight || ''} onChange={e => updBox(i, { netWeight: num(e.target.value) })} /></td>
                      <td className="p-1.5">
                        {f.packages.length > 1 && (
                          <button type="button" onClick={() => set('packages', f.packages.filter((_, n) => n !== i))} className="p-1.5 text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Input label="Notes (optional)" value={f.notes} onChange={e => set('notes', e.target.value)} />
      </div>
    </Modal>
  );
};