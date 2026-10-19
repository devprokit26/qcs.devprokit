import { Router, Request, Response } from 'express';
import { authenticate, requireAnyPermission } from '../../middleware/auth';
import { ok } from '../../utils/response';
import {
  getAnalyticsSummary,
  getRevenueCostTrend,
  getStatusDistribution,
  getServiceDistribution,
  getCourierReport,
  getDestinationReport,
  getCustomerReport,
  getCreditWarnings,
} from './reports.service';

const router = Router();
router.use(authenticate);
router.use(requireAnyPermission('dashboard', 'reports', 'alerts'));

router.get('/analytics', async (_req: Request, res: Response) => {
  ok(res, await getAnalyticsSummary());
});

router.get('/trend', async (req: Request, res: Response) => {
  const days = Math.min(Math.max(parseInt(String(req.query.days ?? '7'), 10) || 7, 1), 365);
  ok(res, await getRevenueCostTrend(days));
});

router.get('/status-distribution', async (_req: Request, res: Response) => {
  ok(res, await getStatusDistribution());
});

router.get('/service-distribution', async (_req: Request, res: Response) => {
  ok(res, await getServiceDistribution());
});

router.get('/couriers', async (_req: Request, res: Response) => {
  ok(res, await getCourierReport());
});

router.get('/destinations', async (_req: Request, res: Response) => {
  ok(res, await getDestinationReport());
});

router.get('/customers', async (_req: Request, res: Response) => {
  ok(res, await getCustomerReport());
});

router.get('/credit-warnings', async (_req: Request, res: Response) => {
  ok(res, await getCreditWarnings());
});

export { router as reportsRouter };
