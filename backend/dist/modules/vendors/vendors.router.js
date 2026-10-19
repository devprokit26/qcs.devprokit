"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const profileEdit_1 = require("../audit/profileEdit");
const validate_1 = require("../../middleware/validate");
const vendors_schema_1 = require("./vendors.schema");
const vendors_service_1 = require("./vendors.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.vendorsRouter = router;
router.use(auth_1.authenticate);
const readPerms = (0, auth_1.requireAnyPermission)('ledger', 'shipments');
router.get('/', readPerms, async (req, res) => {
    const search = req.query.search;
    (0, response_1.ok)(res, await (0, vendors_service_1.listVendors)(search));
});
router.get('/:id', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, vendors_service_1.getVendor)(parseInt(req.params.id, 10)));
});
router.post('/', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(vendors_schema_1.vendorSchema), async (req, res) => {
    (0, response_1.created)(res, await (0, vendors_service_1.createVendor)(req.body));
});
const handleUpdate = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    (0, response_1.ok)(res, await (0, profileEdit_1.editPartyWithAudit)('vendor', id, req.body, req.user.id, () => (0, vendors_service_1.updateVendor)(id, req.body)));
};
router.put('/:id', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(vendors_schema_1.updateVendorSchema), handleUpdate);
router.patch('/:id', (0, auth_1.requirePermission)('ledger'), (0, validate_1.validate)(vendors_schema_1.updateVendorSchema), handleUpdate);
router.delete('/:id', (0, auth_1.requirePermission)('ledger'), async (req, res) => {
    await (0, vendors_service_1.deleteVendor)(parseInt(req.params.id, 10));
    (0, response_1.noContent)(res);
});
//# sourceMappingURL=vendors.router.js.map