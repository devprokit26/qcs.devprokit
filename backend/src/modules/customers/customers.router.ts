import { Router, Response, Request } from 'express';
import { authenticate, requirePermission, requireAnyPermission, AuthenticatedRequest } from '../../middleware/auth';
import { editPartyWithAudit } from '../audit/profileEdit';
import { validate } from '../../middleware/validate';
import { customerSchema } from './customers.schema';
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerAging,
  getAllCustomersAging,
  checkCustomerCredit,
} from './customers.service';
import { ok, created, noContent } from '../../utils/response';

type IdParam = { id: string };

const router = Router();
router.use(authenticate);

const readPerms = requireAnyPermission('ledger', 'shipments', 'weightproforma', 'alerts', 'reports');

router.get('/', readPerms, async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  ok(res, await listCustomers(search));
});

router.get('/aging/all', readPerms, async (_req: Request, res: Response) => {
  ok(res, await getAllCustomersAging());
});

router.get('/:id/aging', readPerms, async (req: Request<IdParam>, res: Response) => {
  ok(res, await getCustomerAging(parseInt(req.params.id, 10)));
});

router.post('/:id/check-credit', readPerms, async (req: Request<IdParam>, res: Response) => {
  const amount = Number(req.body?.additionalAmount ?? req.body?.amount ?? 0);
  ok(res, await checkCustomerCredit(parseInt(req.params.id, 10), amount));
});

router.get('/:id', readPerms, async (req: Request<IdParam>, res: Response) => {
  ok(res, await getCustomer(parseInt(req.params.id, 10)));
});

router.post('/', requirePermission('ledger'), validate(customerSchema), async (req: Request, res: Response) => {
  created(res, await createCustomer(req.body));
});

const handleUpdate = async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  ok(res, await editPartyWithAudit('customer', id, req.body, req.user!.id, () => updateCustomer(id, req.body)));
};

router.put('/:id', requirePermission('ledger'), validate(customerSchema.partial()), handleUpdate);
router.patch('/:id', requirePermission('ledger'), validate(customerSchema.partial()), handleUpdate);

router.delete('/:id', requirePermission('ledger'), async (req: Request<IdParam>, res: Response) => {
  await deleteCustomer(parseInt(req.params.id, 10));
  noContent(res);
});

export { router as customersRouter };
