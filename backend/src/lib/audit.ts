const SKIP = new Set(['id', 'createdAt', 'updatedAt']);

const norm = (v: any) => {
  if (v && typeof v === 'object' && typeof v.toNumber === 'function') return v.toNumber();
  return v === '' || v === undefined ? null : v;
};

/** Returns only the fields whose value changed: { field: { from, to } } */
export function diffObjects(before: any, after: any) {
  const out: Record<string, { from: any; to: any }> = {};
  for (const k of Object.keys(after || {})) {
    if (SKIP.has(k)) continue;
    const a = norm(before?.[k]);
    const b = norm(after[k]);
    if (JSON.stringify(a) !== JSON.stringify(b)) out[k] = { from: a, to: b };
  }
  return out;
}

export async function writeAudit(
  db: any,
  p: {
    userId?: number | null;
    action: 'create' | 'update' | 'delete' | 'void';
    module: string;
    entity: string;
    entityId: string | number;
    label?: string;
    changes?: Record<string, { from: any; to: any }>;
    snapshot?: any;
  }
) {
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