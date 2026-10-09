'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../../components/common/ClinicLogo';
import {
  Monitor,
  Volume2,
  VolumeX,
  Users,
  Clock,
  ArrowRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  RefreshCw,
  Bell,
  Stethoscope,
  Pill,
  CreditCard,
  Activity,
} from 'lucide-react';

interface QueueItem {
  id: string;
  token: string;
  patientName: string;
  patientCode: string;
  department: string;
  doctorName?: string;
  room: string;
  status: 'WAITING' | 'CALLING' | 'IN_ROOM' | 'COMPLETED';
  waitTimeMinutes: number;
  chiefComplaint?: string;
}

export default function QueuePage() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCall, setActiveCall] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Initial realistic clinical queue tokens
  const [queueItems, setQueueItems] = useState<QueueItem[]>([
    {
      id: 'q-1',
      token: 'A-101',
      patientName: 'Chan Dara (ចាន់ ដារ៉ា)',
      patientCode: 'P-0012',
      department: 'Consultation Room 1',
      doctorName: 'Dr. Heng Rotana',
      room: 'Room 1',
      status: 'CALLING',
      waitTimeMinutes: 12,
      chiefComplaint: 'Acute Fever & Cough',
    },
    {
      id: 'q-2',
      token: 'A-102',
      patientName: 'Sok Mean (សុខ មាន)',
      patientCode: 'P-0015',
      department: 'Consultation Room 2',
      doctorName: 'Dr. Sok Chantha',
      room: 'Room 2',
      status: 'IN_ROOM',
      waitTimeMinutes: 18,
      chiefComplaint: 'Hypertension Follow-Up',
    },
    {
      id: 'q-3',
      token: 'T-201',
      patientName: 'Keo Sopheap (កែវ សុភាព)',
      patientCode: 'P-0018',
      department: 'Triage & Vital Signs',
      doctorName: 'Nurse Bopha',
      room: 'Desk 1',
      status: 'WAITING',
      waitTimeMinutes: 5,
      chiefComplaint: 'Routine Checkup',
    },
    {
      id: 'q-4',
      token: 'P-301',
      patientName: 'Lim Seng (លីម សេង)',
      patientCode: 'P-0008',
      department: 'Pharmacy Counter',
      doctorName: 'Pharm. Srun Vichheka',
      room: 'Counter 3',
      status: 'WAITING',
      waitTimeMinutes: 8,
      chiefComplaint: 'Prescription Dispensation',
    },
    {
      id: 'q-5',
      token: 'C-401',
      patientName: 'Meas Sreynich (មាស ស្រីនិច)',
      patientCode: 'P-0009',
      department: 'Cashier & KHQR Billing',
      doctorName: 'Cashier Keo Vanna',
      room: 'Billing 1',
      status: 'WAITING',
      waitTimeMinutes: 4,
      chiefComplaint: 'KHQR Payment Settlement',
    },
  ]);

  // Two-tone Hospital Audio Chime using Web Audio API (Zero external mp3 needed)
  const playHospitalChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Gentle C5 (523.25 Hz) followed by E5 (659.25 Hz) chime
      playTone(523.25, 0, 0.4);
      playTone(659.25, 0.35, 0.6);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const handleCallPatient = (item: QueueItem) => {
    playHospitalChime();
    setActiveCall(item);
    setQueueItems((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'CALLING' } : q))
    );
  };

  const handleCompletePatient = (itemId: string) => {
    setQueueItems((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'COMPLETED' } : q))
    );
    if (activeCall?.id === itemId) {
      setActiveCall(null);
    }
  };

  const handleCallNextWaiting = () => {
    const nextWaiting = queueItems.find((q) => q.status === 'WAITING');
    if (nextWaiting) {
      handleCallPatient(nextWaiting);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const waitingCount = queueItems.filter((q) => q.status === 'WAITING').length;
  const inServiceCount = queueItems.filter((q) => q.status === 'IN_ROOM' || q.status === 'CALLING').length;

  return (
    <div className={`space-y-6 max-w-7xl mx-auto pb-12 ${isFullscreen ? 'p-6 bg-slate-900 text-white min-h-screen' : ''}`}>
      {/* Header Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ${
        isFullscreen ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <ClinicLogo variant="icon" size="md" />
          <div>
            <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
              {t.queue.title}
            </h1>
            <p className={`text-xs mt-0.5 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.queue.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-teal-50 border-teal-200 text-teal-800 font-semibold'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span className="text-[11px] hidden sm:inline">
              {soundEnabled ? (isKm ? 'សំឡេងកណ្ដឹង: បើក' : 'Audio: ON') : (isKm ? 'សំឡេងកណ្ដឹង: បិទ' : 'Audio: OFF')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCallNextWaiting}
            disabled={waitingCount === 0}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            <span>{t.queue.callNext}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-colors ${
              isFullscreen
                ? 'bg-amber-500 text-slate-900 border-amber-400 font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isFullscreen ? t.queue.exitDisplay : t.queue.displayMode}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Prominent "Now Calling" Announcer Banner */}
      {activeCall && (
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-6 text-white shadow-2xl border-2 border-teal-500 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-amber-400 flex flex-col items-center justify-center shrink-0 shadow-lg">
                <span className="text-[10px] uppercase tracking-wider font-mono text-amber-300 font-bold">
                  {t.queue.token}
                </span>
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {activeCall.token}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-900 text-[10px] font-bold font-mono uppercase tracking-wide">
                    {t.queue.calling}
                  </span>
                  <span className="text-xs text-teal-100 font-mono">
                    {activeCall.patientCode}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {activeCall.patientName}
                </h2>
                <p className="text-sm text-teal-100 mt-0.5 flex items-center gap-1.5">
                  <span>{t.queue.pleaseProceedTo}:</span>
                  <span className="font-bold underline text-amber-300">
                    {activeCall.department} ({activeCall.room})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => playHospitalChime()}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold border border-white/20 transition-colors flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-amber-300" />
                <span>{t.queue.recall}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCompletePatient(activeCall.id)}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isKm ? 'បានចូលពិគ្រោះ' : 'Proceed to Room'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isFullscreen ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xs'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{t.queue.totalInQueue}</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
            {waitingCount}
          </div>
          <span className="text-[10px] text-teal-600 font-medium">
            {isKm ? 'កំពុងរង់ចាំហៅ' : 'Awaiting calling'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isFullscreen ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xs'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{isKm ? 'កំពុងបម្រើសេវា' : 'Active In-Service'}</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
            {inServiceCount}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">
            {isKm ? 'ក្នុងបន្ទប់ពិគ្រោះ/បញ្ជរ' : 'In rooms / counters'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isFullscreen ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xs'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{t.queue.averageWaitTime}</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
            ~ 11 {isKm ? 'នាទី' : 'min'}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">
            {isKm ? 'លឿនជាងមធ្យម 20%' : '20% faster than SLA'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${isFullscreen ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xs'}`}>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{isKm ? 'បន្ទប់ពិគ្រោះសកម្ម' : 'Active Rooms'}</span>
            <Stethoscope className="w-4 h-4 text-emerald-600" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
            4 / 5
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            {isKm ? 'វេជ្ជបណ្ឌិត & បុគ្គលិកកំពុងបម្រើ' : 'Doctors & Staff Active'}
          </span>
        </div>
      </div>

      {/* Main Queue Token Table */}
      <div className={`rounded-2xl border overflow-hidden ${isFullscreen ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xs'}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isFullscreen ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              {isKm ? 'តារាងជួរអ្នកជំងឺផ្ទាល់' : 'Live Outpatient Queue Board'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {queueItems.length} {isKm ? 'នាក់ក្នុងប្រព័ន្ធ' : 'total encounters'}
          </span>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className={`border-b text-[11px] font-bold uppercase tracking-wider text-slate-400 ${
              isFullscreen ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'
            }`}>
              <tr>
                <th className="px-4 sm:px-6 py-3 font-mono">{t.queue.token}</th>
                <th className="px-4 sm:px-6 py-3">{t.queue.patient}</th>
                <th className="px-4 sm:px-6 py-3">{t.queue.department}</th>
                <th className="px-4 sm:px-6 py-3">{t.queue.status}</th>
                <th className="px-4 sm:px-6 py-3 font-mono">{t.queue.averageWaitTime}</th>
                <th className="px-4 sm:px-6 py-3 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isFullscreen ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {queueItems.map((item) => {
                const isWaiting = item.status === 'WAITING';
                const isCalling = item.status === 'CALLING';
                const isInRoom = item.status === 'IN_ROOM';
                const isCompleted = item.status === 'COMPLETED';

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isCalling
                        ? isFullscreen
                          ? 'bg-teal-900/30'
                          : 'bg-teal-50/60'
                        : isFullscreen
                        ? 'hover:bg-slate-700/50'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-sm">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-mono font-black">
                        {item.token}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
                        {item.patientName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.patientCode} • {item.chiefComplaint}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${isFullscreen ? 'text-slate-200' : 'text-slate-800'}`}>
                        {item.department}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.doctorName} ({item.room})
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isCalling && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          {t.queue.calling}
                        </span>
                      )}
                      {isInRoom && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {t.queue.inRoom}
                        </span>
                      )}
                      {isWaiting && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          {t.queue.waiting}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          {t.queue.completed}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {item.waitTimeMinutes} {isKm ? 'នាទី' : 'min'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isWaiting && (
                        <button
                          type="button"
                          onClick={() => handleCallPatient(item)}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1"
                        >
                          <Bell className="w-3 h-3" />
                          <span>{t.queue.callNext}</span>
                        </button>
                      )}
                      {isCalling && (
                        <button
                          type="button"
                          onClick={() => handleCompletePatient(item.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isKm ? 'បញ្ចប់' : 'Finish'}</span>
                        </button>
                      )}
                      {isInRoom && (
                        <button
                          type="button"
                          onClick={() => handleCompletePatient(item.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          {isKm ? 'បញ្ចប់ពិគ្រោះ' : 'Discharge'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
