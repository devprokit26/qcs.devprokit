"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listExpenseCategories = listExpenseCategories;
exports.createExpenseCategory = createExpenseCategory;
exports.deleteExpenseCategory = deleteExpenseCategory;
exports.updateExpenseCategory = updateExpenseCategory;
exports.listExpenses = listExpenses;
exports.createExpense = createExpense;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
const client_1 = require("../../prisma/client");
const serialize_1 = require("../../lib/serialize");
const httpErrors_1 = require("../../lib/httpErrors");
async function listExpenseCategories() {
    const cats = await client_1.prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
    return cats.map(serialize_1.serializeExpenseCategory);
}
async function createExpenseCategory(input) {
    const name = input.name.trim();
    const existing = await client_1.prisma.expenseCategory.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
        if (existing.isActive)
            throw (0, httpErrors_1.conflictError)(`Category "${existing.name}" already exists`);
        // Re-activate an archived category with the same name
        const revived = await client_1.prisma.expenseCategory.update({
            where: { id: existing.id },
            data: { isActive: true },
        });
        return (0, serialize_1.serializeExpenseCategory)(revived);
    }
    const cat = await client_1.prisma.expenseCategory.create({ data: { ...input, name } });
    return (0, serialize_1.serializeExpenseCategory)(cat);
}
/**
 * Deletes a category. If any expense still uses it, the category is archived
 * (isActive = false) instead so existing expenses keep their category name.
 */
async function deleteExpenseCategory(id) {
    const cat = await client_1.prisma.expenseCategory.findUnique({ where: { id } });
    if (!cat)
        throw (0, httpErrors_1.notFoundError)('Category not found');
    const used = await client_1.prisma.expense.count({ where: { categoryId: id } });
    if (used > 0) {
        await client_1.prisma.expenseCategory.update({ where: { id }, data: { isActive: false } });
        return { archived: true, usedBy: used };
    }
    await client_1.prisma.expenseCategory.delete({ where: { id } });
    return { archived: false, usedBy: 0 };
}
async function updateExpenseCategory(id, input) {
    const cat = await client_1.prisma.expenseCategory.update({ where: { id }, data: input });
    return (0, serialize_1.serializeExpenseCategory)(cat);
}
async function listExpenses() {
    const expenses = await client_1.prisma.expense.findMany({
        orderBy: { date: 'desc' },
        include: { category: true, createdBy: { select: { username: true } } }
    });
    return expenses.map(serialize_1.serializeExpense);
}
async function createExpense(input, userId) {
    const expense = await client_1.prisma.expense.create({
        data: {
            date: input.date,
            categoryId: input.categoryId,
            amount: input.amount,
            description: input.description,
            paidTo: input.paidTo,
            paymentMethod: input.paymentMethod,
            referenceNo: input.referenceNo,
            createdById: userId
        },
        include: { category: true, createdBy: { select: { username: true } } }
    });
    return (0, serialize_1.serializeExpense)(expense);
}
async function updateExpense(id, input) {
    const { paymentMethod, ...rest } = input;
    const data = { ...rest };
    if (paymentMethod)
        data.paymentMethod = paymentMethod;
    const expense = await client_1.prisma.expense.update({
        where: { id },
        data,
        include: { category: true, createdBy: { select: { username: true } } }
    });
    return (0, serialize_1.serializeExpense)(expense);
}
async function deleteExpense(id) {
    await client_1.prisma.expense.delete({ where: { id } });
}
//# sourceMappingURL=expenses.service.js.map