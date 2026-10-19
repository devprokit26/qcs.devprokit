"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffObjects = diffObjects;
exports.writeAudit = writeAudit;
const SKIP = new Set(['id', 'createdAt', 'updatedAt']);
const norm = (v) => {
    if (v && typeof v === 'object' && typeof v.toNumber === 'function')
        return v.toNumber();
    return v === '' || v === undefined ? null : v;
};
/** Returns only the fields whose value changed: { field: { from, to } } */
function diffObjects(before, after) {
    const out = {};
    for (const k of Object.keys(after || {})) {
        if (SKIP.has(k))
            continue;
        const a = norm(before?.[k]);
        const b = norm(after[k]);
        if (JSON.stringify(a) !== JSON.stringify(b))
            out[k] = { from: a, to: b };
    }
    return out;
}
async function writeAudit(db, p) {
    const isUpdate = p.action === 'update';
    const ch = Object.entries(p.changes || {});
    await db.auditLog.create({
        data: {
            userId: p.userId ?? null,
            action: p.action,
            module: p.module,
            entity: p.entity,
            entityId: String(p.entityId),
            label: p.label ?? '',
            oldData: isUpdate ? Object.fromEntries(ch.map(([k, v]) => [k, v.from])) : p.snapshot ?? undefined,
            newData: isUpdate ? Object.fromEntries(ch.map(([k, v]) => [k, v.to])) : undefined,
        },
    });
}
//# sourceMappingURL=audit.js.map