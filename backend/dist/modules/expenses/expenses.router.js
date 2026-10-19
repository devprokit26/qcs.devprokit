"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const client_1 = require("../../prisma/client");
const audit_1 = require("../../lib/audit");
const expenses_audit_1 = require("./expenses.audit");
const expenses_schema_1 = require("./expenses.schema");
const expenses_service_1 = require("./expenses.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.expensesRouter = router;
router.use(auth_1.authenticate);
router.get('/categories', (0, auth_1.requirePermission)('expenses'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, expenses_service_1.listExpenseCategories)());
});
router.post('/categories', (0, auth_1.requirePermission)('expenses'), (0, validate_1.validate)(expenses_schema_1.expenseCategorySchema), async (req, res) => {
    (0, response_1.created)(res, await (0, expenses_service_1.createExpenseCategory)(req.body));
});
const handleUpdateCategory = async (req, res) => {
    (0, response_1.ok)(res, await (0, expenses_service_1.updateExpenseCategory)(parseInt(req.params.id, 10), req.body));
};
router.put('/categories/:id', (0, auth_1.requirePermission)('expenses'), (0, validate_1.validate)(expenses_schema_1.expenseCategorySchema.partial()), handleUpdateCategory);
router.patch('/categories/:id', (0, auth_1.requirePermission)('expenses'), (0, validate_1.validate)(expenses_schema_1.expenseCategorySchema.partial()), handleUpdateCategory);
router.delete('/categories/:id', (0, auth_1.requirePermission)('expenses'), async (req, res) => {
    (0, response_1.ok)(res, await (0, expenses_service_1.deleteExpenseCategory)(parseInt(req.params.id, 10)));
});
router.get('/', (0, auth_1.requirePermission)('expenses'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, expenses_service_1.listExpenses)());
});
router.post('/', (0, auth_1.requirePermission)('expenses'), (0, validate_1.validate)(expenses_schema_1.expenseSchema), async (req, res) => {
    const exp = await (0, expenses_service_1.createExpense)(req.body, req.user.id);
    await (0, audit_1.writeAudit)(client_1.prisma, {
        userId: req.user.id, action: 'create', module: 'Expenses', entity: 'Expense', entityId: exp.id,
        label: `${exp.description} · PKR ${exp.amount}`,
    });
    (0, response_1.created)(res, exp);
});
const handleUpdateExpense = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const before = await (0, expenses_audit_1.snapshotExpense)(id);
    const result = await (0, expenses_service_1.updateExpense)(id, req.body);
    const after = await (0, expenses_audit_1.snapshotExpense)(id);
    const changes = before && after ? (0, audit_1.diffObjects)(before, after) : {};
    if (Object.keys(changes).length) {
        await (0, audit_1.writeAudit)(client_1.prisma, {
            userId: req.user.id, action: 'update', module: 'Expenses', entity: 'Expense', entityId: id,
            label: after?.description, changes,
        });
    }
    (0, response_1.ok)(res, result);
};
router.put('/:id', (0, auth_1.requirePermission)('expenses'), (0, validate_1.validate)(expenses_schema_1.updateExpenseSchema), handleUpdateExpense);
router.patch('/:id', (0, auth_1.requirePermission)('expenses'), (0, validate_1.validate)(expenses_schema_1.updateExpenseSchema), handleUpdateExpense);
router.delete('/:id', (0, auth_1.requirePermission)('expenses'), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const before = await (0, expenses_audit_1.snapshotExpense)(id);
    await (0, expenses_service_1.deleteExpense)(id);
    await (0, audit_1.writeAudit)(client_1.prisma, {
        userId: req.user.id, action: 'delete', module: 'Expenses', entity: 'Expense', entityId: id,
        label: before ? `${before.description} · PKR ${before.amount}` : '', snapshot: before ?? undefined,
    });
    (0, response_1.noContent)(res);
});
//# sourceMappingURL=expenses.router.js.map