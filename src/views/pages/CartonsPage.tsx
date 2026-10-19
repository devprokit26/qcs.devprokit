import React, { useState, useMemo } from 'react';
import {
  Package, Plus, ArrowDown, ArrowUp, Edit2, AlertTriangle,
  BarChart2, Search, ChevronDown, ChevronRight, Box, TrendingUp, Trash2,History,
} from 'lucide-react';
import { AuditLogModal } from '@/views/components/common/AuditLogModal';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/views/components/common/ConfirmDialog';
import { useCartonsController } from '@/controllers/useCartonsController';
import { CartonType, CartonMovement, MovementType, NewCartonType } from '@/models/types';
import { formatNum } from '@/utils/formatters';
import { Button } from '@/views/components/common/Button';
import { Input } from '@/views/components/common/Input';
import { Select } from '@/views/components/common/Select';
import { Modal } from '@/views/components/common/Modal';
import { todayLocal } from '@/utils/dates';

// ─── Helpers ────────────────────────────────────────────────────────────────
const MOVEMENT_LABELS: Record<MovementType, string> = {
  RECEIVED: 'Stock Received',
  USED: 'Used in Shipment',
  ADJUSTMENT_IN: 'Adjustment (+)',
  ADJUSTMENT_OUT: 'Adjustment (−)',
  RETURNED: 'Returned',
};
const MOVEMENT_COLORS: Record<MovementType, string> = {
  RECEIVED: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  USED: 'text-blue-600 bg-blue-50 border-blue-200',
  ADJUSTMENT_IN: 'text-teal-600 bg-teal-50 border-teal-200',
  ADJUSTMENT_OUT: 'text-amber-600 bg-amber-50 border-amber-200',
  RETURNED: 'text-red-700 bg-red-50 border-red-200',
};

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Add/Edit Type Modal ─────────────────────────────────────────────────────
interface TypeModalProps {
  open: boolean;
  onClose: () => void;
  initial?: CartonType | null;
  /** Names already in use (case-insensitive duplicate check). */
  existingNames: { id: number; name: string }[];
  /** When creating, `data` also carries the opening stock (quantity + unit price). */
  onSave: (data: NewCartonType) => void;
}

/** Optional positive number field: '' is allowed, otherwise must be > 0. */
function dimError(v: string, label: string): string | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return `${label} must be greater than 0`;
  if (n > 1000) return `${label} looks too large (max 1000 cm)`;
  return null;
}

