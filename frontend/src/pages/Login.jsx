// src/pages/Login.jsx — Medical Blue & White Clinical Staff Authentication
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
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-3">
          <img
            src="/logo.png"
            alt="MediPulse AI Logo"
            className="w-12 h-12 rounded-xl object-cover shadow-sm border border-[#DFE6EE] bg-white p-0.5"
          />
          <span className="text-2xl font-bold text-[#173A5E] tracking-tight">
            MediPulse <span className="text-[#2F78C8] font-semibold">AI</span>
          </span>
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-[#172B3A]">
          Hospital Automation & AI Care Portal
        </h1>
        <p className="mt-1 text-center text-sm text-[#617181]">
          Sign in to manage appointments, AI triage, and patient communications
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-[#DFE6EE] py-8 px-6 shadow-sm rounded-xl sm:px-10">
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 bg-[#FDECEC] border border-[#B42318]/30 rounded-lg p-3.5 flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 text-[#B42318] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-[#B42318] font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="staff-email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#172B3A] mb-1.5"
              >
                Staff Email Address
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8898AA]">
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
                  placeholder="admin@hospital.test"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="staff-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#172B3A] mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8898AA]">
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

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full"
              >
                Sign In to Dashboard
              </Button>
            </div>
          </form>

          {/* Quick Credential Helper for Verification */}
          <div className="mt-6 pt-5 border-t border-[#DFE6EE]">
            <p className="text-[11px] font-semibold text-[#617181] uppercase tracking-wider mb-2.5">
              Preset Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@hospital.test')}
                className="p-2.5 text-left bg-[#F5F8FC] hover:bg-[#EDF4FB] rounded-lg border border-[#DFE6EE] text-[#172B3A] transition focus-visible:ring-2 focus-visible:ring-[#175DB5]"
              >
                <div className="font-semibold text-[#173A5E]">Admin Role</div>
                <div className="text-[#617181] truncate text-[11px] mt-0.5">admin@hospital.test</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('doctor@hospital.test')}
                className="p-2.5 text-left bg-[#F5F8FC] hover:bg-[#EDF4FB] rounded-lg border border-[#DFE6EE] text-[#172B3A] transition focus-visible:ring-2 focus-visible:ring-[#175DB5]"
              >
                <div className="font-semibold text-[#2F78C8]">Doctor Role</div>
                <div className="text-[#617181] truncate text-[11px] mt-0.5">doctor@hospital.test</div>
              </button>
            </div>
            <p className="mt-2.5 text-[11px] text-[#617181] text-center">
              Password: <span className="font-mono text-[#173A5E] font-medium">Password@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
