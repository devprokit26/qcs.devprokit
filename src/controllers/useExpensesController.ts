import { useState, useCallback, useEffect, useMemo } from 'react';
import { Expense, ExpenseCategory } from '@/models/types';
import { dailyTotal, periodTotal, totalsByCategory, dailyBreakdown } from '@/models/expenses';
import { ExpenseInput } from '@/services/api/expenseInterface';
import { expenseService } from '@/services';
import toast from 'react-hot-toast';
import { todayLocal, shiftDateStr } from '@/utils/dates';

export interface ExpensesFilter {
  search: string;
  categoryId: number | '';
  dateFrom: string;
  dateTo: string;
}

export interface ExpensesState {
  expenses: Expense[];
  categories: ExpenseCategory[];
  filtered: Expense[];
  loading: boolean;
  filter: ExpensesFilter;
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  categoryTotals: Record<number, number>;
  dailyChart: Array<{ date: string; total: number }>;
}

export interface ExpensesActions {
  setFilter: (fn: (prev: ExpensesFilter) => ExpensesFilter) => void;
  addExpense: (input: ExpenseInput) => void;
  editExpense: (id: number, patch: Partial<ExpenseInput>) => void;
  removeExpense: (id: number) => void;
  addCategory: (name: string) => Promise<boolean>;
  toggleCategory: (id: number, active: boolean) => void;
  removeCategory: (id: number) => Promise<boolean>;
  resetDemo: () => void;
  refresh: () => void;
}

function isoToday() { return todayLocal(); }
function isoOffset(days: number) { return shiftDateStr(todayLocal(), -days); }

export function useExpensesController(): ExpensesState & ExpensesActions {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ExpensesFilter>({
    search: '',
    categoryId: '',
    dateFrom: '',
    dateTo: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setExpenses(await expenseService.getExpenses());
      setCategories(await expenseService.getExpenseCategories());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    if (filter.categoryId !== '') {
      list = list.filter(e => e.categoryId === Number(filter.categoryId));
    }
    if (filter.dateFrom) list = list.filter(e => e.date >= filter.dateFrom);
    if (filter.dateTo) list = list.filter(e => e.date <= filter.dateTo);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(e =>
        e.description.toLowerCase().includes(q) ||
        (e.paidTo || '').toLowerCase().includes(q) ||
        (e.referenceNo || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [expenses, filter]);

  const today = isoToday();
  const weekStart = isoOffset(6);
  const monthStart = isoOffset(29);

  const todayTotal = useMemo(() => dailyTotal(expenses, today), [expenses, today]);
  const weekTotal = useMemo(() => periodTotal(expenses, weekStart, today), [expenses, weekStart, today]);
  const monthTotal = useMemo(() => periodTotal(expenses, monthStart, today), [expenses, monthStart, today]);
  const categoryTotals = useMemo(() => totalsByCategory(expenses), [expenses]);
  const dailyChart = useMemo(() => dailyBreakdown(expenses, monthStart, today), [expenses, monthStart, today]);

  const addExpense = useCallback(async (input: ExpenseInput) => {
    try {
      await expenseService.saveExpense(input);
      toast.success('Expense recorded');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense');
    }
  }, [load]);

  const editExpense = useCallback(async (id: number, patch: Partial<ExpenseInput>) => {
    try {
      await expenseService.updateExpense(id, patch);
      toast.success('Expense updated');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update expense');
    }
  }, [load]);

  const removeExpense = useCallback(async (id: number) => {
    try {
      await expenseService.deleteExpense(id);
      toast.success('Expense deleted');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  }, [load]);

  const addCategory = useCallback(async (name: string) => {
    try {
      await expenseService.saveExpenseCategory(name);
      toast.success(`Category "${name}" added`);
      await load();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add category');
      return false;
    }
  }, [load]);

  const toggleCategory = useCallback(async (id: number, active: boolean) => {
    try {
      await expenseService.updateExpenseCategory(id, { isActive: active });
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category');
    }
  }, [load]);

  const removeCategory = useCallback(async (id: number) => {
    try {
      const name = categories.find(c => c.id === id)?.name || 'Category';
      const res = await expenseService.deleteExpenseCategory(id);
      toast.success(
        res.archived
          ? `"${name}" is used by existing expenses, so it was hidden (old records keep it)`
          : `Category "${name}" deleted`
      );
      await load();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
      return false;
    }
  }, [load, categories]);

  const resetDemo = useCallback(async () => {
    await expenseService.resetExpenseData();
    toast.success('Expense data reset');
    await load();
  }, [load]);

  return {
    expenses, categories, filtered, loading, filter,
    todayTotal, weekTotal, monthTotal, categoryTotals, dailyChart,
    setFilter, addExpense, editExpense, removeExpense,
    addCategory, toggleCategory, removeCategory, resetDemo, refresh: load,
  };
}
