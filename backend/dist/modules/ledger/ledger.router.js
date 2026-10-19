"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const ledger_schema_1 = require("./ledger.schema");
const ledger_service_1 = require("./ledger.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.ledgerRouter = router;
router.use(auth_1.authenticate);
const readPerms = (0, auth_1.requireAnyPermission)('ledger', 'alerts');
router.get('/customer/:id', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, ledger_service_1.getCustomerLedger)(parseInt(req.params.id, 10)));
});
router.get('/vendor/:id', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, ledger_service_1.getVendorLedger)(parseInt(req.params.id, 10)));
});
router.get('/customer/:id/aging', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, ledger_service_1.getCustomerAging)(parseInt(req.params.id, 10)));
});
router.get('/vendor/:id/aging', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, ledger_service_1.getVendorAging)(parseInt(req.params.id, 10)));
});
router.post('/customer/:id', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(ledger_schema_1.createLedgerEntrySchema), async (req, res) => {
    (0, response_1.created)(res, await (0, ledger_service_1.addCustomerTransaction)(parseInt(req.params.id, 10), req.body));
});
router.post('/vendor/:id', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(ledger_schema_1.createLedgerEntrySchema), async (req, res) => {
    (0, response_1.created)(res, await (0, ledger_service_1.addVendorTransaction)(parseInt(req.params.id, 10), req.body));
});
//# sourceMappingURL=ledger.router.js.map