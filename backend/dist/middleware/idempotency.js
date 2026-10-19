"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeOldIdempotencyKeys = purgeOldIdempotencyKeys;
exports.idempotency = idempotency;
const client_1 = require("@prisma/client");
const client_2 = require("../prisma/client");
async function purgeOldIdempotencyKeys() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    try {
        await client_2.prisma.idempotencyKey.deleteMany({
            where: { createdAt: { lt: sevenDaysAgo } }
        });
    }
    catch (err) {
        console.error('Failed to purge old idempotency keys:', err);
    }
}
// Purge old keys at startup and every 6 hours
purgeOldIdempotencyKeys();
setInterval(purgeOldIdempotencyKeys, 6 * 60 * 60 * 1000);
async function idempotency(req, res, next) {
    if (req.method === 'GET') {
        return next();
    }
    const clientId = req.headers['x-client-id'];
    if (!clientId) {
        return next();
    }
    // Skip auth routes (login responses contain JWT tokens)
    if (req.originalUrl.startsWith('/api/v1/auth') || req.path.startsWith('/auth')) {
        return next();
    }
    try {
        // 1. Reserve the key before running the handler
        await client_2.prisma.idempotencyKey.create({
            data: {
                key: clientId,
                path: req.originalUrl,
                body: client_1.Prisma.JsonNull,
            },
        });
    }
    catch (err) {
        if (err?.code === 'P2002' || (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
            // Key already exists in database
            const existing = await client_2.prisma.idempotencyKey.findUnique({
                where: { key: clientId },
            });
            if (!existing || existing.body === null || existing.body === client_1.Prisma.JsonNull) {
                // Still being processed
                return res.status(409).json({ success: false, message: 'Request is still being processed' });
            }
            // Replay stored response
            const stored = existing.body;
            if (stored && typeof stored === 'object' && stored._is204NoContent) {
                return res.status(204).send();
            }
            return res.status(200).json(stored);
        }
        return next(err);
    }
    // Reservation succeeded: attach hooks to store response on 2xx or delete key on error
    let handled = false;
    let responseBody = null;
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const finalize = async () => {
        if (handled)
            return;
        handled = true;
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const is204 = res.statusCode === 204;
            const bodyToSave = is204 ? { _is204NoContent: true } : (responseBody ?? {});
            try {
                await client_2.prisma.idempotencyKey.update({
                    where: { key: clientId },
                    data: { body: bodyToSave },
                });
            }
            catch (e) {
                console.error('Failed to update idempotency key:', e);
            }
        }
        else {
            // On error (4xx, 5xx), release (delete) the key
            try {
                await client_2.prisma.idempotencyKey.delete({
                    where: { key: clientId },
                });
            }
            catch (e) {
                // key might already be deleted
            }
        }
    };
    res.json = (body) => {
        responseBody = body;
        finalize();
        return originalJson(body);
    };
    res.send = (body) => {
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
//# sourceMappingURL=idempotency.js.map