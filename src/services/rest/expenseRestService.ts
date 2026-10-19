/**
 * REST implementations for Expense functions.
 * The controller imports these same function names from here when VITE_USE_MOCK=false.
 * Function signatures MUST exactly match expenseMockService.ts exports.
 */
import { Expense, ExpenseCategory } from '@/models/types';
import { apiFetch } from './apiClient';

export interface ExpenseInput {
  date: string;
  categoryId: number;
  amount: number;
  description: string;
  paidTo?: string;
  paymentMethod: string;
  referenceNo?: string;
  createdBy: string;
}

/* ---- Categories ---- */

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  return apiFetch<ExpenseCategory[]>('/expenses/categories');
}

export async function saveExpenseCategory(name: string): Promise<ExpenseCategory> {
  return apiFetch<ExpenseCategory>('/expenses/categories', {
    method: 'POST',
    body: JSON.stringify({ name, isActive: true }),
  });
}

export async function updateExpenseCategory(
  id: number,
  patch: Partial<Omit<ExpenseCategory, 'id'>>
): Promise<void> {
  await apiFetch(`/expenses/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteExpenseCategory(id: number): Promise<{ archived: boolean }> {
  const res = await apiFetch<{ archived?: boolean } | null>(`/expenses/categories/${id}`, {
    method: 'DELETE',
  });
  return { archived: !!res?.archived };
}

/* ---- Expenses ---- */

export async function getExpenses(): Promise<Expense[]> {
  return apiFetch<Expense[]>('/expenses');
}

export async function saveExpense(input: ExpenseInput): Promise<Expense> {
  return apiFetch<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateExpense(id: number, patch: Partial<ExpenseInput>): Promise<Expense> {
  return apiFetch<Expense>(`/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteExpense(id: number): Promise<void> {
  await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
}

export async function resetExpenseData(): Promise<void> {
  // No-op in REST mode
  return Promise.resolve();
}
