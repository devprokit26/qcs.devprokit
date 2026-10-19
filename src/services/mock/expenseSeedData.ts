import { ExpenseCategory, Expense } from '@/models/types';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

export const SEED_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 1, name: 'Fuel & Transport', isActive: true },
  { id: 2, name: 'Office Rent', isActive: true },
  { id: 3, name: 'Office Supplies', isActive: true },
  { id: 4, name: 'Utilities (Electricity/Internet)', isActive: true },
  { id: 5, name: 'Courier Handling', isActive: true },
  { id: 6, name: 'Salaries & Wages', isActive: true },
  { id: 7, name: 'Maintenance & Repairs', isActive: true },
  { id: 8, name: 'Miscellaneous', isActive: true },
];

export const SEED_EXPENSES: Expense[] = [
  {
    id: 1, date: today, categoryId: 1, amount: 3500, description: 'Fuel for delivery van',
    paidTo: 'PSO Pump', paymentMethod: 'Cash', createdBy: 'admin',
    createdAt: today, updatedAt: today,
  },
  {
    id: 2, date: today, categoryId: 3, amount: 1200, description: 'A4 paper & printing cartridges',
    paidTo: 'Office Planet', paymentMethod: 'Cash', createdBy: 'admin',
    createdAt: today, updatedAt: today,
  },
  {
    id: 3, date: yesterday, categoryId: 1, amount: 4200, description: 'Van fuel – long run to Lahore',
    paidTo: 'Shell Station', paymentMethod: 'Cash', createdBy: 'admin',
    createdAt: yesterday, updatedAt: yesterday,
  },
  {
    id: 4, date: yesterday, categoryId: 5, amount: 8500, description: 'TCS handling charges – October batch',
    paidTo: 'TCS Express', paymentMethod: 'Bank Transfer', referenceNo: 'TCS-2024-OCT',
    createdBy: 'admin', createdAt: yesterday, updatedAt: yesterday,
  },
  {
    id: 5, date: twoDaysAgo, categoryId: 4, amount: 12000, description: 'Monthly electricity bill',
    paidTo: 'LESCO', paymentMethod: 'Online', referenceNo: 'LESCO-0001',
    createdBy: 'admin', createdAt: twoDaysAgo, updatedAt: twoDaysAgo,
  },
  {
    id: 6, date: weekAgo, categoryId: 2, amount: 45000, description: 'Monthly office rent – October',
    paidTo: 'Landlord', paymentMethod: 'Bank Transfer', referenceNo: 'RENT-OCT-2024',
    createdBy: 'admin', createdAt: weekAgo, updatedAt: weekAgo,
  },
  {
    id: 7, date: weekAgo, categoryId: 7, amount: 6500, description: 'Generator repair & service',
    paidTo: 'Ahmed Electricals', paymentMethod: 'Cash', createdBy: 'admin',
    createdAt: weekAgo, updatedAt: weekAgo,
  },
  {
    id: 8, date: twoWeeksAgo, categoryId: 6, amount: 120000, description: 'Staff salaries – September',
    paidTo: 'Multiple Staff', paymentMethod: 'Bank Transfer', referenceNo: 'SAL-SEP-2024',
    createdBy: 'admin', createdAt: twoWeeksAgo, updatedAt: twoWeeksAgo,
  },
  {
    id: 9, date: twoWeeksAgo, categoryId: 5, amount: 5500, description: 'M&P courier handling batch',
    paidTo: 'M&P Express', paymentMethod: 'Cash', createdBy: 'admin',
    createdAt: twoWeeksAgo, updatedAt: twoWeeksAgo,
  },
  {
    id: 10, date: monthAgo, categoryId: 8, amount: 2800, description: 'Miscellaneous petty cash',
    paymentMethod: 'Cash', createdBy: 'admin',
    createdAt: monthAgo, updatedAt: monthAgo,
  },
];
