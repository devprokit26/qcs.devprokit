import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { checkEmail, checkInteger, checkNonNegative, checkPhone, checkText, firstError } from '@/utils/validation';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Customer } from '@/models/types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSave: (data: Omit<Customer, 'id'>) => Promise<unknown>;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSave,
}) => {
  const isEditing = !!customerToEdit;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [creditLimit, setCreditLimit] = useState<string>('500000');
  const [creditDays, setCreditDays] = useState<string>('30');
  const [accountCode, setAccountCode] = useState('');
  const [branch, setBranch] = useState('KHI');
  const [openingBalance, setOpeningBalance] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setCity(customerToEdit.city || '');
      setCreditLimit(String(customerToEdit.creditLimit ?? ''));
      setCreditDays(String(customerToEdit.creditDays ?? 30));
      setAccountCode(customerToEdit.accountCode || '');
      setBranch(customerToEdit.branch || '');
      setOpeningBalance(customerToEdit.openingBalance ? String(customerToEdit.openingBalance) : '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCity('Karachi');
      setCreditLimit('500000');
      setCreditDays('30');
      setAccountCode('');
      setBranch('KHI');
      setOpeningBalance('');
    }
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = firstError(
      checkText(name, 'Customer name', { min: 2, max: 100 }),
      checkPhone(phone),
      checkEmail(email),
      checkText(city, 'City', { required: false, max: 60 }),
      checkNonNegative(creditLimit, 'Credit limit'),
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
        creditLimit: Number(creditLimit) || 0,
        creditDays: Number(creditDays),
        accountCode: accountCode.trim(),
        branch: branch.trim(),
        openingBalance: Number(openingBalance) || 0,
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
      title={isEditing ? 'Edit Customer' : 'Add New Customer'}
      subtitle="Create or modify customer account in your ledger"
      size="md"
      dataTestId="customer-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditing ? 'Save Changes' : 'Add Customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Customer Name"
          required
          placeholder="e.g. ABC Trading Co."
          value={name}
          onChange={e => setName(e.target.value)}
          data-testid="customer-name-input"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            maxLength={11}
            inputMode="numeric"
            placeholder="03001234567"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="customer@example.com"
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
          <Input
            label="Credit Limit (PKR)"
            type="number"
            min={0}
            placeholder="500000"
            value={creditLimit}
            onChange={e => setCreditLimit(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Payment Terms / Credit Days"
            type="number"
            min={0}
            placeholder="30"
            value={creditDays}
            onChange={e => setCreditDays(e.target.value.replace(/\D/g, ''))}
            hint="Grace period before account is locked"
          />
          <Input
            label="Account Code"
            placeholder="e.g. 1-06-01-0002"
            value={accountCode}
            onChange={e => setAccountCode(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Branch / Station Code"
            placeholder="e.g. KHI, SKT, LHE"
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
            hint="Prior debt owed by this customer (Dr)"
          />
        </div>
      </form>
    </Modal>
  );
};
