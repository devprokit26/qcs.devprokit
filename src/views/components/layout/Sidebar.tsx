import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Scale,
  BookOpen,
  Bell,
  BarChart3,
  Users,
  ChevronLeft,
  LogOut,
  Box,
  Receipt,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { PageKey, User } from '@/models/types';
import { Logo } from './Logo';
import { initials } from '@/utils/formatters';
import { canAccessPage } from '@/utils/permissions';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentUser: User | null;
  onLogout: () => void;
  overdueAlertCount: number;
}

interface NavItemConfig {
  /** unique id for React keys / test ids (defaults to key) */
  id?: string;
  key: PageKey;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  currentUser,
  onLogout,
  overdueAlertCount,
}) => {
  const mainNavItems: NavItemConfig[] = [
    { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { key: 'shipments', label: 'Shipments', path: '/shipments', icon: Package },
   { key: 'weightproforma', label: 'Weight Proforma', path: '/weightproforma', icon: Scale },
{ key: 'invoice-proforma', label: 'Invoice Proforma', path: '/proforma', icon: FileSpreadsheet },
{ key: 'ledger', label: 'Ledger', path: '/ledger', icon: BookOpen },
    { id: 'invoices', key: 'ledger', label: 'Payments', path: '/invoices', icon: FileText },
    {
      key: 'alerts',
      label: 'Alerts',
      path: '/alerts',
      icon: Bell,
      badge: overdueAlertCount,
    },
    { key: 'reports', label: 'Reports', path: '/reports', icon: BarChart3 },
    { key: 'cartons', label: 'Cartons', path: '/cartons', icon: Box },
    { key: 'expenses', label: 'Daily Expenses', path: '/expenses', icon: Receipt },
  ];

  const adminNavItems: NavItemConfig[] = [
    { key: 'users-management', label: 'Users', path: '/users', icon: Users },
  ];

  const hasAccess = (key: PageKey) => canAccessPage(currentUser, key);

  const visibleMainItems = mainNavItems.filter(item => hasAccess(item.key));
  const visibleAdminItems = adminNavItems.filter(item => hasAccess(item.key));

  return (
    <aside
      className={`bg-[#292929] border-r border-[#414141] transition-all duration-250 flex flex-col fixed top-0 bottom-0 left-0 z-40 select-none ${
        collapsed ? 'w-[80px]' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 px-4 flex items-center justify-between border-b border-white/10">
        {!collapsed ? (
          <Logo variant="sidebar" />
        ) : (
          <div className="mx-auto">
            <Logo variant="mark" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={`w-7 h-7 rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-transform cursor-pointer ${
            collapsed ? 'rotate-180 absolute -right-3.5 top-6 z-50 bg-[#292929] shadow-sm' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          data-testid="sidebar-toggle-btn"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Main Menu
            </div>
          )}
          <ul className="space-y-1">
            {visibleMainItems.map(item => {
              const Icon = item.icon;
              return (
                <li key={item.id ?? item.key}>
                  <NavLink
                    to={item.path}
                    data-testid={`nav-${item.id ?? item.key}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 group relative ${
                        isActive
                          ? 'bg-[#F21624] text-white shadow-md shadow-red-600/20'
                          : 'text-slate-300 hover:bg-white/10 hover:text-[#00A6BD]'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none ${
                          collapsed
                            ? 'absolute top-1 right-2 bg-red-500 text-white'
                            : 'ml-auto bg-red-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {visibleAdminItems.length > 0 && (
          <div>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                Administration
              </div>
            )}
            <ul className="space-y-1">
              {visibleAdminItems.map(item => {
                const Icon = item.icon;
                return (
                  <li key={item.id ?? item.key}>
                    <NavLink
                      to={item.path}
                      data-testid={`nav-${item.id ?? item.key}`}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 group ${
                          isActive
                            ? 'bg-[#F21624] text-white shadow-md shadow-red-600/20'
                            : 'text-slate-300 hover:bg-white/10 hover:text-[#00A6BD]'
                        } ${collapsed ? 'justify-center px-0' : ''}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-white/10 bg-[#222222]">
        <div
          className={`flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 ${
            collapsed ? 'flex-col gap-2' : ''
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#E6F9FC] text-[#008A9D] font-extrabold text-xs flex items-center justify-center flex-shrink-0 border border-[#00A6BD]/30 shadow-xs">
              {initials(currentUser?.name)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold truncate">
                  @{currentUser?.username || 'admin'}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#F21624] hover:bg-white/10 transition-colors cursor-pointer"
            title="Log out"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
