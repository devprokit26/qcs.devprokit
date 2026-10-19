import { ExpenseCategory, Expense, ExpensePaymentMethod } from '@/models/types';
import { SEED_EXPENSE_CATEGORIES, SEED_EXPENSES } from './expenseSeedData';
import { recordMockAudit } from './auditMockService';

const KEYS = {
  CATEGORIES: 'alliance_expense_categories',
  EXPENSES: 'alliance_expenses',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(p)) return fallback;
    return p;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

/* ---- Categories ---- */
export function getExpenseCategories(): ExpenseCategory[] {
  return read<ExpenseCategory[]>(KEYS.CATEGORIES, SEED_EXPENSE_CATEGORIES);
}

export function saveExpenseCategory(name: string): ExpenseCategory {
  const cats = getExpenseCategories();
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name is required');
  const existing = cats.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    if (existing.isActive) throw new Error(`Category "${existing.name}" already exists`);
    // Re-activate an archived category with the same name
    const revived = { ...existing, isActive: true };
    write(KEYS.CATEGORIES, cats.map(c => (c.id === existing.id ? revived : c)));
    return revived;
  }
  name = trimmed;
  const id = cats.length ? Math.max(...cats.map(c => c.id)) + 1 : 1;
  const cat: ExpenseCategory = { id, name, isActive: true };
  write(KEYS.CATEGORIES, [...cats, cat]);
  return cat;
}

export function updateExpenseCategory(id: number, patch: Partial<Omit<ExpenseCategory, 'id'>>): void {
  const cats = getExpenseCategories().map(c => c.id === id ? { ...c, ...patch } : c);
  write(KEYS.CATEGORIES, cats);
}

export function deleteExpenseCategory(id: number): { archived: boolean } {
  const inUse = getExpenses().some(e => e.categoryId === id);
  if (inUse) {
    updateExpenseCategory(id, { isActive: false });
    return { archived: true };
  }
  write(KEYS.CATEGORIES, getExpenseCategories().filter(c => c.id !== id));
  return { archived: false };
}

/* ---- Expenses ---- */
export function getExpenses(): Expense[] {
  return read<Expense[]>(KEYS.EXPENSES, SEED_EXPENSES);
}

export interface ExpenseInput {
  date: string;
  categoryId: number;
  amount: number;
  description: string;
  paidTo?: string;
  paymentMethod: ExpensePaymentMethod;
  referenceNo?: string;
  createdBy: string;
}

export function saveExpense(input: ExpenseInput): Expense {
  const expenses = getExpenses();
  const id = expenses.length ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
  const now = new Date().toISOString();
  const exp: Expense = { ...input, id, createdAt: now, updatedAt: now };
  write(KEYS.EXPENSES, [...expenses, exp]);
  recordMockAudit({
    user: input.createdBy || 'admin',
    action: 'create',
    module: 'Expenses',
    entity: 'Expense',
    label: `${exp.description} · PKR ${exp.amount}`,
    changes: [],
    entityId: id,
  });
  return exp;
}

export function updateExpense(id: number, patch: Partial<ExpenseInput>): Expense {
  const now = new Date().toISOString();
  const before = getExpenses().find(e => e.id === id);
  if (!before) throw new Error('Expense not found');
  const expenses = getExpenses().map(e => e.id === id ? { ...e, ...patch, updatedAt: now } : e);
  write(KEYS.EXPENSES, expenses);
  const updated = expenses.find(e => e.id === id)!;
  const changes = Object.keys(patch).flatMap(field => {
    const from = (before as unknown as Record<string, unknown>)[field];
    const to = (updated as unknown as Record<string, unknown>)[field];
    return JSON.stringify(from) === JSON.stringify(to) ? [] : [{ field, from, to }];
  });
  if (changes.length) {
    recordMockAudit({
      user: patch.createdBy || before.createdBy || 'admin',
      action: 'update',
      module: 'Expenses',
      entity: 'Expense',
      label: updated.description,
      changes,
      entityId: id,
    });
  }
  return updated;
}

export function deleteExpense(id: number): void {
  const existing = getExpenses();
  const before = existing.find(e => e.id === id);
  if (!before) throw new Error('Expense not found');
  const expenses = existing.filter(e => e.id !== id);
  write(KEYS.EXPENSES, expenses);
  recordMockAudit({
    user: before.createdBy || 'admin',
    action: 'delete',
    module: 'Expenses',
    entity: 'Expense',
    label: `${before.description} · PKR ${before.amount}`,
    changes: [],
    entityId: id,
  });
}

export function resetExpenseData(): void {
  write(KEYS.CATEGORIES, SEED_EXPENSE_CATEGORIES);
  write(KEYS.EXPENSES, SEED_EXPENSES);
}
