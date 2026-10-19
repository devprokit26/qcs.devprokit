import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/views/components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="bg-white rounded-modal shadow-card p-12 max-w-md w-full text-center border border-slate-200">
        <FileQuestion className="w-16 h-16 text-slate-300 mx-auto mb-6" />
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">404</h1>
        <p className="text-slate-600 font-semibold mb-8">
          The page you are looking for doesn't exist or you don't have permission to access it.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
