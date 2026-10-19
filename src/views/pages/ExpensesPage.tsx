import React, { useState } from 'react';
import {
  Receipt, Plus, Search, Filter, Trash2, Edit2, Calendar,
  TrendingDown, Wallet, DollarSign, BarChart2, Tag, X, Settings2,History,
} from 'lucide-react';
import { AuditLogModal } from '@/views/components/common/AuditLogModal';
import { useExpensesController } from '@/controllers/useExpensesController';
import { Expense, ExpenseCategory, ExpensePaymentMethod } from '@/models/types';
import { ExpenseInput } from '@/services/api/expenseInterface';
import { useAuthController } from '@/controllers/useAuthController';
import { formatNum } from '@/utils/formatters';
import { Button } from '@/views/components/common/Button';
import { Input } from '@/views/components/common/Input';
import { Select } from '@/views/components/common/Select';
import { Modal } from '@/views/components/common/Modal';
import { todayLocal } from '@/utils/dates';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PAYMENT_METHODS: ExpensePaymentMethod[] = ['Cash', 'Bank Transfer', 'Online', 'Easypaisa', 'JazzCash'];

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatPKR(n: number) {
  return 'PKR ' + formatNum(n);
}

// ─── Expense Form Modal ───────────────────────────────────────────────────────
interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  initial?: Expense | null;
  onSave: (input: ExpenseInput) => void;
  onUpdate?: (id: number, patch: Partial<ExpenseInput>) => void;
  createdBy?: string;
}
const ExpenseModal: React.FC<ExpenseModalProps> = ({
  open, onClose, categories, initial, onSave, onUpdate, createdBy = 'admin',
}) => {
  const today = todayLocal();
  const [date, setDate] = useState(initial?.date ?? today);
  const firstActiveId = categories.find(c => c.isActive)?.id ?? '';
  const [categoryId, setCategoryId] = useState(String(initial?.categoryId ?? firstActiveId));
  const [amount, setAmount] = useState(String(initial?.amount ?? ''));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [paidTo, setPaidTo] = useState(initial?.paidTo ?? '');
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(initial?.paymentMethod ?? 'Cash');
  const [referenceNo, setReferenceNo] = useState(initial?.referenceNo ?? '');

  React.useEffect(() => {
    if (open) {
      setDate(initial?.date ?? today);
      setCategoryId(String(initial?.categoryId ?? (categories.find(c => c.isActive)?.id ?? '')));
      setAmount(String(initial?.amount ?? ''));
      setDescription(initial?.description ?? '');
      setPaidTo(initial?.paidTo ?? '');
      setPaymentMethod(initial?.paymentMethod ?? 'Cash');
      setReferenceNo(initial?.referenceNo ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const isValid = amount && Number(amount) > 0 && description.trim() && categoryId;

  const handleSave = () => {
    const input: ExpenseInput = {
      date, categoryId: Number(categoryId), amount: Number(amount),
      description: description.trim(), paidTo: paidTo.trim() || undefined,
      paymentMethod, referenceNo: referenceNo.trim() || undefined, createdBy,
    };
    if (initial && onUpdate) {
      onUpdate(initial.id, input);
    } else {
      onSave(input);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={open} onClose={onClose}
      title={initial ? 'Edit Expense' : 'Record Expense'}
      subtitle="Track operating costs and daily expenses"
      size="sm"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!isValid}>
            {initial ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Date <span className="text-red-500">*</span></label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Amount (PKR) <span className="text-red-500">*</span></label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 3500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Category <span className="text-red-500">*</span></label>
          <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            {categories.length === 0 && <option value="">No categories — add one first</option>}
            {categories
              .filter(c => c.isActive || String(c.id) === categoryId)
              .map(c => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (archived)'}</option>)}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Description <span className="text-red-500">*</span></label>
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the expense" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Paid To</label>
            <Input value={paidTo} onChange={e => setPaidTo(e.target.value)} placeholder="Vendor / person name" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Payment Method</label>
            <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as ExpensePaymentMethod)}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Reference No.</label>
          <Input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} placeholder="Receipt / voucher number (optional)" />
        </div>
      </div>
    </Modal>
  );
};

// ─── Category Manager Modal ──────────────────────────────────────────────────
interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  usage: Record<number, number>;
  onAdd: (name: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onRestore: (id: number) => void;
}
const CategoryManagerModal: React.FC<CategoryManagerProps> = ({
  open, onClose, categories, usage, onAdd, onDelete, onRestore,
}) => {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  React.useEffect(() => {
    if (open) { setName(''); setConfirmId(null); }
  }, [open]);

  const active = categories.filter(c => c.isActive);
  const archived = categories.filter(c => !c.isActive);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    const ok = await onAdd(trimmed);
    setBusy(false);
    if (ok) setName('');
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Expense Categories"
      subtitle="Add new categories or delete ones you no longer use"
      size="sm"
      footer={<Button variant="secondary" size="sm" onClick={onClose}>Done</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <Input
            label="New Category"
            placeholder="e.g. Salaries, Internet, Packing Material"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            data-testid="new-category-input"
          />
          <Button
            variant="primary" size="md" onClick={handleAdd}
            disabled={!name.trim()} loading={busy}
            icon={<Plus className="w-4 h-4" />}
            data-testid="add-category-btn"
          >
            Add
          </Button>
        </div>

        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Active ({active.length})
          </div>
          {active.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No categories yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {active.map(c => (
                <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 min-w-0">
                    <Tag className="w-3.5 h-3.5 text-[#F21624] flex-shrink-0" />
                    <span className="truncate">{c.name}</span>
                    {usage[c.id] ? (
                      <span className="text-[10.5px] text-slate-400 font-bold whitespace-nowrap">
                        {usage[c.id]} expense{usage[c.id] > 1 ? 's' : ''}
                      </span>
                    ) : null}
                  </span>
                  {confirmId === c.id ? (
                    <span className="flex items-center gap-1">
                      <Button variant="danger" size="sm" onClick={async () => { await onDelete(c.id); setConfirmId(null); }}>
                        Confirm
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setConfirmId(null)}>No</Button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(c.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                      title="Delete category"
                      data-testid={`delete-category-${c.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-slate-400 mt-2 leading-snug">
            A category that is already used by expenses is archived (hidden from new entries) instead of
            deleted, so old records keep their category name.
          </p>
        </div>

        {archived.length > 0 && (
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Archived ({archived.length})
            </div>
            <ul className="divide-y divide-slate-100 border border-dashed border-slate-200 rounded-xl">
              {archived.map(c => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm text-slate-500">
                  <span className="truncate">{c.name}</span>
                  <Button variant="secondary" size="sm" onClick={() => onRestore(c.id)}>Restore</Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ExpensesPage: React.FC = () => {
  const {
    expenses, categories, filtered, loading, filter,
    todayTotal, weekTotal, monthTotal, categoryTotals,
    setFilter, addExpense, editExpense, removeExpense,
    addCategory, removeCategory, toggleCategory,
  } = useExpensesController();
  const { currentUser } = useAuthController();
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const categoryUsage = React.useMemo(() => {
    const m: Record<number, number> = {};
    expenses.forEach(e => { m[e.categoryId] = (m[e.categoryId] || 0) + 1; });
    return m;
  }, [expenses]);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name ?? '—';

  const [auditOpen, setAuditOpen] = useState(false);
const [auditId, setAuditId] = useState<number | undefined>();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-[#292929] border-t-[#F21624] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-[#F21624]" />
            Daily Expenses
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Track and manage operating costs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
<Button variant="secondary" size="sm" icon={<History className="w-4 h-4" />}
  onClick={() => { setAuditId(undefined); setAuditOpen(true); }}>
  Audit Log
</Button>

          <Button
            variant="secondary" size="sm"
            onClick={() => setCategoryModalOpen(true)}
            icon={<Settings2 className="w-4 h-4" />}
            data-testid="manage-categories-btn"
          >
            Categories
          </Button>
          <Button
            variant="gold" size="sm"
            onClick={() => { setEditTarget(null); setExpenseModalOpen(true); }}
            icon={<Plus className="w-4 h-4" />}
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Today's Total",
            value: formatPKR(todayTotal),
            icon: Calendar,
            color: 'text-[#292929]',
            bg: 'bg-[#292929]/5 border-[#292929]/10',
            highlight: true,
          },
          {
            label: 'This Week',
            value: formatPKR(weekTotal),
            icon: TrendingDown,
            color: 'text-amber-600',
            bg: 'bg-amber-50 border-amber-200',
          },
          {
            label: 'This Month',
            value: formatPKR(monthTotal),
            icon: Wallet,
            color: 'text-red-600',
            bg: 'bg-red-50 border-red-200',
          },
        ].map(({ label, value, icon: Icon, color, bg, highlight }) => (
          <div key={label} className={`rounded-card border ${bg} p-5 ${highlight ? 'ring-2 ring-[#292929]/20' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{label}</div>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-white rounded-card border border-slate-200/80 shadow-card p-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Breakdown by Category (all-time)
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryTotals)
              .sort(([, a], [, b]) => b - a)
              .map(([catId, total]) => (
                <div key={catId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                  <Tag className="w-3 h-3 text-[#F21624]" />
                  {getCategoryName(Number(catId))}
                  <span className="text-slate-500 font-semibold">— {formatPKR(total)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Search description, paid to, reference..."
              value={filter.search}
              onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
              className="pl-9"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>
          <Button
            variant="secondary" size="sm"
            onClick={() => setShowFilters(x => !x)}
            icon={<Filter className="w-4 h-4" />}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          {(filter.categoryId !== '' || filter.dateFrom || filter.dateTo) && (
            <Button
              variant="ghost" size="sm"
              onClick={() => setFilter(() => ({ search: filter.search, categoryId: '', dateFrom: '', dateTo: '' }))}
              icon={<X className="w-4 h-4" />}
            >
              Clear
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
              <Select
                value={String(filter.categoryId)}
                onChange={e => setFilter(p => ({ ...p, categoryId: e.target.value ? Number(e.target.value) : '' }))}
              >
                <option value="">All Categories</option>
                {categories.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">From Date</label>
              <Input type="date" value={filter.dateFrom} onChange={e => setFilter(p => ({ ...p, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">To Date</label>
              <Input type="date" value={filter.dateTo} onChange={e => setFilter(p => ({ ...p, dateTo: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No expenses found</p>
            <p className="text-xs text-slate-300 mt-1">Click &quot;Record Expense&quot; to add one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-4 py-3">Date</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-4 py-3">Category</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-4 py-3">Description</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-4 py-3 hidden md:table-cell">Paid To</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-4 py-3 hidden md:table-cell">Method</th>
                  <th className="text-right text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-4 py-3">Amount</th>
                  <th className="px-4 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-slate-600 text-xs whitespace-nowrap">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F21624]/10 text-[#C81320] text-[10.5px] font-extrabold">
                        <Tag className="w-3 h-3" />
                        {getCategoryName(exp.categoryId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px] truncate">{exp.description}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{exp.paidTo || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-bold">{exp.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-red-600 whitespace-nowrap">{formatPKR(exp.amount)}</td>
                    <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
  <button title="Edit" onClick={() => { setEditTarget(exp); setExpenseModalOpen(true); }}
    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer">
    <Edit2 className="w-3.5 h-3.5" />
  </button>
  <button title="History" onClick={() => { setAuditId(exp.id); setAuditOpen(true); }}
    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer">
    <History className="w-3.5 h-3.5" />
  </button>
  <button title="Delete" onClick={() => setDeleteId(exp.id)}
    className="p-1.5 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50 cursor-pointer">
    <Trash2 className="w-3.5 h-3.5" />
  </button>
</div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    Total ({filtered.length} records)
                  </td>
                  <td className="px-4 py-3 text-right font-black text-red-600">
                    {formatPKR(filtered.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Expense"
        subtitle="This action cannot be undone"
        size="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={() => { if (deleteId) { removeExpense(deleteId); setDeleteId(null); } }}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">Are you sure you want to delete this expense record?</p>
      </Modal>

      {/* Expense Form Modal */}
      <ExpenseModal
        open={expenseModalOpen}
        onClose={() => { setExpenseModalOpen(false); setEditTarget(null); }}
        categories={categories}
        initial={editTarget}
        onSave={addExpense}
        onUpdate={editExpense}
        createdBy={currentUser?.username || 'admin'}
      />

      {/* Category Manager */}
      <CategoryManagerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        usage={categoryUsage}
        onAdd={addCategory}
        onDelete={removeCategory}
        onRestore={id => toggleCategory(id, true)}
      />

      <AuditLogModal isOpen={auditOpen} onClose={() => setAuditOpen(false)}
  title={auditId ? 'Expense History' : 'Expenses Audit Log'} module="Expenses"
  entity={auditId ? 'Expense' : undefined} entityId={auditId} />
    </div>
  );
};
