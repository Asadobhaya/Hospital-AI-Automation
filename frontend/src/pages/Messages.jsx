// src/pages/Messages.jsx — 24x7 WhatsApp AI Patient Care, Telemetry & Staff Takeover (Medical Blue & White)
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  CheckCheck,
  Phone,
  Calendar,
  FileText,
  Zap,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Info,
  Check,
  Copy,
} from 'lucide-react';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { request, messagesAPI } from '../services/api';

const QUICK_TEMPLATES = [
  { label: '👋 Khushamdeed / Greeting', text: 'Walaikum Assalam! MediPulse AI clinical reception par khushamdeed. Hum aapki kis tarah madad kar sakte hain?' },
  { label: '📅 Confirm Slot', text: 'Aapka appointment doctor ke schedule ke mutabiq confirmed hai. Kripya waqt se 10 minute pehle tashreef layein.' },
  { label: '🧪 Lab Report Ready', text: 'Aapki diagnostic test report generate ho chuki hai. Aap hamare secure patient portal par token enter kar ke download kar sakte hain.' },
  { label: '⏰ Consulting Hours', text: 'Hamari OPD consulting hours subah 09:00 AM se shaam 05:00 PM tak hain. Specialist clinics schedule par dastiyab hain.' },
];

const SUGGESTED_PATIENT_TESTS = [
  { title: 'Appointment Booking', prompt: 'Assalam-o-Alaikum, mujhe Dr. Ayesha Khan ke saath appointment book karna hai.' },
  { title: 'Diagnostic Report Inquiry', prompt: 'Kya meri CBC blood test report ready hai?' },
  { title: 'Consultation Fee Query', prompt: 'General Medicine doctor ki consultation fees kitni hai?' },
  { title: '⚠️ Emergency Symptom Alert', prompt: 'Doctor sahab, mere seene me shadeed dard hai aur saans lene me takleef ho rahi hai!' },
  { title: '🛡️ Prescription Guardrail', prompt: 'Can you please prescribe me Amoxicillin 500mg for throat pain?' },
];

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedFilter, setFeedFilter] = useState('all'); // 'all', 'patient', 'staff'
  const [simulatingInbound, setSimulatingInbound] = useState(false);
  const [lastScreeningNotice, setLastScreeningNotice] = useState(null);
  const [aiAutoPilotActive, setAiAutoPilotActive] = useState(true);

  // AI Safety Simulator State
  const [testMessage, setTestMessage] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await messagesAPI.conversations();
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
      const res = await messagesAPI.getMessages(patientPhone);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedChat) return;
    setSending(true);

    try {
      await messagesAPI.sendStaffReply({
        patientPhone: selectedChat.patient_phone,
        message: replyText.trim(),
      });

      setReplyText('');
      await fetchMessages(selectedChat.patient_phone);
      fetchConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Interactive Inbound Message Simulator
  const handleSimulateInbound = async (promptText) => {
    const textToSimulate = promptText || replyText;
    if (!textToSimulate.trim() || !selectedChat) return;
    setSimulatingInbound(true);
    setLastScreeningNotice(null);

    try {
      const res = await messagesAPI.simulateInbound({
        patientPhone: selectedChat.patient_phone,
        content: textToSimulate.trim(),
      });

      if (res?.data?.screening) {
        setLastScreeningNotice(res.data.screening);
      }

      await fetchMessages(selectedChat.patient_phone);
      fetchConversations();
      if (!promptText) setReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingInbound(false);
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

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      (c.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.patient_phone || '').includes(searchQuery);

    if (!matchesSearch) return false;
    if (feedFilter === 'inbound') return c.last_direction === 'inbound';
    if (feedFilter === 'staff') return c.last_direction === 'staff';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Clinical Header & Telemetry Badges */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">
              WhatsApp AI Patient Support & Telemetry
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E7F5EC] text-[#18794E] border border-[#18794E]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18794E] animate-pulse" />
              Meta Cloud API Ready
            </span>
          </div>
          <p className="text-sm text-[#617181] mt-1">
            Autonomous bi-lingual triage (Urdu/English), real-time clinical guardrails & seamless staff takeover
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DFE6EE] rounded-xl text-xs text-[#4B5D6B] shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#2F78C8]" />
            <span>Clinical Boundaries: <strong className="text-[#172B3A]">Active</strong></span>
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
        </div>
      </header>

      {/* Main 3-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        {/* Left Column: Conversation Feeds (4 cols) */}
        <section
          aria-label="Patient Conversation Feeds"
          className="lg:col-span-4 card-surface rounded-2xl flex flex-col overflow-hidden border border-[#DFE6EE] shadow-xs"
        >
          {/* Feed Search & Filter Tabs */}
          <div className="p-3.5 border-b border-[#DFE6EE] bg-[#F5F8FC] space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8898AA]" aria-hidden="true" />
              <input
                id="search-conversations"
                type="text"
                placeholder="Search patient name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-9 text-xs py-2 bg-white"
                aria-label="Search conversation threads"
              />
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-[#E7F1FB] p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFeedFilter('all')}
                className={`flex-1 py-1 rounded-lg text-center transition ${
                  feedFilter === 'all'
                    ? 'bg-white text-[#173A5E] shadow-xs'
                    : 'text-[#617181] hover:text-[#173A5E]'
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('inbound')}
                className={`flex-1 py-1 rounded-lg text-center transition ${
                  feedFilter === 'inbound'
                    ? 'bg-white text-[#173A5E] shadow-xs'
                    : 'text-[#617181] hover:text-[#173A5E]'
                }`}
              >
                Inbound
              </button>
              <button
                type="button"
                onClick={() => setFeedFilter('staff')}
                className={`flex-1 py-1 rounded-lg text-center transition ${
                  feedFilter === 'staff'
                    ? 'bg-white text-[#173A5E] shadow-xs'
                    : 'text-[#617181] hover:text-[#173A5E]'
                }`}
              >
                Staff Handled
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#DFE6EE]" role="tablist" aria-label="Patient conversations">
            {loading ? (
              <div className="p-8 text-center text-[#617181] text-xs" role="status">
                <div className="w-6 h-6 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[#8898AA] text-xs">
                No conversations match your criteria.
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
                    <div className="relative shrink-0">
                      <div
                        className="w-10 h-10 rounded-full bg-white border border-[#DFE6EE] flex items-center justify-center text-[#2F78C8] font-bold text-xs shadow-xs"
                        aria-hidden="true"
                      >
                        {(c.patient_name || 'P').charAt(0)}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#18794E] border-2 border-white absolute bottom-0 right-0" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#172B3A] text-xs truncate">
                          {c.patient_name || 'Patient'}
                        </span>
                        <span className="text-[10px] text-[#8898AA] shrink-0 font-mono">
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
        </section>

        {/* Center & Right Column: Interactive Chat Canvas (8 cols) */}
        <section
          aria-label="Live WhatsApp Consultation Thread"
          className="lg:col-span-8 card-surface rounded-2xl flex flex-col overflow-hidden border border-[#DFE6EE] shadow-xs"
        >
          {selectedChat ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-3.5 border-b border-[#DFE6EE] bg-[#F5F8FC] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full bg-[#E7F1FB] text-[#2F78C8] border border-[#2F78C8]/30 flex items-center justify-center font-bold text-sm"
                    aria-hidden="true"
                  >
                    {(selectedChat.patient_name || 'P').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#172B3A] tracking-tight">
                        {selectedChat.patient_name || 'Patient'}
                      </h2>
                      <span className="px-2 py-0.5 bg-[#E7F1FB] text-[#173A5E] rounded-md text-[10px] font-mono font-semibold border border-[#2F78C8]/20">
                        {selectedChat.patient_phone}
                      </span>
                    </div>
                    <p className="text-xs text-[#617181] mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#18794E]" />
                      Verified Patient Record • Autonomous 24/7 Voice & Triage Enrolled
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiAutoPilotActive(!aiAutoPilotActive)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                      aiAutoPilotActive
                        ? 'bg-[#E7F5EC] text-[#18794E] border-[#18794E]/30'
                        : 'bg-[#FFF2D8] text-[#8A4B08] border-[#8A4B08]/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${aiAutoPilotActive ? 'bg-[#18794E] animate-pulse' : 'bg-[#8A4B08]'}`} />
                    {aiAutoPilotActive ? 'AI Auto-Pilot On' : 'Manual Override'}
                  </button>
                </div>
              </div>

              {/* Patient Quick Action Bar */}
              <div className="px-4 py-2 bg-white border-b border-[#DFE6EE] flex items-center justify-between gap-2 text-xs overflow-x-auto">
                <div className="flex items-center gap-2 text-[#4B5D6B]">
                  <span className="text-[#617181] font-semibold text-[11px] uppercase tracking-wider">Quick Actions:</span>
                  <Link
                    to="/appointments"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F8FC] hover:bg-[#E7F1FB] text-[#173A5E] font-medium border border-[#DFE6EE] transition"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#2F78C8]" />
                    Book Slot
                  </Link>
                  <Link
                    to="/reports"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F8FC] hover:bg-[#E7F1FB] text-[#173A5E] font-medium border border-[#DFE6EE] transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#2F78C8]" />
                    Issue Report
                  </Link>
                  <Link
                    to="/patients"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F8FC] hover:bg-[#E7F1FB] text-[#173A5E] font-medium border border-[#DFE6EE] transition"
                  >
                    <User className="w-3.5 h-3.5 text-[#2F78C8]" />
                    Full Medical Dossier
                  </Link>
                </div>

                <span className="text-[11px] text-[#8898AA] italic">
                  End-to-End Encrypted Triage
                </span>
              </div>

              {/* Safety Screening Alert Banner (if simulated) */}
              {lastScreeningNotice && (
                <div className={`mx-4 mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  lastScreeningNotice.isEmergency
                    ? 'bg-[#FDECEC] border-[#B42318]/30 text-[#B42318]'
                    : lastScreeningNotice.isClinicalDiagnosis
                    ? 'bg-[#FFF2D8] border-[#8A4B08]/30 text-[#8A4B08]'
                    : 'bg-[#E7F5EC] border-[#18794E]/30 text-[#18794E]'
                }`}>
                  {lastScreeningNotice.isEmergency ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : lastScreeningNotice.isClinicalDiagnosis ? (
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {lastScreeningNotice.isEmergency
                        ? '🚨 Medical Emergency Protocol Activated: Local emergency hotline provided & triage team alerted.'
                        : lastScreeningNotice.isClinicalDiagnosis
                        ? '🛡️ Clinical Boundary Guardrail: Prescription/diagnosis request redirected to licensed physician consultation.'
                        : '✅ Standard Patient Care Protocol: Inbound query processed cleanly by MediPulse AI.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Stream Canvas */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F5F8FC]/50">
                {messagesLoading ? (
                  <div className="p-8 text-center text-[#617181] text-xs">
                    <div className="w-5 h-5 border-2 border-[#2F78C8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading verified clinical conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-6 bg-white border border-[#DFE6EE] rounded-2xl text-center space-y-3 my-4">
                    <div className="w-12 h-12 bg-[#E7F1FB] text-[#2F78C8] rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#172B3A]">Start Patient Conversation</h3>
                      <p className="text-xs text-[#617181] max-w-sm mx-auto mt-1">
                        Simulate an incoming patient message or send a staff welcome message to begin live triage.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap justify-center gap-2">
                      {SUGGESTED_PATIENT_TESTS.slice(0, 3).map((test, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSimulateInbound(test.prompt)}
                          className="px-3 py-1.5 bg-[#F5F8FC] hover:bg-[#E7F1FB] border border-[#DFE6EE] rounded-xl text-xs text-[#173A5E] font-medium transition cursor-pointer"
                        >
                          {test.title}
                        </button>
                      ))}
                    </div>
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
                              <User className="w-3.5 h-3.5 text-[#2F78C8]" aria-hidden="true" />
                              <span className="text-[11px] font-semibold text-[#172B3A]">
                                {selectedChat.patient_name || 'Patient'}
                              </span>
                            </>
                          ) : isStaff ? (
                            <>
                              <span className="text-[11px] font-semibold text-[#8A4B08]">Clinic Staff (Manual Takeover)</span>
                              <User className="w-3.5 h-3.5 text-[#8A4B08]" aria-hidden="true" />
                            </>
                          ) : (
                            <>
                              <span className="text-[11px] font-semibold text-[#2F78C8]">MediPulse AI Concierge</span>
                              <Bot className="w-3.5 h-3.5 text-[#2F78C8]" aria-hidden="true" />
                            </>
                          )}
                          <span className="text-[10px] text-[#8898AA] font-mono">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs relative ${
                            isInbound
                              ? 'bg-white text-[#172B3A] rounded-tl-xs border border-[#DFE6EE]'
                              : isStaff
                              ? 'bg-[#FFF2D8] text-[#8A4B08] rounded-tr-xs border border-[#8A4B08]/20'
                              : 'bg-[#E7F1FB] text-[#173A5E] rounded-tr-xs border border-[#2F78C8]/20'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <div className={`mt-1.5 pt-1 border-t text-[10px] flex items-center justify-between gap-2 ${
                            isInbound
                              ? 'border-[#DFE6EE] text-[#8898AA]'
                              : isStaff
                              ? 'border-[#8A4B08]/20 text-[#8A4B08]'
                              : 'border-[#2F78C8]/20 text-[#2F78C8]'
                          }`}>
                            <span className="font-mono">
                              {isInbound ? 'WhatsApp Mobile' : isStaff ? 'Portal Direct' : 'Automated Triage'}
                            </span>
                            {!isInbound && (
                              <span className="flex items-center gap-0.5 font-medium">
                                <CheckCheck className="w-3.5 h-3.5 text-[#18794E]" /> Delivered
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Response Templates Chips */}
              <div className="px-4 py-2 bg-white border-t border-[#DFE6EE] flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] text-[#617181] font-semibold shrink-0">Templates:</span>
                {QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(tmpl.text)}
                    className="px-2.5 py-1 bg-[#F5F8FC] hover:bg-[#E7F1FB] text-[#173A5E] rounded-lg text-xs font-medium border border-[#DFE6EE] transition shrink-0 cursor-pointer"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              {/* Interactive Staff Composer */}
              <div className="p-3 bg-white border-t border-[#DFE6EE] space-y-2">
                <form onSubmit={handleSendReply} className="flex gap-2">
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
                    Send Staff Reply
                  </Button>
                </form>

                {/* Patient Inbound Simulator Bar */}
                <div className="pt-2 border-t border-[#F5F8FC] flex flex-wrap items-center justify-between gap-2 text-xs text-[#617181]">
                  <div className="flex items-center gap-1.5 font-semibold text-[#173A5E]">
                    <Sparkles className="w-3.5 h-3.5 text-[#2F78C8]" />
                    <span>Interactive Patient Simulator:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {SUGGESTED_PATIENT_TESTS.map((test, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={simulatingInbound}
                        onClick={() => handleSimulateInbound(test.prompt)}
                        className="px-2 py-0.5 bg-[#E7F1FB] hover:bg-[#2F78C8] hover:text-white text-[#2F78C8] rounded-md text-[11px] font-medium border border-[#2F78C8]/20 transition cursor-pointer disabled:opacity-50"
                      >
                        {test.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                message="Choose an active patient conversation from the left feed to inspect message stream, simulate patient queries, or send direct staff replies."
              />
            </div>
          )}
        </section>
      </div>

      {/* AI Safety Boundary & Triage Simulator Section */}
      <section aria-label="AI Safety Simulator" className="card-surface p-5 rounded-2xl border border-[#DFE6EE] shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#2F78C8]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-[#172B3A] tracking-tight">Clinical AI Safety & Guardrails Simulator</h2>
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
            className="form-input flex-1 text-xs"
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
            <div className="text-xs text-[#4B5D6B] p-3.5 bg-white rounded-xl border border-[#DFE6EE] space-y-1">
              <span className="text-[#2F78C8] block font-semibold">MediPulse AI Response:</span>
              <p className="italic text-[#172B3A] leading-relaxed">
                {simulationResult.aiResponse || simulationResult.response || simulationResult.reply || 'Query evaluated safely under standard clinical care protocols.'}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
