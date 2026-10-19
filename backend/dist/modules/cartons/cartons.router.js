"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartonsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const client_1 = require("../../prisma/client");
const cartons_schema_1 = require("./cartons.schema");
const cartons_service_1 = require("./cartons.service");
const response_1 = require("../../utils/response");
const serialize_1 = require("../../lib/serialize");
const audit_1 = require("../../lib/audit");
const router = (0, express_1.Router)();
exports.cartonsRouter = router;
router.use(auth_1.authenticate);
const readPerms = (0, auth_1.requireAnyPermission)('cartons', 'shipments');
router.get('/types', readPerms, async (_req, res) => {
    (0, response_1.ok)(res, await (0, cartons_service_1.listCartonTypes)());
});
router.post('/types', (0, auth_1.requirePermission)('cartons'), (0, validate_1.validate)(cartons_schema_1.cartonTypeCreateSchema), async (req, res) => {
    const ct = await (0, cartons_service_1.createCartonType)(req.body, req.user.username);
    const opening = Number(req.body.openingQuantity) > 0 ? ` · opening stock ${req.body.openingQuantity}` : '';
    await (0, audit_1.writeAudit)(client_1.prisma, {
        userId: req.user.id, action: 'create', module: 'Cartons', entity: 'CartonType',
        entityId: ct.id, label: `${ct.name}${opening}`,
    });
    (0, response_1.created)(res, ct);
});
const handleUpdateType = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const before = await client_1.prisma.cartonType.findUnique({ where: { id } });
    const result = await (0, cartons_service_1.updateCartonType)(id, req.body);
    if (before) {
        const after = await client_1.prisma.cartonType.findUnique({ where: { id } });
        if (after) {
            const changes = (0, audit_1.diffObjects)((0, serialize_1.serializeCartonType)(before), (0, serialize_1.serializeCartonType)(after));
            if (Object.keys(changes).length) {
                await (0, audit_1.writeAudit)(client_1.prisma, {
                    userId: req.user.id, action: 'update', module: 'Cartons', entity: 'CartonType',
                    entityId: id, label: after.name, changes,
                });
            }
        }
    }
    (0, response_1.ok)(res, result);
};
router.put('/types/:id', (0, auth_1.requirePermission)('cartons'), (0, validate_1.validate)(cartons_schema_1.cartonTypeSchema.partial()), handleUpdateType);
router.patch('/types/:id', (0, auth_1.requirePermission)('cartons'), (0, validate_1.validate)(cartons_schema_1.cartonTypeSchema.partial()), handleUpdateType);
router.delete('/types/:id', (0, auth_1.requirePermission)('cartons'), async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
        (0, response_1.badRequest)(res, 'Invalid carton type id');
        return;
    }
    const before = await client_1.prisma.cartonType.findUnique({ where: { id } });
    await (0, cartons_service_1.deleteCartonType)(id);
    await (0, audit_1.writeAudit)(client_1.prisma, {
        userId: req.user.id, action: 'delete', module: 'Cartons', entity: 'CartonType',
        entityId: id, label: before?.name ?? '', snapshot: before ? (0, serialize_1.serializeCartonType)(before) : undefined,
    });
    (0, response_1.ok)(res, { deleted: true });
});
router.get('/movements', readPerms, async (_req, res) => {
    (0, response_1.ok)(res, await (0, cartons_service_1.listCartonMovements)());
});
router.post('/movements', (0, auth_1.requirePermission)('cartons'), (0, validate_1.validate)(cartons_schema_1.cartonMovementSchema), async (req, res) => {
    const mov = await (0, cartons_service_1.addCartonMovement)(req.body, req.user.username);
    const ct = await client_1.prisma.cartonType.findUnique({ where: { id: mov.cartonTypeId }, select: { name: true } });
    await (0, audit_1.writeAudit)(client_1.prisma, {
        userId: req.user.id, action: 'create', module: 'Cartons', entity: 'CartonMovement', entityId: mov.id,
        label: `${mov.movementType} · ${mov.quantity} × ${ct?.name ?? `type #${mov.cartonTypeId}`}`
            + (mov.shipmentId ? ` · shipment #${mov.shipmentId}` : '')
            + (mov.note ? ` · ${mov.note}` : ''),
    });
    (0, response_1.created)(res, mov);
});
//# sourceMappingURL=cartons.router.js.map