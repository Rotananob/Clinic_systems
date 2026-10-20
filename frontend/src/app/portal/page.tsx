'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import {
  Clock,
  Users,
  Pill,
  CreditCard,
  Bell,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  RefreshCw,
  Search,
  User,
  Calendar,
  Phone,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Building2,
  Stethoscope,
  Volume2,
} from 'lucide-react';

interface PortalData {
  patient: {
    id: string;
    patientCode: string;
    nameEn: string;
    nameKh?: string | null;
    gender: string;
    phone: string;
    bloodType?: string | null;
    allergies?: string | null;
  };
  activeQueue?: {
    ticketCode: string;
    visitCode: string;
    status: string;
    queuePosition: number;
    patientsAhead: number;
    estimatedWaitMinutes: number;
    assignedDoctorName?: string | null;
    consultationRoom?: string;
    checkInTime: string;
  } | null;
  prescriptions: Array<{
    id: string;
    prescriptionCode: string;
    status: string;
    doctorName?: string | null;
    issuedAt: string;
    totalAmount: number;
    items: Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: number;
      instructions?: string | null;
    }>;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    payableAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    khqrString?: string | null;
  }>;
  clinic: {
    nameEn: string;
    nameKh: string;
    phone?: string | null;
    address?: string | null;
  };
}

