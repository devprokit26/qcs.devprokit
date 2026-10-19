"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const vendors_schema_1 = require("./vendors.schema");
const vendors_service_1 = require("./vendors.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.vendorsRouter = router;
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.requirePermission)('ledger'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, vendors_service_1.listVendors)());
});
router.get('/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, vendors_service_1.getVendor)(parseInt(req.params.id, 10)));
    }
    catch {
        (0, response_1.notFound)(res);
    }
});
router.post('/', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(vendors_schema_1.vendorSchema), async (req, res) => {
    (0, response_1.created)(res, await (0, vendors_service_1.createVendor)(req.body));
});
router.put('/:id', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(vendors_schema_1.vendorSchema.partial()), async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, vendors_service_1.updateVendor)(parseInt(req.params.id, 10), req.body));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.delete('/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    try {
        await (0, vendors_service_1.deleteVendor)(parseInt(req.params.id, 10));
        (0, response_1.noContent)(res);
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
//# sourceMappingURL=vendors.router.js.map