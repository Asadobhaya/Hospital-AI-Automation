// src/pages/Login.jsx — Hospital Staff Authentication
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Lock, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background aesthetic glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
            <Activity className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">
            MediPulse <span className="text-primary-400 font-medium">AI</span>
          </span>
        </div>
        <h2 className="mt-4 text-center text-xl font-semibold text-slate-200">
          Hospital Automation & AI Care Portal
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Sign in to manage appointments, AI triage, and patient communications
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 bg-red-950/60 border border-red-500/50 rounded-xl p-3.5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                  placeholder="name@hospital.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Quick Credential Helper for Verification */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Preset Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@hospital.test')}
                className="p-2 text-left bg-slate-900/60 hover:bg-slate-700/50 rounded border border-slate-700 text-slate-300 transition"
              >
                <div className="font-medium text-primary-400">Admin Role</div>
                <div className="text-slate-400 truncate">admin@hospital.test</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('priya.sharma@hospital.test')}
                className="p-2 text-left bg-slate-900/60 hover:bg-slate-700/50 rounded border border-slate-700 text-slate-300 transition"
              >
                <div className="font-medium text-emerald-400">Doctor Role</div>
                <div className="text-slate-400 truncate">priya.sharma@...</div>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 text-center">
              Password: <span className="font-mono text-slate-400">Password@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
