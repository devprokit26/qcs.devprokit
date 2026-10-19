import { Router, Response, Request } from 'express';
import { authenticate, requirePermission, requireAnyPermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createLedgerEntrySchema } from './ledger.schema';
import {
  getCustomerLedger,
  getVendorLedger,
  addCustomerTransaction,
  addVendorTransaction,
  getCustomerAging,
  getVendorAging,
} from './ledger.service';
import { ok, created } from '../../utils/response';

type IdParam = { id: string };

const router = Router();
router.use(authenticate);

const readPerms = requireAnyPermission('ledger', 'alerts');

router.get('/customer/:id', readPerms, async (req: Request<IdParam>, res: Response) => {
  ok(res, await getCustomerLedger(parseInt(req.params.id, 10)));
});

router.get('/vendor/:id', readPerms, async (req: Request<IdParam>, res: Response) => {
  ok(res, await getVendorLedger(parseInt(req.params.id, 10)));
});

router.get('/customer/:id/aging', readPerms, async (req: Request<IdParam>, res: Response) => {
  ok(res, await getCustomerAging(parseInt(req.params.id, 10)));
});

router.get('/vendor/:id/aging', readPerms, async (req: Request<IdParam>, res: Response) => {
  ok(res, await getVendorAging(parseInt(req.params.id, 10)));
});

router.post(
  '/customer/:id',
  requirePermission('ledger'),
  validate(createLedgerEntrySchema),
  async (req: Request<IdParam>, res: Response) => {
    created(res, await addCustomerTransaction(parseInt(req.params.id, 10), req.body));
  }
);

router.post(
  '/vendor/:id',
  requirePermission('ledger'),
  validate(createLedgerEntrySchema),
  async (req: Request<IdParam>, res: Response) => {
    created(res, await addVendorTransaction(parseInt(req.params.id, 10), req.body));
  }
);

export { router as ledgerRouter };
