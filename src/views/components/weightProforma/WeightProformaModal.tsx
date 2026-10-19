import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { checkDate, checkText, firstError } from '@/utils/validation';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { WeightProforma, WeightBox, Shipment } from '@/models/types';
import { calculateBoxWeights, calculateProformaTotals } from '@/models/weight';
import { Plus, Trash2 } from 'lucide-react';
import { todayLocal } from '@/utils/dates';

interface WeightProformaModalProps {
  isOpen: boolean;
  onClose: () => void;
  proformaToEdit?: WeightProforma | null;
  shipments: Shipment[];
  onSave: (data: Omit<WeightProforma, 'id'>) => Promise<unknown>;
}

export const WeightProformaModal: React.FC<WeightProformaModalProps> = ({
  isOpen,
  onClose,
  proformaToEdit,
  shipments,
  onSave,
}) => {
  const isEditing = !!proformaToEdit;

  const [cnNo, setCnNo] = useState('');
  const [shipper, setShipper] = useState('');
  const [services, setServices] = useState('');
  const [date, setDate] = useState('');
  const [divisor, setDivisor] = useState(5000);
  const [shipmentId, setShipmentId] = useState<number | ''>('');
  const [boxes, setBoxes] = useState<WeightBox[]>([]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (proformaToEdit) {
      setCnNo(proformaToEdit.cnNo);
      setShipper(proformaToEdit.shipper);
      setServices(proformaToEdit.services);
      setDate(proformaToEdit.date);
      setDivisor(proformaToEdit.divisor || 5000);
      setShipmentId(proformaToEdit.shipmentId || '');
      setBoxes(
        proformaToEdit.boxes.length
          ? proformaToEdit.boxes
          : [{ id: 'b1', actWeight: 0, l: 0, w: 0, h: 0 }]
      );
    } else {
      const today = todayLocal();
      const randomCn = Math.floor(1000000000 + Math.random() * 9000000000);
      setCnNo(String(randomCn));
      setShipper('');
      setServices('USA-CAN-MEX UPS ExpdL VIA UK');
      setDate(today);
      setDivisor(5000);
      setShipmentId('');
      // Start with one empty box row (no demo numbers to delete)
      setBoxes([{ id: 'b1', actWeight: 0, l: 0, w: 0, h: 0 }]);
    }
  }, [proformaToEdit, isOpen]);

  const addBoxRow = () => {
    setBoxes(prev => [
      ...prev,
      { id: `b_${Date.now()}_${prev.length}`, actWeight: 0, l: 0, w: 0, h: 0 },
    ]);
  };

  const updateBox = (index: number, field: keyof WeightBox, value: number) => {
    setBoxes(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeBox = (index: number) => {
    if (boxes.length <= 1) return;
    setBoxes(prev => prev.filter((_, i) => i !== index));
  };

  const totals = calculateProformaTotals(boxes, divisor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let boxError: string | null = null;
    if (boxes.length === 0) boxError = 'Add at least one box';
    boxes.forEach((b, i) => {
      if (boxError) return;
      const n = i + 1;
      const act = Number(b.actWeight);
      if (!Number.isFinite(act) || act <= 0) boxError = `Box ${n}: actual weight must be greater than 0`;
      else if (act > 1000) boxError = `Box ${n}: actual weight looks too large (max 1000 KG)`;
      else if ([b.l, b.w, b.h].some(d => !Number.isFinite(Number(d)) || Number(d) <= 0)) {
        boxError = `Box ${n}: length, width and height must all be greater than 0`;
      } else if ([b.l, b.w, b.h].some(d => Number(d) > 1000)) {
        boxError = `Box ${n}: a dimension looks too large (max 1000 cm)`;
      }
    });
    const err = firstError(
      checkText(cnNo, 'C/N number', { max: 40 }),
      checkText(shipper, 'Shipper name', { min: 2, max: 100 }),
      checkDate(date, 'Date'),
      !Number.isFinite(Number(divisor)) || Number(divisor) <= 0 ? 'Divisor must be greater than 0 (usually 5000 or 6000)' : null,
      boxError,
    );
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSave({
        cnNo: cnNo.trim(),
        shipper: shipper.trim(),
        services: services.trim(),
        date,
        divisor,
        shipmentId: shipmentId ? Number(shipmentId) : null,
        boxes,
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
      title={isEditing ? 'Edit Weight Proforma' : 'New Weight Proforma'}
      subtitle="Box-by-box actual vs. dimensional chargeable weight calculation"
      size="xl"
      dataTestId="wp-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSubmit} loading={submitting}>
            {isEditing ? 'Update Proforma' : 'Save Proforma'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="C/N Number"
            required
            placeholder="e.g. 1350280995"
            value={cnNo}
            onChange={e => setCnNo(e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <Select
            label="Link to Shipment (AWB)"
            value={shipmentId}
            onChange={e => setShipmentId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">None — Standalone record</option>
            {shipments.map(s => (
              <option key={s.id} value={s.id}>
                {s.awb} ({s.customerName} &bull; {s.destination})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Shipper Name"
            required
            placeholder="e.g. GARSON WEARS (PVT) LTD"
            value={shipper}
            onChange={e => setShipper(e.target.value)}
          />
          <Input
            label="Services Description"
            required
            placeholder="e.g. USA-CAN-MEX UPS ExpdL VIA UK"
            value={services}
            onChange={e => setServices(e.target.value)}
          />
        </div>

        <div className="w-full md:w-1/3">
          <Select
            label="Volumetric Divisor"
            value={divisor}
            onChange={e => setDivisor(Number(e.target.value))}
          >
            <option value={5000}>5000 (Air Freight Standard - IATA)</option>
            <option value={6000}>6000 (Express Courier Standard)</option>
          </Select>
        </div>

        {/* Dynamic Box Table */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Box-by-Box Breakdown ({boxes.length} Boxes)
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addBoxRow}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Box Row
            </Button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#292929] text-white">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12 font-bold">#</th>
                  <th className="py-2.5 px-3 text-right font-bold">Act. Weight (KG)</th>
                  <th className="py-2.5 px-3 text-center font-bold">L (cm)</th>
                  <th className="py-2.5 px-3 text-center font-bold">W (cm)</th>
                  <th className="py-2.5 px-3 text-center font-bold">H (cm)</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#E5C365]">Dim Weight</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#FFC6C9]">Ch. Weight</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {boxes.map((b, i) => {
                  const calc = calculateBoxWeights(b, divisor);
                  return (
                    <tr key={b.id || i} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={b.actWeight || ''}
                          onChange={e => updateBox(i, 'actWeight', parseFloat(e.target.value) || 0)}
                          className="mono w-full text-right px-2 py-1 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#292929]"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={b.l || ''}
                          onChange={e => updateBox(i, 'l', parseFloat(e.target.value) || 0)}
                          className="mono w-full text-center px-1 py-1 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#292929]"
                          placeholder="L"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={b.w || ''}
                          onChange={e => updateBox(i, 'w', parseFloat(e.target.value) || 0)}
                          className="mono w-full text-center px-1 py-1 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#292929]"
                          placeholder="W"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={b.h || ''}
                          onChange={e => updateBox(i, 'h', parseFloat(e.target.value) || 0)}
                          className="mono w-full text-center px-1 py-1 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-[#292929]"
                          placeholder="H"
                        />
                      </td>
                      <td className="mono py-2 px-3 text-right font-bold text-slate-700">
                        {calc.dimWeight.toFixed(2)}
                      </td>
                      <td className="mono py-2 px-3 text-right font-extrabold text-[#292929]">
                        {calc.chWeight.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeBox(i)}
                          disabled={boxes.length <= 1}
                          className="p-1 text-slate-300 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                          title="Remove box"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#FEF3C7]/60 font-extrabold border-t-2 border-[#F21624]/40 text-slate-900">
                <tr>
                  <td className="py-2.5 px-3 text-center">TOTAL</td>
                  <td className="mono py-2.5 px-3 text-right">{totals.totalAct.toFixed(2)}</td>
                  <td colSpan={3} className="text-center text-[10.5px] text-slate-500">
                    Formula: (L &times; W &times; H) / {divisor}
                  </td>
                  <td className="mono py-2.5 px-3 text-right">{totals.totalDim.toFixed(2)}</td>
                  <td className="mono py-2.5 px-3 text-right text-base text-[#C81320]">
                    {totals.totalCh.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </form>
    </Modal>
  );
};
