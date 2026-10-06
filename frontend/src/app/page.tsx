'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
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
  Building,
  RefreshCw,
  Stethoscope,
  ShieldCheck,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { RegisterPatientDrawer } from '../components/patients/RegisterPatientDrawer';

export default function DashboardPage() {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Operations Command</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time outpatient queue, dynamic KHQR settlement revenue, pharmacy fulfillment, and follow-ups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm transition-colors text-xs"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register Patient</span>
          </button>
          <Link
            href="/visits"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Outpatient Queue</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Waiting */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Waiting Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics ? metrics.queueStatus?.waiting : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting triage & consultation</p>
        </div>

        {/* In Consultation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Consultation</span>
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-800 font-mono">
            {metrics ? metrics.queueStatus?.inConsultation : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active physician encounters</p>
        </div>

        {/* Completed Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Finished Consultations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 font-mono">
            {metrics ? metrics.queueStatus?.completedToday : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Today outpatient encounters</p>
        </div>

        {/* KHQR Revenue Settled */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">KHQR Settled (Today)</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ${metrics ? metrics.revenueToday?.usd?.toFixed(2) : '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? metrics.revenueToday?.paidInvoicesCount : '0'} verified settlements
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">Registered Patients</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {metrics ? metrics.totalPatients : '0'}
            </div>
          </div>
          <Users className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">Follow-Ups Today</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {metrics ? metrics.followUps?.todayScheduled : '0'}
            </div>
          </div>
          <CalendarDays className="w-5 h-5 text-teal-600" />
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">Pharmacy Pending</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              {metrics ? metrics.pharmacy?.pendingPrescriptions : '0'}
            </div>
          </div>
          <Pill className="w-5 h-5 text-indigo-500" />
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500">Archived Documents</div>
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
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Clinical Workflows & Modules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/patients"
              className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Patient Registry & 360</h3>
                <p className="text-xs text-slate-500 mt-1">
                  National ID duplicate prevention, comprehensive clinical timeline, allergy alerts, and records.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-700 group-hover:translate-x-1 transition-transform">
                <span>Open Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/visits"
              className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Visits & Medical Records</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Live queue, BMI calculation, physical examination findings, assessment, and care plans.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-700 group-hover:translate-x-1 transition-transform">
                <span>Manage Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/prescriptions"
              className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2.5">
                  <Pill className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Pharmacy & Prescriptions</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Multi-item medication orders, dosage and duration tracking, and automatic dispensing invoices.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-700 group-hover:translate-x-1 transition-transform">
                <span>Dispense Drugs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/billing"
              className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Dynamic KHQR Billing</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tag 01=12 exact locked dynamic QR, ABA Mobile deep links, and 0.3s real-time verification.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>Cashier Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/follow-ups"
              className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2.5">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Follow-Ups & Recalls</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Post-operative recall, suture removals, chronic illness monitoring, and patient scheduling.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-700 group-hover:translate-x-1 transition-transform">
                <span>View Schedule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>

            <Link
              href="/documents"
              className="group p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-2.5">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Lab & Clinical Documents</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload laboratory blood tests, radiology X-ray/ultrasound scans, and medical certificates.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-700 group-hover:translate-x-1 transition-transform">
                <span>Browse Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* Right: Real-time Activity Stream */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Recent Operational Activity
          </h2>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-700" />
                <span>Latest Outpatient Encounters</span>
              </div>
              {metrics?.recentActivity?.visits?.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {metrics.recentActivity.visits.map((v: any) => (
                    <div key={v.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-900">{v.patient?.nameEn}</div>
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
                <p className="text-xs text-slate-400 py-2">No visits registered today yet.</p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-800 mb-2.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Latest Invoices</span>
              </div>
              {metrics?.recentActivity?.invoices?.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {metrics.recentActivity.invoices.map((inv: any) => (
                    <div key={inv.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-900">{inv.patient?.nameEn}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{inv.invoiceNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-slate-900">
                          ${Number(inv.payableAmount).toFixed(2)}
                        </div>
                        <span
                          className={`text-[10px] font-medium ${
                            inv.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">No recent invoices.</p>
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
