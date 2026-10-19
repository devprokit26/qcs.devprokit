import { Router, Response, Request } from 'express';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema } from './users.schema';
import { listUsers, getUser, createUser, updateUser, deleteUser } from './users.service';
import { ok, created, noContent } from '../../utils/response';

type IdParam = { id: string };

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', async (_req, res: Response) => {
  ok(res, await listUsers());
});

router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  ok(res, await getUser(parseInt(req.params.id, 10)));
});

router.post('/', validate(createUserSchema), async (req: Request, res: Response) => {
  created(res, await createUser(req.body));
});

const handleUpdateUser = async (req: Request<IdParam>, res: Response) => {
  ok(res, await updateUser(parseInt(req.params.id, 10), req.body));
};

router.put('/:id', validate(updateUserSchema), handleUpdateUser);
router.patch('/:id', validate(updateUserSchema), handleUpdateUser);

router.delete('/:id', async (req: Request<IdParam> & AuthenticatedRequest, res: Response) => {
  await deleteUser(parseInt(req.params.id, 10), req.user!.id);
  noContent(res);
});

export { router as usersRouter };
