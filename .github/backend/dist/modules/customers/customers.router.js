"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const customers_schema_1 = require("./customers.schema");
const customers_service_1 = require("./customers.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.customersRouter = router;
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.requirePermission)('ledger'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, customers_service_1.listCustomers)());
});
router.get('/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, customers_service_1.getCustomer)(parseInt(req.params.id, 10)));
    }
    catch {
        (0, response_1.notFound)(res);
    }
});
router.post('/', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(customers_schema_1.customerSchema), async (req, res) => {
    (0, response_1.created)(res, await (0, customers_service_1.createCustomer)(req.body));
});
router.put('/:id', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(customers_schema_1.customerSchema.partial()), async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, customers_service_1.updateCustomer)(parseInt(req.params.id, 10), req.body));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.delete('/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    try {
        await (0, customers_service_1.deleteCustomer)(parseInt(req.params.id, 10));
        (0, response_1.noContent)(res);
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
//# sourceMappingURL=customers.router.js.map