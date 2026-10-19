import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthController } from '@/controllers/useAuthController';
import { Logo } from '../components/layout/Logo';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Lock, User, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, loginError } = useAuthController();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    const ok = await login(username.trim(), password);
    if (ok) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#171717] via-[#292929] to-[#3D3D3D] flex items-center justify-center p-4">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00A6BD]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-white rounded-modal shadow-modal p-8 border border-slate-200/80">
        <Logo variant="full" className="mb-6" />

        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Sign In</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Enter your credentials to access the logistics management portal
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4" autoComplete="on">
          {loginError && (
            <div
              role="alert"
              data-testid="login-error"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700"
            >
              <AlertCircle className="w-4 h-4 mt-px flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="relative">
            <Input
              label="Username"
              required
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              data-testid="login-username-input"
              autoComplete="username"
            />
            <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-9 pointer-events-none" />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              data-testid="login-password-input"
              autoComplete="current-password"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-9 pointer-events-none" />
          </div>

          <Button
            type="submit"
            variant="gold"
            size="lg"
            className="w-full mt-2 font-black tracking-wider"
            loading={loading}
            data-testid="login-submit-btn"
          >
            SIGN IN
          </Button>
        </form>

      </div>
    </div>
  );
};
