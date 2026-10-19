import { Router, Response, Request } from 'express';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { prisma } from '../../prisma/client';
import { ok, serverError } from '../../utils/response';

const router = Router();
router.use(authenticate);

// We're consolidating dashboard/reports for simplicity here, as they often query similar stats.
// Real production logic would abstract into services, but this serves the mock endpoints.

router.get('/kpi', requirePermission('dashboard'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalShipments = await prisma.shipment.count();
    const activeCustomers = await prisma.customer.count();
    const unpaidInvoices = 0; // Mock placeholder
    const pendingShipments = await prisma.shipment.count({ where: { status: 'Pending' } });

    ok(res, {
      totalShipments,
      activeCustomers,
      unpaidInvoices,
      pendingShipments
    });
  } catch (err) {
    serverError(res, 'Failed to fetch KPIs');
  }
});

router.get('/monthly-revenue', requirePermission('dashboard'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Basic mock implementation mimicking the frontend's chart needs
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const revenue = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
    const cost = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
    
    const data = months.map((name, i) => ({
      name,
      revenue: revenue[i],
      cost: cost[i]
    }));
    
    ok(res, data);
  } catch (err) {
    serverError(res, 'Failed to fetch revenue');
  }
});

router.get('/recent-activities', requirePermission('dashboard'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // In a real app, query AuditLogs. Using mock static list for now
    const activities = [
      { id: 1, action: "Shipment #1042 created", time: "2 hours ago", user: "admin" },
      { id: 2, action: "Payment of PKR 50,000 received", time: "5 hours ago", user: "ops.tariq" }
    ];
    ok(res, activities);
  } catch (err) {
    serverError(res, 'Failed to fetch activities');
  }
});

export { router as dashboardRouter };
