import { Router, Response } from 'express';
import { prisma } from '../../prisma/client';
import { ok, serverError } from '../../utils/response';

const router = Router();

router.get('/', async (_req, res: Response) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    ok(res, { status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    serverError(res, 'Database connection failed');
  }
});

export { router as healthRouter };
