'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../../components/common/ClinicLogo';
import { playHospitalChime, speakQueueCall } from '../../lib/chime';
import { useLiveSync } from '../../lib/useLiveSync';
import { CheckinModal } from '../../components/patients/CheckinModal';
import {
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
  Activity,
  Plus,
  PlayCircle,
  RotateCcw,
  Sparkles,
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
  isBackendVisit?: boolean;
}

export default function QueuePage() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCall, setActiveCall] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'WAITING' | 'IN_ROOM' | 'COMPLETED'>('ALL');
  const [isTestingSound, setIsTestingSound] = useState(false);

  // Initial fallback mock data
  const defaultMockItems: QueueItem[] = [
    {
      id: 'q-demo-1',
      token: 'A-101',
      patientName: 'Chan Dara (ចាន់ ដារ៉ា)',
      patientCode: 'P-0012',
      department: 'Consultation Room 1',
      doctorName: 'Dr. Houn Vannak',
      room: 'Room 1',
      status: 'WAITING',
      waitTimeMinutes: 12,
      chiefComplaint: 'Acute Fever & Cough',
      isBackendVisit: false,
    },
    {
      id: 'q-demo-2',
      token: 'A-102',
      patientName: 'Sok Mean (សុខ មាន)',
      patientCode: 'P-0015',
      department: 'Consultation Room 2',
      doctorName: 'Dr. Sok Chantha',
      room: 'Room 2',
      status: 'IN_ROOM',
      waitTimeMinutes: 18,
      chiefComplaint: 'Hypertension Follow-Up',
      isBackendVisit: false,
    },
    {
      id: 'q-demo-3',
      token: 'T-201',
      patientName: 'Keo Sopheap (កែវ សុភាព)',
      patientCode: 'P-0018',
      department: 'Triage & Vital Signs',
      doctorName: 'Nurse Bopha',
      room: 'Desk 1',
      status: 'WAITING',
      waitTimeMinutes: 5,
      chiefComplaint: 'Routine Checkup',
      isBackendVisit: false,
    },
  ];

  const [queueItems, setQueueItems] = useState<QueueItem[]>(defaultMockItems);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      const liveVisits = await api.visits.list();
      if (Array.isArray(liveVisits) && liveVisits.length > 0) {
        const mapped: QueueItem[] = liveVisits.map((v: any, index: number) => {
          const waitTime = Math.max(1, Math.round((Date.now() - new Date(v.createdAt).getTime()) / 60000));
          const roomName = v.doctor ? `Room ${v.doctor.fullNameEn?.slice(-1) || '1'}` : 'Triage Room 1';
          return {
            id: v.id,
            token: v.visitCode || `Q-${100 + index}`,
            patientName: v.patient ? `${v.patient.nameEn}${v.patient.nameKh ? ` (${v.patient.nameKh})` : ''}` : 'Patient',
            patientCode: v.patient?.patientCode || 'P-0000',
            department: v.doctor ? `Dr. ${v.doctor.fullNameEn}` : 'Consultation Desk',
            doctorName: v.doctor ? `Dr. ${v.doctor.fullNameEn}` : 'Attending Physician',
            room: roomName,
            status: v.status === 'COMPLETED' ? 'COMPLETED' : v.status === 'IN_CONSULTATION' ? 'IN_ROOM' : 'WAITING',
            waitTimeMinutes: isNaN(waitTime) ? 5 : waitTime,
            chiefComplaint: v.reason || 'Medical Consultation',
            isBackendVisit: true,
          };
        });

        // Preserve CALLING status if active
        setQueueItems((prev) => {
          const activeCallingId = activeCall?.id;
          return mapped.map((m) => {
            if (m.id === activeCallingId && m.status !== 'COMPLETED') {
              return { ...m, status: 'CALLING' };
            }
            return m;
          });
        });
      }
    } catch {
      // Retain existing local queue state on network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  // Real-time automatic sync listener without requiring page reload
  useLiveSync(fetchQueueData);

  // Play Audible Hospital Broadcast Chime + Spoken Voice Announcement
  const handlePlayHospitalChime = (item?: QueueItem) => {
    if (soundEnabled) {
      playHospitalChime();
      const target = item || activeCall;
      if (target) {
        setTimeout(() => {
          speakQueueCall(target.token, target.room || target.department, isKm);
        }, 900);
      }
    }
  };

  // Test Audio Chime & Speech Announcement Anytime
  const handleTestChimeAndVoice = () => {
    setIsTestingSound(true);
    playHospitalChime();
    setTimeout(() => {
      speakQueueCall('A-101', isKm ? 'បន្ទប់ពិគ្រោះទី ១' : 'Consultation Room 1', isKm);
      setTimeout(() => setIsTestingSound(false), 2000);
    }, 900);
  };

  // Call Patient
  const handleCallPatient = (item: QueueItem) => {
    handlePlayHospitalChime(item);
    setActiveCall(item);
    setQueueItems((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'CALLING' } : q))
    );
  };

  // Move Patient to Consultation Room (In-Service)
  const handleMoveToRoom = async (item: QueueItem) => {
    setQueueItems((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'IN_ROOM' } : q))
    );
    if (activeCall?.id === item.id) {
      setActiveCall(null);
    }
    if (item.isBackendVisit) {
      try {
        await api.visits.updateStatus(item.id, 'IN_CONSULTATION');
      } catch {
        // silent fallback
      }
    }
  };

  // Complete Patient Consultation
  const handleCompletePatient = async (itemId: string) => {
    const target = queueItems.find((q) => q.id === itemId);
    setQueueItems((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'COMPLETED' } : q))
    );
    if (activeCall?.id === itemId) {
      setActiveCall(null);
    }
    if (target?.isBackendVisit) {
      try {
        await api.visits.updateStatus(itemId, 'COMPLETED');
      } catch {
        // silent fallback
      }
    }
  };

  // Re-queue Patient Back to Waiting
  const handleRequeuePatient = async (item: QueueItem) => {
    setQueueItems((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'WAITING' } : q))
    );
    if (item.isBackendVisit) {
      try {
        await api.visits.updateStatus(item.id, 'WAITING');
      } catch {
        // silent fallback
      }
    }
  };

  // Call Next Waiting Patient
  const handleCallNextWaiting = () => {
    const nextWaiting = queueItems.find((q) => q.status === 'WAITING');
    if (nextWaiting) {
      handleCallPatient(nextWaiting);
    } else {
      // If queue is empty, prompt user to check in a patient
      setIsCheckinOpen(true);
    }
  };

  // Populate Demo Queue Tokens if Empty
  const handleAddDemoPatients = () => {
    const freshDemo: QueueItem[] = [
      {
        id: `q-demo-${Date.now()}-1`,
        token: `A-${Math.floor(100 + Math.random() * 899)}`,
        patientName: isKm ? 'ចាន់ ដារ៉ា (Chan Dara)' : 'Chan Dara',
        patientCode: 'P-0012',
        department: 'Consultation Room 1',
        doctorName: 'Dr. Houn Vannak',
        room: 'Room 1',
        status: 'WAITING',
        waitTimeMinutes: 2,
        chiefComplaint: isKm ? 'ក្ដៅខ្លួន និងក្អក ៣ថ្ងៃ' : 'Acute Fever & Cough',
        isBackendVisit: false,
      },
      {
        id: `q-demo-${Date.now()}-2`,
        token: `B-${Math.floor(100 + Math.random() * 899)}`,
        patientName: isKm ? 'សុខ មាន (Sok Mean)' : 'Sok Mean',
        patientCode: 'P-0015',
        department: 'Consultation Room 2',
        doctorName: 'Dr. Sok Chantha',
        room: 'Room 2',
        status: 'WAITING',
        waitTimeMinutes: 5,
        chiefComplaint: isKm ? 'លើសសម្ពាធឈាម' : 'Hypertension Checkup',
        isBackendVisit: false,
      },
    ];
    setQueueItems((prev) => [...freshDemo, ...prev]);
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
  const completedCount = queueItems.filter((q) => q.status === 'COMPLETED').length;

  const filteredQueueItems = useMemo(() => {
    if (activeTab === 'WAITING') return queueItems.filter((q) => q.status === 'WAITING');
    if (activeTab === 'IN_ROOM') return queueItems.filter((q) => q.status === 'IN_ROOM' || q.status === 'CALLING');
    if (activeTab === 'COMPLETED') return queueItems.filter((q) => q.status === 'COMPLETED');
    return queueItems;
  }, [queueItems, activeTab]);

  return (
    <div className={`space-y-6 max-w-7xl mx-auto pb-12 ${isFullscreen ? 'p-6 bg-slate-900 text-white min-h-screen' : ''}`}>
      {/* Header Bar */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors ${
          isFullscreen ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-2xs'
        }`}
      >
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

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh Queue Button */}
          <button
            type="button"
            onClick={fetchQueueData}
            disabled={loading}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
              isFullscreen
                ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={isKm ? 'ផ្ទុកទិន្នន័យឡើងវិញ' : 'Refresh Queue'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
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

          {/* Test Sound Button */}
          <button
            type="button"
            onClick={handleTestChimeAndVoice}
            disabled={isTestingSound}
            className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
              isTestingSound
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold animate-pulse'
                : isFullscreen
                ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={isKm ? 'តេស្តសំឡេងកណ្ដឹង & ប្រកាសហៅ' : 'Test Audio Chime & Announcement'}
          >
            <PlayCircle className="w-4 h-4 text-amber-600" />
            <span className="text-[11px] hidden md:inline">
              {isTestingSound ? (isKm ? 'កំពុងបន្លឺសំឡេង...' : 'Playing...') : (isKm ? 'តេស្តសំឡេង' : 'Test Sound')}
            </span>
          </button>

          {/* Direct Check-In Patient Button */}
          <button
            type="button"
            onClick={() => setIsCheckinOpen(true)}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{isKm ? 'បញ្ចូលអ្នកជំងឺក្នុងជួរ' : '+ Check-in Patient'}</span>
          </button>

          {/* Call Next Patient Button */}
          <button
            type="button"
            onClick={handleCallNextWaiting}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors ${
              waitingCount > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>
              {waitingCount > 0
                ? t.queue.callNext
                : isKm
                ? 'ហៅវេនបន្ទាប់ (ជួរទទេ)'
                : 'Call Next (Empty)'}
            </span>
          </button>

          {/* Fullscreen TV Mode Toggle */}
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
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-2xl border-2 border-teal-500 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-amber-400 flex flex-col items-center justify-center shrink-0 shadow-lg">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-mono text-amber-300 font-bold">
                  {t.queue.token}
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  {activeCall.token}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold font-mono uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-2 bg-slate-900 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-3 bg-slate-900 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1 h-1.5 bg-slate-900 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                    <span>{t.queue.calling}</span>
                  </span>
                  <span className="text-xs text-teal-100 font-mono font-semibold bg-white/10 px-2 py-0.5 rounded">
                    {activeCall.patientCode}
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white mt-1 truncate">
                  {activeCall.patientName}
                </h2>
                <p className="text-xs sm:text-sm text-teal-100 mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span>{t.queue.pleaseProceedTo}:</span>
                  <span className="font-bold underline text-amber-300">
                    {activeCall.department} ({activeCall.room})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handlePlayHospitalChime(activeCall)}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold border border-white/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-amber-300" />
                <span>{t.queue.recall}</span>
              </button>
              <button
                type="button"
                onClick={() => handleMoveToRoom(activeCall)}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{isKm ? 'ចូលបន្ទប់ពិគ្រោះ' : 'Proceed to Room'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCompletePatient(activeCall.id)}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800/80 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold border border-white/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isKm ? 'បញ្ចប់' : 'Finish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('WAITING')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'WAITING'
              ? 'ring-2 ring-teal-600 bg-teal-50/30 border-teal-300'
              : isFullscreen
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
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

        <div
          onClick={() => setActiveTab('IN_ROOM')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'IN_ROOM'
              ? 'ring-2 ring-amber-500 bg-amber-50/30 border-amber-300'
              : isFullscreen
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
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

        <div
          onClick={() => setActiveTab('COMPLETED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'COMPLETED'
              ? 'ring-2 ring-indigo-500 bg-indigo-50/30 border-indigo-300'
              : isFullscreen
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>{isKm ? 'បានបញ្ចប់ការពិគ្រោះ' : 'Completed Encounters'}</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
            {completedCount}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">
            {isKm ? 'ពិនិត្យរួចរាល់' : 'Finished consultations'}
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

      {/* Main Queue Board Table */}
      <div className={`rounded-2xl border overflow-hidden ${isFullscreen ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-2xs'}`}>
        {/* Table Filter Tabs & Title */}
        <div
          className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isFullscreen ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              {isKm ? 'តារាងជួរអ្នកជំងឺផ្ទាល់' : 'Live Outpatient Queue Board'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isKm ? 'ទាំងអស់' : 'All'} ({queueItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('WAITING')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'WAITING'
                  ? 'bg-white text-teal-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isKm ? 'រង់ចាំ' : 'Waiting'} ({waitingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('IN_ROOM')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'IN_ROOM'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isKm ? 'កំពុងពិគ្រោះ' : 'In-Service'} ({inServiceCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isKm ? 'បានបញ្ចប់' : 'Completed'} ({completedCount})
            </button>
          </div>
        </div>

        {/* Empty State when 0 items in current filter */}
        {filteredQueueItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-xs">
              <Users className="w-7 h-7 text-teal-700" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className={`text-sm sm:text-base font-bold ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
                {activeTab === 'WAITING'
                  ? isKm
                    ? 'មិនមានអ្នកជំងឺកំពុងរង់ចាំហៅឡើយ'
                    : 'No patients currently waiting in queue'
                  : isKm
                  ? 'មិនមានទិន្នន័យអ្នកជំងឺក្នុងបញ្ជីនេះទេ'
                  : 'No records found in this view'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isKm
                  ? 'អ្នកជំងឺមុនៗបានបញ្ចប់ការពិគ្រោះ ឬចូលបន្ទប់រួចរាល់ហើយ។ លោកអ្នកអាចចុចប៊ូតុងខាងក្រោមដើម្បីបញ្ចូលអ្នកជំងឺថ្មី ឬហៅឡើងវិញ។'
                  : 'All previous visits are completed. Click below to check in a new patient or test audio announcements.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCheckinOpen(true)}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isKm ? 'បញ្ចូលអ្នកជំងឺក្នុងជួរ (New Check-in)' : 'Check-in New Patient'}</span>
              </button>
              <button
                type="button"
                onClick={handleTestChimeAndVoice}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4 text-slate-500" />
                <span>{isKm ? 'តេស្តសំឡេងកណ្ដឹង & ហៅជាសំឡេង' : 'Test Call Audio'}</span>
              </button>
              <button
                type="button"
                onClick={handleAddDemoPatients}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>{isKm ? 'បញ្ចូលទិន្នន័យតេស្ត' : 'Add Test Queue'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead
                className={`border-b text-[11px] font-bold uppercase tracking-wider text-slate-400 ${
                  isFullscreen ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'
                }`}
              >
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
                {filteredQueueItems.map((item) => {
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
                            : 'bg-teal-50/70 font-medium'
                          : isFullscreen
                          ? 'hover:bg-slate-700/50'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Token # */}
                      <td className="px-4 sm:px-6 py-3.5 font-mono font-bold text-sm">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-mono font-black">
                          {item.token}
                        </span>
                      </td>

                      {/* Patient Name & Code */}
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className={`font-semibold ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
                          {item.patientName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.patientCode} • {item.chiefComplaint}
                        </div>
                      </td>

                      {/* Department / Room */}
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className={`font-medium ${isFullscreen ? 'text-slate-200' : 'text-slate-800'}`}>
                          {item.department}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.doctorName} ({item.room})
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 sm:px-6 py-3.5">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-medium border border-teal-200">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            {t.queue.completed}
                          </span>
                        )}
                      </td>

                      {/* Wait Time */}
                      <td className="px-4 sm:px-6 py-3.5 font-mono text-slate-400">
                        {item.waitTimeMinutes} {isKm ? 'នាទី' : 'min'}
                      </td>

                      {/* Row Action Controls */}
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                          {/* WAITING Actions */}
                          {isWaiting && (
                            <button
                              type="button"
                              onClick={() => handleCallPatient(item)}
                              className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span>{isKm ? 'ហៅលេខ' : 'Call Token'}</span>
                            </button>
                          )}

                          {/* CALLING Actions */}
                          {isCalling && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePlayHospitalChime(item)}
                                className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                                title="Recall sound"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>{t.queue.recall}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveToRoom(item)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>{isKm ? 'ចូលពិគ្រោះ' : 'To Room'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompletePatient(item.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                              >
                                <span>{isKm ? 'បញ្ចប់' : 'Finish'}</span>
                              </button>
                            </>
                          )}

                          {/* IN_ROOM Actions */}
                          {isInRoom && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePlayHospitalChime(item)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                                title="Announce call again"
                              >
                                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>{t.queue.recall}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCompletePatient(item.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isKm ? 'បញ្ចប់ពិគ្រោះ' : 'Complete'}</span>
                              </button>
                            </>
                          )}

                          {/* COMPLETED Actions: Recall or Re-queue */}
                          {isCompleted && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePlayHospitalChime(item)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                                title={isKm ? 'ហៅលេខឡើងវិញ' : 'Announce Token Again'}
                              >
                                <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                                <span>{isKm ? 'ហៅឡើងវិញ' : 'Recall'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequeuePatient(item)}
                                className="px-2.5 py-1 border border-slate-200 hover:bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                                title={isKm ? 'ដាក់ចូលជួររង់ចាំវិញ' : 'Put Back into Waiting Queue'}
                              >
                                <RotateCcw className="w-3 h-3 text-indigo-600" />
                                <span>{isKm ? 'ដាក់ចូលជួរវិញ' : 'Re-queue'}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-In Modal Dialog */}
      <CheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        onSuccess={() => {
          setIsCheckinOpen(false);
          fetchQueueData();
        }}
      />
    </div>
  );
}
