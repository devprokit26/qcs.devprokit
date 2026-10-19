import { apiFetch } from './apiClient';

export interface AuditEntry {
  id: number;
  at: string;
  user: string;
  action: string;
  module: string;
  entity: string;
  entityId: string | null;
  label: string;
  changes: { field: string; from: unknown; to: unknown }[];
}

export async function getAuditLogs(p: { module: string; entity?: string; entityId?: string | number }) {
  const q = new URLSearchParams({ module: p.module });
  if (p.entity) q.append('entity', p.entity);
  if (p.entityId !== undefined) q.append('entityId', String(p.entityId));
  return apiFetch<AuditEntry[]>(`/audit?${q.toString()}`);
}