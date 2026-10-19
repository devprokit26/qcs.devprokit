"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const profileEdit_1 = require("../audit/profileEdit");
const validate_1 = require("../../middleware/validate");
const customers_schema_1 = require("./customers.schema");
const customers_service_1 = require("./customers.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.customersRouter = router;
router.use(auth_1.authenticate);
const readPerms = (0, auth_1.requireAnyPermission)('ledger', 'shipments', 'weightproforma', 'alerts', 'reports');
router.get('/', readPerms, async (req, res) => {
    const search = req.query.search;
    (0, response_1.ok)(res, await (0, customers_service_1.listCustomers)(search));
});
router.get('/aging/all', readPerms, async (_req, res) => {
    (0, response_1.ok)(res, await (0, customers_service_1.getAllCustomersAging)());
});
router.get('/:id/aging', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, customers_service_1.getCustomerAging)(parseInt(req.params.id, 10)));
});
router.post('/:id/check-credit', readPerms, async (req, res) => {
    const amount = Number(req.body?.additionalAmount ?? req.body?.amount ?? 0);
    (0, response_1.ok)(res, await (0, customers_service_1.checkCustomerCredit)(parseInt(req.params.id, 10), amount));
});
router.get('/:id', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, customers_service_1.getCustomer)(parseInt(req.params.id, 10)));
});
router.post('/', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(customers_schema_1.customerSchema), async (req, res) => {
    (0, response_1.created)(res, await (0, customers_service_1.createCustomer)(req.body));
});
const handleUpdate = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    (0, response_1.ok)(res, await (0, profileEdit_1.editPartyWithAudit)('customer', id, req.body, req.user.id, () => (0, customers_service_1.updateCustomer)(id, req.body)));
};
router.put('/:id', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(customers_schema_1.customerSchema.partial()), handleUpdate);
router.patch('/:id', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(customers_schema_1.customerSchema.partial()), handleUpdate);
router.delete('/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    await (0, customers_service_1.deleteCustomer)(parseInt(req.params.id, 10));
    (0, response_1.noContent)(res);
});
//# sourceMappingURL=customers.router.js.map