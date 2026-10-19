"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoicesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const invoices_service_1 = require("./invoices.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.invoicesRouter = router;
router.use(auth_1.authenticate);
const readPerms = (0, auth_1.requireAnyPermission)('ledger', 'shipments');
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
router.get('/bills', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, invoices_service_1.listBills)({ from: str(req.query.from), to: str(req.query.to) }));
});
router.get('/', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, invoices_service_1.listInvoices)({
        search: str(req.query.search), from: str(req.query.from),
        to: str(req.query.to), status: str(req.query.status),
    }));
});
// Delete = cancel + reversal entry in the ledger (record stays visible as Cancelled)
router.delete('/receipts/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    await (0, invoices_service_1.voidReceipt)(parseInt(req.params.id, 10), req.user.id);
    (0, response_1.noContent)(res);
});
router.delete('/bills/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    await (0, invoices_service_1.voidBillPayment)(parseInt(req.params.id, 10), req.user.id);
    (0, response_1.noContent)(res);
});
router.delete('/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    await (0, invoices_service_1.voidInvoice)(parseInt(req.params.id, 10), req.user.id);
    (0, response_1.noContent)(res);
});
//# sourceMappingURL=invoices.router.js.map