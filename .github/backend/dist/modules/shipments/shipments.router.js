"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipmentsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const shipments_schema_1 = require("./shipments.schema");
const shipments_service_1 = require("./shipments.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.shipmentsRouter = router;
router.use(auth_1.authenticate);
router.get('/', (0, auth_1.requirePermission)('shipments'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, shipments_service_1.listShipments)());
});
router.get('/:id', (0, auth_1.requirePermission)('shipments'), async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, shipments_service_1.getShipment)(parseInt(req.params.id, 10)));
    }
    catch {
        (0, response_1.notFound)(res);
    }
});
router.post('/', (0, auth_1.requirePermission)('shipments'), (0, validate_1.validate)(shipments_schema_1.shipmentSchema), async (req, res) => {
    try {
        const shipment = await (0, shipments_service_1.createShipment)(req.body, req.user.username);
        (0, response_1.created)(res, shipment);
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.put('/:id', (0, auth_1.requirePermission)('shipments'), (0, validate_1.validate)(shipments_schema_1.shipmentSchema.partial()), async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, shipments_service_1.updateShipment)(parseInt(req.params.id, 10), req.body, req.user.username));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.patch('/:id/status', (0, auth_1.requirePermission)('shipments'), async (req, res) => {
    try {
        const { status } = req.body;
        (0, response_1.ok)(res, await (0, shipments_service_1.updateShipmentStatus)(parseInt(req.params.id, 10), status));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.delete('/:id', (0, auth_1.requirePermission)('shipments'), async (req, res) => {
    try {
        await (0, shipments_service_1.deleteShipment)(parseInt(req.params.id, 10));
        (0, response_1.noContent)(res);
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
//# sourceMappingURL=shipments.router.js.map