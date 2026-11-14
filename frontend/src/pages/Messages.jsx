// src/pages/Messages.jsx — 24x7 WhatsApp AI Patient Support & Human Takeover
import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  Search,
  Bot,
  User,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

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
          message: replyText.trim()
        })
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
        body: JSON.stringify({ text: testMessage })
      });
      const json = await res.json();
      setSimulationResult(json.data || json);
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    (c.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.patient_phone || '').includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WhatsApp AI Patient Support</h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous multi-lingual assistant (Hinglish/English), clinical boundary guardrails & staff override
          </p>
        </div>
        <button
          onClick={() => { fetchConversations(); if (selectedChat) fetchMessages(selectedChat.patient_phone); }}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Feeds
        </button>
      </div>

      {/* Main Chat Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px] lg:h-[620px]">
        {/* Left Conversations Sidebar */}
        <div className="h-64 lg:h-full lg:col-span-4 bg-slate-800/80 border border-slate-700/70 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          <div className="p-3.5 border-b border-slate-700/70 bg-slate-900/40">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs">
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
                    onClick={() => setSelectedChat(c)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${isSelected ? 'bg-primary-600/15 border-l-4 border-primary-500' : 'hover:bg-slate-700/30'}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
                      {(c.patient_name || 'P').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs truncate">
                          {c.patient_name || 'Patient'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
        <div className="lg:col-span-8 bg-slate-800/80 border border-slate-700/70 rounded-2xl flex flex-col overflow-hidden shadow-sm">
          {selectedChat ? (
            <>
              {/* Chat Thread Header */}
              <div className="p-3.5 border-b border-slate-700/70 bg-slate-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-xs">
                    {(selectedChat.patient_name || 'P').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{selectedChat.patient_name || 'Patient'}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedChat.patient_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[11px] font-medium border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    AI Agent Active
                  </span>
                </div>
              </div>

              {/* Message History Bubble Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/30">
                {messagesLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading message stream...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">No prior messages for this conversation.</div>
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
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" /> Patient
                            </span>
                          ) : isStaff ? (
                            <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
                              Staff Takeover
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-primary-400 flex items-center gap-1">
                              <Bot className="w-3 h-3 text-primary-400" /> MediPulse AI
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isInbound
                              ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/70'
                              : isStaff
                              ? 'bg-amber-600 text-white rounded-tr-sm'
                              : 'bg-primary-600 text-white rounded-tr-sm shadow-sm'
                          }`}
                        >
                          <p className="whitespace-pre-line">{m.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Staff Override Input Bar */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-700/70 bg-slate-900/60 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a manual staff reply to patient via WhatsApp..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">Select a Conversation</h3>
              <p className="text-xs text-slate-500 mt-1">Choose a patient from the list to view live chat and take over manually.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Guardrail & Safety Live Tester */}
      <div className="bg-slate-800/80 border border-slate-700/70 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Live AI Medical Safety & Clinical Guardrail Sandbox
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Test incoming prompts against emergency keywords (108 escalation), clinical advice boundaries (no drug prescriptions), and prompt injection guards.
        </p>

        <form onSubmit={handleRunAiSafetyTest} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Try e.g.: 'Severe chest pain emergency' OR 'prescribe antibiotic for cough' OR 'Book tomorrow'"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={simulating || !testMessage.trim()}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            {simulating ? 'Evaluating...' : 'Screen Message'}
          </button>
        </form>

        {simulationResult && (
          <div className="mt-4 p-4 bg-slate-900/90 rounded-xl border border-slate-700 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Triage Decision:</span>
              <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                simulationResult.isEmergency
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : simulationResult.isClinicalDiagnosis || simulationResult.clinicalBoundaryTriggered
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : simulationResult.blocked || simulationResult.isPromptInjection
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {simulationResult.action || (simulationResult.isEmergency ? 'EMERGENCY_ESCALATE' : 'ALLOW')}
              </span>
            </div>
            {simulationResult.response && (
              <div>
                <span className="text-slate-400 block mb-1">Automated Safe Reply:</span>
                <p className="p-2.5 bg-slate-800 rounded-lg text-slate-200 whitespace-pre-line border border-slate-700">
                  {simulationResult.response || simulationResult.reply}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
