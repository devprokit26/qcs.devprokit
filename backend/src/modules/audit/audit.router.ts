import { Router, Response } from 'express';
import { PageKey } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { mapPageKeyToKey } from '../../lib/enums';
import { ok, forbidden } from '../../utils/response';

const router = Router();
router.use(authenticate);

const MODULE_PERM: Record<string, string> = {
  Ledger: 'ledger',
  Expenses: 'expenses',
  Cartons: 'cartons',
  Payments: 'ledger',
  Proforma: 'invoice-proforma',
};

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const module = String(req.query.module || '');
  const perm = MODULE_PERM[module];
  if (!perm) return ok(res, []);
  if (!req.user!.isProtected && !req.user!.permissions.includes(mapPageKeyToKey(perm) as PageKey)) {
    return forbidden(res);
  }
  const where: any = { module };
  if (req.query.entity) where.entity = String(req.query.entity);
  if (req.query.entityId) where.entityId = String(req.query.entityId);

  const rows = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true, username: true } } },
    orderBy: { id: 'desc' },
    take: 300,
  });

  ok(res, rows.map((r: any) => {
    const o = (r.oldData || {}) as Record<string, any>;
    const n = (r.newData || {}) as Record<string, any>;
    return {
      id: r.id,
      at: r.createdAt.toISOString(),
      user: r.user?.name || r.user?.username || 'system',
      action: r.action,
      module: r.module,
      entity: r.entity,
      entityId: r.entityId,
      label: r.label,
      changes: r.action === 'update'
        ? Object.keys(n).map(k => ({ field: k, from: o[k] ?? null, to: n[k] ?? null }))
        : [],
    };
  }));
});

export { router as auditRouter };