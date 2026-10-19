import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { checkEmail, checkInteger, checkNonNegative, checkPhone, checkText, firstError } from '@/utils/validation';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Vendor, VendorCategory } from '@/models/types';
import { VENDOR_CATEGORIES } from '@/utils/constants';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorToEdit?: Vendor | null;
  onSave: (data: Omit<Vendor, 'id'>) => Promise<unknown>;
}

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  vendorToEdit,
  onSave,
}) => {
  const isEditing = !!vendorToEdit;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Courier / Freight');
  const [creditDays, setCreditDays] = useState<string>('30');
  const [accountCode, setAccountCode] = useState('');
  const [branch, setBranch] = useState('KHI');
  const [openingBalance, setOpeningBalance] = useState<string>('');

  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name);
      setPhone(vendorToEdit.phone || '');
      setEmail(vendorToEdit.email || '');
      setCity(vendorToEdit.city || '');
      setCategory(vendorToEdit.category || 'Courier / Freight');
      setCreditDays(String(vendorToEdit.creditDays ?? 30));
      setAccountCode(vendorToEdit.accountCode || '');
      setBranch(vendorToEdit.branch || '');
      setOpeningBalance(vendorToEdit.openingBalance ? String(vendorToEdit.openingBalance) : '');
      setServices(vendorToEdit.services || ['Express', 'Economy']);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCity('Karachi');
      setCategory('Courier / Freight');
      setCreditDays('30');
      setAccountCode('');
      setBranch('KHI');
      setOpeningBalance('');
      setServices(['Express', 'Economy']);
    }
  }, [vendorToEdit, isOpen]);

  const addServiceTag = () => {
    const trimmed = serviceInput.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices(prev => [...prev, trimmed]);
      setServiceInput('');
    }
  };

  const removeServiceTag = (tag: string) => {
    setServices(prev => prev.filter(s => s !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = firstError(
      checkText(name, 'Vendor name', { min: 2, max: 100 }),
      checkPhone(phone),
      checkEmail(email),
      checkText(city, 'City', { required: false, max: 60 }),
      checkInteger(creditDays, 'Credit days', { min: 0, max: 365 }),
      checkNonNegative(openingBalance, 'Opening balance'),
      checkText(accountCode, 'Account code', { required: false, max: 30 }),
    );
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSave({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        category,
        creditDays: Number(creditDays),
        accountCode: accountCode.trim(),
        branch: branch.trim(),
        openingBalance: Number(openingBalance) || 0,
        services,
      });
      // Keep the form open (with the typed data) if saving failed
      if (result !== null && result !== false) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Vendor' : 'Add New Vendor'}
      subtitle="Create or modify supplier account in your payables ledger"
      size="md"
      dataTestId="vendor-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditing ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Vendor / Supplier Name"
          required
          placeholder="e.g. National Courier Services"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            maxLength={11}
            inputMode="numeric"
            placeholder="03211112233"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="ap@vendor.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            placeholder="Karachi"
            value={city}
            onChange={e => setCity(e.target.value)}
          />
          <Select
            label="Vendor Category"
            value={category}
            onChange={e => setCategory(e.target.value as VendorCategory)}
          >
            {VENDOR_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        {/* Services Tag Input */}
        <div>
          <label className="text-xs font-bold text-slate-800 tracking-tight block mb-1">
            Offered Services
          </label>
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="e.g. Express, Overnight, Cargo"
              value={serviceInput}
              onChange={e => setServiceInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addServiceTag();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addServiceTag}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {services.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 shadow-2xs"
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeServiceTag(s)}
                  className="text-slate-400 hover:text-red-500 font-extrabold cursor-pointer"
                >
                  &times;
                </button>
              </span>
            ))}
            {services.length === 0 && (
              <span className="text-xs text-slate-400 italic">No services added yet</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Payment Terms (Days)"
            type="number"
            min={0}
            placeholder="30"
            value={creditDays}
            onChange={e => setCreditDays(e.target.value.replace(/\D/g, ''))}
          />
          <Input
            label="Account Code"
            placeholder="e.g. 2-01-01-0002"
            value={accountCode}
            onChange={e => setAccountCode(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Branch / Station"
            placeholder="e.g. KHI"
            value={branch}
            onChange={e => setBranch(e.target.value)}
          />
          <Input
            label="Opening Balance (PKR)"
            type="number"
            min={0}
            placeholder="0"
            value={openingBalance}
            onChange={e => setOpeningBalance(e.target.value)}
            hint="Amount already payable to this vendor (Dr)"
          />
        </div>
      </form>
    </Modal>
  );
};
