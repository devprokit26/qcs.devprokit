"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proformaRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const proforma_schema_1 = require("./proforma.schema");
const proforma_service_1 = require("./proforma.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.proformaRouter = router;
router.use(auth_1.authenticate);
const perm = (0, auth_1.requirePermission)('invoice-proforma');
router.get('/', perm, async (_req, res) => (0, response_1.ok)(res, await (0, proforma_service_1.listProformas)()));
router.get('/available-shipments', perm, async (_req, res) => (0, response_1.ok)(res, await (0, proforma_service_1.listAvailableShipments)()));
router.post('/', perm, (0, validate_1.validate)(proforma_schema_1.proformaSchema), async (req, res) => {
    (0, response_1.created)(res, await (0, proforma_service_1.createProforma)(req.body, { id: req.user.id, username: req.user.username }));
});
const upd = async (req, res) => (0, response_1.ok)(res, await (0, proforma_service_1.updateProforma)(parseInt(req.params.id, 10), req.body, req.user.id));
router.put('/:id', perm, (0, validate_1.validate)(proforma_schema_1.updateProformaSchema), upd);
router.patch('/:id', perm, (0, validate_1.validate)(proforma_schema_1.updateProformaSchema), upd);
router.delete('/:id', perm, async (req, res) => {
    (0, response_1.ok)(res, await (0, proforma_service_1.deleteProforma)(parseInt(req.params.id, 10), req.user.id));
});
//# sourceMappingURL=proforma.router.js.map