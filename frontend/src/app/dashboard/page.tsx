'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  Activity,
  CreditCard,
  Pill,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  CalendarDays,
  FileText,
  RefreshCw,
  Stethoscope,
  ShieldCheck,
  DollarSign,
  Monitor,
  FileCheck,
  AlertTriangle,
  History,
  BarChart3,
  Compass,
  Sparkles,
} from 'lucide-react';
import { RegisterPatientDrawer } from '../../components/patients/RegisterPatientDrawer';
import { ExploreModulesModal } from '../../components/dashboard/ExploreModulesModal';
import { AbaPaywayTesterCard } from '../../components/dashboard/AbaPaywayTesterCard';

function DashboardView() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';
  const { user } = useAuth();
  const clinicType = user?.tenant?.clinicType;

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      const data = await api.dashboard.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // 10s real-time live poller
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner - Streamlined & Decluttered */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FDFBF7] p-5 rounded-2xl border border-[#E7E1D4] shadow-xs relative overflow-hidden card-3d">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#EADDC9]/20 to-[#E3D4BC]/30 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              {t.dashboard.commandTitle}
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0EAE0] text-stone-800 border border-[#DFD6C6] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {t.dashboard.liveSync}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
            <span>{t.dashboard.subtitle}</span>
            <span>•</span>
            <span className="font-medium text-stone-700 font-sans" suppressHydrationWarning>
              {new Date().toLocaleDateString(locale === 'km' ? 'km-KH' : 'en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Clean, Targeted Header Actions */}
        <div className="flex items-center flex-wrap gap-2 z-10">
          <button
            onClick={fetchMetrics}
            className="p-2 text-stone-600 hover:text-stone-900 bg-[#FAF7F2] border border-[#E5DFD2] hover:border-[#D5CDBD] rounded-xl shadow-2xs transition-colors text-xs active:scale-95"
            title={t.common.refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Quick Command Palette Launcher */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-[#F2EDE2] hover:bg-[#EBE4D6] text-stone-700 border border-[#DFD7C7] rounded-xl text-xs font-semibold transition-colors shadow-2xs active:scale-95"
            title="Search Commands (Ctrl+K)"
          >
            <span>Command</span>
            <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-white/80 rounded border border-[#DDD5C5]">
              Ctrl K
            </kbd>
          </button>

          {/* Explore Modules Trigger */}
          <button
            onClick={() => setIsExploreOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F5EFE4] hover:bg-[#EFE6D8] text-teal-900 border border-[#DFD6C6] rounded-xl text-xs font-semibold transition-colors shadow-2xs active:scale-95"
          >
            <Compass className="w-4 h-4 text-teal-800" />
            <span>{isKm ? 'រុករកមុខងារ' : 'Explore Tools'}</span>
          </button>

          {/* Primary Doctor Action */}
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.dashboard.registerPatient}</span>
          </button>
        </div>
      </div>

      {/* Doctor Productivity & Navigation Guide Bar */}
      <div className="bg-[#F8F5EE] border border-[#E7DFC9] p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-stone-900">
              {isKm ? 'លំហូរការងារស្នូលប្រចាំថ្ងៃរបស់គ្រូពេទ្យ' : 'Core Daily Clinical Operations'}
            </span>
            <p className="text-stone-500 text-[11px] truncate sm:whitespace-normal">
              {isKm
                ? 'ចុច [Ctrl + K] ឬចុចប៊ូតុង [រុករកមុខងារ] ដើម្បីស្វែងរក និងបើកមុខងារឯកទេសទាំងអស់ (PACS, LIS, ធ្មេញ, IPD, Teleconsult, ឃ្លាំង...)'
                : 'Press [Ctrl + K] or click [Explore Tools] to discover all specialized suites (PACS, LIS Lab, Dental, IPD, Teleconsult, Inventory...)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExploreOpen(true)}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 text-teal-900 border border-[#DDD5C5] rounded-xl font-semibold transition-colors shadow-2xs text-[11px] flex items-center gap-1.5 active:scale-95"
          >
            <Compass className="w-3.5 h-3.5 text-teal-800" />
            <span>{isKm ? 'បើក Explore' : 'Open Explore'}</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="px-2.5 py-1.5 bg-[#ECE4D4] hover:bg-[#E3D9C5] text-stone-700 rounded-xl font-mono text-[11px] transition-colors shadow-2xs flex items-center gap-1 active:scale-95"
            title="Press Ctrl+K"
          >
            <span>Ctrl</span>
            <span className="font-bold">K</span>
          </button>
        </div>
      </div>

      {/* ABA PayWay Quick Setup & Live KHQR Tester Widget */}
      <AbaPaywayTesterCard />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Waiting */}
        <div className="bg-[#FDFBF7] p-4 sm:p-5 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold text-stone-700">{t.dashboard.waitingQueue}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">
            {metrics ? metrics.queueStatus?.waiting : '0'}
          </div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            {isKm ? 'រង់ចាំវាស់ Vitals & ពិគ្រោះ (~11 នាទី)' : 'Awaiting triage & consultation (~11m)'}
          </p>
        </div>

        {/* In Consultation */}
        <div className="bg-[#FDFBF7] p-4 sm:p-5 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-teal-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold text-stone-700">{t.dashboard.inConsultation}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-900 font-mono tracking-tight">
            {metrics ? metrics.queueStatus?.inConsultation : '0'}
          </div>
          <p className="text-[11px] text-teal-700 font-medium mt-1">
            {isKm ? 'វេជ្ជបណ្ឌិតកំពុងពិនិត្យព្យាបាល' : 'Active physician encounters'}
          </p>
        </div>

        {/* Completed Today */}
        <div className="bg-[#FDFBF7] p-4 sm:p-5 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold text-stone-700">{t.dashboard.finishedConsultations}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono tracking-tight">
            {metrics ? metrics.queueStatus?.completedToday : '0'}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {isKm ? 'វត្តមានពិគ្រោះថ្ងៃនេះ' : 'Today outpatient encounters'}
          </p>
        </div>

        {/* KHQR Revenue Settled */}
        <div className="bg-[#FDFBF7] p-4 sm:p-5 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold text-stone-700">{t.dashboard.khqrRevenue}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">
            ${metrics ? Number(metrics.revenueToday?.usd || 0).toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center justify-between">
            <span className="font-mono text-emerald-700 font-semibold">
              ≈ {Math.round((Number(metrics?.revenueToday?.usd) || 0) * 4100).toLocaleString()} ៛
            </span>
            <span>
              {metrics ? metrics.revenueToday?.paidInvoicesCount : '0'} {isKm ? 'វិក្កយបត្រ' : 'bills'}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#E7E1D4] flex items-center justify-between card-hover shadow-2xs">
          <div>
            <div className="text-[11px] text-stone-500">{t.dashboard.registeredPatients}</div>
            <div className="text-lg font-bold text-stone-900 font-mono mt-0.5">
              {metrics ? metrics.totalPatients : '0'}
            </div>
          </div>
          <Users className="w-5 h-5 text-stone-400" />
        </div>

        <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#E7E1D4] flex items-center justify-between card-hover shadow-2xs">
          <div>
            <div className="text-[11px] text-stone-500">{t.dashboard.followUpsToday}</div>
            <div className="text-lg font-bold text-stone-900 font-mono mt-0.5">
              {metrics ? metrics.followUps?.todayScheduled : '0'}
            </div>
          </div>
          <CalendarDays className="w-5 h-5 text-teal-700" />
        </div>

        <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#E7E1D4] flex items-center justify-between card-hover shadow-2xs">
          <div>
            <div className="text-[11px] text-stone-500">{t.dashboard.pharmacyPending}</div>
            <div className="text-lg font-bold text-stone-900 font-mono mt-0.5">
              {metrics ? metrics.pharmacy?.pendingPrescriptions : '0'}
            </div>
          </div>
          <Pill className="w-5 h-5 text-amber-600" />
        </div>

        <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#E7E1D4] flex items-center justify-between card-hover shadow-2xs">
          <div>
            <div className="text-[11px] text-stone-500">{t.dashboard.archivedDocuments}</div>
            <div className="text-lg font-bold text-stone-900 font-mono mt-0.5">
              {metrics ? metrics.documents?.total : '0'}
            </div>
          </div>
          <FileText className="w-5 h-5 text-stone-400" />
        </div>
      </div>

      {/* Clinical Operations & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Launch Targeted Workflows (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
              {isKm ? 'លំហូរការងារគោលដៅប្រចាំថ្ងៃ' : 'Targeted Clinical Workflows'}
            </h2>
            <span className="text-[10px] text-teal-800 font-mono font-medium">
              Daily Outpatient Operations
            </span>
          </div>

          {/* 4 Targeted Doctor Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Queue Calling Screen */}
            <Link
              href="/queue"
              className="group p-4 bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] hover:border-teal-700 transition-all shadow-xs card-3d flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center mb-2.5 shadow-2xs">
                  <Monitor className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm">{t.queue.title}</h3>
                <p className="text-xs text-stone-500 mt-1">
                  {isKm
                    ? 'ប្រព័ន្ធហៅលេខតាមសំឡេង និងគ្រប់គ្រងអ្នកជំងឺរង់ចាំ'
                    : t.queue.subtitle}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-800 group-hover:translate-x-1 transition-transform">
                <span>{isKm ? 'បើកផ្ទាំងហៅលេខ' : 'Launch Queue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* 2. Doctor Consultation & Vitals (or Dental if Dental clinic) */}
            {clinicType === 'DENTAL' ? (
              <Link
                href="/dental"
                className="group p-4 bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] hover:border-teal-700 transition-all shadow-xs card-3d flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-2.5 border border-teal-200/60">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    {isKm ? 'ពេទ្យធ្មេញ FDI Odontogram' : 'Dental Odontogram'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    {isKm
                      ? 'ប្លង់ 32 ធ្មេញកាយវិភាគវិទ្យា និងតាមដានរោគពុកធ្មេញ WHO DMFT'
                      : 'FDI 32-tooth anatomical chart & dental treatment'}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-800 group-hover:translate-x-1 transition-transform">
                  <span>{isKm ? 'បើកប្លង់ធ្មេញ' : 'Open Odontogram'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ) : (
              <Link
                href="/visits"
                className="group p-4 bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] hover:border-teal-700 transition-all shadow-xs card-3d flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-2.5 border border-teal-200/60">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    {isKm ? 'ការពិគ្រោះ & វាស់ Vitals' : 'Consultations & Vitals'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    {isKm
                      ? 'កត់ត្រាសញ្ញាជីវិត ពិនិត្យរោគវិនិច្ឆ័យ ICD-10 និងចេញវេជ្ជបញ្ជា'
                      : 'Active encounters, vital triage and clinical SOAP notes'}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-800 group-hover:translate-x-1 transition-transform">
                  <span>{isKm ? 'ចាប់ផ្តើមពិនិត្យ' : 'Start Consultation'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            )}

            {/* 3. Patient Master Directory */}
            <Link
              href="/patients"
              className="group p-4 bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] hover:border-teal-700 transition-all shadow-xs card-3d flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#F0EAE0] text-stone-800 flex items-center justify-center mb-2.5 border border-[#DFD6C6]">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm">{t.patients.title}</h3>
                <p className="text-xs text-stone-500 mt-1">
                  {isKm
                    ? 'ស្វែងរកប្រវត្តិជំងឺ ឯកសារចាស់ៗ និងកែសម្រួលព័ត៌មាន'
                    : t.patients.subtitle}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-800 group-hover:translate-x-1 transition-transform">
                <span>{t.patients.viewProfile}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            {/* 4. Billing & Dynamic KHQR POS */}
            <Link
              href="/billing"
              className="group p-4 bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] hover:border-emerald-700 transition-all shadow-xs card-3d flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-2.5 border border-emerald-200/60">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm">{t.billing.title}</h3>
                <p className="text-xs text-stone-500 mt-1">
                  {isKm
                    ? 'គិតលុយទូទាត់រហ័ស ស្កេន KHQR និងចេញវិក្កយបត្រ'
                    : t.billing.subtitle}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-800 group-hover:translate-x-1 transition-transform">
                <span>{t.billing.payWithKhqr}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* Explore Extended Diagnostic & Clinical Suites Card */}
          <div className="bg-[#F8F5EE] border border-[#E3DAC7] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs card-3d">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-teal-800 text-white text-[10px] font-bold font-mono uppercase tracking-wider">
                  Specialized Modules
                </span>
                <span className="text-xs font-bold text-stone-900">
                  {isKm
                    ? 'ត្រូវការប្រើប្រាស់មុខងាររោគវិនិច្ឆ័យ ឬម៉ូឌុលឯកទេសផ្សេងទៀត?'
                    : 'Need Diagnostic or Advanced Clinical Suites?'}
                </span>
              </div>
              <p className="text-xs text-stone-600 max-w-xl">
                {isKm
                  ? 'ចូលមើល PACS DICOM, មន្ទីរពិសោធន៍ LIS, ធ្មេញ Odontogram, សម្រាកពេទ្យ IPD, Teleconsult, ឃ្លាំងឱសថ FEFO, លិខិតវេជ្ជសាស្ត្រ និងការកំណត់...'
                  : 'Access PACS DICOM imaging, LIS analyzers, Dental odontogram, IPD beds, Teleconsult, FEFO stock, Certificates and Clinic Settings...'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsExploreOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>{isKm ? 'រុករកម៉ូឌុលទាំងអស់' : 'Explore All Modules'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-time Activity Stream & Audit Log */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
            {t.dashboard.recentActivity}
          </h2>

          <div className="bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] p-4 shadow-xs space-y-4 card-3d">
            <div>
              <div className="text-xs font-bold text-stone-900 mb-2.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-800" />
                <span>{t.dashboard.latestEncounters}</span>
              </div>
              {metrics?.recentActivity?.visits?.length > 0 ? (
                <div className="divide-y divide-[#EFEAE0]">
                  {metrics.recentActivity.visits.map((v: any) => (
                    <div key={v.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-stone-900">
                          {isKm && v.patient?.nameKh ? v.patient.nameKh : v.patient?.nameEn || 'Patient'}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {v.visitCode} {v.doctor?.fullNameEn ? `• Dr. ${v.doctor.fullNameEn}` : ''}
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-2">
                  {isKm ? 'មិនទាន់មានវត្តមានអ្នកជំងឺថ្មីនៅឡើយ' : 'No visits registered today yet.'}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[#EFEAE0]">
              <div className="text-xs font-bold text-stone-900 mb-2.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t.dashboard.latestInvoices}</span>
              </div>
              {metrics?.recentActivity?.invoices?.length > 0 ? (
                <div className="divide-y divide-[#EFEAE0]">
                  {metrics.recentActivity.invoices.map((inv: any) => (
                    <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-stone-900">
                          {isKm && inv.patient?.nameKh ? inv.patient.nameKh : inv.patient?.nameEn || 'Patient'}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">{inv.invoiceNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-stone-900">
                          ${Number(inv.payableAmount).toFixed(2)}
                        </div>
                        <span
                          className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-2">
                  {isKm ? 'មិនទាន់មានវិក្កយបត្រនៅឡើយ' : 'No recent invoices.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <RegisterPatientDrawer
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientCreated={() => fetchMetrics()}
      />

      <ExploreModulesModal
        isOpen={isExploreOpen}
        onClose={() => setIsExploreOpen(false)}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;
    if (!token && !isLoading) {
      router.push('/login');
    }
  }, [isLoading, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-stone-500">
        <div className="w-7 h-7 border-2 border-teal-800 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-medium">កំពុងផ្ទុកផ្ទាំងគ្រប់គ្រងគ្លីនិក...</span>
      </div>
    );
  }

  return <DashboardView />;
}
