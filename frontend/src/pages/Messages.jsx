// src/pages/Messages.jsx — 24x7 WhatsApp AI Patient Support & Human Takeover (Medical Blue & White)
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
import { request } from '../services/api';

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
      const res = await request('/messages/conversations');
      const convos = res?.data || res || [];
      setConversations(convos);
      if (convos.length > 0 && !selectedChat) {
        setSelectedChat(convos[0]);
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
      const res = await request(`/messages/${encodeURIComponent(patientPhone)}`);
      setMessages(res?.data || res || []);
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
      await request('/messages/staff-reply', {
        method: 'POST',
        body: {
          patientPhone: selectedChat.patient_phone,
          message: replyText.trim(),
        },
      });

      setReplyText('');
      fetchMessages(selectedChat.patient_phone);
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
      const res = await request('/messages/ai-screen', {
        method: 'POST',
        body: { text: testMessage },
      });
      setSimulationResult(res?.data || res);
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
          <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">WhatsApp AI Patient Support</h1>
          <p className="text-sm text-[#617181] mt-1">
            Autonomous multi-lingual assistant (Urdu/English), clinical boundary guardrails & staff override
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
          <div className="p-3.5 border-b border-[#DFE6EE] bg-[#F5F8FC]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8898AA]" aria-hidden="true" />
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

          <div className="flex-1 overflow-y-auto divide-y divide-[#DFE6EE]" role="tablist" aria-label="Patient conversations">
            {loading ? (
              <div className="p-6 text-center text-[#617181] text-xs" role="status">
                <div className="w-6 h-6 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[#8898AA] text-xs">
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
                        ? 'bg-[#E7F1FB] border-l-4 border-[#2F78C8]'
                        : 'hover:bg-[#EDF4FB] border-l-4 border-transparent'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full bg-[#E7F1FB] border border-[#DFE6EE] flex items-center justify-center text-[#2F78C8] font-bold text-xs shrink-0"
                      aria-hidden="true"
                    >
                      {(c.patient_name || 'P').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#172B3A] text-xs truncate">
                          {c.patient_name || 'Patient'}
                        </span>
                        <span className="text-[10px] text-[#8898AA] shrink-0">
                          {c.last_message_at
                            ? new Date(c.last_message_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#617181] font-mono truncate mt-0.5">
                        {c.patient_phone}
                      </p>
                      <p className="text-xs text-[#4B5D6B] truncate mt-1">
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
              <div className="p-3.5 border-b border-[#DFE6EE] bg-[#F5F8FC] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full bg-[#E7F1FB] text-[#2F78C8] border border-[#DFE6EE] flex items-center justify-center font-bold text-xs"
                    aria-hidden="true"
                  >
                    {(selectedChat.patient_name || 'P').charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#172B3A] tracking-tight">
                      {selectedChat.patient_name || 'Patient'}
                    </h2>
                    <p className="text-xs text-[#617181] font-mono">{selectedChat.patient_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-[#E7F5EC] text-[#18794E] rounded-full text-[11px] font-semibold border border-[#18794E]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#18794E] animate-pulse" aria-hidden="true" />
                    AI Agent Active
                  </span>
                </div>
              </div>

              {/* Message History Bubble Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F5F8FC]/60">
                {messagesLoading ? (
                  <div className="p-8 text-center text-[#617181] text-xs">Loading message stream...</div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-[#8898AA] text-xs">
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
                              <User className="w-3 h-3 text-[#617181]" aria-hidden="true" />
                              <span className="text-[11px] font-semibold text-[#172B3A]">
                                {selectedChat.patient_name || 'Patient'}
                              </span>
                            </>
                          ) : isStaff ? (
                            <>
                              <span className="text-[11px] font-semibold text-[#8A4B08]">Clinic Staff (Manual)</span>
                              <User className="w-3 h-3 text-[#8A4B08]" aria-hidden="true" />
                            </>
                          ) : (
                            <>
                              <span className="text-[11px] font-semibold text-[#2F78C8]">MediPulse AI Agent</span>
                              <Bot className="w-3 h-3 text-[#2F78C8]" aria-hidden="true" />
                            </>
                          )}
                          <span className="text-[10px] text-[#8898AA]">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isInbound
                              ? 'bg-white text-[#172B3A] rounded-tl-sm border border-[#DFE6EE]'
                              : isStaff
                              ? 'bg-[#FFF2D8] text-[#8A4B08] rounded-tr-sm border border-[#8A4B08]/20'
                              : 'bg-[#E7F1FB] text-[#173A5E] rounded-tr-sm border border-[#2F78C8]/20'
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
              <form onSubmit={handleSendReply} className="p-3 border-t border-[#DFE6EE] bg-white flex gap-2">
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
          <Sparkles className="w-4 h-4 text-[#2F78C8]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[#172B3A] tracking-tight">Clinical AI Safety & Guardrails Simulator</h2>
        </div>
        <p className="text-xs text-[#617181] mb-4">
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
          <div className="mt-4 p-4 bg-[#F5F8FC] border border-[#DFE6EE] rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#172B3A]">Simulation Outcome:</span>
              {simulationResult.escalated ? (
                <span className="inline-flex items-center gap-1 text-[#B42318] font-semibold bg-[#FDECEC] border border-[#B42318]/20 px-2.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Emergency Escalation Triggered
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#18794E] font-semibold bg-[#E7F5EC] border border-[#18794E]/20 px-2.5 py-0.5 rounded-full">
                  <CheckCircle className="w-4 h-4" aria-hidden="true" /> Handled by Standard Protocol
                </span>
              )}
            </div>
            <div className="text-xs text-[#4B5D6B] p-3 bg-white rounded-lg border border-[#DFE6EE]">
              <span className="text-[#617181] block mb-1 font-semibold">AI Generated Response:</span>
              <p className="italic">{simulationResult.aiResponse || simulationResult.response}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
