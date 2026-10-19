import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PAGE_TITLES } from '@/utils/constants';
import { PageKey, User } from '@/models/types';
import { formatDate } from '@/utils/formatters';
import { RotateCcw, MapPin, Menu, User as UserIcon, LogOut } from 'lucide-react';

interface TopBarProps {
  currentUser: User | null;
  onResetDemoData: () => void;
  onLogout: () => void;
  onMobileMenuOpen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  onResetDemoData,
  onLogout,
  onMobileMenuOpen,
}) => {
  const location = useLocation();
  const path = location.pathname.replace('/', '') as PageKey | 'invoices';
  const pageMeta = PAGE_TITLES[path] || {
    title: 'Qadir Cargo Service',
    sub: 'QCS International · Freight & Courier Management',
  };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-black text-[#292929] tracking-tight leading-tight truncate">
            {pageMeta.title}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1 tracking-tight hidden sm:block">
            {pageMeta.sub}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Date Pill */}
        <div className="mono hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-600 shadow-2xs">
          <span>{formatDate(new Date().toISOString())}</span>
        </div>

        {/* Region Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] rounded-full text-xs font-extrabold shadow-2xs">
          <MapPin className="w-3.5 h-3.5 text-[#F21624]" />
          <span>Pakistan &bull; PKR</span>
        </div>

        {/* User / Action Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
            data-testid="user-menu-btn"
          >
            <div className="w-7 h-7 rounded-lg bg-[#292929] text-[#F21624] font-bold text-xs flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 hidden sm:inline">
              {currentUser?.name || 'Account'}
            </span>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn"
              onClick={() => setMenuOpen(false)}
            >
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-400">@{currentUser?.username}</p>
              </div>

              {/* <button
                onClick={onResetDemoData}
                data-testid="reset-demo-data-btn"
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Reset Demo Data</span>
              </button> */}

              <button
                onClick={onLogout}
                className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-100"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
