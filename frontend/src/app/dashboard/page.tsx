'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Users,
  Activity,
  CreditCard,
  Pill,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  CalendarDays,
  FileText,
  RefreshCw,
  Stethoscope,
  ShieldCheck,
  DollarSign,
  Monitor,
  AlertCircle,
  AlertTriangle,
  History,
  Compass,
  Sparkles,
  Boxes,
  Phone,
  Check,
  Eye,
  ExternalLink,
  ChevronRight,
  Search,
  Wallet,
} from 'lucide-react';
import { RegisterPatientDrawer } from '../../components/patients/RegisterPatientDrawer';
import { ExploreModulesModal } from '../../components/dashboard/ExploreModulesModal';
import { AbaPaywayTesterCard } from '../../components/dashboard/AbaPaywayTesterCard';
import { KhqrCheckoutModal } from '../../components/payments/KhqrCheckoutModal';
import { isRouteAllowed } from '../../lib/rbac';
import { isModuleHidden } from '../../lib/module-visibility';
import {
  playHospitalChime,
  playCashRegisterChime,
  playPaymentSuccessChime,
} from '../../lib/chime';

type OperationalTab = 'queue' | 'billing' | 'followups' | 'workflows';

function getWaitMinutes(createdAt: string | Date): number {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(1, Math.floor(diffMs / 60000));
}

