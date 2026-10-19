"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weightProformaRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const weightProforma_schema_1 = require("./weightProforma.schema");
const weightProforma_service_1 = require("./weightProforma.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.weightProformaRouter = router;
router.use(auth_1.authenticate);
const readPerms = (0, auth_1.requireAnyPermission)('weightproforma', 'shipments', 'ledger', 'alerts', 'reports');
router.get('/', readPerms, async (req, res) => {
    const search = req.query.search;
    (0, response_1.ok)(res, await (0, weightProforma_service_1.listWeightProformas)(search));
});
router.get('/:id', readPerms, async (req, res) => {
    (0, response_1.ok)(res, await (0, weightProforma_service_1.getWeightProforma)(parseInt(req.params.id, 10)));
});
router.post('/', (0, auth_1.requirePermission)('weightproforma'), (0, validate_1.validate)(weightProforma_schema_1.weightProformaSchema), async (req, res) => {
    (0, response_1.created)(res, await (0, weightProforma_service_1.createWeightProforma)(req.body));
});
const handleUpdate = async (req, res) => {
    (0, response_1.ok)(res, await (0, weightProforma_service_1.updateWeightProforma)(parseInt(req.params.id, 10), req.body));
};
router.put('/:id', (0, auth_1.requirePermission)('weightproforma'), (0, validate_1.validate)(weightProforma_schema_1.updateWeightProformaSchema), handleUpdate);
router.patch('/:id', (0, auth_1.requirePermission)('weightproforma'), (0, validate_1.validate)(weightProforma_schema_1.updateWeightProformaSchema), handleUpdate);
router.delete('/:id', (0, auth_1.requirePermission)('weightproforma'), async (req, res) => {
    await (0, weightProforma_service_1.deleteWeightProforma)(parseInt(req.params.id, 10));
    (0, response_1.noContent)(res);
});
//# sourceMappingURL=weightProforma.router.js.map