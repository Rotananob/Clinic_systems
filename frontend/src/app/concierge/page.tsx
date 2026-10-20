'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Search,
  Plus,
  ShieldAlert,
  Bot,
  User,
  Stethoscope,
  Activity,
  MessageCircle,
  Phone,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

interface ConciergeMessage {
  id: string;
  sender: 'CLINIC_BOT' | 'PATIENT' | 'DOCTOR';
  senderName: string;
  channel: 'TELEGRAM' | 'WHATSAPP' | 'SMS';
  content: string;
  sentAt: string;
  isRedFlag: boolean;
}

interface RedFlagAlert {
  id: string;
  threadId: string;
  patientId: string;
  patientName: string;
  symptomDetected: string;
  severity: 'URGENT' | 'CRITICAL';
  reportedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

interface PatientCareThread {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  telegramChatId?: string;
  visitId: string;
  primaryDoctor: string;
  diagnosis: string;
  activeProtocol: string;
  channel: 'TELEGRAM' | 'WHATSAPP' | 'SMS';
  adherenceScore: number;
  adherenceDosesTotal: number;
  adherenceDosesConfirmed: number;
  status: 'ACTIVE' | 'ESCALATED_RED_FLAG' | 'COMPLETED';
  lastActivityAt: string;
  messages: ConciergeMessage[];
}

export default function ConciergePage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';
  const c = t.concierge;

  const [threads, setThreads] = useState<PatientCareThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<PatientCareThread | null>(null);
  const [redFlags, setRedFlags] = useState<RedFlagAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Doctor reply state
  const [replyText, setReplyText] = useState<string>('');
  const [sendingReply, setSendingReply] = useState<boolean>(false);

  // Trigger Protocol Modal
  const [showTriggerModal, setShowTriggerModal] = useState<boolean>(false);
  const [modalPatientId, setModalPatientId] = useState<string>('PT-1003');
  const [modalPatientName, setModalPatientName] = useState<string>('MENG Dara');
  const [modalPhone, setModalPhone] = useState<string>('+85512778899');
  const [modalProtocol, setModalProtocol] = useState<string>('POST_CONSULTATION_DAY1');
  const [modalChannel, setModalChannel] = useState<'TELEGRAM' | 'WHATSAPP'>('TELEGRAM');
  const [triggering, setTriggering] = useState<boolean>(false);

