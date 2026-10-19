import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../prisma/client';
import { unauthorized, forbidden } from '../utils/response';
import { PageKey } from '@prisma/client';
import { mapPageKeyToKey } from '../lib/enums';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    permissions: PageKey[];
    isProtected: boolean;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return unauthorized(res);

  let payload: { sub: number };
  try {
    payload = jwt.verify(token, config.jwtSecret) as unknown as { sub: number };
  } catch (err) {
    if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
      return unauthorized(res, 'Invalid or expired token');
    }
    return unauthorized(res, 'Authentication failed');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, permissions: true, isProtected: true },
    });
    if (!user) return unauthorized(res, 'User not found');
    req.user = user;
    next();
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please retry.',
    });
  }
}

export function requirePermission(page: PageKey | string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);
    if (req.user.isProtected) return next();
    const mappedPage = mapPageKeyToKey(page);
    if (!req.user.permissions.includes(mappedPage as PageKey)) return forbidden(res);
    next();
  };
}

export function requireAnyPermission(...pages: (PageKey | string)[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return unauthorized(res);
    if (req.user.isProtected) return next();
    const mappedPages = pages.map(mapPageKeyToKey);
    const hasAny = mappedPages.some(page => req.user!.permissions.includes(page as PageKey));
    if (!hasAny) return forbidden(res);
    next();
  };
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) return unauthorized(res);
  if (!req.user.isProtected) return forbidden(res, 'Admin only');
  next();
}
