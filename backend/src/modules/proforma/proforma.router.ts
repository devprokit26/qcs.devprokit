import { Router, Response } from 'express';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { proformaSchema, updateProformaSchema } from './proforma.schema';
import { listProformas, listAvailableShipments, createProforma, updateProforma, deleteProforma } from './proforma.service';
import { ok, created } from '../../utils/response';

const router = Router();
router.use(authenticate);

const perm = requirePermission('invoice-proforma');

router.get('/', perm, async (_req, res: Response) => ok(res, await listProformas()));
router.get('/available-shipments', perm, async (_req, res: Response) => ok(res, await listAvailableShipments()));

router.post('/', perm, validate(proformaSchema), async (req: AuthenticatedRequest, res: Response) => {
  created(res, await createProforma(req.body, { id: req.user!.id, username: req.user!.username }));
});

const upd = async (req: AuthenticatedRequest, res: Response) =>
  ok(res, await updateProforma(parseInt(req.params.id as string, 10), req.body, req.user!.id));
router.put('/:id', perm, validate(updateProformaSchema), upd);
router.patch('/:id', perm, validate(updateProformaSchema), upd);

router.delete('/:id', perm, async (req: AuthenticatedRequest, res: Response) => {
  ok(res, await deleteProforma(parseInt(req.params.id as string, 10), req.user!.id));
});

export { router as proformaRouter };