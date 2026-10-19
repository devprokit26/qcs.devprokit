import { Expense, ExpenseCategory, ExpensePaymentMethod } from '@/models/types';

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

/** Interface for expense service — both mock and REST variants must match */
export interface IExpenseService {
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  saveExpenseCategory(name: string): Promise<ExpenseCategory>;
  updateExpenseCategory(id: number, patch: Partial<Omit<ExpenseCategory, 'id'>>): Promise<void>;
  /** Deletes a category. If expenses still use it, it is archived (hidden) instead. */
  deleteExpenseCategory(id: number): Promise<{ archived: boolean }>;
  getExpenses(): Promise<Expense[]>;
  saveExpense(input: ExpenseInput): Promise<Expense>;
  updateExpense(id: number, patch: Partial<ExpenseInput>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;
  resetExpenseData(): Promise<void>;
}
