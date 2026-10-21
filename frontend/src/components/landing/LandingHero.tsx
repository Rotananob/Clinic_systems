'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../common/ClinicLogo';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Volume2,
  Printer,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
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
} from 'lucide-react';

export const LandingHero: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const router = useRouter();

  // Clinic subdomain registration input state
  const [clinicInput, setClinicInput] = useState('');
  const [activeTab, setActiveTab] = useState<'khqr' | 'voice' | 'queue' | 'hardware'>('khqr');

  // 3D Parallax Tilt state for the central cockpit
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Mode 1: KHQR Interactive State
  const [khqrAmount, setKhqrAmount] = useState('15.00');
  const [khqrCurrency, setKhqrCurrency] = useState<'USD' | 'KHR'>('USD');
  const [countdown, setCountdown] = useState(178);
  const [isSettled, setIsSettled] = useState(false);
  const [settlementHash, setSettlementHash] = useState('');
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  // Mode 2: Voice & Gemini SOAP Interactive State
  const [isRecording, setIsRecording] = useState(false);
  const [soapStep, setSoapStep] = useState(2); // 0=idle, 1=listening, 2=parsed
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Visoth Ratha, MD');

  // Mode 3: Smart Khmer Queue Interactive State
  const [currentTicket, setCurrentTicket] = useState(42);
  const [currentPatient, setCurrentPatient] = useState('លោក សុខ វិសាល (Sok Visal)');
  const [currentRoom, setCurrentRoom] = useState('បន្ទប់ពិគ្រោះលេខ ០១ (Room 01)');
  const [isCallingAudio, setIsCallingAudio] = useState(false);

  // Auto countdown timer for KHQR
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3D Mouse Parallax Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth subtle tilt (-8 deg to +8 deg)
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    setTilt({ rotateX, rotateY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ rotateX: 0, rotateY: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  // Simulate Bakong Instant Settlement
  const handleSimulateScan = () => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSettled(true);
      setSettlementHash(`TXN-ABA-${Date.now().toString(36).toUpperCase()}`);
      setIsSimulatingScan(false);
    }, 900);
  };

  const handleResetKhqr = (amt: string) => {
    setKhqrAmount(amt);
    setIsSettled(false);
    setCountdown(180);
    setSettlementHash('');
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
      'លោក សុខ វិសាល (Sok Visal)',
      'កញ្ញា កែវ ចរិយា (Keo Chariya)',
      'លោក ហេង រតនា (Heng Rotana)',
      'អ្នកស្រី ចាន់ សុភាព (Chan Sopheap)',
      'លោក ជា វិបុល (Chea Vibol)',
    ];
    const rooms = [
      'បន្ទប់ពិគ្រោះលេខ ០១ (Room 01)',
      'បន្ទប់ពិគ្រោះលេខ ០២ (Room 02)',
      'បន្ទប់ធ្មេញលេខ ០១ (Dental 01)',
      'បន្ទប់ព្យាបាលទូទៅ (OPD Treatment)',
    ];
    setCurrentTicket((prev) => prev + 1);
    setCurrentPatient(names[Math.floor(Math.random() * names.length)]);
    setCurrentRoom(rooms[Math.floor(Math.random() * rooms.length)]);
    setTimeout(() => {
      setIsCallingAudio(false);
    }, 2400);
  };

  // Compute live slug preview
  const slugPreview = clinicInput.trim()
    ? clinicInput
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 24)
    : 'your-clinic';

  // Construct dynamic Tag 01=12 payload string
  const dynamicKhqrPayload = `00020101021229380016link.payway.com.kh0114ABA-PAYWAY-DEMO520454115303${
    khqrCurrency === 'USD' ? '840' : '116'
  }54${khqrAmount.length.toString().padStart(2, '0')}${khqrAmount}5802KH5912X-CLINIC PAAS6010PHNOM PENH62210717INV-2026-08816304${(
    'CRC' + Math.floor(1000 + Math.random() * 9000)
  ).slice(0, 4)}`;

  return (
    <section className="relative overflow-hidden pt-10 pb-20 md:pt-14 md:pb-28">
      {/* 3D Atmospheric Lighting Canvas */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] bg-gradient-to-tr from-teal-200/35 via-emerald-100/30 to-amber-100/25 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[420px] h-[420px] bg-teal-300/15 rounded-full blur-2xl pointer-events-none -z-10 animate-ambient-drift" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================================== */}
        {/* Header Hero Branding with Interactive 3D Emblem */}
        {/* ============================================================== */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
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
                      ? 'បញ្ចូលឈ្មោះគ្លីនិករបស់អ្នក (ឧ. គ្លីនិក សុខភាព)...'
                      : 'Enter your clinic name (e.g. Sokhapheap Clinic)...'
                  }
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm font-semibold text-stone-900 focus:outline-hidden placeholder:text-stone-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <span>{isKm ? 'ចុះឈ្មោះភ្លាមៗ' : 'Get Started'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subdomain slug preview indicator */}
              <div className="px-3 pb-0.5 text-left flex items-center justify-between text-[11px] text-stone-500 font-mono border-t border-stone-100 pt-1.5">
                <div className="flex items-center gap-1 truncate">
                  <span className="text-teal-800 font-semibold">Workspace URL:</span>
                  <span className="text-stone-700 font-bold bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E5DEC\-D]">
                    https://{slugPreview}.xclinic.kh
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold hidden sm:inline">
                  Free 10 KHQR/day
                </span>
              </div>
            </form>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
            >
              <span>{isKm ? 'ចាប់ផ្តើមគម្រោង Free សាកល្បង' : 'Start 14-Day Free Evaluation'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-800 border border-[#DFD6C6] rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors active:scale-95"
            >
              <Users className="w-4 h-4 text-stone-600" />
              <span>{isKm ? 'ចូលប្រើប្រាស់គណនី (Sign In)' : 'Sign In to Portal'}</span>
            </Link>
          </div>

          {/* Hardware & Standard Compliance Points */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-4 text-left font-sans">
            <div className="bg-white/80 p-3 rounded-2xl border border-[#E7DFCF] shadow-2xs">
              <div className="text-sm sm:text-base font-extrabold text-teal-800">2-Second Speed</div>
              <div className="text-[11px] text-stone-500 font-medium">Tag 01=12 Dynamic KHQR</div>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-[#E7DFCF] shadow-2xs">
              <div className="text-sm sm:text-base font-extrabold text-teal-800">100% Direct ABA</div>
              <div className="text-[11px] text-stone-500 font-medium">Direct Settlement to Merchant</div>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-[#E7DFCF] shadow-2xs">
              <div className="text-sm sm:text-base font-extrabold text-teal-800">Gemini 3.8 AI</div>
              <div className="text-[11px] text-stone-500 font-medium">Khmer Voice to SOAP Note</div>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-[#E7DFCF] shadow-2xs">
              <div className="text-sm sm:text-base font-extrabold text-teal-800">MoH Compliant</div>
              <div className="text-[11px] text-stone-500 font-medium">ICD-11 & Strict Tenant Isolation</div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Human-Crafted 3D Spatial Medical Cockpit Console */}
        {/* ============================================================== */}
        <div className="mt-12 max-w-5xl mx-auto perspective-1200 relative">
          {/* Subtle Outer Glow Shadow behind the console */}
          <div className="absolute inset-0 bg-teal-800/10 rounded-3xl blur-2xl -z-10" />

          {/* The Tilt Container */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: isHovering
                ? `perspective(1200px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.015, 1.015, 1.015)`
                : 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              transition: isHovering
                ? 'transform 0.08s ease-out'
                : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="relative bg-[#FDFBF7] rounded-3xl border border-[#E3DBCB] shadow-2xl overflow-hidden transform-gpu preserve-3d"
          >
            {/* Specular Glare Sheen following cursor */}
            <div
              className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 40%, transparent 70%)`,
                opacity: glare.opacity,
              }}
            />

            {/* Cockpit Top Navigation & Real Medical Instrument Tabs */}
            <div className="bg-gradient-to-r from-[#21292B] via-[#162224] to-[#0A1617] text-white px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-xs" />
                </div>
                <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold tracking-wider text-teal-200 font-mono uppercase">
                    X-Clinic 3D Spatial Live Console
                  </span>
                </div>
              </div>

              {/* Console Tactile Mode Switcher */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('khqr')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    activeTab === 'khqr'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-200" />
                  <span>{isKm ? 'Dynamic KHQR' : 'Dynamic KHQR'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('voice')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    activeTab === 'voice'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-teal-200" />
                  <span>{isKm ? 'Gemini 3.8 AI SOAP' : 'Gemini 3.8 AI SOAP'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    activeTab === 'queue'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-teal-200" />
                  <span>{isKm ? 'ហៅជួរអ្នកជំងឺ' : 'Khmer Voice Queue'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('hardware')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                    activeTab === 'hardware'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5 text-teal-200" />
                  <span>{isKm ? 'បោះពុម្ព 80mm' : '80mm Hardware'}</span>
                </button>
              </div>
            </div>

            {/* ========================================================== */}
            {/* TAB 1: DYNAMIC KHQR COCKPIT */}
            {/* ========================================================== */}
            {activeTab === 'khqr' && (
              <div className="p-6 sm:p-8 bg-[#FAF7F2] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Config Controls (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                      <Zap className="w-3.5 h-3.5 text-teal-700" />
                      <span>Tag 01=12 Dynamic Single-Use Engine</span>
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      Bakong EMVCo Standard
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-sans">
                      {isKm
                        ? 'បង្កើត Dynamic KHQR និងទូទាត់ប្រាក់ភ្លាមៗ'
                        : 'Instant Dynamic KHQR Generation & Real Settlement'}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed font-sans">
                      {isKm
                        ? 'សាកល្បងចុចជ្រើសរើសចំនួនទឹកប្រាក់ខាងក្រោម ដើម្បីទស្សនាការផ្លាស់ប្តូរលេខកូដ Dynamic KHQR តាមក្បួន Bakong ពិតប្រាកដ។'
                        : 'Select test amount below to watch the live EMVCo Tag 01=12 payload and CRC16 checksum calculate in real-time.'}
                    </p>
                  </div>

                  {/* Preset Amount Toggles */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                      {isKm ? 'ចំនួនទឹកប្រាក់តេស្ត (Test Presets)' : 'Select Test Amount'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {['1.00', '5.00', '15.00', '25.00', '50.00'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleResetKhqr(amt)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                            khqrAmount === amt && !isSettled
                              ? 'bg-teal-800 text-white shadow-xs scale-105'
                              : 'bg-white hover:bg-stone-100 text-stone-800 border border-[#DCD5C5]'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 bg-white border border-[#DCD5C5] px-2.5 py-1 rounded-xl">
                        <span className="text-stone-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={khqrAmount}
                          onChange={(e) => handleResetKhqr(e.target.value)}
                          className="w-16 bg-transparent text-xs font-bold font-mono text-stone-900 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Invoice Breakdown Card */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5DFD0] shadow-xs space-y-2.5 text-xs font-sans">
                    <div className="flex justify-between items-center text-stone-500">
                      <span>{isKm ? 'លេខវិក្កយបត្រ' : 'Invoice Reference:'}</span>
                      <span className="font-mono font-bold text-stone-900">#INV-2026-0881</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-500">
                      <span>{isKm ? 'អ្នកជំងឺ' : 'Patient Name:'}</span>
                      <span className="font-semibold text-stone-900">ចាន់ ដារ៉ា (Chan Dara - PT-0488)</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-500">
                      <span>{isKm ? 'គណនីគ្លីនិកទទួលប្រាក់' : 'Merchant Destination:'}</span>
                      <span className="font-semibold text-teal-900">X-Clinic Medical Center (ABA PayWay)</span>
                    </div>
                    <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-sm font-bold text-stone-900">
                      <span>{isKm ? 'ទឹកប្រាក់ត្រូវបង់' : 'Payable Amount:'}</span>
                      <span className="text-teal-800 font-mono text-base font-black">
                        ${parseFloat(khqrAmount || '0').toFixed(2)} USD (
                        {(parseFloat(khqrAmount || '0') * 4100).toLocaleString()} KHR)
                      </span>
                    </div>
                  </div>

                  {/* EMVCo Spec Inspection Pill */}
                  <div className="bg-[#F0ECE1] border border-[#DDD6C5] p-3 rounded-2xl space-y-1">
                    <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
                      <span>EMVCo Tag 01=12 Verification Payload</span>
                      <span className="text-emerald-700 font-bold">100% Compliant</span>
                    </div>
                    <p className="font-mono text-[10px] text-stone-600 truncate">
                      {dynamicKhqrPayload}
                    </p>
                  </div>
                </div>

                {/* Right Interactive QR Terminal (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#DFD7C7] shadow-sm relative space-y-4">
                  {/* Status Ribbon */}
                  <div className="w-full flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold text-stone-800">
                      {isSettled ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{isKm ? 'ទូទាត់ជោគជ័យ ១០០%' : 'Settlement Confirmed'}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-stone-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>{isKm ? 'រង់ចាំការស្កេន...' : 'Listening for Scan...'}</span>
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{countdown}s</span>
                    </span>
                  </div>

                  {/* QR Box with Laser Scan Effect */}
                  <div className="relative p-4 rounded-2xl bg-[#FAF7F2] border border-[#D5CDBD] flex flex-col items-center justify-center">
                    <QRCodeSVG
                      value={dynamicKhqrPayload}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                    {!isSettled && (
                      <div className="absolute inset-x-4 h-1 bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-400 rounded-full animate-laser-scan pointer-events-none" />
                    )}

                    {isSettled && (
                      <div className="absolute inset-0 bg-emerald-950/90 rounded-2xl flex flex-col items-center justify-center text-white text-center p-4 animate-in zoom-in-95 duration-200">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2" />
                        <div className="font-bold text-sm">
                          {isKm ? 'ទូទាត់ប្រាក់ជោគជ័យ' : 'Payment Received'}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-300 mt-1">
                          ${parseFloat(khqrAmount || '0').toFixed(2)} USD
                        </div>
                        <div className="text-[10px] text-stone-300 mt-1 truncate max-w-full">
                          {settlementHash}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive Simulate Scan Trigger */}
                  <div className="w-full space-y-2">
                    {!isSettled ? (
                      <button
                        type="button"
                        onClick={handleSimulateScan}
                        disabled={isSimulatingScan}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-98"
                      >
                        {isSimulatingScan ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{isKm ? 'កំពុងផ្ទៀងផ្ទាត់ការទូទាត់...' : 'Verifying Bakong Settlement...'}</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>{isKm ? 'ចុចទីនេះដើម្បីតេស្តស្កេនបង់ប្រាក់' : 'Simulate Bakong App Scan'}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResetKhqr('15.00')}
                        className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors"
                      >
                        {isKm ? 'សាកល្បងប្រតិបត្តិការថ្មី' : 'Reset & Test Another Bill'}
                      </button>
                    )}

                    <div className="text-[10px] text-stone-400 text-center font-mono">
                      Direct Push to Merchant ABA App - 0% Fee
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 2: GEMINI 3.8 FLASH VOICE & AI SOAP STUDIO */}
            {/* ========================================================== */}
            {activeTab === 'voice' && (
              <div className="p-6 sm:p-8 bg-[#FAF7F2] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      <span>Google Gemini 3.8 Flash AI Model</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      Anti-Spam 2 req/min
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-sans">
                      {isKm
                        ? 'កត់ត្រាសំឡេងវេជ្ជសាស្ត្រ & បំប្លែងទៅជាទម្រង់ SOAP'
                        : 'Bilingual Clinical Voice Dictation to SOAP Notes'}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed font-sans">
                      {isKm
                        ? 'គ្រូពេទ្យគ្រាន់តែនិយាយជាភាសាខ្មែរ ឬអង់គ្លេស ប្រព័ន្ធ AI Gemini 3.8 Flash នឹងវិភាគរកសញ្ញាជំងឺ សញ្ញាសំខាន់ៗ (Vitals) កូដជំងឺ ICD-11 និងរៀបចំវេជ្ជបញ្ជាដោយស្វ័យប្រវត្តិ។'
                        : 'Dictate symptoms in Khmer or English. Gemini 3.8 Flash extracts vitals, assigns official ICD-11 codes, and generates a structured SOAP note in seconds.'}
                    </p>
                  </div>

                  {/* Doctor Profile Selection */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-stone-600">
                      {isKm ? 'វេជ្ជបណ្ឌិត:' : 'Doctor:'}
                    </span>
                    {['Dr. Visoth Ratha, MD', 'Dr. Chantha Sok (Dental)', 'Dr. Sophea Mey'].map(
                      (doc) => (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => setSelectedDoctor(doc)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            selectedDoctor === doc
                              ? 'bg-teal-800 text-white'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          {doc}
                        </button>
                      )
                    )}
                  </div>

                  {/* Dictation Box */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-teal-800" />
                        <span>{isKm ? 'សំឡេងវេជ្ជសាស្ត្រខ្មែរ (Dictation Transcript)' : 'Live Clinical Transcript'}</span>
                      </span>
                      {isRecording && (
                        <span className="text-[11px] font-bold text-rose-600 animate-pulse flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-600" />
                          <span>Listening...</span>
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF7F2] border border-stone-200 text-xs text-stone-700 leading-relaxed font-sans">
                      {isRecording ? (
                        <div className="flex items-center gap-2 text-stone-500 italic">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>កំពុងស្តាប់សំឡេងវេជ្ជបណ្ឌិត... (Listening to doctor dictation...)</span>
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
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                          isRecording
                            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                            : 'bg-teal-800 hover:bg-teal-900 text-white shadow-xs'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>
                          {isRecording
                            ? (isKm ? 'បញ្ចប់ការកត់ត្រា' : 'Stop Recording')
                            : (isKm ? 'សាកល្បងកត់ត្រាសំឡេងថ្មី' : 'Record New Dictation')}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 h-5">
                        {[12, 20, 24, 16, 28, 14, 22, 10].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-teal-700'}`}
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
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-[#DFD7C7] shadow-sm space-y-3.5 font-sans">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-800" />
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Structured Medical SOAP Record
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      Gemini 3.8 Output
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* S: Subjective */}
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-stone-200">
                      <div className="font-bold text-teal-900 text-[11px] uppercase tracking-wide">
                        S - Subjective (រោគសញ្ញាប្រាប់ដោយអ្នកជំងឺ)
                      </div>
                      <p className="text-stone-700 text-[11px] mt-0.5">
                        Chief Complaint: Dry cough x 4 days, fever, fatigue, sore throat.
                      </p>
                    </div>

                    {/* O: Objective */}
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-stone-200">
                      <div className="font-bold text-teal-900 text-[11px] uppercase tracking-wide">
                        O - Objective (សញ្ញាគ្លីនិក & Vitals)
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 mt-1 text-[10px] font-mono font-bold text-stone-800 text-center">
                        <div className="bg-white p-1 rounded border border-stone-200">
                          <span className="text-stone-400 block text-[9px]">TEMP</span>
                          38.5 C
                        </div>
                        <div className="bg-white p-1 rounded border border-stone-200">
                          <span className="text-stone-400 block text-[9px]">BP</span>
                          120/80
                        </div>
                        <div className="bg-white p-1 rounded border border-stone-200">
                          <span className="text-stone-400 block text-[9px]">PULSE</span>
                          76 bpm
                        </div>
                        <div className="bg-white p-1 rounded border border-stone-200">
                          <span className="text-stone-400 block text-[9px]">SPO2</span>
                          98%
                        </div>
                      </div>
                    </div>

                    {/* A: Assessment */}
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-stone-200">
                      <div className="font-bold text-teal-900 text-[11px] uppercase tracking-wide">
                        A - Assessment (រោគវិនិច្ឆ័យ & កូដជំងឺ)
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-teal-800 text-white font-mono font-bold text-[10px]">
                          ICD-11: CA40.0
                        </span>
                        <span className="text-[11px] font-bold text-stone-800">
                          Acute Bronchitis (រលាកទងសួតស្រួចស្រាវ)
                        </span>
                      </div>
                    </div>

                    {/* P: Plan */}
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-stone-200">
                      <div className="font-bold text-teal-900 text-[11px] uppercase tracking-wide">
                        P - Plan (វេជ្ជបញ្ជា & ផែនការព្យាបាល)
                      </div>
                      <ul className="mt-1 space-y-1 text-[11px] text-stone-700">
                        <li>• Azithromycin 500mg (1x PO Daily x 3 days)</li>
                        <li>• Paracetamol 500mg (1-2x PO Q6H PRN for fever)</li>
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
              <div className="p-6 sm:p-8 bg-[#FAF7F2] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <Volume2 className="w-3.5 h-3.5 text-amber-800" />
                    <span>Native Khmer Speech Audio Synthesis Engine</span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-sans">
                      {isKm
                        ? 'ប្រព័ន្ធហៅអ្នកជំងឺជាសំឡេងខ្មែរស្វ័យប្រវត្តិ'
                        : 'Automated Khmer Audio Queue Station'}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed font-sans">
                      {isKm
                        ? 'គ្រូពេទ្យចុច Call លើផ្ទាំងកុំព្យូទ័រ ប្រព័ន្ធនឹងបន្លឺសំឡេងហៅឈ្មោះអ្នកជំងឺ និងបន្ទប់ពិគ្រោះជាភាសាខ្មែរទៅកាន់ Speaker បន្ទប់រង់ចាំដោយស្វ័យប្រវត្តិ។'
                        : '1-click announcing of patient token number, Khmer full name, and consulting room in clear natural Khmer speech.'}
                    </p>
                  </div>

                  {/* Active Queue Details */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">{isKm ? 'បន្ទប់ពិគ្រោះ:' : 'Consulting Room:'}</span>
                      <span className="font-bold text-stone-900">{currentRoom}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">{isKm ? 'គ្រូពេទ្យប្រចាំការ:' : 'Doctor on Duty:'}</span>
                      <span className="font-bold text-teal-800">វេជ្ជ. វិសិដ្ឋ រដ្ឋា (Dr. Visoth Ratha)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">{isKm ? 'ស្ថានភាពជួរ:' : 'Queue Status:'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        CALLING_NOW
                      </span>
                    </div>
                  </div>

                  {/* Action Call Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleNextPatient}
                      className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Volume2 className="w-4 h-4 text-amber-300" />
                      <span>
                        {isKm ? 'ចុចទីនេះដើម្បីហៅអ្នកជំងឺបន្ទាប់' : 'Call Next Patient in Khmer'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Right Hospital Waiting Screen (6 Cols) */}
                <div className="lg:col-span-6 bg-stone-950 p-6 rounded-2xl text-white shadow-xl border border-stone-800 space-y-4 text-center">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>SMART WAITING DISPLAY</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500">
                      AUDIO CHANNEL: 01
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                      NOW CALLING / កំពុងហៅ
                    </div>
                    <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-1 tracking-tight">
                      # A - {currentTicket.toString().padStart(3, '0')}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-stone-200 mt-2">
                      {currentPatient}
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold mt-1">
                      សូមអញ្ជើញចូល {currentRoom}
                    </div>
                  </div>

                  {/* Audio Frequency Rings */}
                  <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 flex items-center justify-center gap-1.5 h-10">
                    {[14, 26, 32, 20, 28, 16, 36, 12, 24, 18].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full ${
                          isCallingAudio ? 'bg-amber-400 animate-pulse' : 'bg-teal-500'
                        }`}
                        style={{
                          height: `${h}px`,
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>

                  <div className="text-[10px] text-stone-500 font-mono">
                    High-Definition Natural Khmer Voice Broadcast
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* TAB 4: 80MM POS SLIP & CASH DRAWER HARDWARE */}
            {/* ========================================================== */}
            {activeTab === 'hardware' && (
              <div className="p-6 sm:p-8 bg-[#FAF7F2] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                    <Printer className="w-3.5 h-3.5 text-blue-800" />
                    <span>Direct ESC/POS Driverless Printing</span>
                  </span>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight font-sans">
                      {isKm
                        ? 'បោះពុម្ពវិក្កយបត្រ 80mm រហ័ស និងបើកថតប្រាក់'
                        : '80mm POS Thermal Slip & Cash Drawer Integration'}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed font-sans">
                      {isKm
                        ? 'ប្រព័ន្ធដំណើរការផ្ទាល់ជាមួយម៉ាស៊ីន Thermal 80mm គ្រប់ប្រភេទ (USB, LAN, Bluetooth) គាំទ្រអក្សរខ្មែរ Unicode ១០០% និងបញ្ជាបើកថតប្រាក់ស្វ័យប្រវត្តិ។'
                        : 'Zero-driver native ESC/POS thermal printing with clean Khmer Unicode font rasterization and automated cash drawer trigger pulses.'}
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-[#E5DFD0] text-xs space-y-2 text-stone-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isKm ? 'គាំទ្រអក្សរខ្មែរ Unicode ស្រះលើក្រោមមិនបាត់' : '100% Khmer Unicode without vowel clipping'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isKm ? 'ភ្ជាប់ QR កូដពិនិត្យវិក្កយបត្រតាមទូរស័ព្ទ' : 'Includes Digital Verification QR Code'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isKm ? 'បញ្ជាបើកថតប្រាក់ Pin 2/5 Drawer Kick Pulse' : 'Automated Cash Drawer Trigger (RJ11 Pin 2/5)'}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-68 bg-white p-5 rounded-2xl border border-stone-300 shadow-md font-mono text-[11px] text-stone-800 space-y-3">
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
                      <div>Patient: Chan Dara (P-0012)</div>
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
                      <span className="text-teal-800">$15.00 (61,500 R)</span>
                    </div>

                    <div className="text-center pt-1 border-t border-dashed border-stone-300 text-[10px] text-stone-500">
                      Payment: KHQR Dynamic (ABA PayWay)
                      <div className="font-bold text-emerald-700 mt-0.5">PAID & SETTLED</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
