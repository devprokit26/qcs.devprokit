import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { HttpError } from '../lib/httpErrors';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  if (res.headersSent) {
    return _next(err);
  }

  // 1. HttpError
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // 2. Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.flatten().fieldErrors,
    });
  }

  // 3. Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError || err?.code?.startsWith?.('P')) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A record with this unique field already exists.',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Record not found.',
      });
    }
    if (err.code === 'P2003') {
      return res.status(409).json({
        success: false,
        message: 'Foreign key constraint failed.',
      });
    }
  }

  // 4. CORS errors
  if (err?.message && (err.message.includes('CORS') || err.message.includes('Not allowed by CORS'))) {
    return res.status(403).json({
      success: false,
      message: 'Not allowed by CORS',
    });
  }

  // 5. Body parser 4xx errors
  if (err?.type === 'entity.parse.failed' || (typeof err?.status === 'number' && err.status >= 400 && err.status < 500)) {
    return res.status(err.status || 400).json({
      success: false,
      message: err.message || 'Invalid request body',
    });
  }

  // 6. Generic 500
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
}
