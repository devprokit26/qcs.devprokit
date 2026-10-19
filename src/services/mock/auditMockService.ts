import type { AuditEntry } from '../rest/auditRestService';

const AUDIT_KEY = 'alliance_mock_audit_logs';

type AuditFilter = { module: string; entity?: string; entityId?: string | number };

function readLogs(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return [];
    const rows: unknown = JSON.parse(raw);
    return Array.isArray(rows) ? rows as AuditEntry[] : [];
  } catch {
    return [];
  }
}

function writeLogs(rows: AuditEntry[]) {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(rows.slice(-1000)));
}

export async function getAuditLogs(filter: AuditFilter): Promise<AuditEntry[]> {
  return readLogs()
    .filter(row =>
      row.module === filter.module &&
      (!filter.entity || row.entity === filter.entity) &&
      (filter.entityId === undefined || row.entityId === String(filter.entityId))
    )
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 300);
}

export function recordMockAudit(entry: Omit<AuditEntry, 'id' | 'at' | 'entityId'> & {
  entityId: string | number;
}) {
  const rows = readLogs();
  const nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  rows.push({
    ...entry,
    id: nextId,
    at: new Date().toISOString(),
    entityId: String(entry.entityId),
  });
  writeLogs(rows);
}
