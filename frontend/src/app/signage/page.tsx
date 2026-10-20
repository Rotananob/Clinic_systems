'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Bell,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';

interface QueueTicket {
  id: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  department: string;
  station: string;
  stationDisplayNameKh: string;
  stationDisplayNameEn: string;
  status: 'WAITING' | 'CALLING' | 'IN_SERVICE' | 'COMPLETED' | 'NO_SHOW';
  priority: 'NORMAL' | 'URGENT_EMERGENCY' | 'ELDERLY_PREGNANT';
  calledAt?: string;
  speechTextKh: string;
  speechTextEn: string;
  waitTimeMinutes: number;
  assignedStaff?: string;
}

interface SignageBoardData {
  callingTickets: QueueTicket[];
  waitingTickets: QueueTicket[];
  announcements: Array<{
    id: string;
    titleKh: string;
    titleEn: string;
    contentKh: string;
    contentEn: string;
    priority: string;
    active: boolean;
  }>;
  summary: {
    totalWaiting: number;
    totalCalling: number;
    avgWaitMinutes: number;
  };
}

export default function SignagePage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';

  const [boardData, setBoardData] = useState<SignageBoardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [lastCalledId, setLastCalledId] = useState<string | null>(null);

  // Kiosk ticket issuance modal state
  const [showKioskModal, setShowKioskModal] = useState<boolean>(false);
  const [kioskPatientName, setKioskPatientName] = useState<string>('');
  const [kioskDepartment, setKioskDepartment] = useState<string>('CONSULTATION');
  const [kioskPriority, setKioskPriority] = useState<string>('NORMAL');
  const [kioskSubmitting, setKioskSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Update live clock every second
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(isKh ? 'km-KH' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      );
      setCurrentDate(
        now.toLocaleDateString(isKh ? 'km-KH' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [isKh]);

  // Synthesize hospital chime (two-tone chime: D5 587Hz -> A5 880Hz)
  const playHospitalChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // First tone (587Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Second tone (880Hz) after 0.25s
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.25);
      gain2.gain.setValueAtTime(0.3, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 1.2);
    } catch {
      // Audio autoplay policy catch
    }
  }, []);

  // Text-to-speech announcement in Khmer and English
  const speakAnnouncement = useCallback(
    (ticket: QueueTicket) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();

      playHospitalChime();

      setTimeout(() => {
        const textToSpeak = isKh ? ticket.speechTextKh : ticket.speechTextEn;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        // Try to pick Khmer voice if available
        const voices = window.speechSynthesis.getVoices();
        const khmerVoice = voices.find((v) => v.lang.toLowerCase().includes('km') || v.name.toLowerCase().includes('khmer'));
        if (khmerVoice && isKh) {
          utterance.voice = khmerVoice;
        }

        window.speechSynthesis.speak(utterance);
      }, 700);
    },
    [isKh, playHospitalChime],
  );

  // Fetch live board data
  const fetchBoard = useCallback(async () => {
    try {
      const data = await api.signage.getBoard();
      setBoardData(data);
      setLoading(false);

      // Check if there is a newly called ticket to chime
      if (data && data.callingTickets && data.callingTickets.length > 0) {
        const currentHero = data.callingTickets[0];
        if (currentHero.id !== lastCalledId) {
          setLastCalledId(currentHero.id);
          if (audioEnabled) {
            speakAnnouncement(currentHero);
          }
        }
      }
    } catch {
      setLoading(false);
    }
  }, [audioEnabled, lastCalledId, speakAnnouncement]);

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 4000);
    return () => clearInterval(interval);
  }, [fetchBoard]);

  // Full-screen toggler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Enable audio by explicit user gesture
  const handleEnableAudio = () => {
    setAudioEnabled(true);
    playHospitalChime();
    if (boardData && boardData.callingTickets && boardData.callingTickets.length > 0) {
      speakAnnouncement(boardData.callingTickets[0]);
    }
  };

  // Handle staff calling a ticket again
  const handleCallTicket = async (ticketId: string, station: string) => {
    try {
      const result = await api.signage.callTicket(ticketId, { station });
      if (audioEnabled && result.ticket) {
        speakAnnouncement(result.ticket);
      }
      setSuccessToast(isKh ? 'បានហៅអ្នកជំងឺជោគជ័យ' : 'Patient successfully called to station');
      setTimeout(() => setSuccessToast(null), 3000);
      fetchBoard();
    } catch {
      // Error catch
    }
  };

  // Handle marking ticket completed
  const handleCompleteTicket = async (ticketId: string) => {
    try {
      await api.signage.completeTicket(ticketId);
      setSuccessToast(isKh ? 'បានបញ្ចប់ការពិគ្រោះ' : 'Ticket marked as completed');
      setTimeout(() => setSuccessToast(null), 3000);
      fetchBoard();
    } catch {
      // Error catch
    }
  };

  // Handle self-service kiosk check-in
  const handleIssueKioskTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kioskPatientName.trim()) return;

    setKioskSubmitting(true);
    try {
      await api.signage.issueTicket({
        patientName: kioskPatientName.trim(),
        department: kioskDepartment,
        priority: kioskPriority,
      });
      setKioskSubmitting(false);
      setShowKioskModal(false);
      setKioskPatientName('');
      setSuccessToast(t.signage.printTicketSuccess);
      setTimeout(() => setSuccessToast(null), 3500);
      fetchBoard();
    } catch {
      setKioskSubmitting(false);
    }
  };

  const heroTicket = boardData?.callingTickets && boardData.callingTickets.length > 0 ? boardData.callingTickets[0] : null;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="bg-[#1E293B] border-b border-slate-700/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {t.signage.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              {t.signage.subtitle}
            </p>
          </div>
        </div>

        {/* Live Clock & Control Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xl font-mono font-bold text-emerald-400 tracking-wider">
              {currentTime}
            </div>
            <div className="text-xs text-slate-400">
              {currentDate}
            </div>
          </div>

          {/* Audio State Toggle */}
          <button
            onClick={() => (audioEnabled ? setAudioEnabled(false) : handleEnableAudio())}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium border transition-colors ${
              audioEnabled
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-300 animate-pulse'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{audioEnabled ? t.signage.audioActiveNotice : t.signage.audioMutedNotice}</span>
          </button>

          {/* Self-Service Kiosk Button */}
          <button
            onClick={() => setShowKioskModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.signage.issueTicketButton}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Toggle Fullscreen 4K/1080p"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Main Grid: Calling Hero vs Queue List */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column: Calling Now Hero (7 of 12 columns) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[#1E293B]/80 rounded-2xl border border-slate-700/80 p-6 flex flex-col flex-1 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
                <h2 className="text-lg md:text-2xl font-bold tracking-wide text-emerald-400 uppercase">
                  {t.signage.callingNow}
                </h2>
              </div>
              {heroTicket && (
                <button
                  onClick={() => speakAnnouncement(heroTicket)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span>{t.signage.callAgain}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-slate-400 animate-pulse text-lg">{t.common.loading}</div>
              </div>
            ) : heroTicket ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center my-6">
                {/* Hero Ticket Number Badge */}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-2">
                    {t.signage.ticketNumber}
                  </span>
                  <div className="text-7xl sm:text-8xl md:text-9xl font-black text-amber-400 font-mono tracking-tighter drop-shadow-[0_0_35px_rgba(251,191,36,0.3)]">
                    {heroTicket.ticketNumber}
                  </div>
                </div>

                {/* Patient Name */}
                <div className="text-2xl md:text-3xl font-bold text-white mb-6">
                  {heroTicket.patientName}
                </div>

                {/* Assigned Station / Room */}
                <div className="w-full max-w-xl bg-slate-900/90 rounded-2xl border-2 border-emerald-500/60 p-6 mb-6 shadow-inner">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    {t.signage.assignedStation}
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                    {isKh ? heroTicket.stationDisplayNameKh : heroTicket.stationDisplayNameEn}
                  </div>
                  {heroTicket.assignedStaff && (
                    <div className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <span>{heroTicket.assignedStaff}</span>
                    </div>
                  )}
                </div>

                {/* Priority Badge */}
                {heroTicket.priority !== 'NORMAL' && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-950/60 border border-rose-500/50 text-rose-300 text-sm font-semibold">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {heroTicket.priority === 'URGENT_EMERGENCY'
                        ? t.signage.priorityEmergency
                        : t.signage.priorityElderly}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Clock className="w-16 h-16 text-slate-600 mb-4 stroke-[1.5]" />
                <p className="text-lg">{t.signage.noActiveCalls}</p>
              </div>
            )}

            {/* Calling Hero Quick Actions Footer for Clinic Staff */}
            {heroTicket && (
              <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {t.signage.zeroEmojiStandards}
                </span>
                <button
                  onClick={() => handleCompleteTicket(heroTicket.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium border border-slate-600 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{t.signage.markCompleted}</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Waiting Queue (5 of 12 columns) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#1E293B]/80 rounded-2xl border border-slate-700/80 p-6 flex flex-col flex-1 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg md:text-xl font-bold tracking-wide text-white">
                  {t.signage.waitingQueue}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-bold">
                {boardData?.waitingTickets?.length || 0}
              </span>
            </div>

            {/* Waiting Ticket Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {!boardData?.waitingTickets || boardData.waitingTickets.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 text-slate-600 mb-2 stroke-[1.5]" />
                  <p className="text-sm">{t.signage.noWaiting}</p>
                </div>
              ) : (
                boardData.waitingTickets.map((ticket, idx) => (
                  <div
                    key={ticket.id}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-slate-500 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-mono text-xs text-slate-500 font-semibold">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xl font-bold font-mono text-amber-300">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-sm font-medium text-slate-200">
                          {ticket.patientName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {isKh ? ticket.stationDisplayNameKh : ticket.stationDisplayNameEn}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      {ticket.priority !== 'NORMAL' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40">
                          {ticket.priority === 'URGENT_EMERGENCY'
                            ? t.signage.priorityEmergency
                            : t.signage.priorityElderly}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>~{ticket.waitTimeMinutes} min</span>
                        </span>
                      )}

                      {/* Quick Call Button for Staff */}
                      <button
                        onClick={() => handleCallTicket(ticket.id, ticket.station)}
                        className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/60 border border-blue-500/40 text-blue-300 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>{t.common.view}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Continuous Scrolling Broadcast Marquee */}
      <footer className="bg-[#0B1120] border-t border-slate-800 px-6 py-2.5 flex items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-bold text-amber-400 whitespace-nowrap">
          <ShieldCheck className="w-4 h-4" />
          <span>{t.signage.marqueeTitle}:</span>
        </div>
        <div className="overflow-hidden flex-1 relative whitespace-nowrap">
          <div className="inline-block animate-marquee pl-full">
            {boardData?.announcements && boardData.announcements.length > 0 ? (
              boardData.announcements
                .map((a) => (isKh ? `${a.titleKh}: ${a.contentKh}` : `${a.titleEn}: ${a.contentEn}`))
                .join('   |   ')
            ) : (
              <span>
                {isKh
                  ? 'សូមអញ្ជើញរង់ចាំការហៅលេខតាមបន្ទប់ពិគ្រោះនីមួយៗ។ គ្លីនិកសូមរក្សាសិទ្ធិអាទិភាពសម្រាប់អ្នកជំងឺសង្គ្រោះបន្ទាន់ មនុស្សចាស់ និងស្ត្រីមានផ្ទៃពោះ។'
                  : 'Please wait for your ticket number to be called on the display. Priority is granted to emergency, elderly, and maternal cases.'}
              </span>
            )}
          </div>
        </div>
      </footer>

      {/* Self-Service Kiosk Check-In Modal */}
      {showKioskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                <span>{t.signage.issueModalTitle}</span>
              </h3>
              <button
                onClick={() => setShowKioskModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                {t.common.close}
              </button>
            </div>

            <form onSubmit={handleIssueKioskTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.signage.inputPatientName}
                </label>
                <input
                  type="text"
                  required
                  value={kioskPatientName}
                  onChange={(e) => setKioskPatientName(e.target.value)}
                  placeholder={isKh ? 'បញ្ចូលឈ្មោះអ្នកជំងឺ...' : 'Enter patient name...'}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.signage.selectDepartment}
                </label>
                <select
                  value={kioskDepartment}
                  onChange={(e) => setKioskDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500 text-sm"
                >
                  <option value="CONSULTATION">{t.signage.deptConsultation}</option>
                  <option value="LABORATORY">{t.signage.deptLaboratory}</option>
                  <option value="IMAGING">{t.signage.deptImaging}</option>
                  <option value="PHARMACY">{t.signage.deptPharmacy}</option>
                  <option value="CASHIER">{t.signage.deptCashier}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.signage.selectPriority}
                </label>
                <select
                  value={kioskPriority}
                  onChange={(e) => setKioskPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500 text-sm"
                >
                  <option value="NORMAL">{t.signage.priorityNormal}</option>
                  <option value="ELDERLY_PREGNANT">{t.signage.priorityElderly}</option>
                  <option value="URGENT_EMERGENCY">{t.signage.priorityEmergency}</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowKioskModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium border border-slate-700"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={kioskSubmitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium border border-blue-400/40 disabled:opacity-50"
                >
                  {kioskSubmitting ? t.common.loading : t.signage.printTicketSuccess.slice(0, 16)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
