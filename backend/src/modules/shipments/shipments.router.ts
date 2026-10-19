import { Router, Response, Request } from 'express';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { shipmentSchema, updateShipmentSchema } from './shipments.schema';
import {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
} from './shipments.service';
import { ok, created, noContent } from '../../utils/response';

type IdParam = { id: string };

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('shipments'), async (req: Request, res: Response) => {
  const { search, status, range, from, to } = req.query;
  const filter = {
    search: search as string | undefined,
    status: status as string | undefined,
    range: range as any,
    from: from as string | undefined,
    to: to as string | undefined,
  };
  ok(res, await listShipments(filter));
});

router.get('/:id', requirePermission('shipments'), async (req: Request<IdParam>, res: Response) => {
  ok(res, await getShipment(parseInt(req.params.id, 10)));
});

router.post(
  '/',
  requirePermission('shipments'),
  validate(shipmentSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const result = await createShipment(req.body, req.user!.username);
    created(res, { ...result.shipment, warning: result.warning });
  }
);

router.put(
  '/:id',
  requirePermission('shipments'),
  validate(updateShipmentSchema),
  async (req: Request<IdParam> & AuthenticatedRequest, res: Response) => {
    const result = await updateShipment(
      parseInt(req.params.id, 10),
      req.body,
      req.user!.username
    );
    ok(res, { ...result.shipment, warning: result.warning });
  }
);

router.patch('/:id/status', requirePermission('shipments'), async (req: Request<IdParam> & AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  ok(res, await updateShipmentStatus(parseInt(req.params.id, 10), status, req.user!.username));
});

router.delete('/:id', requirePermission('shipments'), async (req: Request<IdParam>, res: Response) => {
  await deleteShipment(parseInt(req.params.id, 10));
  noContent(res);
});

export { router as shipmentsRouter };
