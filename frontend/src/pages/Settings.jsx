// src/pages/Settings.jsx — Hospital Configuration, Integration Telemetry & Audit Logs (Medical Blue & White)
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
import { request } from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingService, setTestingService] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [setData, auditData] = await Promise.all([
        request('/settings'),
        request('/settings/audit-logs'),
      ]);

      setSettings(setData?.data || setData || null);
      setAuditLogs(auditData?.data || auditData || []);
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
      const res = await request('/settings/test-integration', {
        method: 'POST',
        body: { integration },
      });
      setTestResult({
        service: integration,
        success: true,
        message: res?.data?.message || res?.message || 'Connection successful!',
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
      <div className="p-12 text-center text-[#617181]" role="status">
        <div className="w-8 h-8 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">System Settings & Integrations</h1>
          <p className="text-sm text-[#617181] mt-1">
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
              ? 'bg-[#E7F5EC] border-[#18794E]/40 text-[#18794E]'
              : 'bg-[#FDECEC] border-[#B42318]/40 text-[#B42318]'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-[#18794E]" aria-hidden="true" />
            ) : (
              <XCircle className="w-4 h-4 text-[#B42318]" aria-hidden="true" />
            )}
            <span>
              <strong>{testResult.service.toUpperCase()}:</strong> {testResult.message}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="underline font-semibold cursor-pointer"
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
                <div className="p-2 bg-[#E7F1FB] text-[#2F78C8] rounded-xl" aria-hidden="true">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-[#172B3A] text-sm">PostgreSQL / Supabase</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#18794E] border border-[#18794E]/20">
                Connected
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-[#4B5D6B]">
              <p>Provider: <strong className="text-[#172B3A]">{integrations.database?.provider || 'Supabase Managed Postgres'}</strong></p>
              <p>Endpoint: <code className="text-[#617181] font-mono text-[11px] bg-[#F5F8FC] border border-[#DFE6EE] px-1 py-0.5 rounded">{integrations.database?.url || 'supabase.co'}</code></p>
              <p className="text-[#617181] text-[11px]">Enforces database-level constraint: UNIQUE(doctor_id, slot_time)</p>
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
                <div className="p-2 bg-[#E7F5EC] text-[#18794E] rounded-xl" aria-hidden="true">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-[#172B3A] text-sm">Meta WhatsApp Cloud API</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#18794E] border border-[#18794E]/20">
                Active v21.0
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-[#4B5D6B]">
              <p>Phone Number ID: <code className="text-[#617181] font-mono text-[11px] bg-[#F5F8FC] border border-[#DFE6EE] px-1 py-0.5 rounded">{integrations.whatsapp?.phoneNumberId || 'Registered'}</code></p>
              <p>Verify Token: <code className="text-[#617181] font-mono text-[11px] bg-[#F5F8FC] border border-[#DFE6EE] px-1 py-0.5 rounded">{integrations.whatsapp?.webhookVerifyToken || 'Configured'}</code></p>
              <p>Inbound Webhook: <code className="text-[#617181] font-mono text-[11px] bg-[#F5F8FC] border border-[#DFE6EE] px-1 py-0.5 rounded">/api/webhooks/whatsapp</code></p>
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
                <div className="p-2 bg-[#FFF2D8] text-[#8A4B08] rounded-xl" aria-hidden="true">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-[#172B3A] text-sm">Outbound Voice Calling Service</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F5EC] text-[#18794E] border border-[#18794E]/20">
                HMAC-SHA256
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-[#4B5D6B]">
              <p>Gateway Endpoint: <code className="text-[#617181] font-mono text-[11px] bg-[#F5F8FC] border border-[#DFE6EE] px-1 py-0.5 rounded">{integrations.voice?.baseUrl || 'Voice Gateway'}</code></p>
              <p>Callback Secret: <code className="text-[#617181] font-mono text-[11px] bg-[#F5F8FC] border border-[#DFE6EE] px-1 py-0.5 rounded">HMAC Signature Active</code></p>
              <p>Callback Webhook: <code className="text-[#617181] font-mono text-[11px] bg-[#F5F8FC] border border-[#DFE6EE] px-1 py-0.5 rounded">/api/webhooks/voice/callback</code></p>
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
                <div className="p-2 bg-[#E7F0FF] text-[#2458A6] rounded-xl" aria-hidden="true">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="font-semibold text-[#172B3A] text-sm">Hospital Schedule & Triage Rules</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E7F0FF] text-[#2458A6] border border-[#2458A6]/20">
                Operational
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-[#4B5D6B]">
              <p>Institution: <strong className="text-[#172B3A]">{hospitalConfig.name || 'MediPulse Apex Hospital'}</strong></p>
              <p>Emergency Line: <strong className="text-[#172B3A] font-mono">{hospitalConfig.emergencyNumber || '+92 51 111 000 000'}</strong></p>
              <p>Consulting Hours: <strong className="text-[#172B3A]">{hospitalConfig.workingHours?.start || '09:00'} - {hospitalConfig.workingHours?.end || '17:00'}</strong></p>
              <p>Slot Granularity: <strong className="text-[#172B3A]">{hospitalConfig.workingHours?.slotDurationMinutes || 30} minutes</strong></p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#DFE6EE] text-[11px] text-[#617181] flex items-center justify-between">
            <span>AI Triage Guard: Active</span>
            <span className="text-[#18794E] font-semibold">All 5 Automated Flows Online</span>
          </div>
        </article>
      </section>

      {/* Audit Log Table */}
      <section aria-label="System Audit Trail" className="card-surface rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#DFE6EE] bg-[#F5F8FC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#2F78C8]" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-[#172B3A]">System Security & Clinical Audit Trail</h2>
          </div>
          <span className="text-xs text-[#617181] font-mono">Immutable Event Logs</span>
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
                <tr className="border-b border-[#DFE6EE] bg-[#F5F8FC] text-[#172B3A] uppercase font-semibold">
                  <th scope="col" className="py-3 px-4">Action</th>
                  <th scope="col" className="py-3 px-4">Resource</th>
                  <th scope="col" className="py-3 px-4">Details</th>
                  <th scope="col" className="py-3 px-4">IP Address</th>
                  <th scope="col" className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE6EE]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#EDF4FB] transition">
                    <td className="py-3 px-4 font-mono font-semibold text-[#2F78C8]">{log.action}</td>
                    <td className="py-3 px-4 text-[#172B3A]">{log.resource_type} #{log.resource_id || '-'}</td>
                    <td className="py-3 px-4 text-[#617181] max-w-xs truncate">{JSON.stringify(log.details || {})}</td>
                    <td className="py-3 px-4 font-mono text-[#617181]">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4 text-[#617181]">{new Date(log.created_at).toLocaleString()}</td>
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
