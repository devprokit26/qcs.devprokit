import { Router, Response, Request } from 'express';
import { authenticate, requirePermission, AuthenticatedRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { prisma } from '../../prisma/client';
import { writeAudit, diffObjects } from '../../lib/audit';
import { snapshotExpense } from './expenses.audit';
import { expenseSchema, updateExpenseSchema, expenseCategorySchema } from './expenses.schema';
import {
  listExpenses,
  listExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  createExpense,
  updateExpense,
  deleteExpense,
} from './expenses.service';
import { ok, created, noContent } from '../../utils/response';

type IdParam = { id: string };

const router = Router();
router.use(authenticate);

router.get('/categories', requirePermission('expenses'), async (_req, res: Response) => {
  ok(res, await listExpenseCategories());
});

router.post('/categories', requirePermission('expenses'), validate(expenseCategorySchema), async (req: Request, res: Response) => {
  created(res, await createExpenseCategory(req.body));
});

const handleUpdateCategory = async (req: Request<IdParam>, res: Response) => {
  ok(res, await updateExpenseCategory(parseInt(req.params.id, 10), req.body));
};

router.put('/categories/:id', requirePermission('expenses'), validate(expenseCategorySchema.partial()), handleUpdateCategory);
router.patch('/categories/:id', requirePermission('expenses'), validate(expenseCategorySchema.partial()), handleUpdateCategory);

router.delete('/categories/:id', requirePermission('expenses'), async (req: Request<IdParam>, res: Response) => {
  ok(res, await deleteExpenseCategory(parseInt(req.params.id, 10)));
});

router.get('/', requirePermission('expenses'), async (_req, res: Response) => {
  ok(res, await listExpenses());
});

router.post('/', requirePermission('expenses'), validate(expenseSchema), async (req: AuthenticatedRequest, res: Response) => {
  const exp: any = await createExpense(req.body, req.user!.id);
  await writeAudit(prisma, {
    userId: req.user!.id, action: 'create', module: 'Expenses', entity: 'Expense', entityId: exp.id,
    label: `${exp.description} · PKR ${exp.amount}`,
  });
  created(res, exp);
});

const handleUpdateExpense = async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const before = await snapshotExpense(id);
  const result = await updateExpense(id, req.body);
  const after = await snapshotExpense(id);
  const changes = before && after ? diffObjects(before, after) : {};
  if (Object.keys(changes).length) {
    await writeAudit(prisma, {
      userId: req.user!.id, action: 'update', module: 'Expenses', entity: 'Expense', entityId: id,
      label: after?.description, changes,
    });
  }
  ok(res, result);
};

router.put('/:id', requirePermission('expenses'), validate(updateExpenseSchema), handleUpdateExpense);
router.patch('/:id', requirePermission('expenses'), validate(updateExpenseSchema), handleUpdateExpense);

router.delete('/:id', requirePermission('expenses'), async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const before = await snapshotExpense(id);
  await deleteExpense(id);
  await writeAudit(prisma, {
    userId: req.user!.id, action: 'delete', module: 'Expenses', entity: 'Expense', entityId: id,
    label: before ? `${before.description} · PKR ${before.amount}` : '', snapshot: before ?? undefined,
  });
  noContent(res);
});

export { router as expensesRouter };