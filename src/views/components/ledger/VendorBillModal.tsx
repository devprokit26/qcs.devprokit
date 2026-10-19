import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { checkAmount, checkDate, checkText, firstError } from '@/utils/validation';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Vendor, VoucherType } from '@/models/types';
import { todayLocal } from '@/utils/dates';

interface VendorBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fixed vendor. Leave null and pass `vendors` to let the user pick one. */
  vendor: Vendor | null;
  /** When given (and `vendor` is null) a vendor picker is shown. */
  vendors?: Vendor[];
  onSave: (
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
  ) => Promise<unknown>;
}

export const VendorBillModal: React.FC<VendorBillModalProps> = ({
  isOpen,
  onClose,
  vendor,
  vendors,
  onSave,
}) => {
  const [pickedVendorId, setPickedVendorId] = useState<string>('');
  const [voucherType, setVoucherType] = useState<VoucherType>('PINV');
  const [voucherNo, setVoucherNo] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState('');
  const [shipInv, setShipInv] = useState('');
  const [jobNo, setJobNo] = useState('');
  const [branch, setBranch] = useState('SKT');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const activeVendor: Vendor | null =
    vendor ?? (vendors?.find(v => String(v.id) === pickedVendorId) || null);
  const canPick = !vendor && !!vendors;

  useEffect(() => {
    if (isOpen && !vendor) setPickedVendorId('');
  }, [isOpen, vendor]);

  useEffect(() => {
    if (isOpen && activeVendor) setBranch(activeVendor.branch || 'SKT');
  }, [isOpen, activeVendor?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && (vendor || canPick)) {
      const today = todayLocal();
      setVoucherType('PINV');
      setVoucherNo('');
      setAmount('');
      setDate(today);
      setShipInv('');
      setJobNo('');
      setBranch(vendor?.branch || 'SKT');
      setDescription('');
    }
  }, [vendor, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!vendor && !canPick) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = firstError(
      !activeVendor ? 'Please select the vendor this bill is from' : null,
      checkAmount(amount, 'Bill amount'),
      checkDate(date, 'Bill date'),
      checkText(description, 'Description', { required: false, max: 200 }),
    );
    if (err) {
      toast.error(err);
      return;
    }

    if (!activeVendor) return;
    setSubmitting(true);
    try {
      const result = await onSave(activeVendor.id, {
        amount: Number(amount),
        date,
        voucherType,
        voucherNo: voucherNo.trim() || undefined,
        shipInv: shipInv.trim(),
        jobNo: jobNo.trim(),
        branch: branch.trim(),
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
      title="Add Bill / Payable Entry"
      subtitle={activeVendor ? `Record a bill or expense invoice received from ${activeVendor.name}` : 'Record a bill or expense invoice received from a vendor'}
      size="md"
      dataTestId="vendor-bill-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Save Bill Entry
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {canPick && (
          <Select
            label="Vendor"
            required
            value={pickedVendorId}
            onChange={e => setPickedVendorId(e.target.value)}
            data-testid="bill-vendor-select"
          >
            <option value="">— Select vendor —</option>
            {(vendors || []).map(v => (
              <option key={v.id} value={v.id}>
                {v.name}{v.city ? ` (${v.city})` : ''}
              </option>
            ))}
          </Select>
        )}
        {canPick && (vendors || []).length === 0 && (
          <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            No vendors yet — add one from the Ledger → Vendors tab first.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Voucher Type"
            required
            value={voucherType}
            onChange={e => setVoucherType(e.target.value as VoucherType)}
          >
            <option value="PINV">PINV — Purchase / Supplier Invoice</option>
            <option value="EXP-INV">EXP-INV — Expense Invoice</option>
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
            label="Bill Date"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Bill / Invoice #"
            placeholder="e.g. INV-2256"
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

        <Input
          label="Particulars / Description"
          placeholder="e.g. Freight charges for October consignment"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </form>
    </Modal>
  );
};