export default function PatientPortalPage() {
  const { t, locale, setLocale } = useTranslation();
  const isKm = locale === 'km';
  const pLoc = (t as any).patientPortal || {};

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'PRESCRIPTIONS' | 'PAYMENTS' | 'REMINDERS'>('QUEUE');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize Telegram WebApp SDK if running inside Telegram Mini App
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      setIsTelegramWebApp(true);

      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user);
        if (tg.initDataUnsafe.user.username) {
          // Pre-populate search or lookup
          fetchPatient(tg.initDataUnsafe.user.username);
        }
      }
    }

    // Check URL parameters for direct ticket/patient link (e.g. ?patient=P-2026-0001 or ?ticket=Q-014)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('patient') || params.get('ticket') || params.get('phone');
      if (q) {
        setSearchQuery(q);
        fetchPatient(q);
      }
    }
  }, []);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const fetchPatient = async (idToSearch?: string) => {
    const q = (idToSearch || searchQuery).trim();
    if (!q) {
      setError(
        isKm
          ? 'សូមវាយបញ្ចូលកូដអ្នកជំងឺ លេខទូរស័ព្ទ ឬលេខសំបុត្រដើម្បីស្វែងរក។'
          : 'Please enter patient code, phone number, or visit code to track.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.portal.getPatient(q);
      setPortalData(res);
      triggerHaptic();
    } catch (err: any) {
      console.warn('Portal lookup error:', err.message);
      setError(
        isKm
          ? 'មិនមានទិន្នន័យសម្រាប់លេខកូដនេះឡើយ។ សូមពិនិត្យលេខកូដ ឬសាកសួរតុបេឡា។'
          : 'No active patient record found matching your query. Please verify and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const latestUnpaidInvoice = useMemo(() => {
    return portalData?.invoices.find((inv) => inv.status === 'UNPAID') || portalData?.invoices[0];
  }, [portalData]);

  const latestPrescription = useMemo(() => {
    return portalData?.prescriptions[0];
  }, [portalData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {portalData?.clinic?.nameKh || 'មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {portalData?.clinic?.nameEn || 'Rotana Polyclinic & Medical Center'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isTelegramWebApp && (
              <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full font-medium">
                Telegram TMA
              </span>
            )}
            <button
              onClick={() => setLocale(isKm ? 'en' : 'km')}
              className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              {isKm ? 'EN' : 'ខ្មែរ'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 py-4 flex-1 space-y-4">
        {/* Search / Lookup Banner */}
        <section className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
            <span>{pLoc.searchButton || 'Track My Visit'}</span>
            {portalData && (
              <button
                onClick={() => fetchPatient()}
                className="text-[11px] text-teal-700 dark:text-teal-400 flex items-center space-x-1 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>{isKm ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Refresh'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPatient()}
                placeholder={pLoc.searchPlaceholder || 'Enter patient code, phone, or ticket...'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
              />
            </div>
            <button
              onClick={() => fetchPatient()}
              disabled={loading}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              {loading ? (isKm ? 'កំពុងស្វែងរក...' : 'Searching...') : pLoc.searchButton || 'Track'}
            </button>
          </div>

          {error && (
            <div className="mt-2.5 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Patient Profile Bar (if loaded) */}
        {portalData && (
          <section className="bg-gradient-to-r from-teal-900 to-teal-800 text-white p-3.5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm">
                    {portalData.patient.nameEn}
                    {portalData.patient.nameKh && (
                      <span className="font-normal text-teal-200 ml-1">({portalData.patient.nameKh})</span>
                    )}
                  </span>
                  <span className="text-[10px] bg-teal-800/80 px-2 py-0.5 rounded-md font-mono border border-teal-700">
                    {portalData.patient.patientCode}
                  </span>
                </div>
                <div className="text-[11px] text-teal-200 mt-0.5 flex items-center space-x-3">
                  <span>{portalData.patient.phone}</span>
                  {portalData.patient.allergies && (
                    <span className="text-amber-300 font-medium">
                      Allergy: {portalData.patient.allergies}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-9 h-9 rounded-full bg-teal-700/60 border border-teal-500/30 flex items-center justify-center">
                <User className="w-5 h-5 text-teal-200" />
              </div>
            </div>
          </section>
        )}

        {/* Navigation Tabs */}
        <nav className="grid grid-cols-4 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('QUEUE');
              triggerHaptic();
            }}
            className={`py-2 px-1 text-center rounded-lg transition ${
              activeTab === 'QUEUE'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {pLoc.tabQueue || 'Queue'}
          </button>
          <button
            onClick={() => {
              setActiveTab('PRESCRIPTIONS');
              triggerHaptic();
            }}
            className={`py-2 px-1 text-center rounded-lg transition ${
              activeTab === 'PRESCRIPTIONS'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {pLoc.tabPrescriptions || 'Prescriptions'}
          </button>
          <button
            onClick={() => {
              setActiveTab('PAYMENTS');
              triggerHaptic();
            }}
            className={`py-2 px-1 text-center rounded-lg transition ${
              activeTab === 'PAYMENTS'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {pLoc.tabPayments || 'KHQR'}
          </button>
          <button
            onClick={() => {
              setActiveTab('REMINDERS');
              triggerHaptic();
            }}
            className={`py-2 px-1 text-center rounded-lg transition ${
              activeTab === 'REMINDERS'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {pLoc.tabReminders || 'Reminders'}
          </button>
        </nav>

        {/* Tab 1: Live Waiting Queue */}
        {activeTab === 'QUEUE' && (
          <div className="space-y-3">
            {portalData?.activeQueue ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs text-center space-y-4">
                <div className="inline-block px-3 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-full text-xs font-semibold text-teal-800 dark:text-teal-300">
                  {portalData.activeQueue.status === 'IN_CONSULTATION'
                    ? pLoc.statusCalling || 'Now Calling - Please Enter Room'
                    : portalData.activeQueue.status === 'COMPLETED'
                    ? pLoc.statusCompleted || 'Visit Completed'
                    : pLoc.statusWaiting || 'Waiting in Queue'}
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    {pLoc.ticketNumber || 'Your Ticket Number'}
                  </div>
                  <div className="text-5xl font-extrabold text-teal-800 dark:text-teal-400 font-mono tracking-tight my-1">
                    {portalData.activeQueue.ticketCode}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Visit Code: {portalData.activeQueue.visitCode}
                  </div>
                </div>

                {/* Queue Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {pLoc.patientsAhead || 'Patients Ahead'}
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                      {portalData.activeQueue.patientsAhead}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Position #{portalData.activeQueue.queuePosition}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {pLoc.estimatedWait || 'Estimated Wait'}
                    </div>
                    <div className="text-2xl font-bold text-teal-700 dark:text-teal-400 font-mono mt-0.5">
                      ~{portalData.activeQueue.estimatedWaitMinutes}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {pLoc.minutesUnit || 'minutes'}
                    </div>
                  </div>
                </div>

                {/* Assigned Room & Doctor */}
                <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900 rounded-xl text-left flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px] uppercase font-semibold">
                      {pLoc.consultationRoom || 'Consultation Room'}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {portalData.activeQueue.consultationRoom || 'Room 1'}
                    </div>
                    <div className="text-slate-500 text-xs">
                      Dr. {portalData.activeQueue.assignedDoctorName || 'General Practitioner'}
                    </div>
                  </div>
                  <Building2 className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-xs text-slate-500">
                  {isKm
                    ? 'សូមវាយបញ្ចូលលេខកូដអ្នកជំងឺ ឬលេខសំបុត្រដើម្បីពិនិត្យលេខរង់ចាំរបស់អ្នក។'
                    : 'Please enter your patient code or visit code to track your queue status.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Digital Prescriptions */}
        {activeTab === 'PRESCRIPTIONS' && (
          <div className="space-y-3">
            {portalData?.prescriptions && portalData.prescriptions.length > 0 ? (
              portalData.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="font-mono font-bold text-sm text-teal-800 dark:text-teal-400">
                        {rx.prescriptionCode}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(rx.issuedAt).toLocaleDateString()} {rx.doctorName && `— Dr. ${rx.doctorName}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        ${rx.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {rx.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-100">
                          <span>{item.medicineName}</span>
                          <span className="font-mono text-teal-700 dark:text-teal-400">{item.dosage}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                          <span>{item.frequency}</span>
                          <span>•</span>
                          <span>{item.duration}</span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                        {item.instructions && (
                          <div className="text-[10px] text-slate-400 italic">
                            {item.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Verification Seal */}
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pLoc.verifiedSeal || 'Digitally Verified & Encrypted Prescription'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                <Pill className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-xs text-slate-500">
                  {pLoc.rxEmpty || 'No prescriptions recorded for this visit yet.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: KHQR Self-Checkout */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-3">
            {latestUnpaidInvoice ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs text-center space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">
                      {pLoc.paymentTitle || 'Invoice'}
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {latestUnpaidInvoice.invoiceNumber}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      latestUnpaidInvoice.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {latestUnpaidInvoice.status === 'PAID'
                      ? pLoc.paymentPaid || 'PAID'
                      : pLoc.paymentPending || 'UNPAID'}
                  </span>
                </div>

                {/* Amount display */}
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold">
                    {pLoc.paymentPending || 'Total Balance Due'}
                  </div>
                  <div className="text-4xl font-extrabold text-teal-800 dark:text-teal-400 font-mono tracking-tight my-1">
                    ${latestUnpaidInvoice.payableAmount.toFixed(2)}
                  </div>
                </div>

                {/* KHQR Payload display */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl inline-block border border-slate-200 dark:border-slate-700">
                  <QrCode className="w-40 h-40 mx-auto text-slate-800 dark:text-slate-100" />
                  <div className="text-[11px] text-slate-500 mt-2 font-medium">
                    {pLoc.scanToPay || 'Scan KHQR with any Cambodian Banking App'}
                  </div>
                </div>

                {/* Direct Banking App Links */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href="https://link.payway.com.kh"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition"
                  >
                    <span>{pLoc.openAba || 'Pay with ABA Mobile'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://bakong.nbc.org.kh"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition"
                  >
                    <span>{pLoc.openBakong || 'Pay with Bakong'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-xs text-slate-500">
                  {isKm ? 'គ្មានវិក្កយបត្រត្រូវទូទាត់ឡើយ។' : 'No pending invoices found for your record.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Telegram Reminders */}
        {activeTab === 'REMINDERS' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-700 dark:text-sky-300">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {pLoc.remindersTitle || 'Automated Telegram Reminders'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {pLoc.remindersSubtitle || 'Never miss a dose or follow-up consultation'}
                  </div>
                </div>
              </div>

              {/* Medication Schedule Preview */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  {pLoc.medicationSchedule || 'Daily Medication Schedule'}
                </div>
                {latestPrescription?.items && latestPrescription.items.length > 0 ? (
                  latestPrescription.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {it.medicineName} ({it.dosage})
                        </div>
                        <div className="text-[11px] text-slate-500">{it.frequency}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-semibold">
                        Active
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500">
                    {isKm
                      ? 'វេជ្ជបញ្ជានឹងលោតកាលវិភាគលេបថ្នាំដោយស្វ័យប្រវត្តនៅទីនេះ។'
                      : 'Prescribed medication schedules will automatically populate here.'}
                  </div>
                )}
              </div>

              {/* Telegram Bot Link Button */}
              <div className="pt-2">
                <a
                  href={`https://t.me/Clinic_systemBot?start=patient_${portalData?.patient?.patientCode || 'demo'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition"
                >
                  <Bell className="w-4 h-4" />
                  <span>{pLoc.connectTelegram || 'Connect to Official Clinic Telegram Bot'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-slate-400 py-3">
        {pLoc.poweredBy || 'ClinicOS Patient Cloud Platform'}
      </footer>
    </div>
  );
}
