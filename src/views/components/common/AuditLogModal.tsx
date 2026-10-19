import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from './Modal';
import { Button } from './Button';
import { AuditEntry, getAuditLogs } from '@/services';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  module: string;
  entity?: string;
  entityId?: number | string;
}

const pretty = (f: string) => f.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
const show = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : Array.isArray(v) ? v.join(', ') : String(v));

export const AuditLogModal: React.FC<Props> = ({ isOpen, onClose, title, module, entity, entityId }) => {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getAuditLogs({ module, entity, entityId })
      .then(setRows)
      .catch(() => toast.error('Failed to load audit log'))
      .finally(() => setLoading(false));
  }, [isOpen, module, entity, entityId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Who changed what, and where"
      size="lg"
      footer={<Button variant="secondary" size="sm" onClick={onClose}>Close</Button>}
    >
      {loading ? (
        <div className="py-10 text-center text-xs text-slate-400">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-xs font-bold text-slate-400">No changes recorded yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['When', 'Who', 'Where', 'Change'].map(h => (
                  <th key={h} className="py-2 px-3 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => (
                <tr key={r.id} className="align-top">
                  <td className="py-2 px-3 whitespace-nowrap text-slate-600">{new Date(r.at).toLocaleString('en-PK')}</td>
                  <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{r.user}</td>
                  <td className="py-2 px-3 text-slate-700">
                    <div className="font-semibold">{r.module} › {r.entity}</div>
                    {r.label && <div className="text-slate-400">{r.label}</div>}
                  </td>
                  <td className="py-2 px-3">
                    {r.action === 'update' ? (
                      <div className="space-y-1">
                        {r.changes.map(c => (
                          <div key={c.field}>
                            <span className="font-bold text-slate-700">{pretty(c.field)}:</span>{' '}
                            <span className="text-red-600 line-through">{show(c.from)}</span>{' → '}
                            <span className="text-emerald-700 font-bold">{show(c.to)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                        {r.action === 'create' ? 'Created' : r.action === 'delete' ? 'Deleted' : 'Cancelled'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};