// src/pages/Messages.jsx — 24x7 WhatsApp AI Patient Support & Human Takeover
import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Bot,
  User,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Safety Simulator State
  const [testMessage, setTestMessage] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/messages/conversations', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const convos = json.data || [];
        setConversations(convos);
        if (convos.length > 0 && !selectedChat) {
          setSelectedChat(convos[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (patientPhone) => {
    if (!patientPhone) return;
    try {
      setMessagesLoading(true);
      const res = await fetch(`/api/messages/${encodeURIComponent(patientPhone)}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.patient_phone);
    }
  }, [selectedChat]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat) return;
    setSending(true);

    try {
      const res = await fetch('/api/messages/staff-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patientPhone: selectedChat.patient_phone,
          message: replyText.trim(),
        }),
      });

      if (res.ok) {
        setReplyText('');
        fetchMessages(selectedChat.patient_phone);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleRunAiSafetyTest = async (e) => {
    e.preventDefault();
    if (!testMessage.trim()) return;
    setSimulating(true);

    try {
      const res = await fetch('/api/messages/ai-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: testMessage }),
      });
      const json = await res.json();
      setSimulationResult(json.data || json);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      (c.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.patient_phone || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WhatsApp AI Patient Support</h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous multi-lingual assistant (Hinglish/English), clinical boundary guardrails & staff override
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            fetchConversations();
            if (selectedChat) fetchMessages(selectedChat.patient_phone);
          }}
          icon={RefreshCw}
        >
          Refresh Feeds
        </Button>
      </header>

      {/* Main Chat Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px] lg:h-[620px]">
        {/* Left Conversations Sidebar */}
        <div className="h-64 lg:h-full lg:col-span-4 card-surface rounded-2xl flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/60">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="search-conversations"
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-9 text-xs py-2"
                aria-label="Search conversation threads"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800" role="tablist" aria-label="Patient conversations">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs" role="status">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active patient conversations found.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedChat?.patient_phone === c.patient_phone;
                return (
                  <button
                    key={c.patient_phone}
                    type="button"
                    onClick={() => setSelectedChat(c)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-primary-600/15 border-l-4 border-primary-500'
                        : 'hover:bg-slate-800/50 border-l-4 border-transparent'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0"
                      aria-hidden="true"
                    >
                      {(c.patient_name || 'P').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs truncate">
                          {c.patient_name || 'Patient'}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {c.last_message_at
                            ? new Date(c.last_message_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {c.patient_phone}
                      </p>
                      <p className="text-xs text-slate-300 truncate mt-1">
                        {c.last_message_content || 'Recent interaction'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Thread */}
        <div className="lg:col-span-8 card-surface rounded-2xl flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full bg-primary-600/20 text-primary-400 border border-primary-500/30 flex items-center justify-center font-bold text-xs"
                    aria-hidden="true"
                  >
                    {(selectedChat.patient_name || 'P').charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white tracking-tight">
                      {selectedChat.patient_name || 'Patient'}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">{selectedChat.patient_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/60 text-emerald-400 rounded-full text-[11px] font-medium border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    AI Agent Active
                  </span>
                </div>
              </div>

              {/* Message History Bubble Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
                {messagesLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading message stream...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No prior messages for this conversation.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isInbound = m.direction === 'inbound';
                    const isStaff = m.direction === 'staff';

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isInbound ? (
                            <>
                              <User className="w-3 h-3 text-slate-400" aria-hidden="true" />
                              <span className="text-[11px] font-medium text-slate-300">
                                {selectedChat.patient_name || 'Patient'}
                              </span>
                            </>
                          ) : isStaff ? (
                            <>
                              <span className="text-[11px] font-medium text-amber-400">Clinic Staff (Manual)</span>
                              <User className="w-3 h-3 text-amber-400" aria-hidden="true" />
                            </>
                          ) : (
                            <>
                              <span className="text-[11px] font-medium text-primary-400">MediPulse AI Agent</span>
                              <Bot className="w-3 h-3 text-primary-400" aria-hidden="true" />
                            </>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isInbound
                              ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700'
                              : isStaff
                              ? 'bg-amber-950/70 text-amber-100 rounded-tr-sm border border-amber-600/30'
                              : 'bg-primary-600/25 text-primary-100 rounded-tr-sm border border-primary-500/30'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Staff Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-800 bg-slate-900/60 flex gap-2">
                <input
                  id="staff-reply-input"
                  type="text"
                  placeholder="Type message to override AI and reply as clinic staff..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="form-input flex-1 py-2 text-xs"
                  aria-label="Staff reply input"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={sending}
                  icon={Send}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                message="Choose an active WhatsApp conversation from the left feed to inspect message stream and send staff replies."
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Safety Boundary & Triage Simulator Section */}
      <section aria-label="AI Safety Simulator" className="card-surface p-5 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-white tracking-tight">Clinical AI Safety & Guardrails Simulator</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Test incoming patient prompts against Gemini clinical boundary filters, prescription refusal safeguards, and emergency escalation routing.
        </p>

        <form onSubmit={handleRunAiSafetyTest} className="flex flex-col sm:flex-row gap-3">
          <input
            id="ai-prompt-test"
            type="text"
            placeholder="e.g. 'Can you prescribe Amoxicillin 500mg?' or 'I have severe chest pain'"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="form-input flex-1"
            aria-label="Safety prompt test input"
          />
          <Button
            type="submit"
            variant="secondary"
            size="md"
            loading={simulating}
            className="shrink-0"
          >
            Run Clinical Screen
          </Button>
        </form>

        {simulationResult && (
          <div className="mt-4 p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Simulation Outcome:</span>
              {simulationResult.escalated ? (
                <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Emergency Escalation Triggered
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" /> Handled by Standard Protocol
                </span>
              )}
            </div>
            <div className="text-xs text-slate-300 p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block mb-1 font-medium">AI Generated Response:</span>
              <p className="italic">{simulationResult.aiResponse || simulationResult.response}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
