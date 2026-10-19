import { prisma } from '../../prisma/client';
import { ExpenseCategoryInput, ExpenseInput } from './expenses.schema';
import { ExpensePaymentMethod } from '@prisma/client';
import { serializeExpense, serializeExpenseCategory } from '../../lib/serialize';
import { notFoundError, conflictError } from '../../lib/httpErrors';

export async function listExpenseCategories() {
  const cats = await prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
  return cats.map(serializeExpenseCategory);
}

export async function createExpenseCategory(input: ExpenseCategoryInput) {
  const name = input.name.trim();
  const existing = await prisma.expenseCategory.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) {
    if (existing.isActive) throw conflictError(`Category "${existing.name}" already exists`);
    // Re-activate an archived category with the same name
    const revived = await prisma.expenseCategory.update({
      where: { id: existing.id },
      data: { isActive: true },
    });
    return serializeExpenseCategory(revived);
  }
  const cat = await prisma.expenseCategory.create({ data: { ...input, name } });
  return serializeExpenseCategory(cat);
}

/**
 * Deletes a category. If any expense still uses it, the category is archived
 * (isActive = false) instead so existing expenses keep their category name.
 */
export async function deleteExpenseCategory(id: number) {
  const cat = await prisma.expenseCategory.findUnique({ where: { id } });
  if (!cat) throw notFoundError('Category not found');

  const used = await prisma.expense.count({ where: { categoryId: id } });
  if (used > 0) {
    await prisma.expenseCategory.update({ where: { id }, data: { isActive: false } });
    return { archived: true, usedBy: used };
  }
  await prisma.expenseCategory.delete({ where: { id } });
  return { archived: false, usedBy: 0 };
}

export async function updateExpenseCategory(id: number, input: Partial<ExpenseCategoryInput>) {
  const cat = await prisma.expenseCategory.update({ where: { id }, data: input });
  return serializeExpenseCategory(cat);
}

export async function listExpenses() {
  const expenses = await prisma.expense.findMany({ 
    orderBy: { date: 'desc' },
    include: { category: true, createdBy: { select: { username: true } } }
  });
  return expenses.map(serializeExpense);
}

export async function createExpense(input: ExpenseInput, userId: number) {
  const expense = await prisma.expense.create({
    data: {
      date: input.date,
      categoryId: input.categoryId,
      amount: input.amount,
      description: input.description,
      paidTo: input.paidTo,
      paymentMethod: input.paymentMethod as ExpensePaymentMethod,
      referenceNo: input.referenceNo,
      createdById: userId
    },
    include: { category: true, createdBy: { select: { username: true } } }
  });
  return serializeExpense(expense);
}

export async function updateExpense(id: number, input: Partial<ExpenseInput>) {
  const { paymentMethod, ...rest } = input;
  const data: any = { ...rest };
  if (paymentMethod) data.paymentMethod = paymentMethod as ExpensePaymentMethod;

  const expense = await prisma.expense.update({
    where: { id },
    data,
    include: { category: true, createdBy: { select: { username: true } } }
  });
  return serializeExpense(expense);
}

export async function deleteExpense(id: number) {
  await prisma.expense.delete({ where: { id } });
}
