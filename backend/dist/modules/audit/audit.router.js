"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRouter = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const auth_1 = require("../../middleware/auth");
const enums_1 = require("../../lib/enums");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.auditRouter = router;
router.use(auth_1.authenticate);
const MODULE_PERM = {
    Ledger: 'ledger',
    Expenses: 'expenses',
    Cartons: 'cartons',
    Payments: 'ledger',
    Proforma: 'invoice-proforma',
};
router.get('/', async (req, res) => {
    const module = String(req.query.module || '');
    const perm = MODULE_PERM[module];
    if (!perm)
        return (0, response_1.ok)(res, []);
    if (!req.user.isProtected && !req.user.permissions.includes((0, enums_1.mapPageKeyToKey)(perm))) {
        return (0, response_1.forbidden)(res);
    }
    const where = { module };
    if (req.query.entity)
        where.entity = String(req.query.entity);
    if (req.query.entityId)
        where.entityId = String(req.query.entityId);
    const rows = await client_1.prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, username: true } } },
        orderBy: { id: 'desc' },
        take: 300,
    });
    (0, response_1.ok)(res, rows.map((r) => {
        const o = (r.oldData || {});
        const n = (r.newData || {});
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
//# sourceMappingURL=audit.router.js.map