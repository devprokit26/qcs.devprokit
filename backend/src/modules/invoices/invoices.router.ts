import { Router, Request, Response } from 'express';
import { authenticate, requireAnyPermission, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { listInvoices, listBills, voidInvoice, voidReceipt, voidBillPayment } from './invoices.service';
import { ok, noContent } from '../../utils/response';

const router = Router();
router.use(authenticate);

const readPerms = requireAnyPermission('ledger', 'shipments');
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

router.get('/bills', readPerms, async (req: Request, res: Response) => {
  ok(res, await listBills({ from: str(req.query.from), to: str(req.query.to) }));
});

router.get('/', readPerms, async (req: Request, res: Response) => {
  ok(res, await listInvoices({
    search: str(req.query.search), from: str(req.query.from),
    to: str(req.query.to), status: str(req.query.status),
  }));
});

// Delete = cancel + reversal entry in the ledger (record stays visible as Cancelled)
router.delete('/receipts/:id', requirePermission('ledger'), async (req: AuthenticatedRequest, res: Response) => {
  await voidReceipt(parseInt(req.params.id as string, 10), req.user!.id);
  noContent(res);
});
router.delete('/bills/:id', requirePermission('ledger'), async (req: AuthenticatedRequest, res: Response) => {
  await voidBillPayment(parseInt(req.params.id as string, 10), req.user!.id);
  noContent(res);
});
router.delete('/:id', requirePermission('ledger'), async (req: AuthenticatedRequest, res: Response) => {
  await voidInvoice(parseInt(req.params.id as string, 10), req.user!.id);
  noContent(res);
});

export { router as invoicesRouter };