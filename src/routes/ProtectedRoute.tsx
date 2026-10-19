import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthController } from '@/controllers/useAuthController';
import { PageKey } from '@/models/types';
import { ShieldAlert } from 'lucide-react';
import { canAccessPage } from '@/utils/permissions';

interface ProtectedRouteProps {
  pageKey?: PageKey;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ pageKey, children }) => {
  const { currentUser, isAuthenticated, loading } = useAuthController();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#292929] border-t-[#F21624] rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Qadir Cargo Service...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (pageKey && !canAccessPage(currentUser, pageKey)) {
    return (
      <div className="p-12 text-center max-w-md mx-auto my-12 bg-white rounded-modal border border-slate-200 shadow-card">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
          Your account does not have permission to view the <strong className="text-slate-800">{pageKey}</strong> module.
          Please contact an administrator if you require access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
