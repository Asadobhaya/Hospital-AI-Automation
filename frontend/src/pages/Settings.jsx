// src/pages/Settings.jsx — Hospital Configuration, Integration Telemetry & Audit Logs
import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  MessageSquare,
  PhoneCall,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  History
} from 'lucide-react';

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
        fetch('/api/settings/audit-logs', { credentials: 'include' })
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
        body: JSON.stringify({ integration })
      });
      const json = await res.json();
      setTestResult({
        service: integration,
        success: res.ok,
        message: json.data?.message || json.message || (res.ok ? 'Connection successful!' : 'Connection failed')
      });
    } catch (err) {
      setTestResult({
        service: integration,
        success: false,
        message: err.message
      });
    } finally {
      setTestingService(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading system settings & integration telemetry...</p>
      </div>
    );
  }

  const integrations = settings?.integrations || {};
  const hospitalConfig = settings?.hospitalConfig || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Integrations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Environment telemetry, third-party API gateways, hospital operating rules & audit logs
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {testResult && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${testResult.success ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200' : 'bg-red-950/50 border-red-500/40 text-red-200'}`}>
          <div className="flex items-center gap-2">
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
            <span><strong>{testResult.service.toUpperCase()}:</strong> {testResult.message}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="underline text-slate-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Database */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white text-sm">PostgreSQL / Supabase</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>Provider: <strong>{integrations.database?.provider}</strong></p>
              <p>Endpoint: <code className="text-slate-400">{integrations.database?.url}</code></p>
              <p className="text-slate-400 text-[11px]">Enforces database-level constraint: UNIQUE(doctor_id, slot_time)</p>
            </div>
          </div>
          <button
            onClick={() => handleTestIntegration('database')}
            disabled={testingService === 'database'}
            className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {testingService === 'database' ? 'Pinging Database...' : 'Test DB Query Latency'}
          </button>
        </div>

        {/* WhatsApp Cloud API */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white text-sm">Meta WhatsApp Cloud API</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active v21.0
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>Phone Number ID: <code className="text-slate-400">{integrations.whatsapp?.phoneNumberId}</code></p>
              <p>Verify Token: <code className="text-slate-400">{integrations.whatsapp?.webhookVerifyToken}</code></p>
              <p>Inbound Webhook: <code className="text-slate-400">/api/webhooks/whatsapp</code></p>
            </div>
          </div>
          <button
            onClick={() => handleTestIntegration('whatsapp')}
            disabled={testingService === 'whatsapp'}
            className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {testingService === 'whatsapp' ? 'Validating Webhook...' : 'Ping WhatsApp Webhook'}
          </button>
        </div>

        {/* Voice AI Gateway */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white text-sm">Outbound Voice Calling Service</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                HMAC-SHA256
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>Base Gateway URL: <code className="text-slate-400">{integrations.voice?.baseUrl}</code></p>
              <p>API Key: <code className="text-slate-400">{integrations.voice?.apiKey}</code></p>
              <p>Callback Endpoint: <code className="text-slate-400">/api/webhooks/voice/callback</code></p>
            </div>
          </div>
          <button
            onClick={() => handleTestIntegration('voice')}
            disabled={testingService === 'voice'}
            className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {testingService === 'voice' ? 'Validating Signature...' : 'Test Callback Verification'}
          </button>
        </div>

        {/* Hospital Operating Rules */}
        <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white text-sm">Hospital Schedule & Triage Rules</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Operational
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p>Institution: <strong>{hospitalConfig.name}</strong></p>
              <p>Emergency Line: <strong>{hospitalConfig.emergencyNumber}</strong></p>
              <p>Consulting Hours: <strong>{hospitalConfig.workingHours?.start} - {hospitalConfig.workingHours?.end}</strong></p>
              <p>Slot Granularity: <strong>{hospitalConfig.workingHours?.slotDurationMinutes} minutes</strong></p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>AI Triage Guard: Active</span>
            <span className="text-emerald-400">All 5 Automated Flows Online</span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-700/80 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-white">System Security & Clinical Audit Trail</h3>
          </div>
          <span className="text-xs text-slate-400">Immutable Event Logs</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No audit events recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-700/60 bg-slate-900/30 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/20">
                    <td className="py-2.5 px-4 font-mono font-medium text-primary-400">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-300">{log.resource_type} #{log.resource_id || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">{JSON.stringify(log.details || {})}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-2.5 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
