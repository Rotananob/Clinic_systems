'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../common/ClinicLogo';
import { QRCodeSVG } from 'qrcode.react';
import { buildLiveAbaKhqr } from '../../lib/khqr';
import {
  QrCode,
  Volume2,
  Printer,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  Building2,
  Users,
  Mic,
  Activity,
  Stethoscope,
  Radio,
  FileText,
  BadgeCheck,
  RefreshCw,
  Lock,
  HardDrive,
  Copy,
  ChevronDown,
  ChevronUp,
  Code2,
  Play,
  Pause,
} from 'lucide-react';

type ConsoleTab = 'khqr' | 'voice' | 'queue' | 'hardware';

export const LandingHero: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const router = useRouter();

  // Clinic subdomain registration input state
  const [clinicInput, setClinicInput] = useState('');
  const [activeTab, setActiveTab] = useState<ConsoleTab>('khqr');

  // Auto-Showcase Carousel state
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [autoProgress, setAutoProgress] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 3D Parallax Tilt container ref (Uses GPU CSS variables for 120 FPS zero-lag tracking)
  const cardRef = useRef<HTMLDivElement>(null);

  // Mode 1: KHQR Real Live Scannable Cockpit
  const [customMerchantName, setCustomMerchantName] = useState('NOB ROTANA');
  const [selectedPresetAmount, setSelectedPresetAmount] = useState('0.01');
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [khqrCurrency, setKhqrCurrency] = useState<'USD' | 'KHR'>('USD');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [showTagBreakdown, setShowTagBreakdown] = useState(false);
  const [isPlayingChime, setIsPlayingChime] = useState(false);

  // Mode 2: Voice & Gemini SOAP Interactive State
  const [isRecording, setIsRecording] = useState(false);
  const [soapStep, setSoapStep] = useState(2); // 0=idle, 1=listening, 2=parsed
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Visoth Ratha, MD');

  // Mode 3: Smart Khmer Queue Interactive State
  const [currentTicket, setCurrentTicket] = useState(42);
  const [currentPatient, setCurrentPatient] = useState('លោក សុខ វិសាល - Sok Visal');
  const [currentRoom, setCurrentRoom] = useState('បន្ទប់ពិគ្រោះលេខ ០១ - Room 01');
  const [isCallingAudio, setIsCallingAudio] = useState(false);

  // Compute live slug preview memoized
  const slugPreview = useMemo(() => {
    return clinicInput.trim()
      ? clinicInput
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 24)
      : 'your-clinic';
  }, [clinicInput]);

  // Compute active locked amount
  const activeAmount = useMemo(() => {
    return isCustomAmount
      ? customAmountInput.trim() || (khqrCurrency === 'KHR' ? '400' : '0.01')
      : selectedPresetAmount;
  }, [isCustomAmount, customAmountInput, khqrCurrency, selectedPresetAmount]);

  // Generate 100% compliant permanent live ABA KHQR with memoization
  const activeLiveKhqr = useMemo(() => {
    return buildLiveAbaKhqr({
      merchantName: customMerchantName,
      amount: activeAmount,
      currency: khqrCurrency,
      useRawSessionIfDefault: true,
    });
  }, [customMerchantName, activeAmount, khqrCurrency]);

  // Tab cycling sequence
  const tabsList: ConsoleTab[] = useMemo(() => ['khqr', 'voice', 'queue', 'hardware'], []);

  // Handle Tab Switch with manual interaction pause
  const handleSelectTab = useCallback((tab: ConsoleTab) => {
    setActiveTab(tab);
    setAutoProgress(0);
    setIsUserInteracting(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsUserInteracting(false);
    }, 10000); // Resume auto-cycle after 10 seconds of inactivity
  }, []);

  // Auto-Showcase Timer
  useEffect(() => {
    if (!isAutoPlay || isUserInteracting) return;

    const intervalTime = 100; // Update progress every 100ms
    const totalDuration = 6000; // 6 seconds per tab
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setAutoProgress((prev) => {
        if (prev >= 100) {
          // Switch to next tab
          setActiveTab((currentTab) => {
            const currentIndex = tabsList.indexOf(currentTab);
            const nextIndex = (currentIndex + 1) % tabsList.length;
            return tabsList[nextIndex];
          });
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isAutoPlay, isUserInteracting, tabsList]);

  // 3D Parallax Mouse Movement Handler (Direct DOM CSS properties - zero React re-renders)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5.5;
    const rotateY = ((x - centerX) / centerX) * 5.5;

    cardRef.current.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
    cardRef.current.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
    cardRef.current.style.setProperty('--gx', `${((x / rect.width) * 100).toFixed(1)}%`);
    cardRef.current.style.setProperty('--gy', `${((y / rect.height) * 100).toFixed(1)}%`);
    cardRef.current.style.setProperty('--go', '0.22');
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsUserInteracting(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsUserInteracting(false);
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rx', '0deg');
    cardRef.current.style.setProperty('--ry', '0deg');
    cardRef.current.style.setProperty('--go', '0');
  }, []);

  // Web Audio Chime & Khmer Speech Synthesis
  const playPaymentSuccessChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
    } catch {
      // Audio not allowed or unavailable
    }
  }, []);

  const playQueueSpeech = useCallback((ticketNum: number, roomStr: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = `សូមអញ្ជើញ លេខ ${ticketNum} ចូល ${roomStr}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'km-KH';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Speech synthesis fallback
    }
  }, []);

  // Copy EMVCo Payload to Clipboard
  const handleCopyPayload = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(activeLiveKhqr.qrString);
        setCopiedPayload(true);
        setTimeout(() => setCopiedPayload(false), 2000);
      }
    } catch {
      // Clipboard write fallback
    }
  };

  // Safe Payment Sound Test
  const handleTestChime = () => {
    setIsPlayingChime(true);
    playPaymentSuccessChime();
    setTimeout(() => setIsPlayingChime(false), 800);
  };

  // Simulate Voice Dictation
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setSoapStep(2);
    } else {
      setIsRecording(true);
      setSoapStep(1);
      setTimeout(() => {
        setIsRecording(false);
        setSoapStep(2);
      }, 2500);
    }
  };

  // Simulate Next Patient Queue Calling
  const handleNextPatient = () => {
    setIsCallingAudio(true);
    const names = [
      'លោក សុខ វិសាល - Sok Visal',
      'កញ្ញា កែវ ចរិយា - Keo Chariya',
      'លោក ហេង រតនា - Heng Rotana',
      'អ្នកស្រី ចាន់ សុភាព - Chan Sopheap',
      'លោក ជា វិបុល - Chea Vibol',
    ];
    const rooms = [
      'បន្ទប់ពិគ្រោះលេខ ០១ - Room 01',
      'បន្ទប់ពិគ្រោះលេខ ០២ - Room 02',
      'បន្ទប់ធ្មេញលេខ ០១ - Dental 01',
      'បន្ទប់ព្យាបាលទូទៅ - OPD Treatment',
    ];
    const nextTicket = currentTicket + 1;
    const nextPatient = names[Math.floor(Math.random() * names.length)];
    const nextRoom = rooms[Math.floor(Math.random() * rooms.length)];
    setCurrentTicket(nextTicket);
    setCurrentPatient(nextPatient);
    setCurrentRoom(nextRoom);
    playQueueSpeech(nextTicket, nextRoom);
    setTimeout(() => {
      setIsCallingAudio(false);
    }, 2400);
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-20 md:pt-14 md:pb-28">
      {/* 3D Atmospheric Cyber Lighting Canvas */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] bg-gradient-to-tr from-teal-500/20 via-emerald-500/15 to-cyan-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[460px] h-[460px] bg-teal-400/10 rounded-full blur-2xl pointer-events-none -z-10 animate-ambient-drift" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================================== */}
        {/* Header Hero Branding with Interactive 3D Emblem */}
        {/* ============================================================== */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
          {/* Top Promotion Ribbon */}
          <div className="max-w-2xl mx-auto mb-2">
            <div className="p-2 sm:p-2.5 bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border border-amber-300/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shadow-2xs">
              <div className="flex items-center gap-2 text-stone-800 font-medium">
                <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-black text-[10px] tracking-wider uppercase shrink-0">
                  {isKm ? 'ប្រូម៉ូសិនពិសេស' : 'Special Offer'}
                </span>
                <span className="font-sans text-[11px] sm:text-xs text-left">
                  {isKm
                    ? 'ចុះឈ្មោះថ្ងៃនេះ ទទួលបានការប្រើប្រាស់ Free Starter ៥ KHQR ក្នុងមួយថ្ងៃ + សាកល្បង AI Gemini និង Voice Queue ១៤ ថ្ងៃពេញ!'
                    : 'Claim Free Starter Tier forever 5 KHQR/day + 14-day full AI Gemini & Voice Queue trial!'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-teal-900 bg-white px-2 py-0.5 rounded-xl border border-stone-200 shrink-0">
                {isKm ? 'គ្មានកាតធនាគារ' : 'No Credit Card'}
              </span>
            </div>
          </div>

          {/* 3D Brand Logo Showcase */}
          <div className="inline-flex justify-center mb-1">
            <ClinicLogo variant="hero3d" size="hero" showSubtitle={false} interactive={true} />
          </div>

          {/* Announcement Pill */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#DCD5C5] text-stone-800 text-xs font-semibold shadow-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-sans">
                {isKm
                  ? 'X-Clinic 2.0 • PaaS វេជ្ជសាស្ត្រជំនាន់ថ្មី • Bakong Tag 01=12 & Gemini 3.8 AI'
                  : 'X-Clinic 2.0 • Next-Gen Medical PaaS • Bakong Tag 01=12 & Gemini 3.8 AI'}
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-900 tracking-tight leading-tight md:leading-tight font-sans">
            {isKm
              ? 'ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក និងទូទាត់ប្រាក់ KHQR ទំនើបឈានមុខគេនៅកម្ពុជា'
              : 'Next-Generation Clinical Operating System & Dynamic KHQR Platform'}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto font-sans">
            {isKm
              ? 'ដំណោះស្រាយវេជ្ជសាស្ត្រ All-in-One សម្រាប់គ្លីនិកឯកជន និងមន្ទីរសម្រាកព្យាបាលទូទាំងប្រទេសកម្ពុជា៖ បង្កើត Tag 01=12 Dynamic KHQR ត្រឹម ២ វិនាទី, កត់ត្រាវេជ្ជសាស្ត្រជាសំឡេងតាម Gemini 3.8 Flash, ហៅអ្នកជំងឺជាសំឡេងខ្មែរ, និងបាញ់ដំណឹង Telegram Topics ស្វ័យប្រវត្តិ។'
              : 'Complete all-in-one PaaS workspace for private clinics in Cambodia: 2-second dynamic Tag 01=12 KHQR generation, Gemini 3.8 Flash voice dictation to structured SOAP, native Khmer queue calling, and automated Telegram operations.'}
          </p>

          {/* Interactive Fast Clinic Registration Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                router.push(
                  `/register${
                    clinicInput.trim()
                      ? `?clinicName=${encodeURIComponent(clinicInput.trim())}`
                      : ''
                  }`
                );
              }}
              className="p-2 bg-white border border-[#D5CDBD] rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-teal-700 transition-all space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="pl-2.5 text-teal-800">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={clinicInput}
                  onChange={(e) => setClinicInput(e.target.value)}
                  placeholder={
                    isKm
                      ? 'បញ្ចូលឈ្មោះគ្លីនិករបស់អ្នក ឧទាហរណ៍ គ្លីនិក សុខភាព...'
                      : 'Enter your clinic name (e.g. Sokhapheap Clinic)...'
                  }
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm font-semibold text-stone-900 focus:outline-hidden placeholder:text-stone-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  <span>{isKm ? 'ចុះឈ្មោះភ្លាមៗ' : 'Get Started'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subdomain slug preview indicator */}
              <div className="px-3 pb-0.5 text-left flex items-center justify-between text-[11px] text-stone-500 font-mono border-t border-stone-100 pt-1.5">
                <div className="flex items-center gap-1 truncate">
                  <span className="text-teal-800 font-semibold">Workspace URL:</span>
                  <span className="text-stone-700 font-bold bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E5DEC1]">
                    https://{slugPreview}.clinic.com
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold hidden sm:inline">
                  Free 5 KHQR/day
                </span>
              </div>
            </form>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 hover-wobble"
            >
              <span>{isKm ? 'ចាប់ផ្តើមគម្រោង Free សាកល្បង' : 'Start 14-Day Free Evaluation'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-800 border border-[#DFD6C6] rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors active:scale-95"
            >
              <Users className="w-4 h-4 text-stone-600" />
              <span>{isKm ? 'ចូលប្រើប្រាស់គណនី' : 'Sign In to Portal'}</span>
            </Link>
          </div>

          {/* Hardware & Standard Compliance Points */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-4 text-left font-sans">
            <div className="bg-white/80 p-3 rounded-2xl border border-[#E7DFCF] shadow-2xs hover-wobble transition-transform">
              <div className="text-sm sm:text-base font-extrabold text-teal-800">2-Second Speed</div>
              <div className="text-[11px] text-stone-500 font-medium">Tag 01=12 Dynamic KHQR</div>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-[#E7DFCF] shadow-2xs hover-wobble transition-transform">
              <div className="text-sm sm:text-base font-extrabold text-teal-800">100% Direct ABA</div>
              <div className="text-[11px] text-stone-500 font-medium">Direct Settlement to Merchant</div>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-[#E7DFCF] shadow-2xs hover-wobble transition-transform">
              <div className="text-sm sm:text-base font-extrabold text-teal-800">Gemini 3.8 AI</div>
              <div className="text-[11px] text-stone-500 font-medium">Khmer Voice to SOAP Note</div>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-[#E7DFCF] shadow-2xs hover-wobble transition-transform">
              <div className="text-sm sm:text-base font-extrabold text-teal-800">MoH Compliant</div>
              <div className="text-[11px] text-stone-500 font-medium">ICD-11 & Strict Tenant Isolation</div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Next-Gen Cyber-Luxury 3D Spatial Medical Cockpit Console */}
        {/* ============================================================== */}
        <div className="mt-12 max-w-5xl mx-auto perspective-1200 relative">
          {/* Luminous Cyber Neon Aura behind the console */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-emerald-500/25 to-cyan-500/20 rounded-3xl blur-3xl -z-10 animate-neon-aura" />

          {/* The High-Performance 3D Tilt Container */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: 'perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(0)',
              transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="relative bg-gradient-to-b from-[#111A1D] via-[#0B1315] to-[#070C0E] rounded-3xl border border-teal-500/35 shadow-[0_25px_80px_-15px_rgba(13,148,136,0.3)] overflow-hidden transform-gpu preserve-3d will-change-transform"
          >
            {/* Specular Interactive Reflection Sheen (GPU updated via CSS variables) */}
            <div
              className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
              style={{
                background:
                  'radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255, 255, 255, 0.32) 0%, rgba(20, 184, 166, 0.12) 30%, transparent 65%)',
                opacity: 'var(--go, 0)',
              }}
            />

            {/* Cockpit Top Navigation & Real Medical Instrument Tabs */}
            <div className="bg-gradient-to-r from-[#1A2528] via-[#101C1E] to-[#0A1416] text-white px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-teal-500/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-xs" />
                </div>
                <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black tracking-wider text-teal-300 font-mono uppercase">
                    X-Clinic 3D Spatial Live Console
                  </span>
                </div>

                {/* Auto-Showcase Status Pill */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                    isAutoPlay
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-xs'
                      : 'bg-stone-800/80 text-stone-400 border-stone-700'
                  }`}
                  title={isAutoPlay ? 'Auto-Tour: ON (Click to Pause)' : 'Auto-Tour: PAUSED (Click to Play)'}
                >
                  {isAutoPlay ? (
                    <>
                      <Pause className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Auto</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 text-stone-400" />
                      <span>Paused</span>
                    </>
                  )}
                </button>
              </div>

              {/* Console Tactile Mode Switcher with Interactive Spring Pills */}
              <div className="flex items-center gap-1 bg-black/60 p-1.5 rounded-2xl border border-teal-500/30 text-xs overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => handleSelectTab('khqr')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer hover-wobble ${
                    activeTab === 'khqr'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-102'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-200" />
                  <span>Dynamic KHQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('voice')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer hover-wobble ${
                    activeTab === 'voice'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-102'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-teal-200" />
                  <span>Gemini 3.8 AI SOAP</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('queue')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer hover-wobble ${
                    activeTab === 'queue'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-102'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-teal-200" />
                  <span>{isKm ? 'ហៅជួរអ្នកជំងឺ' : 'Khmer Voice Queue'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('hardware')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer hover-wobble ${
                    activeTab === 'hardware'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-102'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5 text-teal-200" />
                  <span>{isKm ? 'បោះពុម្ព 80mm' : '80mm Hardware'}</span>
                </button>
              </div>
            </div>

            {/* Animated Auto-Progress Bar Indicator */}
            {isAutoPlay && (
              <div className="w-full h-0.5 bg-stone-900/80 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 transition-all duration-100 ease-linear"
                  style={{ width: `${autoProgress}%` }}
                />
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 1: DYNAMIC KHQR COCKPIT */}
            {/* ========================================================== */}
            {activeTab === 'khqr' && (
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#0F171A] to-[#0A1214] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-tab-enter">
                {/* Left Side: Interactive Customizer & EMVCo Inspector (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/40 shadow-xs">
                      <Zap className="w-3.5 h-3.5 text-teal-400" />
                      <span>EMVCo Tag 01=12 Dynamic KHQR</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {isKm ? 'QR ពិតប្រាកដ • សុពលភាពអចិន្ត្រៃយ៍' : 'Permanent Live • Zero Polling'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                      {isKm ? 'សាកល្បង KHQR ពិតប្រាកដ និងកែប្រែឈ្មោះគ្លីនិកផ្ទាល់' : 'Interactive KHQR Live Generator & Custom Clinic Demo'}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed font-sans">
                      {isKm
                        ? 'សាកល្បងវាយឈ្មោះគ្លីនិករបស់អ្នក និងជ្រើសរើសចំនួនទឹកប្រាក់ជាក់ស្តែង - QR Code នឹង Update តាមស្តង់ដារ EMVCo ភ្លាមៗ អាចស្កេនបានគ្រប់ធនាគារក្នុងប្រទេសកម្ពុជាដោយគ្មាន Timeout 3 នាទីឡើយ។'
                        : 'Customize your clinic name and transaction amount in real-time. Compliant with EMVCo & Bakong specifications, scannable by all Cambodian banking apps with zero session expiration.'}
                    </p>
                  </div>

                  {/* 1. Custom Clinic / Merchant Name Input */}
                  <div className="p-3.5 bg-stone-900/70 backdrop-blur-md rounded-2xl border border-teal-500/20 shadow-inner space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="clinic-tag59" className="font-bold text-teal-200 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>{isKm ? 'ឈ្មោះគ្លីនិកក្នុង QR - EMVCo Tag 59:' : 'Clinic / Merchant Name (Tag 59):'}</span>
                      </label>
                      <span className="text-[10px] font-mono text-teal-400/80 font-bold">
                        {customMerchantName.length}/25 Chars
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        id="clinic-tag59"
                        type="text"
                        maxLength={25}
                        value={customMerchantName}
                        onChange={(e) => setCustomMerchantName(e.target.value.toUpperCase())}
                        placeholder="ENTER CLINIC NAME - MAX 25 CHARS"
                        className="w-full px-3.5 py-2.5 bg-black/50 border border-teal-500/30 rounded-xl text-xs font-bold font-mono text-white placeholder:text-stone-500 focus:outline-hidden focus:ring-2 focus:ring-teal-400 uppercase tracking-wide transition-all shadow-inner"
                      />
                    </div>

                    {/* Quick Preset Pills for Clinic Name */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-medium text-stone-400">
                        {isKm ? 'ជ្រើសរើសគំរូ:' : 'Presets:'}
                      </span>
                      {[
                        { label: isKm ? 'NOB ROTANA - គណនីដើម' : 'NOB ROTANA (Default Owner)', val: 'NOB ROTANA' },
                        { label: 'ROTANA CLINIC', val: 'ROTANA CLINIC' },
                        { label: 'SOKHAPHEAP CLINIC', val: 'SOKHAPHEAP CLINIC' },
                        { label: 'CENTRAL MEDICAL', val: 'CENTRAL MEDICAL' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setCustomMerchantName(item.val)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer hover-wobble ${
                            customMerchantName === item.val
                              ? 'bg-teal-500 text-stone-950 shadow-xs font-black'
                              : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/60'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Amount & Currency Selector */}
                  <div className="p-3.5 bg-stone-900/70 backdrop-blur-md rounded-2xl border border-teal-500/20 shadow-inner space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-teal-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{isKm ? 'ចំនួនទឹកប្រាក់ Lock ពិតប្រាកដ - Tag 54:' : 'Locked Transaction Amount (Tag 54):'}</span>
                      </div>

                      {/* Currency Toggle */}
                      <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-teal-500/30 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setKhqrCurrency('USD');
                            if (isCustomAmount) {
                              setCustomAmountInput('0.01');
                            } else {
                              setSelectedPresetAmount('0.01');
                            }
                          }}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                            khqrCurrency === 'USD'
                              ? 'bg-teal-500 text-stone-950 font-black shadow-xs'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          USD ($)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setKhqrCurrency('KHR');
                            if (isCustomAmount) {
                              setCustomAmountInput('400');
                            } else {
                              setSelectedPresetAmount('400');
                            }
                          }}
                          className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                            khqrCurrency === 'KHR'
                              ? 'bg-teal-500 text-stone-950 font-black shadow-xs'
                              : 'text-stone-400 hover:text-white'
                          }`}
                        >
                          KHR (៛)
                        </button>
                      </div>
                    </div>

                    {/* Amount Preset Buttons with 3D tactile micro-wobble */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(khqrCurrency === 'USD'
                        ? [
                            { val: '0.01', label: isKm ? '$0.01 - សាកល្បងពិតប្រាកដ' : '$0.01 (Safe Real Test)' },
                            { val: '0.05', label: '$0.05' },
                            { val: '1.00', label: '$1.00' },
                            { val: '5.00', label: '$5.00' },
                            { val: '15.00', label: '$15.00' },
                          ]
                        : [
                            { val: '400', label: isKm ? '400 ៛ - សាកល្បងពិតប្រាកដ' : '400 ៛ (Safe Real Test)' },
                            { val: '2000', label: '2,000 ៛' },
                            { val: '4000', label: '4,000 ៛' },
                            { val: '20000', label: '20,000 ៛' },
                            { val: '60000', label: '60,000 ៛' },
                          ]
                      ).map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            setIsCustomAmount(false);
                            setSelectedPresetAmount(preset.val);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1 hover-wobble active-wobble ${
                            !isCustomAmount && selectedPresetAmount === preset.val
                              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-stone-950 font-black shadow-[0_0_15px_rgba(20,184,166,0.35)] scale-102'
                              : 'bg-stone-800/80 text-stone-300 border border-stone-700/60 hover:bg-stone-700 hover:text-white'
                          }`}
                        >
                          {!isCustomAmount && selectedPresetAmount === preset.val && (
                            <Check className="w-3 h-3 text-stone-950 stroke-[3]" />
                          )}
                          <span>{preset.label}</span>
                        </button>
                      ))}

                      {/* Custom Amount Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomAmount(true);
                          if (!customAmountInput) {
                            setCustomAmountInput(khqrCurrency === 'KHR' ? '4000' : '2.50');
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1 hover-wobble active-wobble ${
                          isCustomAmount
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-stone-950 font-black shadow-[0_0_15px_rgba(20,184,166,0.35)] scale-102'
                            : 'bg-stone-800/80 text-stone-300 border border-stone-700/60 hover:bg-stone-700 hover:text-white'
                        }`}
                      >
                        {isCustomAmount && <Check className="w-3 h-3 text-stone-950 stroke-[3]" />}
                        <span>{isKm ? 'កំណត់ចំនួនផ្សេង' : 'Custom'}</span>
                      </button>
                    </div>

                    {/* Custom Amount Input Box */}
                    {isCustomAmount && (
                      <div className="pt-1 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold font-mono text-xs text-teal-400">
                            {khqrCurrency === 'USD' ? '$' : '៛'}
                          </span>
                          <input
                            type="number"
                            step={khqrCurrency === 'USD' ? '0.01' : '100'}
                            min={khqrCurrency === 'USD' ? '0.01' : '100'}
                            value={customAmountInput}
                            onChange={(e) => setCustomAmountInput(e.target.value)}
                            placeholder={khqrCurrency === 'USD' ? '0.01' : '400'}
                            className="w-full pl-8 pr-3 py-2 bg-black/60 border border-teal-500/40 rounded-xl text-xs font-bold font-mono text-white focus:outline-hidden focus:ring-2 focus:ring-teal-400 shadow-inner"
                          />
                        </div>
                        <span className="text-[11px] text-stone-400 font-sans">
                          {isKm ? 'ចំនួនទឹកប្រាក់ត្រូវទូទាត់ជាក់ស្តែង' : 'Exact invoice total'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3. Live Invoice Summary Card */}
                  <div className="p-4 rounded-2xl bg-stone-900/60 backdrop-blur-md border border-white/10 shadow-inner space-y-2 text-xs font-sans">
                    <div className="flex justify-between items-center text-stone-400">
                      <span>{isKm ? 'លេខវិក្កយបត្រ - Tag 62:' : 'Invoice Reference (Tag 62):'}</span>
                      <span className="font-mono font-bold text-white">#INV-2026-0881</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-400">
                      <span>{isKm ? 'អ្នកជំងឺគំរូ:' : 'Patient Name:'}</span>
                      <span className="font-semibold text-stone-200">ចាន់ ដារ៉ា - P-0012</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-400">
                      <span>{isKm ? 'គ្លីនិកទទួលប្រាក់ - Tag 59:' : 'Merchant Destination (Tag 59):'}</span>
                      <span className="font-bold text-teal-300 font-mono">
                        {activeLiveKhqr.merchantName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-stone-400">
                      <span>{isKm ? 'គណនីធនាគារ ABA - Tag 30:' : 'ABA Account (Tag 30):'}</span>
                      <span className="font-mono text-stone-300">126092913522024 - ABA Bank</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-bold text-white">
                      <span>{isKm ? 'ទឹកប្រាក់ត្រូវទូទាត់ Lock:' : 'Total Locked Payable:'}</span>
                      <span className="text-teal-400 font-mono text-base font-black">
                        {activeLiveKhqr.amountFormatted}
                      </span>
                    </div>
                  </div>

                  {/* 4. Live EMVCo Tag Inspector & Copy Button */}
                  <div className="p-3 bg-stone-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowTagBreakdown(!showTagBreakdown)}
                        className="flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-teal-300 transition-colors cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5 text-teal-400" />
                        <span>{isKm ? 'ពិនិត្យ EMVCo Tag Breakdown & CRC16' : 'Inspect EMVCo Tag Breakdown & CRC16'}</span>
                        {showTagBreakdown ? (
                          <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyPayload}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-[11px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        {copiedPayload ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">{isKm ? 'បានចម្លង!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-stone-400" />
                            <span>{isKm ? 'ចម្លង Payload' : 'Copy Payload'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {showTagBreakdown && (
                      <div className="pt-1 space-y-1.5 text-[11px] font-mono border-t border-white/10 mt-2">
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {activeLiveKhqr.tagBreakdown.map((item) => (
                            <div
                              key={item.tag}
                              className="flex items-start justify-between gap-2 p-1.5 rounded-lg bg-black/40 border border-white/5"
                            >
                              <div className="shrink-0 text-teal-300 font-bold">
                                Tag {item.tag} <span className="text-stone-400 font-normal">- {item.label}:</span>
                              </div>
                              <div className="text-stone-200 font-bold text-right truncate">
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-2.5 bg-black/80 text-teal-300 rounded-xl text-[10px] break-all leading-relaxed font-mono border border-teal-500/20">
                          {activeLiveKhqr.qrString}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Supported Banks Row */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-xs font-semibold text-stone-400">
                      {isKm ? 'គាំទ្រកម្មវិធីធនាគារ:' : 'Supported Mobile Apps:'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950/60 text-teal-300 border border-teal-500/30">
                      ABA Mobile
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30">
                      Bakong App
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/60 text-blue-300 border border-blue-500/30">
                      Acleda
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-950/60 text-lime-300 border border-lime-500/30">
                      Wing Bank
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-300 border border-stone-700">
                      Canadia / Sathapana
                    </span>
                  </div>
                </div>

                {/* Right Side: QR Preview Graphic with Cyber-Scanning Laser Beam */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#141F22] to-[#0D1618] rounded-2xl border border-teal-500/30 shadow-2xl relative space-y-4">
                  {/* Top Badge: Scannable 24/7 */}
                  <div className="w-full flex items-center justify-between text-[11px] font-bold border-b border-white/10 pb-2">
                    <span className="text-stone-400 font-sans">{isKm ? 'ស្ថានភាព QR:' : 'QR Status:'}</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-mono text-[10px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{isKm ? 'ដំណើរការអចិន្ត្រៃយ៍' : 'Permanent Live Active'}</span>
                    </span>
                  </div>

                  {/* Scannable QR Frame with High-Tech Viewfinder Target Corners & Cyber Laser */}
                  <div className="w-60 h-60 bg-black/90 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(20,184,166,0.15)] border border-teal-500/40 overflow-hidden group">
                    {/* Corner Targeting Crosshairs */}
                    <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-teal-400" />
                    <span className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-teal-400" />
                    <span className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-teal-400" />
                    <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-teal-400" />

                    {/* Cyber Laser Scan Line sweeping vertically */}
                    <div className="absolute left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none z-20 animate-cyber-scan shadow-[0_0_12px_#34d399]" />

                    {/* High-Contrast Crisp White QR Surface */}
                    <div className="p-3 bg-white rounded-xl shadow-lg relative z-10 transition-transform duration-300 group-hover:scale-102">
                      <QRCodeSVG
                        value={activeLiveKhqr.qrString}
                        size={180}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  {/* Clean Status & Instruction without blocking overlay */}
                  <div className="text-center space-y-1">
                    <div className="text-xs font-bold text-white font-sans tracking-wide">
                      {activeLiveKhqr.merchantName}
                    </div>
                    <div className="text-teal-400 font-mono text-base font-black tracking-wider">
                      {activeLiveKhqr.amountFormatted}
                    </div>
                    <div className="text-[11px] text-stone-300 font-sans">
                      {isKm
                        ? 'បើក App ធនាគាររបស់អ្នក ABA ឬ Bakong រួចស្កេនដើម្បីសាកល្បង'
                        : 'Open ABA Mobile or Bakong and scan to test live'}
                    </div>
                  </div>

                  {/* 1-Click Mobile App Deep Link Buttons */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <a
                      href={activeLiveKhqr.abaDeeplink}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#005777] hover:bg-[#004761] text-white text-xs font-bold transition-all shadow-md active:scale-95 text-center cursor-pointer hover-wobble"
                    >
                      <span>ABA Mobile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={activeLiveKhqr.bakongDeeplink}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#D61B22] hover:bg-[#B3141A] text-white text-xs font-bold transition-all shadow-md active:scale-95 text-center cursor-pointer hover-wobble"
                    >
                      <span>Bakong App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Secondary Actions: Test Chime & ABA Web Checkout */}
                  <div className="flex items-center justify-between w-full gap-2 pt-1 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleTestChime}
                      className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover-wobble active:scale-95 ${
                        isPlayingChime
                          ? 'bg-emerald-500 text-stone-950 font-black shadow-md'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
                      }`}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingChime ? 'text-stone-950 animate-pulse' : 'text-teal-400'}`} />
                      <span>{isPlayingChime ? (isKm ? 'កំពុងបន្លឺសំឡេង...' : 'Playing Chime...') : (isKm ? 'សាកល្បងសម្លេងទូទាត់' : 'Test Audio Chime')}</span>
                    </button>

                    <a
                      href={activeLiveKhqr.paywayWebLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl text-[11px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1 cursor-pointer hover-wobble active:scale-95"
                    >
                      <span>PayWay Link</span>
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                    </a>
                  </div>

                  {/* Trust note */}
                  <div className="text-[10px] text-stone-400 text-center font-sans leading-tight">
                    {isKm
                      ? 'QR Code នេះទាញចេញពី ABA Merchant Link ផ្ទាល់ PayWay ID 126092913522024 អាចស្កេនបានគ្រប់ពេល គ្មាន Polling និងគ្មានផុតកំណត់ 3 នាទីឡើយ។'
                      : 'Generated directly from verified ABA Merchant Link (PayWay ID: 126092913522024). Permanent validity with zero polling overhead.'}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 2: GEMINI 3.8 FLASH VOICE & AI SOAP STUDIO */}
            {/* ========================================================== */}
            {activeTab === 'voice' && (
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#0F171A] to-[#0A1214] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-tab-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/40 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      <span>Google Gemini 3.8 Flash AI Model</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                      Anti-Spam 2 req/min
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                      {isKm
                        ? 'កត់ត្រាសំឡេងវេជ្ជសាស្ត្រ & បំប្លែងទៅជាទម្រង់ SOAP'
                        : 'Bilingual Clinical Voice Dictation to SOAP Notes'}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed font-sans">
                      {isKm
                        ? 'គ្រូពេទ្យគ្រាន់តែនិយាយជាភាសាខ្មែរ ឬអង់គ្លេស ប្រព័ន្ធ AI Gemini 3.8 Flash នឹងវិភាគរកសញ្ញាជំងឺ សញ្ញាសំខាន់ៗ Vitals កូដជំងឺ ICD-11 និងរៀបចំវេជ្ជបញ្ជាដោយស្វ័យប្រវត្តិ។'
                        : 'Dictate symptoms in Khmer or English. Gemini 3.8 Flash extracts vitals, assigns official ICD-11 codes, and generates a structured SOAP note in seconds.'}
                    </p>
                  </div>

                  {/* Doctor Profile Selection */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-xs font-semibold text-stone-400">
                      {isKm ? 'វេជ្ជបណ្ឌិត:' : 'Doctor:'}
                    </span>
                    {['Dr. Visoth Ratha, MD', 'Dr. Chantha Sok - Dental', 'Dr. Sophea Mey'].map(
                      (doc) => (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => setSelectedDoctor(doc)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer hover-wobble ${
                            selectedDoctor === doc
                              ? 'bg-teal-500 text-stone-950 font-black shadow-xs'
                              : 'bg-stone-800/80 text-stone-300 border border-stone-700 hover:bg-stone-700 hover:text-white'
                          }`}
                        >
                          {doc}
                        </button>
                      )
                    )}
                  </div>

                  {/* Dictation Box */}
                  <div className="p-4 rounded-2xl bg-stone-900/70 backdrop-blur-md border border-teal-500/20 shadow-inner space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-200 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-teal-400" />
                        <span>{isKm ? 'សំឡេងវេជ្ជសាស្ត្រខ្មែរ' : 'Live Clinical Transcript'}</span>
                      </span>
                      {isRecording && (
                        <span className="text-[11px] font-bold text-rose-400 animate-pulse flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>Listening...</span>
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-stone-200 leading-relaxed font-sans shadow-inner">
                      {isRecording ? (
                        <div className="flex items-center gap-2 text-stone-400 italic">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                          <span>{isKm ? 'កំពុងស្តាប់សំឡេងវេជ្ជបណ្ឌិត...' : 'Listening to doctor dictation...'}</span>
                        </div>
                      ) : (
                        'អ្នកជំងឺ ក្អកស្ងួត ៤ថ្ងៃ ក្តៅខ្លួន ៣៨.៥°C អស់កម្លាំង និងឈឺបំពង់ក។ សម្ពាធឈាម ១២០/៨០ mmHg, ចង្វាក់បេះដូង ៧៦ bpm, SpO2 ៩៨%។ សង្ស័យរលាកទងសួតស្រួចស្រាវ។ ផ្តល់ថ្នាំ Azithromycin 500mg និង Paracetamol 500mg។'
                      )}
                    </div>

                    {/* Interactive Recording Button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleToggleRecord}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover-wobble active-wobble ${
                          isRecording
                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md'
                            : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-stone-950 font-black shadow-[0_0_15px_rgba(20,184,166,0.35)]'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>
                          {isRecording
                            ? (isKm ? 'បញ្ចប់ការកត់ត្រា' : 'Stop Recording')
                            : (isKm ? 'សាកល្បងកត់ត្រាសំឡេងថ្មី' : 'Record New Dictation')}
                        </span>
                      </button>

                      {/* Equalizer Visualizer */}
                      <div className="flex items-center gap-1 h-5">
                        {[12, 20, 24, 16, 28, 14, 22, 10].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              isRecording ? 'bg-rose-400 animate-pulse' : 'bg-teal-400'
                            }`}
                            style={{
                              height: `${h}px`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Structured SOAP Output (6 Cols) */}
                <div className="lg:col-span-6 bg-gradient-to-b from-[#141F22] to-[#0D1618] p-5 rounded-2xl border border-teal-500/30 shadow-2xl space-y-3.5 font-sans">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Structured Medical SOAP Record
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/30">
                      Gemini 3.8 Output
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* S: Subjective */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="font-bold text-teal-300 text-[11px] uppercase tracking-wide">
                        {isKm ? 'S - Subjective: រោគសញ្ញាប្រាប់ដោយអ្នកជំងឺ' : 'S - Subjective (Patient Complaints)'}
                      </div>
                      <p className="text-stone-300 text-[11px] mt-0.5">
                        Chief Complaint: Dry cough x 4 days, fever, fatigue, sore throat.
                      </p>
                    </div>

                    {/* O: Objective */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="font-bold text-teal-300 text-[11px] uppercase tracking-wide">
                        {isKm ? 'O - Objective: សញ្ញាគ្លីនិក និង Vitals' : 'O - Objective (Clinical Signs & Vitals)'}
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 mt-1 text-[10px] font-mono font-bold text-white text-center">
                        <div className="bg-stone-900/80 p-1 rounded border border-white/10">
                          <span className="text-stone-400 block text-[9px]">TEMP</span>
                          38.5 C
                        </div>
                        <div className="bg-stone-900/80 p-1 rounded border border-white/10">
                          <span className="text-stone-400 block text-[9px]">BP</span>
                          120/80
                        </div>
                        <div className="bg-stone-900/80 p-1 rounded border border-white/10">
                          <span className="text-stone-400 block text-[9px]">PULSE</span>
                          76 bpm
                        </div>
                        <div className="bg-stone-900/80 p-1 rounded border border-white/10">
                          <span className="text-stone-400 block text-[9px]">SPO2</span>
                          98%
                        </div>
                      </div>
                    </div>

                    {/* A: Assessment */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="font-bold text-teal-300 text-[11px] uppercase tracking-wide">
                        {isKm ? 'A - Assessment: រោគវិនិច្ឆ័យ និងកូដជំងឺ' : 'A - Assessment (Diagnosis & Codes)'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-teal-500 text-stone-950 font-mono font-black text-[10px]">
                          ICD-11: CA40.0
                        </span>
                        <span className="text-[11px] font-bold text-stone-200">
                          Acute Bronchitis - រលាកទងសួតស្រួចស្រាវ
                        </span>
                      </div>
                    </div>

                    {/* P: Plan */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                      <div className="font-bold text-teal-300 text-[11px] uppercase tracking-wide">
                        {isKm ? 'P - Plan: វេជ្ជបញ្ជា និងផែនការព្យាបាល' : 'P - Plan (Prescriptions & Orders)'}
                      </div>
                      <ul className="mt-1 space-y-1 text-[11px] text-stone-300">
                        <li>• Azithromycin 500mg - 1x PO Daily x 3 days</li>
                        <li>• Paracetamol 500mg - 1-2x PO Q6H PRN for fever</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 3: SMART KHMER VOICE QUEUE STATION */}
            {/* ========================================================== */}
            {activeTab === 'queue' && (
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#0F171A] to-[#0A1214] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-tab-enter">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Native Khmer Speech Audio Synthesis Engine</span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                      {isKm
                        ? 'ប្រព័ន្ធហៅអ្នកជំងឺជាសំឡេងខ្មែរស្វ័យប្រវត្តិ'
                        : 'Automated Khmer Audio Queue Station'}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed font-sans">
                      {isKm
                        ? 'គ្រូពេទ្យចុច Call លើផ្ទាំងកុំព្យូទ័រ ប្រព័ន្ធនឹងបន្លឺសំឡេងហៅឈ្មោះអ្នកជំងឺ និងបន្ទប់ពិគ្រោះជាភាសាខ្មែរទៅកាន់ Speaker បន្ទប់រង់ចាំដោយស្វ័យប្រវត្តិ។'
                        : '1-click announcing of patient token number, Khmer full name, and consulting room in clear natural Khmer speech.'}
                    </p>
                  </div>

                  {/* Active Queue Details */}
                  <div className="p-4 rounded-2xl bg-stone-900/70 backdrop-blur-md border border-teal-500/20 shadow-inner space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">{isKm ? 'បន្ទប់ពិគ្រោះ:' : 'Consulting Room:'}</span>
                      <span className="font-bold text-white">{currentRoom}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">{isKm ? 'គ្រូពេទ្យប្រចាំការ:' : 'Doctor on Duty:'}</span>
                      <span className="font-bold text-teal-300">វេជ្ជ. វិសិដ្ឋ រដ្ឋា - Dr. Visoth Ratha</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">{isKm ? 'ស្ថានភាពជួរ:' : 'Queue Status:'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        CALLING_NOW
                      </span>
                    </div>
                  </div>

                  {/* Action Call Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleNextPatient}
                      className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-stone-950 rounded-xl text-xs sm:text-sm font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover-wobble active-wobble active:scale-98"
                    >
                      <Volume2 className="w-4 h-4 text-stone-950" />
                      <span>
                        {isKm ? 'ចុចទីនេះដើម្បីហៅអ្នកជំងឺបន្ទាប់' : 'Call Next Patient in Khmer'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Right Hospital Waiting Screen (6 Cols) */}
                <div className="lg:col-span-6 bg-gradient-to-b from-[#141F22] to-[#0D1618] p-6 rounded-2xl text-white shadow-2xl border border-teal-500/30 space-y-4 text-center">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>SMART WAITING DISPLAY</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      AUDIO CHANNEL: 01
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                      NOW CALLING / កំពុងហៅ
                    </div>
                    <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-1 tracking-tight">
                      # A - {currentTicket.toString().padStart(3, '0')}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-stone-100 mt-2">
                      {currentPatient}
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold mt-1">
                      សូមអញ្ជើញចូល {currentRoom}
                    </div>
                  </div>

                  {/* Audio Frequency Rings */}
                  <div className="p-3 bg-black/50 rounded-xl border border-white/10 flex items-center justify-center gap-1.5 h-10">
                    {[14, 26, 32, 20, 28, 16, 36, 12, 24, 18].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-100 ${
                          isCallingAudio ? 'bg-amber-400 animate-pulse' : 'bg-teal-400'
                        }`}
                        style={{
                          height: `${h}px`,
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="text-[10px] text-stone-400 font-mono">
                    High-Definition Natural Khmer Voice Broadcast
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 4: 80MM POS SLIP & CASH DRAWER HARDWARE */}
            {/* ========================================================== */}
            {activeTab === 'hardware' && (
              <div className="p-6 sm:p-8 bg-gradient-to-b from-[#0F171A] to-[#0A1214] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-tab-enter">
                <div className="lg:col-span-7 space-y-4">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40">
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Direct ESC/POS Driverless Printing</span>
                  </span>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                      {isKm
                        ? 'បោះពុម្ពវិក្កយបត្រ 80mm រហ័ស និងបើកថតប្រាក់'
                        : '80mm POS Thermal Slip & Cash Drawer Integration'}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed font-sans">
                      {isKm
                        ? 'ប្រព័ន្ធដំណើរការផ្ទាល់ជាមួយម៉ាស៊ីន Thermal 80mm គ្រប់ប្រភេទ តាមរយៈ USB, LAN ឬ Bluetooth គាំទ្រអក្សរខ្មែរ Unicode ១០០% និងបញ្ជាបើកថតប្រាក់ស្វ័យប្រវត្តិ។'
                        : 'Zero-driver native ESC/POS thermal printing with clean Khmer Unicode font rasterization and automated cash drawer trigger pulses.'}
                    </p>
                  </div>

                  <div className="p-4 bg-stone-900/70 backdrop-blur-md rounded-2xl border border-teal-500/20 text-xs space-y-2.5 text-stone-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{isKm ? 'គាំទ្រអក្សរខ្មែរ Unicode ស្រះលើក្រោមមិនបាត់' : '100% Khmer Unicode without vowel clipping'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{isKm ? 'ភ្ជាប់ QR កូដពិនិត្យវិក្កយបត្រតាមទូរស័ព្ទ' : 'Includes Digital Verification QR Code'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{isKm ? 'បញ្ជាបើកថតប្រាក់ RJ11 Pin 2 និង 5' : 'Automated Cash Drawer Trigger (RJ11 Pin 2/5)'}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-68 bg-white p-5 rounded-2xl border border-stone-300 shadow-2xl font-mono text-[11px] text-stone-800 space-y-3 transform-gpu hover-wobble">
                    <div className="text-center border-b border-dashed border-stone-300 pb-2">
                      <div className="font-bold text-xs uppercase text-stone-900">X-CLINIC MEDICAL CENTER</div>
                      <div className="text-[10px] text-stone-500">Tel: +855 12 888 999</div>
                      <div className="text-[10px] text-stone-500">MoH License: 2026/0881</div>
                    </div>

                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>Inv: #INV-2026-0881</span>
                        <span>16:42</span>
                      </div>
                      <div>Patient: Chan Dara - P-0012</div>
                    </div>

                    <div className="border-t border-b border-dashed border-stone-300 py-1.5 space-y-1 text-[10px]">
                      <div className="flex justify-between">
                        <span>1x General Consultation</span>
                        <span>$5.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2x Azithromycin 500mg</span>
                        <span>$6.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Paracetamol 500mg</span>
                        <span>$4.00</span>
                      </div>
                    </div>

                    <div className="flex justify-between font-bold text-xs">
                      <span>TOTAL:</span>
                      <span className="text-teal-800">$15.00 - 61,500 R</span>
                    </div>

                    <div className="text-center pt-1 border-t border-dashed border-stone-300 text-[10px] text-stone-500">
                      Payment: KHQR Dynamic - ABA PayWay
                      <div className="font-bold text-emerald-700 mt-0.5">PAID & SETTLED</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3 Irresistible Value Guarantees for Clinic Owners */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/90 rounded-2xl border border-[#DFD6C6] shadow-xs flex items-start gap-3 hover-wobble transition-transform">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-stone-900 font-sans">
                  {isKm ? 'ដំឡើងត្រឹម ៦០ វិនាទី' : '60-Second Setup'}
                </div>
                <div className="text-[11px] text-stone-500 font-sans leading-relaxed">
                  {isKm
                    ? 'គ្រាន់តែ Paste ABA Merchant Link ពី ABA Mobile រួចជាស្រេច មិនបាច់ជួលជាង IT'
                    : 'Paste your free ABA Merchant Link directly from mobile banking; no technician needed'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/90 rounded-2xl border border-[#DFD6C6] shadow-xs flex items-start gap-3 hover-wobble transition-transform">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-stone-900 font-sans">
                  {isKm ? 'លុយចូលកុង ABA ផ្ទាល់ ១០០%' : '100% Direct ABA Settle'}
                </div>
                <div className="text-[11px] text-stone-500 font-sans leading-relaxed">
                  {isKm
                    ? 'X-Clinic មិនប៉ះពាល់ ឬកាត់កម្រៃជើងសារពីលុយរបស់អ្នកឡើយ កម្រៃជើងសារ ០%'
                    : 'Zero middleman escrow; 100% of patient payments deposit directly into your bank'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/90 rounded-2xl border border-[#DFD6C6] shadow-xs flex items-start gap-3 hover-wobble transition-transform">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-stone-900 font-sans">
                  {isKm ? 'ដំណើរការលើគ្រប់ឧបករណ៍' : 'Runs on All Hardware'}
                </div>
                <div className="text-[11px] text-stone-500 font-sans leading-relaxed">
                  {isKm
                    ? 'ដំណើរការលើ Laptop, iPad, Tablet ឬទូរស័ព្ទដៃ មិនបាច់ទិញម៉ាស៊ីនថ្មី'
                    : 'Accessible from any browser on laptops, iPads, tablets, and phones smoothly'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