const TypeModal: React.FC<TypeModalProps> = ({ open, onClose, initial, existingNames, onSave }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [l, setL] = useState(String(initial?.lengthCm ?? ''));
  const [w, setW] = useState(String(initial?.widthCm ?? ''));
  const [h, setH] = useState(String(initial?.heightCm ?? ''));
  const [threshold, setThreshold] = useState(String(initial?.lowStockThreshold ?? 5));
  const [openingQty, setOpeningQty] = useState('');
  const [openingCost, setOpeningCost] = useState('');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const isNew = !initial;

  React.useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setL(String(initial?.lengthCm ?? ''));
      setW(String(initial?.widthCm ?? ''));
      setH(String(initial?.heightCm ?? ''));
      setThreshold(String(initial?.lowStockThreshold ?? 5));
      setOpeningQty('');
      setOpeningCost('');
      setIsActive(initial?.isActive ?? true);
    }
  }, [open, initial]);

  const [touched, setTouched] = useState(false);
  React.useEffect(() => { if (open) setTouched(false); }, [open]);

  const qtyNum = Number(openingQty) || 0;
  const costNum = Number(openingCost) || 0;
  const qtyInvalid = isNew && openingQty !== '' && (!Number.isFinite(Number(openingQty)) || qtyNum < 0 || !Number.isInteger(qtyNum));
  const costInvalid = isNew && openingCost !== '' && (!Number.isFinite(Number(openingCost)) || costNum < 0);
  const thresholdNum = Number(threshold);

  const trimmed = name.trim();
  const errors = {
    name: !trimmed
      ? 'Name is required'
      : trimmed.length > 80
      ? 'Name is too long (max 80 characters)'
      : existingNames.some(t => t.id !== initial?.id && t.name.trim().toLowerCase() === trimmed.toLowerCase())
      ? 'A carton type with this name already exists'
      : null,
    l: dimError(l, 'Length'),
    w: dimError(w, 'Width'),
    h: dimError(h, 'Height'),
    threshold: threshold.trim() === ''
      ? 'Threshold is required (use 0 to disable the alert)'
      : !Number.isInteger(thresholdNum) || thresholdNum < 0
      ? 'Threshold must be a whole number (0 or more)'
      : null,
    cost: costInvalid ? 'Unit price cannot be negative' : null,
  };
  const firstError = Object.values(errors).find(Boolean) || (qtyInvalid ? 'Quantity must be a whole number (0 or more).' : null);

  const handleSave = () => {
    setTouched(true);
    if (firstError) {
      toast.error(firstError);
      return;
    }
    const base = {
      name: trimmed,
      lengthCm: l ? Number(l) : undefined,
      widthCm: w ? Number(w) : undefined,
      heightCm: h ? Number(h) : undefined,
      lowStockThreshold: thresholdNum,
      isActive,
    };
    // Opening stock is only asked / sent when creating a NEW box type
    onSave(
      isNew
        ? { ...base, openingQuantity: qtyNum, openingUnitCost: openingCost !== '' ? costNum : null }
        : base
    );
    onClose();
  };

  return (
    <Modal
      isOpen={open} onClose={onClose}
      title={initial ? 'Edit Carton Type' : 'New Carton Type'}
      subtitle="Define a box size and set low-stock alert threshold"
      size="sm"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Name / Description <span className="text-red-500">*</span></label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Small 30×20×20 cm" error={touched ? errors.name ?? undefined : undefined} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Length (cm)</label>
            <Input type="number" min={0} value={l} onChange={e => setL(e.target.value)} placeholder="30" error={touched ? errors.l ?? undefined : undefined} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Width (cm)</label>
            <Input type="number" min={0} value={w} onChange={e => setW(e.target.value)} placeholder="20" error={touched ? errors.w ?? undefined : undefined} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Height (cm)</label>
            <Input type="number" min={0} value={h} onChange={e => setH(e.target.value)} placeholder="20" error={touched ? errors.h ?? undefined : undefined} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Low Stock Threshold</label>
          <Input type="number" min={0} step={1} value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="5" error={touched ? errors.threshold ?? undefined : undefined} />
          <p className="text-[11px] text-slate-400 mt-1">Alert will show when available stock falls at or below this number.</p>
        </div>

        {!isNew && (
          <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-[#292929]"
            />
            Active (uncheck to hide it from new shipments)
          </label>
        )}

        {isNew && (
          <div className="rounded-xl border border-[#F21624]/30 bg-[#FEF9EC] p-3.5 space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#C81320]">
              Opening Stock
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Quantity (pcs)</label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={openingQty}
                  onChange={e => setOpeningQty(e.target.value)}
                  placeholder="e.g. 100"
                  data-testid="carton-opening-qty"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Unit Price (PKR)</label>
                <Input
                  type="number"
                  min={0}
                  value={openingCost}
                  onChange={e => setOpeningCost(e.target.value)}
                  placeholder="e.g. 85"
                  data-testid="carton-opening-cost"
                  error={touched ? errors.cost ?? undefined : undefined}
                />
              </div>
            </div>
            {qtyInvalid ? (
              <p className="text-[11px] font-semibold text-red-600">Quantity must be a whole number (0 or more).</p>
            ) : (
              <p className="text-[11px] text-slate-500">
                {qtyNum > 0
                  ? `Recorded as "Stock Received": ${qtyNum} pcs${costNum > 0 ? ` × PKR ${costNum.toLocaleString()} = PKR ${(qtyNum * costNum).toLocaleString()}` : ''}.`
                  : 'Leave empty if there is no stock yet — you can add it later with "Record Movement".'}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Add Movement Modal ──────────────────────────────────────────────────────
interface MoveModalProps {
  open: boolean;
  onClose: () => void;
  cartonTypes: CartonType[];
  preselectedTypeId?: number;
  getStock: (cartonTypeId: number) => number;
  onSave: (m: Omit<CartonMovement, 'id' | 'createdAt'>) => void;
}
const OUTGOING: MovementType[] = ['USED', 'ADJUSTMENT_OUT'];

const MoveModal: React.FC<MoveModalProps> = ({ open, onClose, cartonTypes, preselectedTypeId, getStock, onSave }) => {
  const [typeId, setTypeId] = useState(String(preselectedTypeId ?? (cartonTypes[0]?.id ?? '')));
  const [movType, setMovType] = useState<MovementType>('RECEIVED');
  const [qty, setQty] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayLocal());

  React.useEffect(() => {
    if (open) {
      setTypeId(String(preselectedTypeId ?? (cartonTypes[0]?.id ?? '')));
      setMovType('RECEIVED');
      setQty('');
      setUnitCost('');
      setNote('');
      setDate(todayLocal());
    }
  }, [open, preselectedTypeId, cartonTypes]);

  const [touched, setTouched] = useState(false);
  React.useEffect(() => { if (open) setTouched(false); }, [open]);

  const qtyNum = Number(qty);
  const available = typeId ? getStock(Number(typeId)) : 0;
  const isOut = OUTGOING.includes(movType);
  const todayStr = todayLocal();
  const errors = {
    type: !typeId ? 'Select a carton type' : null,
    qty: qty.trim() === ''
      ? 'Quantity is required'
      : !Number.isInteger(qtyNum) || qtyNum <= 0
      ? 'Quantity must be a whole number greater than 0'
      : isOut && qtyNum > available
      ? `Only ${available} pcs available — cannot take out ${qtyNum}`
      : null,
    date: !date ? 'Date is required' : date > todayStr ? 'Date cannot be in the future' : null,
    cost: unitCost !== '' && (!Number.isFinite(Number(unitCost)) || Number(unitCost) < 0)
      ? 'Unit cost cannot be negative'
      : null,
  };
  const firstError = Object.values(errors).find(Boolean);

  const handleSave = () => {
    setTouched(true);
    if (firstError) {
      toast.error(firstError);
      return;
    }
    onSave({
      cartonTypeId: Number(typeId),
      date,
      movementType: movType,
      quantity: Number(qty),
      unitCost: movType === 'RECEIVED' && unitCost ? Number(unitCost) : null,
      note: note.trim() || undefined,
      createdBy: 'admin',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={open} onClose={onClose}
      title="Record Movement"
      subtitle="Append-only: every movement is permanently recorded"
      size="sm"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={cartonTypes.length === 0}>Save</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {cartonTypes.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Create a carton type first — there is nothing to record a movement against yet.
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Carton Type <span className="text-red-500">*</span></label>
          <Select value={typeId} onChange={e => setTypeId(e.target.value)}>
            {cartonTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          {typeId && (
            <p className="text-[11px] text-slate-500 mt-1">Available now: <strong>{formatNum(available)}</strong> pcs</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Movement Type <span className="text-red-500">*</span></label>
            <Select value={movType} onChange={e => setMovType(e.target.value as MovementType)}>
              {(Object.entries(MOVEMENT_LABELS) as [MovementType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Date <span className="text-red-500">*</span></label>
            <Input type="date" max={todayStr} value={date} onChange={e => setDate(e.target.value)} error={touched ? errors.date ?? undefined : undefined} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Quantity <span className="text-red-500">*</span></label>
            <Input type="number" min={1} step={1} value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 50" error={touched ? errors.qty ?? undefined : undefined} />
          </div>
          {movType === 'RECEIVED' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Unit Cost (PKR)</label>
              <Input type="number" min={0} value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="e.g. 85" error={touched ? errors.cost ?? undefined : undefined} />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Note</label>
          <Input value={note} maxLength={200} onChange={e => setNote(e.target.value)} placeholder="Optional remark..." />
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const CartonsPage: React.FC = () => {
  const {
    cartonTypes, stockSummary, lowStockCount, loading,
    addType, editType, deleteType, addMovement, movementsForType, getStock,
  } = useCartonsController();
  const [deleteTarget, setDeleteTarget] = useState<CartonType | null>(null);

  const [search, setSearch] = useState('');
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CartonType | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [movePreset, setMovePreset] = useState<number | undefined>();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredTypes = useMemo(() => {
    const q = search.toLowerCase();
    return cartonTypes.filter(t =>
      !q || t.name.toLowerCase().includes(q)
    );
  }, [cartonTypes, search]);

  const totalStock = stockSummary.reduce((s, r) => s + r.stock, 0);
  const totalIn = stockSummary.reduce((s, r) => s + r.totalIn, 0);
  const totalOut = stockSummary.reduce((s, r) => s + r.totalOut, 0);
  const [auditOpen, setAuditOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-[#292929] border-t-[#F21624] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Box className="w-7 h-7 text-[#F21624]" />
            Cartons & Boxes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Inventory stock tracker — append-only movement ledger</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAuditOpen(true)} icon={<History className="w-4 h-4" />}>
  Audit Log
</Button>
          <Button variant="secondary" size="sm" onClick={() => { setMovePreset(undefined); setMoveModalOpen(true); }} icon={<ArrowDown className="w-4 h-4" />}>
            Record Movement
          </Button>
          <Button variant="gold" size="sm" onClick={() => { setEditTarget(null); setTypeModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
            New Carton Type
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Stock Available', value: formatNum(totalStock), icon: Package, color: 'text-[#292929]', bg: 'bg-[#292929]/5 border-[#292929]/10' },
          { label: 'Total In (All Time)', value: formatNum(totalIn), icon: ArrowDown, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Total Out (All Time)', value: formatNum(totalOut), icon: ArrowUp, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Low Stock Alerts', value: String(lowStockCount), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-card border ${bg} p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className={`text-xl font-black ${color}`}>{value}</div>
              <div className="text-[11px] font-semibold text-slate-500 leading-tight">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Input
            placeholder="Search carton types..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <BarChart2 className="w-4 h-4" />
          {filteredTypes.length} types
        </div>
      </div>

      {/* Carton Type Cards */}
      <div className="space-y-3">
        {filteredTypes.length === 0 ? (
          <div className="bg-white rounded-card border border-slate-200/80 p-16 text-center">
            <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No carton types yet</p>
          </div>
        ) : (
          filteredTypes.map(type => {
            const row = stockSummary.find(r => r.cartonTypeId === type.id);
            const stock = row?.stock ?? 0;
            const isLow = row?.isLow ?? false;
            const isExpanded = expandedId === type.id;
            const typeMovements = isExpanded ? movementsForType(type.id) : [];

            return (
              <div key={type.id} className={`bg-white rounded-card border shadow-card overflow-hidden transition-all ${isLow ? 'border-red-300' : 'border-slate-200/80'}`}>
                {/* Header Row */}
                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-3 p-3 sm:p-4">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : type.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer flex-shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#292929]/5 border border-[#292929]/10 flex items-center justify-center flex-shrink-0">
                    <Box className="w-5 h-5 text-[#292929]" />
                  </div>

                  {/* Name & Dimensions */}
                  <div className="flex-1 min-w-[140px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">{type.name}</span>
                      {isLow && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-extrabold">
                          <AlertTriangle className="w-3 h-3" /> LOW STOCK
                        </span>
                      )}
                      {!type.isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">INACTIVE</span>
                      )}
                    </div>
                    {(type.lengthCm || type.widthCm || type.heightCm) && (
                      <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {type.lengthCm}×{type.widthCm}×{type.heightCm} cm
                      </div>
                    )}
                  </div>

                  {/* Stock badges */}
                  <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-6 text-center w-full lg:w-auto order-last lg:order-none pt-3 lg:pt-0 border-t border-slate-100 lg:border-0">
                    <div>
                      <div className={`text-xl font-black ${isLow ? 'text-red-600' : 'text-[#292929]'}`}>{formatNum(stock)}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Available</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-emerald-600">{formatNum(row?.totalIn ?? 0)}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Total In</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-blue-600">{formatNum(row?.totalOut ?? 0)}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Total Out</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-500">{type.lowStockThreshold}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">Alert at</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto lg:ml-0">
                    <button
                      onClick={() => { setMovePreset(type.id); setMoveModalOpen(true); }}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 border border-emerald-200 cursor-pointer transition-colors"
                      title="Record movement"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditTarget(type); setTypeModalOpen(true); }}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                      title="Edit type"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(type)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer transition-colors"
                      title="Delete type"
                      aria-label={`Delete ${type.name}`}
                      data-testid={`carton-delete-btn-${type.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Movement History (Expandable) */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                    <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                      Movement History ({typeMovements.length} records)
                    </div>
                    {typeMovements.length === 0 ? (
                      <p className="text-xs text-slate-400 font-medium py-4 text-center">No movements recorded yet</p>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {typeMovements.map(m => (
                          <div key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-white rounded-xl border border-slate-200/80 px-3 py-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${MOVEMENT_COLORS[m.movementType]}`}>
                              {MOVEMENT_LABELS[m.movementType]}
                            </span>
                            <span className="text-xs font-bold text-slate-600">{formatNum(m.quantity)} pcs</span>
                            <span className="text-[11px] text-slate-400 font-semibold">{formatDate(m.date)}</span>
                            {m.note && <span className="text-[11px] text-slate-500 break-words flex-1 min-w-[100px]">{m.note}</span>}
                            {m.unitCost && (
                              <span className="text-[11px] font-semibold text-[#F21624] ml-auto">PKR {formatNum(m.unitCost)}/pc</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <TypeModal
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        initial={editTarget}
        existingNames={cartonTypes.map(t => ({ id: t.id, name: t.name }))}
        onSave={data => {
          if (editTarget) {
            editType(editTarget.id, data);
          } else {
            addType(data);
          }
        }}
      />
      <MoveModal
        open={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        cartonTypes={cartonTypes}
        preselectedTypeId={movePreset}
        getStock={getStock}
        onSave={addMovement}
      />

      <AuditLogModal isOpen={auditOpen} onClose={() => setAuditOpen(false)} title="Cartons Audit Log" module="Cartons" />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void deleteType(deleteTarget.id);
        }}
        title="Delete Carton Type"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}" permanently? Its stock movement history will also be deleted. Box types already used in shipments cannot be deleted — mark them inactive instead. This cannot be undone.`
            : ''
        }
        confirmText="Yes, delete"
      />
    </div>
  );
};
