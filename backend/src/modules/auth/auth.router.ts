import { Router, Request, Response } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { loginSchema } from './auth.schema';
import { loginService, meService, maybeRefreshToken } from './auth.service';
import { ok, badRequest, unauthorized } from '../../utils/response';
import { config } from '../../config';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await loginService(req.body);
    // Set httpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return ok(res, result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Login failed';
    return unauthorized(res, msg);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  return ok(res, { message: 'Logged out' });
});

// GET /api/v1/auth/me — sliding refresh: if token has < 2 days left, issue a new one
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await meService(req.user!.id);

    // Check if we should slide/refresh the token
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    const refresh = token ? maybeRefreshToken(token) : null;
    if (refresh) {
      res.cookie('token', refresh.token, {
        httpOnly: true,
        secure: config.isProd,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return ok(res, { ...user, freshToken: refresh.token });
    }

    return ok(res, user);
  } catch {
    return unauthorized(res);
  }
});

export { router as authRouter };
