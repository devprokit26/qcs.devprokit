"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expensesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const expenses_schema_1 = require("./expenses.schema");
const expenses_service_1 = require("./expenses.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.expensesRouter = router;
router.use(auth_1.authenticate);
router.get('/categories', (0, auth_1.requirePermission)('expenses'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, expenses_service_1.listExpenseCategories)());
});
router.get('/', (0, auth_1.requirePermission)('expenses'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, expenses_service_1.listExpenses)());
});
router.post('/', (0, auth_1.requirePermission)('expenses'), (0, validate_1.validate)(expenses_schema_1.expenseSchema), async (req, res) => {
    try {
        (0, response_1.created)(res, await (0, expenses_service_1.createExpense)(req.body, req.user.id));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.put('/:id', (0, auth_1.requirePermission)('expenses'), (0, validate_1.validate)(expenses_schema_1.expenseSchema.partial()), async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, expenses_service_1.updateExpense)(parseInt(req.params.id, 10), req.body));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.delete('/:id', (0, auth_1.requirePermission)('expenses'), async (req, res) => {
    try {
        await (0, expenses_service_1.deleteExpense)(parseInt(req.params.id, 10));
        (0, response_1.noContent)(res);
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
//# sourceMappingURL=expenses.router.js.map