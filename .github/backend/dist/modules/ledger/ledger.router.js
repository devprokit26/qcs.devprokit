"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const ledger_service_1 = require("./ledger.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.ledgerRouter = router;
router.use(auth_1.authenticate);
router.use((0, auth_1.requirePermission)('ledger'));
router.get('/customer/:id', async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, ledger_service_1.getCustomerLedger)(parseInt(req.params.id, 10)));
    }
    catch {
        (0, response_1.notFound)(res);
    }
});
router.get('/vendor/:id', async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, ledger_service_1.getVendorLedger)(parseInt(req.params.id, 10)));
    }
    catch {
        (0, response_1.notFound)(res);
    }
});
//# sourceMappingURL=ledger.router.js.map