  useEffect(() => {
    fetchThreads();
    fetchRedFlags();
  }, [statusFilter]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await api.concierge.getThreads({
        status: statusFilter,
        search: searchQuery,
      });
      if (res && Array.isArray(res)) {
        setThreads(res);
        if (res.length > 0 && !selectedThread) {
          setSelectedThread(res[0]);
        } else if (selectedThread) {
          const updated = res.find((t) => t.id === selectedThread.id);
          if (updated) setSelectedThread(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load care threads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedFlags = async () => {
    try {
      const res = await api.concierge.getRedFlags();
      if (res && Array.isArray(res)) {
        setRedFlags(res);
      }
    } catch (err) {
      console.error('Failed to load red flags:', err);
    }
  };

  const handleSendDoctorReply = async () => {
    if (!selectedThread || !replyText.trim()) return;
    try {
      setSendingReply(true);
      const res = await api.concierge.sendDoctorReply(selectedThread.id, {
        doctorName: selectedThread.primaryDoctor || 'Dr. CHAN Vanna',
        replyText: replyText.trim(),
      });
      if (res) {
        setSelectedThread(res);
        setThreads((prev) => prev.map((t) => (t.id === res.id ? res : t)));
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to send doctor reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleRecordDose = async (confirmed: boolean) => {
    if (!selectedThread) return;
    try {
      const res = await api.concierge.recordDose(selectedThread.id, { confirmed });
      if (res) {
        setSelectedThread(res);
        setThreads((prev) => prev.map((t) => (t.id === res.id ? res : t)));
      }
    } catch (err) {
      console.error('Failed to record dose:', err);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const res = await api.concierge.acknowledgeAlert(alertId, {
        doctorName: 'Dr. CHAN Vanna',
      });
      if (res) {
        fetchRedFlags();
        fetchThreads();
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleTriggerNewProtocol = async () => {
    try {
      setTriggering(true);
      const res = await api.concierge.triggerProtocol({
        patientId: modalPatientId,
        patientName: modalPatientName,
        patientPhone: modalPhone,
        visitId: 'vis-' + Date.now(),
        primaryDoctor: 'Dr. CHAN Vanna',
        diagnosis: 'Acute primary upper respiratory tract infection',
        protocolType: modalProtocol,
        channel: modalChannel,
      });

      if (res) {
        setShowTriggerModal(false);
        fetchThreads();
        setSelectedThread(res);
      }
    } catch (err) {
      console.error('Failed to trigger protocol:', err);
    } finally {
      setTriggering(false);
    }
  };

  // Simulation test helpers
  const handleSimulateInbound = async (content: string) => {
    if (!selectedThread) return;
    try {
      const res = await api.concierge.processInbound(selectedThread.id, {
        senderName: selectedThread.patientName,
        content,
      });
      if (res && res.thread) {
        setSelectedThread(res.thread);
        fetchThreads();
        fetchRedFlags();
      }
    } catch (err) {
      console.error('Failed to process inbound simulation:', err);
    }
  };

  const getAdherenceBadgeColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-12">
      {/* Top Header */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 sticky top-0 z-30 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {c.title}
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono">
                  Telegram & WhatsApp Automation
                </span>
              </h1>
              <p className="text-xs text-slate-400">{c.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTriggerModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>{c.triggerNewProtocolButton}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Red-Flag Urgent Banner */}
        {redFlags.length > 0 && (
          <div className="p-4 bg-red-950/80 border-2 border-red-500/60 rounded-2xl shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-red-300 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              <span>{c.redFlagBannerTitle}</span>
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-mono ml-auto">
                {redFlags.length} {isKh ? 'ករណីអាសន្ន' : 'Pending Alerts'}
              </span>
            </div>

            <div className="divide-y divide-red-800/40">
              {redFlags.map((alert) => (
                <div key={alert.id} className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white text-sm mr-2">{alert.patientName}</span>
                    <span className="text-red-200">
                      {c.symptomAlert}: <strong className="text-white underline">{alert.symptomDetected}</strong>
                    </span>
                    <div className="text-[10px] text-red-300/80 font-mono mt-0.5">
                      Reported: {alert.reportedAt} • Severity: {alert.severity}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow text-xs shrink-0 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{c.acknowledgeAlertButton}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3-Column Split Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Threads List (4 cols) */}
          <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col h-[760px] shadow-xl">
            {/* Thread search and status filter */}
            <div className="p-4 border-b border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  {c.threadList}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                  {threads.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={isKh ? 'ស្វែងរកអ្នកជំងឺ...' : 'Search patient, phone...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchThreads()}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="ALL">{c.filterAllStatus}</option>
                  <option value="ACTIVE">{c.statusActive}</option>
                  <option value="ESCALATED_RED_FLAG">{c.statusEscalated}</option>
                </select>
              </div>
            </div>

            {/* Threads Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50 p-2 space-y-1">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">{t.common.loading}</div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {isKh ? 'គ្មានខ្សែសន្ទនា' : 'No active care threads.'}
                </div>
              ) : (
                threads.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedThread(t)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      selectedThread?.id === t.id
                        ? 'bg-blue-600/20 border border-blue-500/50 text-white'
                        : 'hover:bg-slate-750 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xs font-bold text-white truncate">{t.patientName}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getAdherenceBadgeColor(t.adherenceScore)}`}>
                        {t.adherenceScore}%
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate mb-1">
                      {t.diagnosis}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-700/40">
                      <span className="flex items-center gap-1 font-mono">
                        {t.channel === 'TELEGRAM' ? 'Telegram' : 'WhatsApp'} • {t.patientPhone}
                      </span>
                      {t.status === 'ESCALATED_RED_FLAG' && (
                        <span className="px-1.5 py-0.2 rounded bg-red-600/30 text-red-300 border border-red-500/50 font-bold animate-pulse">
                          RED FLAG
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center Column: Live Conversation Timeline (5 cols) */}
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col h-[760px] shadow-xl">
            {selectedThread ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-700/80 flex items-center justify-between bg-slate-850">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedThread.patientName}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300">
                        {selectedThread.channel}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {c.primaryDoctor}: {selectedThread.primaryDoctor} • Protocol: {selectedThread.activeProtocol}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">{c.adherenceScore}</span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${getAdherenceBadgeColor(selectedThread.adherenceScore)}`}>
                      {selectedThread.adherenceDosesConfirmed}/{selectedThread.adherenceDosesTotal} ({selectedThread.adherenceScore}%)
                    </span>
                  </div>
                </div>

                {/* Timeline Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedThread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.sender === 'PATIENT' ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        {m.sender === 'CLINIC_BOT' && <Bot className="w-3.5 h-3.5 text-blue-400" />}
                        {m.sender === 'PATIENT' && <User className="w-3.5 h-3.5 text-emerald-400" />}
                        {m.sender === 'DOCTOR' && <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />}
                        <span className="font-semibold text-slate-300">{m.senderName}</span>
                        <span>•</span>
                        <span>{m.sentAt.split('T')[1]?.substring(0, 5) || ''}</span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                          m.isRedFlag
                            ? 'bg-red-950/90 border border-red-500/70 text-red-200'
                            : m.sender === 'PATIENT'
                            ? 'bg-slate-900 border border-slate-700/70 text-white rounded-tl-sm'
                            : m.sender === 'DOCTOR'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-slate-750 border border-slate-700 text-slate-200 rounded-tr-sm'
                        }`}
                      >
                        {m.content}
                        {m.isRedFlag && (
                          <div className="mt-1.5 pt-1.5 border-t border-red-500/40 text-[10px] text-red-300 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>RED-FLAG SYMPTOM DETECTED</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Action / Reply Bar */}
                <div className="p-3 border-t border-slate-700/80 bg-slate-850 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={c.typeMessagePlaceholder}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendDoctorReply()}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendDoctorReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all shadow"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Fast Simulation Bar for Testing & Verification */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                    <span>{isKh ? 'សាកល្បងសារឆ្លើយតបអ្នកជំងឺ:' : 'Test Patient Inbound:'}</span>
                    <button
                      onClick={() => handleSimulateInbound('ខ្ញុំលេបថ្នាំទៀងទាត់ និងមានអារម្មណ៍ធូរស្រាលច្រើនហើយ។')}
                      className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-650 text-slate-200"
                    >
                      Normal Dose OK
                    </button>
                    <button
                      onClick={() => handleSimulateInbound('លោកគ្រូពេទ្យ ខ្ញុំលេបថ្នាំរួចស្រាប់តែចេញ កន្ទួលរមាស់ ពេញខ្លួន និងក្តៅខ្លួនខ្លាំង។')}
                      className="px-2 py-0.5 rounded bg-red-900/60 border border-red-500/40 text-red-300 hover:bg-red-900"
                    >
                      Trigger Red-Flag Rash
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs my-auto">
                <HeartHandshake className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p>{isKh ? 'សូមជ្រើសរើសខ្សែសន្ទនាដើម្បីពិនិត្យ' : 'Select a care thread to view timeline.'}</p>
              </div>
            )}
          </div>

          {/* Right Column: Protocol & Adherence Actions (3 cols) */}
          <div className="lg:col-span-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-4 h-[760px] overflow-y-auto text-xs">
            {selectedThread ? (
              <>
                <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>{c.adherenceScore}</span>
                </h3>

                {/* Score Big Card */}
                <div className="p-4 bg-slate-900/70 border border-slate-700/60 rounded-xl text-center space-y-1">
                  <span className="text-slate-400 text-xs">{c.adherenceScore}</span>
                  <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                    {selectedThread.adherenceScore}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedThread.adherenceDosesConfirmed} of {selectedThread.adherenceDosesTotal} doses verified
                  </div>
                </div>

                {/* Dose Recording Action */}
                <div className="space-y-2">
                  <label className="text-slate-300 font-semibold block">{c.recordDoseButton}:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRecordDose(true)}
                      className="py-2 px-3 rounded-lg bg-emerald-600/30 border border-emerald-500/50 hover:bg-emerald-600/40 text-emerald-300 font-bold flex items-center justify-center gap-1 text-[11px]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{c.doseConfirmed}</span>
                    </button>
                    <button
                      onClick={() => handleRecordDose(false)}
                      className="py-2 px-3 rounded-lg bg-amber-600/30 border border-amber-500/50 hover:bg-amber-600/40 text-amber-300 font-bold flex items-center justify-center gap-1 text-[11px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{c.doseMissed}</span>
                    </button>
                  </div>
                </div>

                {/* Protocol Info */}
                <div className="p-3 bg-slate-900/70 border border-slate-700/60 rounded-xl space-y-2 text-[11px]">
                  <div className="font-bold text-slate-200">Protocol Specification</div>
                  <div className="text-slate-400">
                    Type: <span className="text-white font-mono">{selectedThread.activeProtocol}</span>
                  </div>
                  <div className="text-slate-400">
                    Channel: <span className="text-white font-mono">{selectedThread.channel}</span>
                  </div>
                  <div className="text-slate-400">
                    Target Phone: <span className="text-white font-mono">{selectedThread.patientPhone}</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-[10px] text-blue-300 leading-relaxed">
                  {c.zeroEmojiStandard}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>

      {/* Trigger Care Protocol Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-blue-400" />
                {c.modalTriggerTitle}
              </h3>
              <button
                onClick={() => setShowTriggerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">{c.patientName}</label>
                <input
                  type="text"
                  value={modalPatientName}
                  onChange={(e) => setModalPatientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{c.selectProtocol}</label>
                <select
                  value={modalProtocol}
                  onChange={(e) => setModalProtocol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="POST_CONSULTATION_DAY1">{c.protocolPostVisitDay1}</option>
                  <option value="ANTIBIOTIC_ADHERENCE_DAY3">{c.protocolAntibioticDay3}</option>
                  <option value="CHRONIC_HYPERTENSION_WEEKLY">{c.protocolHypertensionWeekly}</option>
                  <option value="LAB_FOLLOWUP_DAY7">{c.protocolLabFollowupDay7}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">{c.selectChannel}</label>
                <select
                  value={modalChannel}
                  onChange={(e) => setModalChannel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="TELEGRAM">Telegram Bot Direct Gateway</option>
                  <option value="WHATSAPP">WhatsApp Cloud API Gateway</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                onClick={() => setShowTriggerModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleTriggerNewProtocol}
                disabled={triggering || !modalPatientName.trim() || !modalPhone.trim()}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold"
              >
                {triggering ? t.common.loading : c.triggerNewProtocolButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
