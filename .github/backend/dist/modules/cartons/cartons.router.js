"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartonsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const cartons_schema_1 = require("./cartons.schema");
const cartons_service_1 = require("./cartons.service");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.cartonsRouter = router;
router.use(auth_1.authenticate);
router.get('/types', (0, auth_1.requirePermission)('cartons'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, cartons_service_1.listCartonTypes)());
});
router.post('/types', (0, auth_1.requirePermission)('cartons'), (0, validate_1.validate)(cartons_schema_1.cartonTypeSchema), async (req, res) => {
    try {
        (0, response_1.created)(res, await (0, cartons_service_1.createCartonType)(req.body));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.put('/types/:id', (0, auth_1.requirePermission)('cartons'), (0, validate_1.validate)(cartons_schema_1.cartonTypeSchema.partial()), async (req, res) => {
    try {
        (0, response_1.ok)(res, await (0, cartons_service_1.updateCartonType)(parseInt(req.params.id, 10), req.body));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
router.get('/movements', (0, auth_1.requirePermission)('cartons'), async (_req, res) => {
    (0, response_1.ok)(res, await (0, cartons_service_1.listCartonMovements)());
});
router.post('/movements', (0, auth_1.requirePermission)('cartons'), (0, validate_1.validate)(cartons_schema_1.cartonMovementSchema), async (req, res) => {
    try {
        (0, response_1.created)(res, await (0, cartons_service_1.addCartonMovement)(req.body, req.user.username));
    }
    catch (err) {
        (0, response_1.badRequest)(res, err instanceof Error ? err.message : 'Failed');
    }
});
//# sourceMappingURL=cartons.router.js.map