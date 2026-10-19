"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listExpenseCategories = listExpenseCategories;
exports.listExpenses = listExpenses;
exports.createExpense = createExpense;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
const client_1 = require("../../prisma/client");
async function listExpenseCategories() {
    return client_1.prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
}
async function listExpenses() {
    return client_1.prisma.expense.findMany({
        orderBy: { date: 'desc' },
        include: { category: true, createdBy: { select: { username: true } } }
    });
}
async function createExpense(input, userId) {
    return client_1.prisma.expense.create({
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
        include: { category: true }
    });
}
async function updateExpense(id, input) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { paymentMethod, ...rest } = input;
    const data = { ...rest };
    if (paymentMethod)
        data.paymentMethod = paymentMethod;
    return client_1.prisma.expense.update({
        where: { id },
        data,
        include: { category: true }
    });
}
async function deleteExpense(id) {
    await client_1.prisma.expense.delete({ where: { id } });
}
//# sourceMappingURL=expenses.service.js.map