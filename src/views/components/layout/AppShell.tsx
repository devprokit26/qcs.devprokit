import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuthController } from '@/controllers/useAuthController';
import { useAlertsController } from '@/controllers/useAlertsController';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { X, WifiOff, RefreshCw } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const { currentUser, logout, resetDemoData } = useAuthController();
  const { totalCount: overdueCount } = useAlertsController();
  const { isOnline, pendingCount } = useConnectionStatus();

  // Bumped after offline changes are synced. It is used as the key of the page
  // below, so the current page is rebuilt and loads the freshly saved data.
  const [syncVersion, setSyncVersion] = useState(0);
  useEffect(() => {
    const onSynced = () => setSyncVersion(v => v + 1);
    window.addEventListener('alince:sync-complete', onSynced);
    return () => window.removeEventListener('alince:sync-complete', onSynced);
  }, []);

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentUser={currentUser}
          onLogout={logout}
          overdueAlertCount={overdueCount}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-[280px] h-full bg-white relative animate-slideRight"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileDrawerOpen(false)}
              currentUser={currentUser}
              onLogout={logout}
              overdueAlertCount={overdueCount}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-250 ${
          sidebarCollapsed ? 'lg:pl-[80px]' : 'lg:pl-[260px]'
        }`}
      >
        <TopBar
          currentUser={currentUser}
          onResetDemoData={resetDemoData}
          onLogout={logout}
          onMobileMenuOpen={() => setMobileDrawerOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-[1560px] w-full mx-auto relative pb-20">
          <Outlet key={syncVersion} />
        </main>
      </div>

      {/* Offline / pending-sync banner */}
      {(!isOnline || pendingCount > 0) && (
        <div className="no-print fixed bottom-0 left-0 right-0 z-[60] bg-amber-50 border-t border-amber-200 px-3 py-2.5 shadow-lg flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            {isOnline ? <RefreshCw className="w-4 h-4 animate-spin" /> : <WifiOff className="w-4 h-4" />}
          </div>
          <div className="text-xs sm:text-sm text-amber-800 min-w-0">
            {isOnline ? (
              <>
                <strong className="font-semibold">Syncing…</strong>{' '}
                {pendingCount} saved change{pendingCount > 1 ? 's are' : ' is'} being sent to the server.
              </>
            ) : (
              <>
                <strong className="font-semibold block sm:inline">You are offline.</strong>{' '}
                Changes are saved on this device and will sync automatically when the connection returns
                {pendingCount > 0 ? ` (${pendingCount} waiting)` : ''}.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
