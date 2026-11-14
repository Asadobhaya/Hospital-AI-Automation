// src/pages/Login.jsx — Accessible Clinical Staff Authentication
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Lock, Mail, ShieldAlert } from 'lucide-react';
import Button from '../components/Button';

export default function Login() {
  const [email, setEmail] = useState('admin@hospital.test');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      let msg = 'Invalid email or password. Please try again.';
      if (typeof err === 'string') {
        msg = err;
      } else if (typeof err?.message === 'string') {
        msg = err.message;
      } else if (typeof err?.error?.message === 'string') {
        msg = err.error.message;
      } else if (err && typeof err === 'object') {
        msg = err.message || JSON.stringify(err);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail) => {
    setEmail(testEmail);
    setPassword('Password@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-3">
          <div className="w-11 h-11 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-600/30">
            <Activity className="w-6 h-6" aria-hidden="true" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            MediPulse <span className="text-primary-400 font-semibold">AI</span>
          </span>
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-slate-100">
          Hospital Automation & AI Care Portal
        </h1>
        <p className="mt-1 text-center text-sm text-slate-400">
          Sign in to manage appointments, AI triage, and patient communications
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10">
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 bg-rose-950/60 border border-rose-500/40 rounded-xl p-3.5 flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="staff-email"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Staff Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="staff-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="name@hospital.org"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="staff-password"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="staff-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full"
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Credential Helper for Verification */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Preset Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@hospital.test')}
                className="p-2.5 text-left bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-slate-300 transition focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <div className="font-semibold text-primary-400">Admin Role</div>
                <div className="text-slate-400 truncate text-[11px] mt-0.5">admin@hospital.test</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('doctor@hospital.test')}
                className="p-2.5 text-left bg-slate-950/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-slate-300 transition focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <div className="font-semibold text-emerald-400">Doctor Role</div>
                <div className="text-slate-400 truncate text-[11px] mt-0.5">doctor@hospital.test</div>
              </button>
            </div>
            <p className="mt-2.5 text-[11px] text-slate-500 text-center">
              Password: <span className="font-mono text-slate-400 font-medium">Password@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
