import { Router, Response, Request } from 'express';
import { authenticate, requirePermission, requireAnyPermission, AuthenticatedRequest } from '../../middleware/auth';
import { editPartyWithAudit } from '../audit/profileEdit';
import { validate } from '../../middleware/validate';
import { vendorSchema, updateVendorSchema } from './vendors.schema';
import { listVendors, getVendor, createVendor, updateVendor, deleteVendor } from './vendors.service';
import { ok, created, noContent } from '../../utils/response';

type IdParam = { id: string };

const router = Router();
router.use(authenticate);

const readPerms = requireAnyPermission('ledger', 'shipments');

router.get('/', readPerms, async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  ok(res, await listVendors(search));
});

router.get('/:id', readPerms, async (req: Request<IdParam>, res: Response) => {
  ok(res, await getVendor(parseInt(req.params.id, 10)));
});

router.post('/', requirePermission('ledger'), validate(vendorSchema), async (req: Request, res: Response) => {
  created(res, await createVendor(req.body));
});

const handleUpdate = async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  ok(res, await editPartyWithAudit('vendor', id, req.body, req.user!.id, () => updateVendor(id, req.body)));
};

router.put('/:id', requirePermission('ledger'), validate(updateVendorSchema), handleUpdate);
router.patch('/:id', requirePermission('ledger'), validate(updateVendorSchema), handleUpdate);

router.delete('/:id', requirePermission('ledger'), async (req: Request<IdParam>, res: Response) => {
  await deleteVendor(parseInt(req.params.id, 10));
  noContent(res);
});

export { router as vendorsRouter };
