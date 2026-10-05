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
} from 'lucide-react';
import { RegisterPatientDrawer } from '../components/patients/RegisterPatientDrawer';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      const data = await api.dashboard.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // 10s live polling
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time patient queue, pharmacy dispatch, and instant KHQR settlements</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Patient</span>
          </button>
          <Link
            href="/visits"
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Check-in Visit</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Waiting Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics ? metrics.queueStatus.waiting : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Patients in waiting area</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Consultation</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics ? metrics.queueStatus.inConsultation : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Active doctor encounters</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pharmacy Pending</span>
            <Pill className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics ? metrics.pharmacy.pendingPrescriptions : '0'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Prescriptions to dispense</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">KHQR Settlements</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            ${metrics ? metrics.revenueToday.usd.toFixed(2) : '0.00'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics ? metrics.revenueToday.paidInvoicesCount : '0'} invoices settled today
          </p>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/patients"
          className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Patient Registry</h3>
            <p className="text-xs text-slate-500 mt-1">
              Search comprehensive records, duplicate prevention, and view complete clinical timeline.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-700 group-hover:translate-x-1 transition-transform">
            <span>Access Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/visits"
          className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Doctor Consultation Queue</h3>
            <p className="text-xs text-slate-500 mt-1">
              Record vital signs, physical examination notes, diagnoses, and automatic fee invoicing.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-700 group-hover:translate-x-1 transition-transform">
            <span>View Active Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/prescriptions"
          className="group p-5 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-all shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <Pill className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Pharmacy & Billing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dispense multi-item medications and generate dynamic Tag 01=12 KHQR codes for instant ABA payment.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-700 group-hover:translate-x-1 transition-transform">
            <span>Manage Dispensing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      <RegisterPatientDrawer
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientCreated={() => fetchMetrics()}
      />
    </div>
  );
}
