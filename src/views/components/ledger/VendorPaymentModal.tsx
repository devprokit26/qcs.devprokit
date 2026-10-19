import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { checkAmount, checkDate, checkText, firstError } from '@/utils/validation';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Vendor, VoucherType } from '@/models/types';
import { PAYMENT_METHODS } from '@/utils/constants';
import { formatPKR } from '@/utils/formatters';
import { todayLocal } from '@/utils/dates';

interface VendorPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  currentBalance: number;
  onSave: (
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
  ) => Promise<unknown>;
}

export const VendorPaymentModal: React.FC<VendorPaymentModalProps> = ({
  isOpen,
  onClose,
  vendor,
  currentBalance,
  onSave,
}) => {
  const [voucherType, setVoucherType] = useState<VoucherType>('BPV');
  const [voucherNo, setVoucherNo] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (vendor && isOpen) {
      const today = todayLocal();
      setVoucherType('BPV');
      setVoucherNo('');
      setAmount(currentBalance > 0 ? String(Math.round(currentBalance * 100) / 100) : '');
      setDate(today);
      setMethod('Bank Transfer');
      setChequeNo('');
      setChequeDate('');
      setNote('');
    }
  }, [vendor, currentBalance, isOpen]);

  if (!vendor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = firstError(
      checkAmount(amount, 'Payment amount'),
      checkDate(date, 'Payment date'),
      method === 'Cheque' ? checkText(chequeNo, 'Cheque number') : null,
      method === 'Cheque' ? checkDate(chequeDate, 'Cheque date', { allowFuture: true }) : null,
      checkText(note, 'Note', { required: false, max: 200 }),
    );
    if (err) {
      toast.error(err);
      return;
    }
    if (currentBalance > 0 && Number(amount) > currentBalance) {
      toast(`Amount is more than the outstanding balance — the extra ${formatPKR(Number(amount) - currentBalance)} will be recorded as an advance.`, { icon: '⚠️' });
    }

    setSubmitting(true);
    try {
      const result = await onSave(vendor.id, {
        amount: Number(amount),
        date,
        voucherType,
        voucherNo: voucherNo.trim() || undefined,
        method,
        ...(method === 'Cheque' ? {
          chequeNo: chequeNo.trim(),
          chequeDate,
        } : {}),
        note: note.trim(),
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
      title="Make Payment to Vendor"
      subtitle={`Record a payment to ${vendor.name}`}
      size="md"
      dataTestId="vendor-payment-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Save Payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payable status card */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Current Payable Balance:
          </span>
          <span
            className={`mono text-lg font-black ${
              currentBalance > 0
                ? 'text-red-600'
                : currentBalance < 0
                ? 'text-emerald-600'
                : 'text-teal-600'
            }`}
          >
            {currentBalance > 0
              ? `Payable: ${formatPKR(currentBalance)}`
              : currentBalance < 0
              ? `Advance: ${formatPKR(Math.abs(currentBalance))}`
              : 'Settled: PKR 0'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Voucher Type"
            required
            value={voucherType}
            onChange={e => setVoucherType(e.target.value as VoucherType)}
          >
            <option value="BPV">BPV — Bank Payment Voucher</option>
            <option value="CPV">CPV — Cash Payment Voucher</option>
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
            label="Amount Paid (PKR)"
            type="number"
            min={1}
            required
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <Input
            label="Payment Date"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <Select
          label="Payment Method"
          value={method}
          onChange={e => {
            setMethod(e.target.value);
            if (e.target.value !== 'Cheque') {
              setChequeNo('');
              setChequeDate('');
            }
          }}
        >
          {PAYMENT_METHODS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>

        {method === 'Cheque' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cheque Number"
              placeholder="Enter cheque number"
              required
              value={chequeNo}
              onChange={e => setChequeNo(e.target.value)}
            />
            <Input
              label="Cheque Date"
              type="date"
              required
              value={chequeDate}
              onChange={e => setChequeDate(e.target.value)}
            />
          </div>
        )}

        <Input
          label="Note / Reference"
          placeholder="Any voucher narration or reference..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </form>
    </Modal>
  );
};
