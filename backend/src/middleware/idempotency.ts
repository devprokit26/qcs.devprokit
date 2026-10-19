import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';

export async function purgeOldIdempotencyKeys() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  try {
    await prisma.idempotencyKey.deleteMany({
      where: { createdAt: { lt: sevenDaysAgo } }
    });
  } catch (err) {
    console.error('Failed to purge old idempotency keys:', err);
  }
}

// Purge old keys at startup and every 6 hours
purgeOldIdempotencyKeys();
setInterval(purgeOldIdempotencyKeys, 6 * 60 * 60 * 1000);

export async function idempotency(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET') {
    return next();
  }

  const clientId = req.headers['x-client-id'] as string;
  if (!clientId) {
    return next();
  }

  // Skip auth routes (login responses contain JWT tokens)
  if (req.originalUrl.startsWith('/api/v1/auth') || req.path.startsWith('/auth')) {
    return next();
  }

  try {
    // 1. Reserve the key before running the handler
    await prisma.idempotencyKey.create({
      data: {
        key: clientId,
        path: req.originalUrl,
        body: Prisma.JsonNull,
      },
    });
  } catch (err: any) {
    if (err?.code === 'P2002' || (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
      // Key already exists in database
      const existing = await prisma.idempotencyKey.findUnique({
        where: { key: clientId },
      });

      if (!existing || existing.body === null || (existing.body as unknown) === Prisma.JsonNull) {
        // Still being processed
        return res.status(409).json({ success: false, message: 'Request is still being processed' });
      }

      // Replay stored response
      const stored = existing.body as any;
      if (stored && typeof stored === 'object' && stored._is204NoContent) {
        return res.status(204).send();
      }
      return res.status(200).json(stored);
    }
    return next(err);
  }

  // Reservation succeeded: attach hooks to store response on 2xx or delete key on error
  let handled = false;
  let responseBody: any = null;

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  const finalize = async () => {
    if (handled) return;
    handled = true;

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const is204 = res.statusCode === 204;
      const bodyToSave = is204 ? { _is204NoContent: true } : (responseBody ?? {});
      try {
        await prisma.idempotencyKey.update({
          where: { key: clientId },
          data: { body: bodyToSave },
        });
      } catch (e) {
        console.error('Failed to update idempotency key:', e);
      }
    } else {
      // On error (4xx, 5xx), release (delete) the key
      try {
        await prisma.idempotencyKey.delete({
          where: { key: clientId },
        });
      } catch (e) {
        // key might already be deleted
      }
    }
  };

  res.json = (body: any) => {
    responseBody = body;
    finalize();
    return originalJson(body);
  };

  res.send = (body?: any) => {
    if (responseBody === null && body !== undefined) {
      responseBody = body;
    }
    finalize();
    return originalSend(body);
  };

  res.on('finish', () => {
    finalize();
  });

  next();
}
