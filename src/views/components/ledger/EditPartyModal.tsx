import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Customer, Vendor, VendorCategory } from '@/models/types';
import { checkPhone } from '@/utils/validation';

const CATEGORIES: VendorCategory[] = ['Courier / Freight', 'Fuel', 'Office Supplies', 'Utilities', 'Rent', 'Maintenance', 'Other'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'customer' | 'vendor';
  party: Customer | Vendor | null;
  // locked: boolean;
  onSave: (id: number, data: any) => Promise<unknown>;
}

export const EditPartyModal: React.FC<Props> = ({ isOpen, onClose, type, party, onSave }) => {
  const isCust = type === 'customer';
  const [f, setF] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!isOpen || !party) return;
    const p: any = party;
    setF({
      name: p.name || '', phone: p.phone || '', email: p.email || '', city: p.city || '',
      accountCode: p.accountCode || '', branch: p.branch || '',
      creditLimit: String(p.creditLimit ?? 0), creditDays: String(p.creditDays ?? 30),
      openingBalance: String(p.openingBalance ?? 0),
      category: p.category || 'Courier / Freight', services: (p.services || []).join(', '),
    });
  }, [isOpen, party]);

  const submit = async () => {
    if (!party) return;
    if (!f.name?.trim()) { toast.error('Name is required'); return; }
    const phoneError = checkPhone(f.phone || '');
    if (phoneError) { toast.error(phoneError); return; }
    if (isCust && !(Number(f.creditLimit) >= 0)) { toast.error('Credit limit must be 0 or more'); return; }
    if (!Number.isInteger(Number(f.creditDays)) || Number(f.creditDays) < 0 || Number(f.creditDays) > 365) { toast.error('Terms (days) must be a whole number between 0 and 365'); return; }
    if (!(Number(f.openingBalance) >= 0)) { toast.error('Opening balance must be 0 or more'); return; }
    const data: any = {
      name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), city: f.city.trim(),
      accountCode: f.accountCode.trim(), branch: f.branch.trim(), creditDays: Number(f.creditDays),
    };
    if (isCust) data.creditLimit = Number(f.creditLimit);
    else {
      data.category = f.category;
      data.services = f.services.split(',').map(s => s.trim()).filter(Boolean);
    }
    data.openingBalance = Number(f.openingBalance) || 0;
    setBusy(true);
    try {
      const r = await onSave(party.id, data);
      if (r) onClose();
    } finally { setBusy(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCust ? 'Edit Customer' : 'Edit Vendor'}
      subtitle="Profile information only. Transactions are not changed here."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="gold" onClick={submit} loading={busy}>Save Changes</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Name" required value={f.name || ''} onChange={e => set('name', e.target.value)} />
        <Input label="Phone" type="tel" maxLength={11} inputMode="numeric" value={f.phone || ''} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 11))} />
        <Input label="Email" value={f.email || ''} onChange={e => set('email', e.target.value)} />
        <Input label="City" value={f.city || ''} onChange={e => set('city', e.target.value)} />
        <Input label="Account Code" value={f.accountCode || ''} onChange={e => set('accountCode', e.target.value)} />
        <Input label="Branch" value={f.branch || ''} onChange={e => set('branch', e.target.value)} />
        {isCust ? (
          <Input label="Credit Limit (PKR)" type="number" min={0} value={f.creditLimit || ''} onChange={e => set('creditLimit', e.target.value)} />
        ) : (
          <Select label="Category" value={f.category || ''} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        )}
        <Input label="Terms (days)" type="number" min={0} max={365} step={1} value={f.creditDays ?? ''} onChange={e => set('creditDays', e.target.value.replace(/\D/g, ''))} />
        {!isCust && (
          <div className="md:col-span-2">
            <Input label="Services (comma separated)" value={f.services || ''} onChange={e => set('services', e.target.value)} />
          </div>
        )}
        <div className="md:col-span-2">
         <Input
  label="Opening Balance (PKR)"
  type="number"
  min={0}
  value={f.openingBalance || ''}
  onChange={e => set('openingBalance', e.target.value)}
  hint="Changing this also updates the ledger statement and balance"
/>
        </div>
      </div>
    </Modal>
  );
};