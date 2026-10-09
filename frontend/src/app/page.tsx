'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useTranslation } from '../context/I18nContext';
import Link from 'next/link';
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
} from 'lucide-react';
import { RegisterPatientDrawer } from '../components/patients/RegisterPatientDrawer';

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {t.dashboard.commandTitle}
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t.dashboard.liveSync}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.dashboard.subtitle}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={fetchMetrics}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl shadow-xs transition-colors text-xs"
            title={t.common.refresh}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.dashboard.registerPatient}</span>
          </button>
          <Link
            href="/queue"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Monitor className="w-4 h-4 text-amber-400" />
            <span>{t.dashboard.queueCallingBtn}</span>
          </Link>
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <CreditCard className="w-4 h-4" />
            <span>KHQR & Billing</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Waiting */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t.dashboard.waitingQueue}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics ? metrics.queueStatus?.waiting : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isKm ? 'រង់ចាំវាស់ Vitals & ពិគ្រោះ' : 'Awaiting triage & consultation'}
          </p>
        </div>

        {/* In Consultation */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t.dashboard.inConsultation}</span>
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-800 font-mono">
            {metrics ? metrics.queueStatus?.inConsultation : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isKm ? 'វេជ្ជបណ្ឌិតកំពុងពិនិត្យព្យាបាល' : 'Active physician encounters'}
          </p>
        </div>

        {/* Completed Today */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t.dashboard.finishedConsultations}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 font-mono">
            {metrics ? metrics.queueStatus?.completedToday : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isKm ? 'វត្តមានពិគ្រោះថ្ងៃនេះ' : 'Today outpatient encounters'}
          </p>
        </div>

        {/* KHQR Revenue Settled */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">{t.dashboard.khqrRevenue}</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ${metrics ? Number(metrics.revenueToday?.usd || 0).toFixed(2) : '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? metrics.revenueToday?.paidInvoicesCount : '0'} {isKm ? 'ប្រតិបត្តិការទូទាត់' : 'verified settlements'}
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">{t.dashboard.registeredPatients}</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {metrics ? metrics.totalPatients : '0'}
            </div>
          </div>
          <Users className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">{t.dashboard.followUpsToday}</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {metrics ? metrics.followUps?.todayScheduled : '0'}
            </div>
          </div>
          <CalendarDays className="w-5 h-5 text-teal-600" />
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">{t.dashboard.pharmacyPending}</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {metrics ? metrics.pharmacy?.pendingPrescriptions : '0'}
            </div>
          </div>
          <Pill className="w-5 h-5 text-indigo-500" />
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">{t.dashboard.archivedDocuments}</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {metrics ? metrics.documents?.total : '0'}
            </div>
          </div>
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Clinical Operations & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Launch Navigation (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              {t.dashboard.quickWorkflows}
            </h2>
            <span className="text-[10px] text-teal-700 font-mono font-medium">
              Enterprise Grade
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/queue"
              className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-700 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mb-2.5 shadow-2xs">
                  <Monitor className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{t.queue.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.queue.subtitle}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-1 transition-transform">
                <span>{isKm ? 'បើកផ្ទាំងហៅលេខ' : 'Launch Queue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/certificates"
              className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-700 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{t.certificates.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.certificates.subtitle}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-1 transition-transform">
                <span>{isKm ? 'ចេញលិខិតផ្លូវការ' : 'Issue Certificate'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/patients"
              className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-700 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{t.patients.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.patients.subtitle}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:translate-x-1 transition-transform">
                <span>{t.patients.viewProfile}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/billing"
              className="group p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-700 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{t.billing.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t.billing.subtitle}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>{t.billing.payWithKhqr}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Right: Real-time Activity Stream & Audit Log */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            {t.dashboard.recentActivity}
          </h2>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-700" />
                <span>{t.dashboard.latestEncounters}</span>
              </div>
              {metrics?.recentActivity?.visits?.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {metrics.recentActivity.visits.map((v: any) => (
                    <div key={v.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-900">
                          {isKm && v.patient?.nameKh ? v.patient.nameKh : v.patient?.nameEn || 'Patient'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {v.visitCode} {v.doctor?.fullNameEn ? `• Dr. ${v.doctor.fullNameEn}` : ''}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">
                  {isKm ? 'មិនទាន់មានវត្តមានអ្នកជំងឺថ្មីនៅឡើយ' : 'No visits registered today yet.'}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.dashboard.latestInvoices}</span>
              </div>
              {metrics?.recentActivity?.invoices?.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {metrics.recentActivity.invoices.map((inv: any) => (
                    <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-900">
                          {isKm && inv.patient?.nameKh ? inv.patient.nameKh : inv.patient?.nameEn || 'Patient'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{inv.invoiceNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-slate-900">
                          ${Number(inv.payableAmount).toFixed(2)}
                        </div>
                        <span
                          className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">
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
    </div>
  );
}
