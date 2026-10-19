import { Router, Response, Request } from 'express';
import { authenticate, requirePermission, requireAnyPermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { weightProformaSchema, updateWeightProformaSchema } from './weightProforma.schema';
import {
  listWeightProformas,
  getWeightProforma,
  createWeightProforma,
  updateWeightProforma,
  deleteWeightProforma,
} from './weightProforma.service';
import { ok, created, noContent } from '../../utils/response';

type IdParam = { id: string };

const router = Router();
router.use(authenticate);

const readPerms = requireAnyPermission('weightproforma', 'shipments', 'ledger', 'alerts', 'reports');

router.get('/', readPerms, async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  ok(res, await listWeightProformas(search));
});

router.get('/:id', readPerms, async (req: Request<IdParam>, res: Response) => {
  ok(res, await getWeightProforma(parseInt(req.params.id, 10)));
});

router.post(
  '/',
  requirePermission('weightproforma'),
  validate(weightProformaSchema),
  async (req: Request, res: Response) => {
    created(res, await createWeightProforma(req.body));
  }
);

const handleUpdate = async (req: Request<IdParam>, res: Response) => {
  ok(res, await updateWeightProforma(parseInt(req.params.id, 10), req.body));
};

router.put('/:id', requirePermission('weightproforma'), validate(updateWeightProformaSchema), handleUpdate);
router.patch('/:id', requirePermission('weightproforma'), validate(updateWeightProformaSchema), handleUpdate);

router.delete('/:id', requirePermission('weightproforma'), async (req: Request<IdParam>, res: Response) => {
  await deleteWeightProforma(parseInt(req.params.id, 10));
  noContent(res);
});

export { router as weightProformaRouter };
