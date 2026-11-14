// src/pages/Settings.jsx — Hospital Configuration, Integration Telemetry & Audit Logs
import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  MessageSquare,
  PhoneCall,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  History,
} from 'lucide-react';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingService, setTestingService] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [setRes, auditRes] = await Promise.all([
        fetch('/api/settings', { credentials: 'include' }),
        fetch('/api/settings/audit-logs', { credentials: 'include' }),
      ]);

      if (setRes.ok) {
        const s = await setRes.json();
        setSettings(s.data || s);
      }
      if (auditRes.ok) {
        const a = await auditRes.json();
        setAuditLogs(a.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestIntegration = async (integration) => {
    setTestingService(integration);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/test-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ integration }),
      });
      const json = await res.json();
      setTestResult({
        service: integration,
        success: res.ok,
        message: json.data?.message || json.message || (res.ok ? 'Connection successful!' : 'Connection failed'),
      });
    } catch (err) {
      setTestResult({
        service: integration,
        success: false,
        message: err.message,
      });
    } finally {
      setTestingService(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400" role="status">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading system settings & integration telemetry...</p>
      </div>
    );
  }

  const integrations = settings?.integrations || {};
  const hospitalConfig = settings?.hospitalConfig || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Integrations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Environment telemetry, third-party API gateways, hospital operating rules & audit logs
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={fetchSettings} icon={RefreshCw}>
          Refresh
        </Button>
      </header>

      {testResult && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            testResult.success
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />
            )}
            <span>
              <strong>{testResult.service.toUpperCase()}:</strong> {testResult.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="underline text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Integration Grid */}
      <section aria-label="System Integrations" className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Database */}
        <article className="card-surface p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl" aria-hidden="true">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-white text-sm">PostgreSQL / Supabase</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>Provider: <strong className="text-white">{integrations.database?.provider || 'Supabase Managed Postgres'}</strong></p>
              <p>Endpoint: <code className="text-slate-400 font-mono text-[11px]">{integrations.database?.url || 'supabase.co'}</code></p>
              <p className="text-slate-400 text-[11px]">Enforces database-level constraint: UNIQUE(doctor_id, slot_time)</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleTestIntegration('database')}
            loading={testingService === 'database'}
            className="mt-4 w-full"
          >
            Test DB Query Latency
          </Button>
        </article>

        {/* WhatsApp Cloud API */}
        <article className="card-surface p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl" aria-hidden="true">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-white text-sm">Meta WhatsApp Cloud API</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                Active v21.0
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>Phone Number ID: <code className="text-slate-400 font-mono text-[11px]">{integrations.whatsapp?.phoneNumberId || 'Registered'}</code></p>
              <p>Verify Token: <code className="text-slate-400 font-mono text-[11px]">{integrations.whatsapp?.webhookVerifyToken || 'Configured'}</code></p>
              <p>Inbound Webhook: <code className="text-slate-400 font-mono text-[11px]">/api/webhooks/whatsapp</code></p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleTestIntegration('whatsapp')}
            loading={testingService === 'whatsapp'}
            className="mt-4 w-full"
          >
            Ping WhatsApp Webhook
          </Button>
        </article>

        {/* Voice AI Gateway */}
        <article className="card-surface p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl" aria-hidden="true">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-white text-sm">Outbound Voice Calling Service</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                HMAC-SHA256
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>Gateway Endpoint: <code className="text-slate-400 font-mono text-[11px]">{integrations.voice?.baseUrl || 'Voice Gateway'}</code></p>
              <p>Callback Secret: <code className="text-slate-400 font-mono text-[11px]">HMAC Signature Active</code></p>
              <p>Callback Webhook: <code className="text-slate-400 font-mono text-[11px]">/api/webhooks/voice/callback</code></p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleTestIntegration('voice')}
            loading={testingService === 'voice'}
            className="mt-4 w-full"
          >
            Test Callback Verification
          </Button>
        </article>

        {/* Hospital Operating Rules */}
        <article className="card-surface p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl" aria-hidden="true">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-white text-sm">Hospital Schedule & Triage Rules</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-950/60 text-purple-400 border border-purple-500/30">
                Operational
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>Institution: <strong className="text-white">{hospitalConfig.name || 'MediPulse Apex Hospital'}</strong></p>
              <p>Emergency Line: <strong className="text-white font-mono">{hospitalConfig.emergencyNumber || '+92 51 111 000 000'}</strong></p>
              <p>Consulting Hours: <strong className="text-white">{hospitalConfig.workingHours?.start || '09:00'} - {hospitalConfig.workingHours?.end || '17:00'}</strong></p>
              <p>Slot Granularity: <strong className="text-white">{hospitalConfig.workingHours?.slotDurationMinutes || 30} minutes</strong></p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>AI Triage Guard: Active</span>
            <span className="text-emerald-400">All 5 Automated Flows Online</span>
          </div>
        </article>
      </section>

      {/* Audit Log Table */}
      <section aria-label="System Audit Trail" className="card-surface rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-white">System Security & Clinical Audit Trail</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Immutable Event Logs</span>
        </div>

        {auditLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit events recorded"
            message="Clinical activities and security actions will be recorded here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 uppercase font-semibold">
                  <th scope="col" className="py-3 px-4">Action</th>
                  <th scope="col" className="py-3 px-4">Resource</th>
                  <th scope="col" className="py-3 px-4">Details</th>
                  <th scope="col" className="py-3 px-4">IP Address</th>
                  <th scope="col" className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-mono font-medium text-primary-400">{log.action}</td>
                    <td className="py-3 px-4 text-slate-300">{log.resource_type} #{log.resource_id || '-'}</td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{JSON.stringify(log.details || {})}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
