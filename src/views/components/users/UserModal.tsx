import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { checkText, firstError } from '@/utils/validation';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { User, PageKey } from '@/models/types';
import { ALL_PAGE_KEYS, ASSIGNABLE_PAGE_KEYS } from '@/utils/constants';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
  onSave: (data: Omit<User, 'id'>) => Promise<unknown>;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  onSave,
}) => {
  const isEditing = !!userToEdit;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<PageKey[]>(['dashboard']);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setUsername(userToEdit.username);
      setPassword('');
      // 'users-management' is admin-only and can never be given to a normal user
      setPermissions((userToEdit.permissions || ['dashboard']).filter(k => k !== 'users-management'));
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setPermissions(['dashboard', 'shipments']);
    }
  }, [userToEdit, isOpen]);

  const togglePermission = (key: PageKey) => {
    if (userToEdit?.protected) return; // protected admin retains all
    setPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = firstError(
      checkText(name, 'Full name', { min: 2, max: 80 }),
      checkText(username, 'Username', { min: 3, max: 40 }),
      username.trim() && !/^[a-zA-Z0-9._-]+$/.test(username.trim())
        ? 'Username can only contain letters, digits, dot, dash and underscore (no spaces)'
        : null,
      !isEditing && !password ? 'Password is required for new users' : null,
      password && password.length < 6 ? 'Password must be at least 6 characters' : null,
      permissions.length === 0 ? 'Please select at least one page permission' : null,
    );
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password ? password : userToEdit?.password,
        permissions: userToEdit?.protected
          ? [...ALL_PAGE_KEYS]
          : permissions.filter(k => k !== 'users-management'),
        protected: userToEdit?.protected || false,
        createdAt: userToEdit?.createdAt || new Date().toISOString(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const pageLabels: Record<PageKey, string> = {
    dashboard: 'Dashboard Overview',
    shipments: 'Shipment Log & Entry',
    weightproforma: 'Weight Proforma Calculations',
    ledger: 'Customer & Vendor Ledger',
    alerts: 'Payment Alerts & Reminders',
    reports: 'Analytics & Financial Reports',
    cartons: 'Cartons & Boxes Inventory',
    expenses: 'Daily Expenses Tracker',
    'users-management': 'User Accounts & Roles',
    'invoice-proforma': 'Invoice Proforma',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User Account' : 'Add New User'}
      subtitle="Configure account credentials and page-by-page access rights"
      size="md"
      dataTestId="user-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          required
          placeholder="e.g. Ahmed Khan"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Username"
            required
            disabled={userToEdit?.protected}
            placeholder="e.g. ahmed.khan"
            value={username}
            onChange={e => setUsername(e.target.value)}
            hint={userToEdit?.protected ? 'Default administrator username cannot be changed' : undefined}
          />

          <Input
            label="Password"
            type="password"
            required={!isEditing}
            placeholder={isEditing ? 'Leave blank to keep existing' : '••••••••'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            hint={isEditing ? 'Leave blank to preserve current password' : undefined}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 tracking-tight block mb-2">
            Page Access Permissions
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            {ASSIGNABLE_PAGE_KEYS.map(key => {
              const checked = permissions.includes(key);
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                    checked
                      ? 'bg-white border-[#292929]/30 text-slate-900 shadow-2xs'
                      : 'border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={userToEdit?.protected}
                    onChange={() => togglePermission(key)}
                    className="w-4 h-4 rounded text-[#292929] focus:ring-[#292929]"
                  />
                  <span>{pageLabels[key]}</span>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Unchecked pages will be hidden from this user's sidebar and blocked by route guards.
            The User Accounts page is reserved for the administrator only.
          </p>
        </div>
      </form>
    </Modal>
  );
};
