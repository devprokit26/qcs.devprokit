import { Router, Response } from 'express';
import { authenticate, requirePermission, requireAnyPermission, AuthenticatedRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { prisma } from '../../prisma/client';
import { cartonTypeSchema, cartonTypeCreateSchema, cartonMovementSchema } from './cartons.schema';
import { listCartonTypes, listCartonMovements, createCartonType, updateCartonType, deleteCartonType, addCartonMovement } from './cartons.service';
import { ok, created, badRequest } from '../../utils/response';
import { serializeCartonType } from '../../lib/serialize';
import { diffObjects, writeAudit } from '../../lib/audit';

const router = Router();
router.use(authenticate);

const readPerms = requireAnyPermission('cartons', 'shipments');

router.get('/types', readPerms, async (_req, res: Response) => {
  ok(res, await listCartonTypes());
});

router.post('/types', requirePermission('cartons'), validate(cartonTypeCreateSchema), async (req: AuthenticatedRequest, res: Response) => {
  const ct: any = await createCartonType(req.body, req.user!.username);
  const opening = Number(req.body.openingQuantity) > 0 ? ` · opening stock ${req.body.openingQuantity}` : '';
  await writeAudit(prisma, {
    userId: req.user!.id, action: 'create', module: 'Cartons', entity: 'CartonType',
    entityId: ct.id, label: `${ct.name}${opening}`,
  });
  created(res, ct);
});

const handleUpdateType = async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const before = await prisma.cartonType.findUnique({ where: { id } });
  const result = await updateCartonType(id, req.body);
  if (before) {
    const after = await prisma.cartonType.findUnique({ where: { id } });
    if (after) {
      const changes = diffObjects(serializeCartonType(before), serializeCartonType(after));
      if (Object.keys(changes).length) {
        await writeAudit(prisma, {
          userId: req.user!.id, action: 'update', module: 'Cartons', entity: 'CartonType',
          entityId: id, label: after.name, changes,
        });
      }
    }
  }
  ok(res, result);
};

router.put('/types/:id', requirePermission('cartons'), validate(cartonTypeSchema.partial()), handleUpdateType);
router.patch('/types/:id', requirePermission('cartons'), validate(cartonTypeSchema.partial()), handleUpdateType);

router.delete('/types/:id', requirePermission('cartons'), async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (!Number.isInteger(id) || id <= 0) {
    badRequest(res, 'Invalid carton type id');
    return;
  }
  const before = await prisma.cartonType.findUnique({ where: { id } });
  await deleteCartonType(id);
  await writeAudit(prisma, {
    userId: req.user!.id, action: 'delete', module: 'Cartons', entity: 'CartonType',
    entityId: id, label: before?.name ?? '', snapshot: before ? serializeCartonType(before) : undefined,
  });
  ok(res, { deleted: true });
});

router.get('/movements', readPerms, async (_req, res: Response) => {
  ok(res, await listCartonMovements());
});

router.post('/movements', requirePermission('cartons'), validate(cartonMovementSchema), async (req: AuthenticatedRequest, res: Response) => {
  const mov: any = await addCartonMovement(req.body, req.user!.username);
  const ct = await prisma.cartonType.findUnique({ where: { id: mov.cartonTypeId }, select: { name: true } });
  await writeAudit(prisma, {
    userId: req.user!.id, action: 'create', module: 'Cartons', entity: 'CartonMovement', entityId: mov.id,
    label: `${mov.movementType} · ${mov.quantity} × ${ct?.name ?? `type #${mov.cartonTypeId}`}`
      + (mov.shipmentId ? ` · shipment #${mov.shipmentId}` : '')
      + (mov.note ? ` · ${mov.note}` : ''),
  });
  created(res, mov);
});

export { router as cartonsRouter };