function DashboardView() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';
  const { user } = useAuth();
  const router = useRouter();
  const clinicType = user?.tenant?.clinicType;

  // Strict browser history trap: prevents back button from navigating to landing or register
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<OperationalTab>('queue');
  const [searchFilter, setSearchFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedInvoiceForKhqr, setSelectedInvoiceForKhqr] = useState<any | null>(null);
  const [, setModuleVersion] = useState(0);

  useEffect(() => {
    const handler = () => setModuleVersion((v) => v + 1);
    window.addEventListener('krupet-modules-changed', handler);
    return () => window.removeEventListener('krupet-modules-changed', handler);
  }, []);

  const canRegister =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'DOCTOR' ||
    user?.role === 'RECEPTIONIST';

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await api.dashboard.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 8000); // 8s live refresh
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Operational Action 1: Call Patient into Consultation Room
  const handleCallPatient = async (visitId: string) => {
    setActionLoading(`call-${visitId}`);
    setActionFeedback(null);
    try {
      await api.visits.updateStatus(visitId, 'IN_CONSULTATION');
      try {
        await playHospitalChime();
      } catch {}
      setActionFeedback({
        type: 'success',
        message: isKm
          ? 'បានហៅអ្នកជំងឺចូលបន្ទប់ពិគ្រោះរួចរាល់'
          : 'Patient called into consultation room successfully',
      });
      await fetchMetrics();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || (isKm ? 'មិនអាចហៅអ្នកជំងឺបានទេ' : 'Failed to call patient'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Operational Action 2: Settle Invoice with Cash
  const handleSettleCash = async (inv: any) => {
    setActionLoading(`cash-${inv.id}`);
    setActionFeedback(null);
    try {
      const amount = Number(inv.payableAmount) || 0;
      await api.payments.settleCash(inv.id, amount);
      try {
        await playCashRegisterChime();
      } catch {}
      setActionFeedback({
        type: 'success',
        message: isKm
          ? `បានទូទាត់វិក្កយបត្រ ${inv.invoiceNumber} ជាសាច់ប្រាក់ $${amount.toFixed(2)} ជោគជ័យ`
          : `Invoice ${inv.invoiceNumber} settled with cash $${amount.toFixed(2)} successfully`,
      });
      await fetchMetrics();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || (isKm ? 'មិនអាចទូទាត់វិក្កយបត្របានទេ' : 'Failed to settle invoice with cash'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Operational Action 3: Check In Scheduled Follow-up to Waiting Queue
  const handleCheckInFollowUp = async (followUp: any) => {
    setActionLoading(`checkin-${followUp.id}`);
    setActionFeedback(null);
    try {
      await api.visits.create({
        patientId: followUp.patient?.id || followUp.patientId,
        doctorId: followUp.doctor?.id || followUp.doctorId || user?.id,
        reason: followUp.reason || 'ការពិគ្រោះតាមដានបន្ត',
      });
      try {
        await playHospitalChime();
      } catch {}
      setActionFeedback({
        type: 'success',
        message: isKm
          ? 'បានកត់ត្រាវត្តមានអ្នកជំងឺចូលជួរពិគ្រោះរួចរាល់'
          : 'Follow-up patient checked into waiting queue successfully',
      });
      setActiveTab('queue');
      await fetchMetrics();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || (isKm ? 'មិនអាចកត់ត្រាវត្តមានបានទេ' : 'Failed to check in patient'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Workflow cards for clinical navigation
  const allWorkflowCards = [
    {
      href: '/queue',
      titleKh: t.queue.title,
      titleEn: t.queue.title,
      descKh: 'ប្រព័ន្ធហៅលេខតាមសំឡេង និងគ្រប់គ្រងអ្នកជំងឺរង់ចាំ',
      descEn: t.queue.subtitle,
      actionKh: 'បើកផ្ទាំងហៅលេខ',
      actionEn: 'Launch Queue',
      icon: Monitor,
      bg: 'bg-stone-900 text-amber-400',
    },
    {
      href: clinicType === 'DENTAL' ? '/dental' : '/visits',
      titleKh: clinicType === 'DENTAL' ? 'ពេទ្យធ្មេញ FDI Odontogram' : 'ការពិគ្រោះ & វាស់ Vitals',
      titleEn: clinicType === 'DENTAL' ? 'Dental Odontogram' : 'Consultations & Vitals',
      descKh:
        clinicType === 'DENTAL'
          ? 'ប្លង់ ៣២ ធ្មេញកាយវិភាគវិទ្យា និងរោគពុកធ្មេញ'
          : 'កត់ត្រាសញ្ញាជីវិត ពិនិត្យរោគវិនិច្ឆ័យ ICD-10 និងចេញវេជ្ជបញ្ជា',
      descEn: 'Active encounters, vital triage and clinical SOAP notes',
      actionKh: clinicType === 'DENTAL' ? 'បើកប្លង់ធ្មេញ' : 'ចាប់ផ្តើមពិនិត្យ',
      actionEn: 'Start Consultation',
      icon: clinicType === 'DENTAL' ? Sparkles : Stethoscope,
      bg: 'bg-teal-50 text-teal-800 border border-teal-200/60',
    },
    {
      href: '/patients',
      titleKh: t.patients.title,
      titleEn: t.patients.title,
      descKh: 'ស្វែងរកប្រវត្តិជំងឺ ឯកសារចាស់ៗ និងកែសម្រួលព័ត៌មាន',
      descEn: t.patients.subtitle,
      actionKh: t.patients.viewProfile,
      actionEn: 'Patient Directory',
      icon: Users,
      bg: 'bg-[#F0EAE0] text-stone-800 border border-[#DFD6C6]',
    },
    {
      href: '/billing',
      titleKh: t.billing.title,
      titleEn: t.billing.title,
      descKh: 'គិតលុយទូទាត់រហ័ស ស្កេន KHQR និងចេញវិក្កយបត្រ',
      descEn: t.billing.subtitle,
      actionKh: t.billing.payWithKhqr,
      actionEn: 'Open Cashier POS',
      icon: CreditCard,
      bg: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
    {
      href: '/prescriptions',
      titleKh: 'វេជ្ជបញ្ជា & បើកថ្នាំឱសថស្ថាន',
      titleEn: 'Prescriptions & Pharmacy Dispensing',
      descKh: 'ត្រួតពិនិត្យវេជ្ជបញ្ជា ផ្ទៀងផ្ទាត់កម្រិតថ្នាំ និងបើកថ្នាំជូនអ្នកជំងឺ',
      descEn: 'Pharmacy dispensing, safety checks and prescription orders',
      actionKh: 'បើកបញ្ជីវេជ្ជបញ្ជា',
      actionEn: 'Open Pharmacy Queue',
      icon: Pill,
      bg: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    },
    {
      href: '/inventory',
      titleKh: 'ឃ្លាំងឱសថ & ស្តុកថ្នាំ',
      titleEn: 'Warehouse & Inventory Stock',
      descKh: 'តាមដានចំនួនថ្នាំក្នុងស្តុក ការផុតកំណត់ FEFO និងការកុម្ម៉ង់បន្ថែម',
      descEn: 'Stock balances, batch expiration and inventory controls',
      actionKh: 'គ្រប់គ្រងស្តុក',
      actionEn: 'View Inventory',
      icon: Boxes,
      bg: 'bg-blue-50 text-blue-800 border border-blue-200/60',
    },
  ];

  const visibleWorkflowCards = allWorkflowCards.filter((card) => {
    if (!isRouteAllowed(user?.role, card.href)) return false;
    if (isModuleHidden(card.href)) return false;
    return true;
  });

  // Filtered active queue list
  const filteredQueue = useMemo(() => {
    const list = metrics?.activeQueue || [];
    if (!searchFilter.trim()) return list;
    const q = searchFilter.trim().toLowerCase();
    return list.filter((v: any) => {
      const code = (v.visitCode || '').toLowerCase();
      const pCode = (v.patient?.patientCode || '').toLowerCase();
      const pEn = (v.patient?.nameEn || '').toLowerCase();
      const pKh = (v.patient?.nameKh || '').toLowerCase();
      const reason = (v.reason || '').toLowerCase();
      return code.includes(q) || pCode.includes(q) || pEn.includes(q) || pKh.includes(q) || reason.includes(q);
    });
  }, [metrics?.activeQueue, searchFilter]);

  // Filtered pending invoices
  const filteredInvoices = useMemo(() => {
    const list = metrics?.pendingInvoices || [];
    if (!searchFilter.trim()) return list;
    const q = searchFilter.trim().toLowerCase();
    return list.filter((inv: any) => {
      const num = (inv.invoiceNumber || '').toLowerCase();
      const pCode = (inv.patient?.patientCode || '').toLowerCase();
      const pEn = (inv.patient?.nameEn || '').toLowerCase();
      const pKh = (inv.patient?.nameKh || '').toLowerCase();
      return num.includes(q) || pCode.includes(q) || pEn.includes(q) || pKh.includes(q);
    });
  }, [metrics?.pendingInvoices, searchFilter]);

  // Filtered follow ups
  const filteredFollowUps = useMemo(() => {
    const list = metrics?.todayFollowUpsList || [];
    if (!searchFilter.trim()) return list;
    const q = searchFilter.trim().toLowerCase();
    return list.filter((f: any) => {
      const pCode = (f.patient?.patientCode || '').toLowerCase();
      const pEn = (f.patient?.nameEn || '').toLowerCase();
      const pKh = (f.patient?.nameKh || '').toLowerCase();
      const reason = (f.reason || '').toLowerCase();
      return pCode.includes(q) || pEn.includes(q) || pKh.includes(q) || reason.includes(q);
    });
  }, [metrics?.todayFollowUpsList, searchFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner - Real Clinic Workspace Identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FDFBF7] p-5 rounded-2xl border border-[#E7E1D4] shadow-xs relative overflow-hidden card-3d">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#EADDC9]/20 to-[#E3D4BC]/30 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              {user?.tenant?.nameKh || user?.tenant?.nameEn || t.dashboard.commandTitle}
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

          {/* Explore Modules Trigger */}
          <button
            onClick={() => setIsExploreOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F5EFE4] hover:bg-[#EFE6D8] text-teal-900 border border-[#DFD6C6] rounded-xl text-xs font-semibold transition-colors shadow-2xs active:scale-95"
          >
            <Compass className="w-4 h-4 text-teal-800" />
            <span>{isKm ? 'រុករកមុខងារ' : 'Explore Tools'}</span>
          </button>

          {/* Primary Doctor Action - Register Patient */}
          {canRegister && (
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs active:scale-95 cursor-pointer interactive-tap"
            >
              <Plus className="w-4 h-4" />
              <span>{t.dashboard.registerPatient}</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-spring-pop ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
            )}
            <span className="font-medium">{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-[11px] font-bold underline opacity-80 hover:opacity-100"
          >
            {isKm ? 'បិទ' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Primary KPI Stats Grid - 100% Real Live Database Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Waiting */}
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`p-4 sm:p-5 rounded-2xl border text-left shadow-xs card-3d relative overflow-hidden group transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-[#FDFBF7] border-[#E7E1D4] hover:border-amber-300'
          }`}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold text-stone-700">{t.dashboard.waitingQueue}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">
            {metrics ? metrics.queueStatus?.waiting : '0'}
          </div>
          <p className="text-[11px] text-amber-800 font-medium mt-1">
            {isKm ? 'រង់ចាំវាស់ Vitals និងពិគ្រោះ' : 'Awaiting vitals & consultation'}
          </p>
        </button>

        {/* In Consultation */}
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`p-4 sm:p-5 rounded-2xl border text-left shadow-xs card-3d relative overflow-hidden group transition-all cursor-pointer ${
            activeTab === 'queue'
              ? 'bg-teal-50/70 border-teal-300'
              : 'bg-[#FDFBF7] border-[#E7E1D4] hover:border-teal-300'
          }`}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-teal-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold text-stone-700">{t.dashboard.inConsultation}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-900 font-mono tracking-tight">
            {metrics ? metrics.queueStatus?.inConsultation : '0'}
          </div>
          <p className="text-[11px] text-teal-800 font-medium mt-1">
            {isKm ? 'វេជ្ជបណ្ឌិតកំពុងពិនិត្យព្យាបាល' : 'Active physician encounters'}
          </p>
        </button>

        {/* Completed Today */}
        <div className="bg-[#FDFBF7] p-4 sm:p-5 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold text-stone-700">{t.dashboard.finishedConsultations}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono tracking-tight">
            {metrics ? metrics.queueStatus?.completedToday : '0'}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium mt-1">
            {isKm ? 'វត្តមានពិគ្រោះបានបញ្ចប់ថ្ងៃនេះ' : 'Completed encounters today'}
          </p>
        </div>

        {/* Settled Revenue */}
        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`p-4 sm:p-5 rounded-2xl border text-left shadow-xs card-3d relative overflow-hidden group transition-all cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/30'
              : 'bg-[#FDFBF7] border-[#E7E1D4] hover:border-emerald-300'
          }`}
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold text-stone-700">{t.dashboard.khqrRevenue}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center">
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
        </button>
      </div>

      {/* Real Cashier Shift Reconciliation Drawer Bar */}
      <div className="bg-[#FAF7F0] border border-[#E4DCB8] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-stone-900">
                {isKm ? 'របាយការណ៍បិទវេន និងចំណូលថ្ងៃនេះ' : 'Daily Cashier Shift & Revenue Summary'}
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-600 mt-0.5 font-sans">
                <span>
                  {isKm ? 'សាច់ប្រាក់សុទ្ធ:' : 'Cash:'}{' '}
                  <strong className="text-stone-900 font-mono">
                    ${Number(metrics?.revenueToday?.cashUsd || 0).toFixed(2)}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  {isKm ? 'ប្រព័ន្ធ KHQR:' : 'KHQR PayWay:'}{' '}
                  <strong className="text-teal-900 font-mono">
                    ${Number(metrics?.revenueToday?.khqrUsd || 0).toFixed(2)}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  {isKm ? 'ជំពាក់រង់ចាំទូទាត់:' : 'Unpaid Receivables:'}{' '}
                  <strong className="text-amber-800 font-mono">
                    {metrics?.revenueToday?.unpaidCount || 0} {isKm ? 'វិក្កយបត្រ' : 'bills'} - $
                    {Number(metrics?.revenueToday?.unpaidUsd || 0).toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('billing')}
              className="px-3 py-1.5 bg-white hover:bg-stone-50 text-teal-900 border border-[#DDD5C5] rounded-xl font-semibold transition-colors shadow-2xs text-xs flex items-center gap-1.5 active:scale-95"
            >
              <CreditCard className="w-3.5 h-3.5 text-teal-800" />
              <span>{isKm ? 'ផ្ទាំងគិតលុយ' : 'Cashier Desk'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Operational Console - 100% Real Interactive Tables with Direct Actions */}
      <div className="bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] shadow-md p-4 sm:p-6 card-3d space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3D5] pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 touch-scroll">
            {/* Tab 1: Live Waiting Queue */}
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isKm ? 'ជួរអ្នកជំងឺរង់ចាំផ្ទាល់' : 'Live Waiting Queue'}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'queue' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
                }`}
              >
                {metrics?.queueStatus?.waiting || 0}
              </span>
            </button>

            {/* Tab 2: Pending Invoices */}
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'billing'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isKm ? 'វិក្កយបត្ររង់ចាំទូទាត់' : 'Pending Invoices'}</span>
              {Boolean(metrics?.revenueToday?.unpaidCount) && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'billing' ? 'bg-amber-400 text-stone-900' : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {metrics.revenueToday.unpaidCount}
                </span>
              )}
            </button>

            {/* Tab 3: Today Follow Ups */}
            <button
              onClick={() => setActiveTab('followups')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'followups'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{isKm ? 'ការណាត់ជួបតាមដានថ្ងៃនេះ' : "Today's Follow-ups"}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'followups' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-800'
                }`}
              >
                {metrics?.followUps?.todayScheduled || 0}
              </span>
            </button>

            {/* Tab 4: Core Workflows */}
            <button
              onClick={() => setActiveTab('workflows')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'workflows'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isKm ? 'ម៉ូឌុលការងារស្នូល' : 'Core Workflows'}</span>
            </button>
          </div>

          {/* Quick Real-Time Filter Input */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={isKm ? 'ស្វែងរកឈ្មោះ ឬលេខកូដ...' : 'Filter name or code...'}
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F2] border border-[#DDD5C5] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-teal-700 transition-colors"
            />
          </div>
        </div>

        {/* Tab 1 Content: Live Waiting Room Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-3">
            {filteredQueue.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-[#F5EFE4] text-stone-800 font-bold uppercase text-[10px] tracking-wider border-b border-[#E5DEC9]">
                    <tr>
                      <th className="p-3">កូដអ្នកជំងឺ & ឈ្មោះ</th>
                      <th className="p-3">មូលហេតុពិគ្រោះ</th>
                      <th className="p-3">រយៈពេលរង់ចាំ</th>
                      <th className="p-3">សញ្ញាជីវិត Vitals</th>
                      <th className="p-3">ស្ថានភាព</th>
                      <th className="p-3 text-right">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE0]">
                    {filteredQueue.map((v: any) => {
                      const waitMins = getWaitMinutes(v.createdAt);
                      const isCalling = actionLoading === `call-${v.id}`;
                      const isWaiting = v.status === 'WAITING';

                      return (
                        <tr key={v.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-stone-900">
                              {isKm && v.patient?.nameKh ? v.patient.nameKh : v.patient?.nameEn || 'Patient'}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1.5">
                              <span>{v.patient?.patientCode || v.visitCode}</span>
                              {v.patient?.phone && <span>• {v.patient.phone}</span>}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-stone-700 font-medium">
                              {v.reason || 'ពិគ្រោះជំងឺទូទៅ'}
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                waitMins > 20
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : waitMins > 10
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {isKm ? `រង់ចាំ ${waitMins} នាទី` : `Waiting ${waitMins}m`}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] font-mono">
                            {v.bloodPressure || v.temperature ? (
                              <div className="space-y-0.5">
                                {v.bloodPressure && <div>BP: {v.bloodPressure}</div>}
                                {v.temperature && <div>T: {v.temperature}°C</div>}
                              </div>
                            ) : (
                              <span className="text-stone-400 italic">មិនទាន់វាស់ Vitals</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                                isWaiting
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-teal-100 text-teal-900 border border-teal-300'
                              }`}
                            >
                              {isWaiting ? (isKm ? 'រង់ចាំ' : 'WAITING') : (isKm ? 'កំពុងពិគ្រោះ' : 'IN CONSULT')}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isWaiting && (
                                <button
                                  type="button"
                                  onClick={() => handleCallPatient(v.id)}
                                  disabled={isCalling}
                                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer interactive-tap"
                                >
                                  {isCalling ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Stethoscope className="w-3 h-3" />
                                  )}
                                  <span>{isKm ? 'ហៅចូលពិនិត្យ' : 'Call In'}</span>
                                </button>
                              )}
                              <Link
                                href={`/visits?visitId=${v.id}`}
                                className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-[#DDD5C5] rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                              >
                                {isKm ? 'ពិនិត្យ' : 'Open'}
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-stone-800">
                  {isKm ? 'បច្ចុប្បន្នគ្មានអ្នកជំងឺកំពុងរង់ចាំក្នុងជួរឡើយ' : 'No patients currently waiting in queue'}
                </div>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {isKm
                    ? 'ចុះឈ្មោះអ្នកជំងឺថ្មី ឬកត់ត្រាវត្តមានពិគ្រោះដើម្បីបញ្ចូលទៅក្នុងជួររង់ចាំ។'
                    : 'Register a new patient or check in an encounter to queue them in.'}
                </p>
                {canRegister && (
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer interactive-tap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.dashboard.registerPatient}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2 Content: Pending Cashier Invoices */}
        {activeTab === 'billing' && (
          <div className="space-y-3">
            {filteredInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-[#F5EFE4] text-stone-800 font-bold uppercase text-[10px] tracking-wider border-b border-[#E5DEC9]">
                    <tr>
                      <th className="p-3">លេខវិក្កយបត្រ</th>
                      <th className="p-3">អ្នកជំងឺ</th>
                      <th className="p-3">ព័ត៌មានពិគ្រោះ</th>
                      <th className="p-3">ទឹកប្រាក់ត្រូវទូទាត់</th>
                      <th className="p-3">កាលបរិច្ឆេទ</th>
                      <th className="p-3 text-right">សកម្មភាពគិតលុយ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE0]">
                    {filteredInvoices.map((inv: any) => {
                      const isSettling = actionLoading === `cash-${inv.id}`;
                      const amount = Number(inv.payableAmount) || 0;

                      return (
                        <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-3">
                            <span className="font-mono font-bold text-stone-900">{inv.invoiceNumber}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-stone-900">
                              {isKm && inv.patient?.nameKh ? inv.patient.nameKh : inv.patient?.nameEn || 'Patient'}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono">
                              {inv.patient?.patientCode}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-stone-700">
                              {inv.visit?.reason || 'សេវាពិគ្រោះ & ថ្នាំ'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-extrabold text-stone-900 text-sm">
                              ${amount.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              ≈ {Math.round(amount * 4100).toLocaleString()} ៛
                            </div>
                          </td>
                          <td className="p-3 text-stone-500 text-[11px] font-mono">
                            {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Settle Cash Button */}
                              <button
                                type="button"
                                onClick={() => handleSettleCash(inv)}
                                disabled={isSettling}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer interactive-tap"
                              >
                                {isSettling ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <DollarSign className="w-3 h-3" />
                                )}
                                <span>{isKm ? 'គិតលុយសាច់ប្រាក់' : 'Cash Settle'}</span>
                              </button>

                              {/* Settle with KHQR Modal */}
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceForKhqr(inv)}
                                className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-1 cursor-pointer interactive-tap"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>{isKm ? 'ស្កេន KHQR' : 'KHQR Pay'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-stone-800">
                  {isKm ? 'វិក្កយបត្រទាំងអស់ត្រូវបានទូទាត់រួចរាល់' : 'All invoices have been settled'}
                </div>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {isKm
                    ? 'គ្មានវិក្កយបត្រជំពាក់កំពុងរង់ចាំទូទាត់នៅឡើយ។'
                    : 'No pending or overdue invoices waiting for collection.'}
                </p>
                <Link
                  href="/billing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isKm ? 'បើកផ្ទាំងគិតលុយ POS' : 'Open Cashier POS'}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 3 Content: Today Scheduled Appointments */}
        {activeTab === 'followups' && (
          <div className="space-y-3">
            {filteredFollowUps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-[#F5EFE4] text-stone-800 font-bold uppercase text-[10px] tracking-wider border-b border-[#E5DEC9]">
                    <tr>
                      <th className="p-3">អ្នកជំងឺ</th>
                      <th className="p-3">លេខទូរស័ព្ទ</th>
                      <th className="p-3">មូលហេតុតាមដាន</th>
                      <th className="p-3">គ្រូពេទ្យទទួលបន្ទុក</th>
                      <th className="p-3">ម៉ោងណាត់</th>
                      <th className="p-3 text-right">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFEAE0]">
                    {filteredFollowUps.map((f: any) => {
                      const isCheckingIn = actionLoading === `checkin-${f.id}`;
                      return (
                        <tr key={f.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-stone-900">
                              {isKm && f.patient?.nameKh ? f.patient.nameKh : f.patient?.nameEn || 'Patient'}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono">
                              {f.patient?.patientCode}
                            </div>
                          </td>
                          <td className="p-3">
                            {f.patient?.phone ? (
                              <a
                                href={`tel:${f.patient.phone}`}
                                className="inline-flex items-center gap-1 text-teal-800 font-mono font-medium hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{f.patient.phone}</span>
                              </a>
                            ) : (
                              <span className="text-stone-400">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="text-stone-800 font-medium">
                              {f.reason || 'ពិនិត្យតាមដាន'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-stone-700">
                              {f.doctor?.fullNameKh || f.doctor?.fullNameEn || 'គ្រូពេទ្យប្រចាំការ'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-stone-600">
                            {new Date(f.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleCheckInFollowUp(f)}
                              disabled={isCheckingIn}
                              className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 disabled:opacity-50 flex items-center gap-1 cursor-pointer interactive-tap ml-auto"
                            >
                              {isCheckingIn ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              <span>{isKm ? 'កត់ត្រាវត្តមានចូលជួរ' : 'Check-In to Queue'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-stone-800">
                  {isKm ? 'គ្មានការណាត់ជួបតាមដានសម្រាប់ថ្ងៃនេះទេ' : 'No follow-up appointments scheduled for today'}
                </div>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {isKm
                    ? 'ការណាត់ជួបរបស់អ្នកជំងឺនឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្ត។'
                    : 'Scheduled appointments and follow-up reminders will appear here.'}
                </p>
                <Link
                  href="/follow-ups"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>{isKm ? 'មើលកាលវិភាគទាំងអស់' : 'View Full Schedule'}</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab 4 Content: Core Workflows */}
        {activeTab === 'workflows' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {visibleWorkflowCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group p-4 bg-[#FAF7F2] rounded-2xl border border-[#E7E1D4] hover:border-teal-700 transition-all shadow-xs card-3d flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 shadow-2xs ${card.bg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm">
                      {isKm ? card.titleKh : card.titleEn}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {isKm ? card.descKh : card.descEn}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-800 group-hover:translate-x-1 transition-transform">
                    <span>{isKm ? card.actionKh : card.actionEn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ABA PayWay Quick Setup Card */}
      <AbaPaywayTesterCard />

      {/* Secondary Metrics & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick System Pulse (1 col) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
            {isKm ? 'ទិន្នន័យប្រព័ន្ធគ្លីនិក' : 'Clinic System Metrics'}
          </h2>

          <div className="grid grid-cols-2 gap-3">
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
        </div>

        {/* Right: Real-Time Activity Log (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
            {t.dashboard.recentActivity}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Recent Encounters */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] p-4 shadow-xs space-y-3 card-3d">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5 border-b border-[#EFEAE0] pb-2">
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
                          {v.patient?.patientCode || v.visitCode}
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-3 text-center">
                  {isKm ? 'មិនទាន់មានវត្តមានអ្នកជំងឺថ្មីនៅឡើយ' : 'No visits registered today yet.'}
                </p>
              )}
            </div>

            {/* Recent Invoices */}
            <div className="bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] p-4 shadow-xs space-y-3 card-3d">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5 border-b border-[#EFEAE0] pb-2">
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
                <p className="text-xs text-stone-400 py-3 text-center">
                  {isKm ? 'មិនទាន់មានវិក្កយបត្រនៅឡើយ' : 'No recent invoices.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Drawers and Modals */}
      <RegisterPatientDrawer
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientCreated={() => fetchMetrics()}
      />

      <ExploreModulesModal
        isOpen={isExploreOpen}
        onClose={() => setIsExploreOpen(false)}
      />

      {/* Real Live KHQR Checkout Modal on Dashboard */}
      {selectedInvoiceForKhqr && (
        <KhqrCheckoutModal
          isOpen={Boolean(selectedInvoiceForKhqr)}
          onClose={() => setSelectedInvoiceForKhqr(null)}
          invoice={selectedInvoiceForKhqr}
          clinicName={user?.tenant?.nameEn || 'ROTANA CLINIC'}
          clinicNameKh={user?.tenant?.nameKh || 'គ្លីនិក រតនា'}
          onPaymentSuccess={() => {
            try {
              playPaymentSuccessChime();
            } catch {}
            setActionFeedback({
              type: 'success',
              message: isKm
                ? `ការទូទាត់វិក្កយបត្រ ${selectedInvoiceForKhqr.invoiceNumber} តាម KHQR បានជោគជ័យ`
                : `KHQR payment for invoice ${selectedInvoiceForKhqr.invoiceNumber} received successfully`,
            });
            setSelectedInvoiceForKhqr(null);
            fetchMetrics();
          }}
        />
      )}
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
