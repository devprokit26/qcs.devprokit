import React, { useState } from 'react';
import { useUsersController } from '@/controllers/useUsersController';
import { Button } from '../components/common/Button';
import { UserModal } from '../components/users/UserModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { User, PageKey } from '@/models/types';
import { initials, formatDate } from '@/utils/formatters';
import { ASSIGNABLE_PAGE_KEYS } from '@/utils/constants';
import { Plus, Edit2, Trash2, Shield, UserCheck } from 'lucide-react';

const PAGE_LABELS: Record<PageKey, string> = {
  dashboard: 'Dashboard',
  shipments: 'Shipments',
  weightproforma: 'Weight Proforma',
  ledger: 'Ledger',
  alerts: 'Alerts',
  reports: 'Reports',
  cartons: 'Cartons & Boxes',
  expenses: 'Daily Expenses',
  'users-management': 'User Mgmt',
  'invoice-proforma': 'Invoice Proforma'
};

export const UsersPage: React.FC = () => {
  const { users, currentUser, createUser, updateUser, deleteUser } = useUsersController();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Accounts</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Create staff accounts and choose exactly which pages each team member can access
          </p>
        </div>

        <Button
          variant="gold"
          onClick={handleOpenAdd}
          icon={<Plus className="w-4 h-4" />}
          data-testid="add-user-btn"
        >
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-card border border-slate-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 select-none">
              <tr>
                <th className="py-3.5 px-4 font-bold text-slate-600 uppercase tracking-wider">User</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 uppercase tracking-wider">Username</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 uppercase tracking-wider">Page Access</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="py-3.5 px-4 font-bold text-slate-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const isProtectedAdmin = !!u.protected;
                // 'users-management' is admin-only, so it is never listed as a granted page
                const grantedPages: PageKey[] = u.permissions.filter(p => p !== 'users-management');
                const isFullAccess = ASSIGNABLE_PAGE_KEYS.every(k => grantedPages.includes(k));
                const isCurrent = u.id === currentUser?.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#292929] to-[#3D3D3D] text-[#F21624] font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-[#F21624]/30 shadow-xs">
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isProtectedAdmin && (
                              <span
                                className="p-0.5 rounded text-amber-600 bg-amber-50"
                                title="Default protected administrator"
                              >
                                <Shield className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                            {isProtectedAdmin ? 'Default System Admin' : 'Staff Account'}
                            {isCurrent && ' (Current Session)'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 mono font-bold text-blue-700">
                      @{u.username}
                    </td>

                    <td className="py-3 px-4">
                      {isFullAccess ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          Full Access (All Pages)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {grantedPages.map(p => (
                            <span
                              key={p}
                              className="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-700"
                            >
                              {PAGE_LABELS[p] || p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          icon={<Edit2 className="w-3.5 h-3.5" />}
                          data-testid={`edit-user-${u.id}`}
                        >
                          Edit
                        </Button>

                        {!isProtectedAdmin && !isCurrent && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteId(u.id)}
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            data-testid={`delete-user-${u.id}`}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userToEdit={editingUser}
        onSave={async data => {
          if (editingUser) {
            await updateUser(editingUser.id, data);
          } else {
            await createUser(data);
          }
        }}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) deleteUser(deleteId);
        }}
        title="Delete User Account"
        message="Are you sure you want to remove this staff account? They will immediately lose access to this ERP."
      />
    </div>
  );
};
