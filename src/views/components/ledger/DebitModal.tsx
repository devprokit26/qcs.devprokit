import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { checkAmount, checkDate, checkText, firstError } from '@/utils/validation';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Customer, VoucherType } from '@/models/types';
import { todayLocal } from '@/utils/dates';

interface DebitModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSave: (
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
  ) => Promise<unknown>;
}

export const DebitModal: React.FC<DebitModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSave,
}) => {
  const [voucherType, setVoucherType] = useState<VoucherType>('AE-LOC-INV');
  const [voucherNo, setVoucherNo] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState('');
  const [shipInv, setShipInv] = useState('');
  const [jobNo, setJobNo] = useState('');
  const [branch, setBranch] = useState('SKT');
  const [orig, setOrig] = useState('SKT');
  const [dest, setDest] = useState('');
  const [pcsWeight, setPcsWeight] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (customer && isOpen) {
      const today = todayLocal();
      setVoucherType('AE-LOC-INV');
      setVoucherNo('');
      setAmount('');
      setDate(today);
      setShipInv('');
      setJobNo('');
      setBranch(customer.branch || 'SKT');
      setOrig(customer.branch || 'SKT');
      setDest('');
      setPcsWeight('');
      setDescription('');
    }
  }, [customer, isOpen]);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = firstError(
      checkAmount(amount, 'Invoice amount'),
      checkDate(date, 'Invoice date'),
      checkText(description, 'Description', { required: false, max: 200 }),
      pcsWeight.trim() && !/^\s*\d+(\.\d+)?\s*(\/\s*\d+(\.\d+)?\s*)?$/.test(pcsWeight)
        ? 'Pcs / Weight must look like "3 / 12.5"'
        : null,
    );
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSave(customer.id, {
        amount: Number(amount),
        date,
        voucherType,
        voucherNo: voucherNo.trim() || undefined,
        shipInv: shipInv.trim(),
        jobNo: jobNo.trim(),
        branch: branch.trim(),
        orig: orig.trim(),
        dest: dest.trim(),
        pcsWeight: pcsWeight.trim(),
        description: description.trim(),
      });
      if (result !== false) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Invoice / Debit Entry"
      subtitle={`Record a manual invoice or debit adjustment for ${customer.name}`}
      size="md"
      dataTestId="debit-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Save Debit Entry
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Voucher Type"
            required
            value={voucherType}
            onChange={e => setVoucherType(e.target.value as VoucherType)}
          >
            <option value="AE-LOC-INV">AE-LOC-INV — Export / Local Sale Invoice</option>
            <option value="AI-LOC-INV">AI-LOC-INV — Import / Custom Clearance Invoice</option>
            <option value="JVR">JVR — Journal Voucher (Adjustment)</option>
          </Select>

          <Input
            label="Voucher Number"
            placeholder="Auto-assigned if blank"
            value={voucherNo}
            onChange={e => setVoucherNo(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount (PKR)"
            type="number"
            min={1}
            required
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <Input
            label="Invoice Date"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Ship. Invoice #"
            placeholder="e.g. SJI-12256"
            value={shipInv}
            onChange={e => setShipInv(e.target.value)}
          />
          <Input
            label="Job No."
            placeholder="e.g. 44 924.00"
            value={jobNo}
            onChange={e => setJobNo(e.target.value)}
          />
          <Input
            label="Branch"
            placeholder="SKT"
            value={branch}
            onChange={e => setBranch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Origin"
            placeholder="SKT"
            value={orig}
            onChange={e => setOrig(e.target.value)}
          />
          <Input
            label="Destination"
            placeholder="MAD"
            value={dest}
            onChange={e => setDest(e.target.value)}
          />
          <Input
            label="Pcs / Weight"
            placeholder="e.g. 44 / 924.0"
            value={pcsWeight}
            onChange={e => setPcsWeight(e.target.value)}
          />
        </div>

        <Input
          label="Particulars / Description"
          placeholder="e.g. M: 176-64561906 Freight Sale"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </form>
    </Modal>
  );
};
