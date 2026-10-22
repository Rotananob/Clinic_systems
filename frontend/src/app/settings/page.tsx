'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import { playPaymentSuccessChime, playHospitalChime, playCashRegisterChime } from '../../lib/chime';
import { HardwareSettingsPanel } from '../../components/hardware/HardwareSettingsPanel';
import { TelegramSettingsPanel } from '../../components/telegram/TelegramSettingsPanel';
import { SoundSettingsPanel } from '../../components/sound/SoundSettingsPanel';
import { SubscriptionSettingsPanel } from '../../components/subscriptions/SubscriptionSettingsPanel';
import { ModuleVisibilitySettingsPanel } from '../../components/settings/ModuleVisibilitySettingsPanel';
import { SystemUpdateSettingsPanel } from '../../components/settings/SystemUpdateSettingsPanel';
import {
  Building2,
  QrCode,
  DollarSign,
  Printer,
  ShieldAlert,
  Save,
  RotateCcw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Percent,
  Cpu,
  LayoutTemplate,
  ArrowRight,
  Send,
  CreditCard,
  Smartphone,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';

interface ClinicSettingsState {
  // 1. Clinic Profile
  clinicNameEn: string;
  clinicNameKh: string;
  mohLicenseNumber: string;
  clinicType: string;
  phonePrimary: string;
  phoneEmergency: string;
  email: string;
  website: string;
  addressEn: string;
  addressKh: string;
  openingHoursEn: string;
  openingHoursKh: string;
  missionSlogan: string;

  // 2. KHQR & PayWay Integration
  merchantName: string;
  merchantCity: string;
  bakongAccountId: string;
  defaultCurrency: 'USD' | 'KHR';
  usdToKhrRate: number;
  pollingIntervalSeconds: number;
  enableDynamicTag0112: boolean;
  autoCloseOnSettled: boolean;
  enableSoundAlert: boolean;
  headlessBridgeUrl: string;
  paywayPaymentUrl: string;

  // 3. Service & Fee Catalog
  generalConsultationFee: number;
  specialistConsultationFee: number;
  pediatricConsultationFee: number;
  emergencySurchargeFee: number;
  ultrasoundScanFee: number;
  labCompleteBloodCountFee: number;
  ecgMonitoringFee: number;
  minorSurgeryBaseFee: number;
  pharmacyDispenseMarkupPercent: number;

  // 4. Receipt & Printing Setup
  receiptTitleEn: string;
  receiptTitleKh: string;
  paperFormat: '80MM_THERMAL' | 'A4_STANDARD' | 'A5_HALF';
  showHeaderLogo: boolean;
  showDoctorName: boolean;
  showCashierName: boolean;
  printKhqrOnPending: boolean;
  printAbaReferenceOnPaid: boolean;
  receiptFooterNoteKh: string;
  receiptFooterNoteEn: string;
  autoOpenPrintDialog: boolean;

  // 5. Security & Operations
  confirmBeforeRevertPaid: boolean;
  inactivityTimeoutMinutes: number;
  preventDuplicatePatientId: boolean;
  auditTrailRetentionDays: number;
  enforceStrongPassword: boolean;
}

const defaultSettings: ClinicSettingsState = {
  // 1. Clinic Profile
  clinicNameEn: '',
  clinicNameKh: '',
  mohLicenseNumber: '',
  clinicType: 'Polyclinic & Outpatient Center',
  phonePrimary: '',
  phoneEmergency: '',
  email: '',
  website: '',
  addressEn: '',
  addressKh: '',
  openingHoursEn: 'Monday - Sunday: 07:30 AM - 08:30 PM (Emergency 24/7)',
  openingHoursKh: 'ច័ន្ទ ដល់ អាទិត្យ៖ ម៉ោង ៧:៣០ ព្រឹក ដល់ ៨:៣០ យប់ - សង្គ្រោះបន្ទាន់ ២៤/៧',
  missionSlogan: 'Professional Medical Care With Compassion & Precision',

  // 2. KHQR & PayWay
  merchantName: '',
  merchantCity: 'PHNOM PENH',
  bakongAccountId: '',
  defaultCurrency: 'USD',
  usdToKhrRate: 4100,
  pollingIntervalSeconds: 3,
  enableDynamicTag0112: true,
  autoCloseOnSettled: false,
  enableSoundAlert: true,
  headlessBridgeUrl: 'http://localhost:4000/api/payments/khqr',
  paywayPaymentUrl: '',

  // 3. Service Fees
  generalConsultationFee: 10.0,
  specialistConsultationFee: 20.0,
  pediatricConsultationFee: 15.0,
  emergencySurchargeFee: 15.0,
  ultrasoundScanFee: 25.0,
  labCompleteBloodCountFee: 18.0,
  ecgMonitoringFee: 15.0,
  minorSurgeryBaseFee: 30.0,
  pharmacyDispenseMarkupPercent: 5.0,

  // 4. Receipt & Printing
  receiptTitleEn: 'OFFICIAL MEDICAL INVOICE & RECEIPT',
  receiptTitleKh: 'វិក្កយបត្រ និងបង្កាន់ដៃទទួលប្រាក់វេជ្ជសាស្ត្រ',
  paperFormat: '80MM_THERMAL',
  showHeaderLogo: true,
  showDoctorName: true,
  showCashierName: true,
  printKhqrOnPending: true,
  printAbaReferenceOnPaid: true,
  receiptFooterNoteKh: 'សូមអរគុណ និងសូមជូនពរឆាប់ជាសះស្បើយ!',
  receiptFooterNoteEn: 'Thank you for choosing Houn Vannak Clinic. Wishing you a speedy recovery!',
  autoOpenPrintDialog: true,

  // 5. Security & Operations
  confirmBeforeRevertPaid: true,
  inactivityTimeoutMinutes: 30,
  preventDuplicatePatientId: true,
  auditTrailRetentionDays: 365,
  enforceStrongPassword: true,
};

const STORAGE_KEY = 'houn_vannak_clinic_settings_v1';

export default function SettingsPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const [activeTab, setActiveTab] = useState<'profile' | 'khqr' | 'fees' | 'receipt' | 'hardware' | 'sound' | 'telegram' | 'security' | 'subscription' | 'modules' | 'updates'>('profile');
  const [settings, setSettings] = useState<ClinicSettingsState>(defaultSettings);
  const [savedNotice, setSavedNotice] = useState(false);
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [tenantLoading, setTenantLoading] = useState<boolean>(true);
  const [testingKhqr, setTestingKhqr] = useState<boolean>(false);
  const [testKhqrResult, setTestKhqrResult] = useState<any>(null);
  const [savingBackend, setSavingBackend] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab && ['profile', 'khqr', 'fees', 'receipt', 'hardware', 'sound', 'telegram', 'security', 'subscription'].includes(tab)) {
          setActiveTab(tab as any);
        }
      }
      // Fetch clinic tenant profile from database
      const fetchTenant = async () => {
        try {
          setTenantLoading(true);
          const res = await api.tenants.getProfile();
          if (res && res.success && res.tenant) {
            setTenantProfile(res);
            const t = res.tenant;
            setSettings((prev) => ({
              ...prev,
              clinicNameEn: t.clinicNameEn || prev.clinicNameEn,
              clinicNameKh: t.clinicNameKh || prev.clinicNameKh,
              mohLicenseNumber: t.mohLicenseNumber || prev.mohLicenseNumber,
              clinicType: t.clinicType || prev.clinicType,
              phonePrimary: t.phonePrimary || prev.phonePrimary,
              phoneEmergency: t.phoneEmergency || prev.phoneEmergency,
              email: t.email || prev.email,
              website: t.website || prev.website,
              addressEn: t.addressEn || prev.addressEn,
              addressKh: t.addressKh || prev.addressKh,
              bakongAccountId: t.bakongAccountId || prev.bakongAccountId,
              merchantName: t.merchantName || prev.merchantName,
              merchantCity: t.merchantCity || prev.merchantCity || 'PHNOM PENH',
              paywayPaymentUrl: t.paywayPaymentUrl || prev.paywayPaymentUrl,
            }));
          }
        } catch (err) {
          console.warn('Failed to fetch tenant profile from server', err);
        } finally {
          setTenantLoading(false);
        }
      };
      fetchTenant();

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      // Fallback to defaultSettings if corrupted
    }
  }, []);

  const handleTestKhqr = async () => {
    if (!settings.bakongAccountId?.trim() || !settings.merchantName?.trim()) {
      setBackendError(
        isKm
          ? 'សូមបញ្ចូល Bakong Account ID និងឈ្មោះ Merchant Name ជាមុនសិនដើម្បីសាកល្បងបង្កើត QR។'
          : 'Please enter Bakong Account ID and Merchant Name first to test QR generation.'
      );
      return;
    }
    setTestingKhqr(true);
    setBackendError(null);
    try {
      const res = await api.tenants.testMerchantKhqr({
        bakongAccountId: settings.bakongAccountId.trim(),
        merchantName: settings.merchantName.trim(),
        merchantCity: settings.merchantCity?.trim() || 'PHNOM PENH',
        paywayPaymentUrl: settings.paywayPaymentUrl?.trim() || undefined,
      });
      if (res && res.success) {
        setTestKhqrResult(res);
      }
    } catch (err: any) {
      setBackendError(err.message || 'Failed to generate test Dynamic KHQR.');
    } finally {
      setTestingKhqr(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBackend(true);
    setBackendError(null);
    try {
      if (activeTab === 'khqr' && settings.bakongAccountId && settings.merchantName) {
        const res = await api.tenants.setupMerchant({
          bakongAccountId: settings.bakongAccountId.trim(),
          merchantName: settings.merchantName.trim(),
          merchantCity: settings.merchantCity?.trim() || 'PHNOM PENH',
          paywayPaymentUrl: settings.paywayPaymentUrl?.trim() || undefined,
        });
        if (res && res.tenant) {
          setTenantProfile((prev: any) => ({ ...prev, tenant: { ...prev?.tenant, ...res.tenant } }));
        }
      } else if (activeTab === 'profile') {
        const res = await api.tenants.updateProfile({
          clinicNameEn: settings.clinicNameEn.trim(),
          clinicNameKh: settings.clinicNameKh.trim(),
          mohLicenseNumber: settings.mohLicenseNumber.trim(),
          clinicType: settings.clinicType,
          phonePrimary: settings.phonePrimary.trim(),
          phoneEmergency: settings.phoneEmergency.trim(),
          email: settings.email.trim(),
          website: settings.website.trim(),
          addressEn: settings.addressEn.trim(),
          addressKh: settings.addressKh.trim(),
          bakongAccountId: settings.bakongAccountId?.trim() || undefined,
          merchantName: settings.merchantName?.trim() || undefined,
          merchantCity: settings.merchantCity?.trim() || undefined,
          paywayPaymentUrl: settings.paywayPaymentUrl?.trim() || undefined,
        });
        if (res && res.tenant) {
          setTenantProfile((prev: any) => ({ ...prev, tenant: { ...prev?.tenant, ...res.tenant } }));
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      try {
        const userStr = localStorage.getItem('clinic_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          u.tenant = {
            ...u.tenant,
            clinicNameEn: settings.clinicNameEn,
            clinicNameKh: settings.clinicNameKh,
            bakongAccountId: settings.bakongAccountId,
            merchantName: settings.merchantName,
            merchantCity: settings.merchantCity,
            paywayPaymentUrl: settings.paywayPaymentUrl,
          };
          localStorage.setItem('clinic_user', JSON.stringify(u));
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('clinic_profile_updated'));
        }
      } catch {}
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setBackendError((err as any)?.message || 'Failed to save settings to server database.');
    } finally {
      setSavingBackend(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm(isKm ? 'តើអ្នកប្រាកដជាចង់កំណត់ការកំណត់ទាំងអស់ទៅលំនាំដើមវិញទេ?' : 'Reset all settings to default values?')) {
      setSettings(defaultSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
      setResetNotice(true);
      setTimeout(() => setResetNotice(false), 3000);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `houn_vannak_clinic_config_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const merged = { ...defaultSettings, ...parsed };
        setSettings(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
      } catch {
        alert(isKm ? 'ឯកសារកំណត់រចនាសម្ព័ន្ធមិនត្រឹមត្រូវ' : 'Invalid configuration JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isKm ? 'ការកំណត់ប្រព័ន្ធគ្លីនិក & សេវាកម្ម' : 'Clinic Configuration & System Settings'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isKm
              ? 'គ្រប់គ្រងព័ត៌មានគ្លីនិក ការតភ្ជាប់ KHQR PayWay តារាងថ្លៃសេវា ទម្រង់បោះពុម្ព និងសុវត្ថិភាពទិន្នន័យ'
              : 'Manage clinic identity, KHQR PayWay parameters, consultation fees, receipt formats, and security policies'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            title="Export Settings JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isKm ? 'ទាញយក Backup' : 'Export Config'}</span>
          </button>

          <label className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{isKm ? 'បញ្ចូល Backup' : 'Import Config'}</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs transition-colors"
            title="Reset to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

            {/* PaaS Multi-Tenant Workspace & Subscription Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              <Building2 className="w-6 h-6 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                  {settings.clinicNameKh || settings.clinicNameEn || (isKm ? 'មន្ទីរសម្រាកព្យាបាលរបស់អ្នក - Your Clinic' : 'Your Clinic Workspace')}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-teal-50 text-teal-800 border border-teal-200">
                  {tenantProfile?.tenant?.planTier ? tenantProfile.tenant.planTier.replace('_', ' ') : 'STARTER'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isKm ? 'គណនីសកម្ម - Active' : 'Active Workspace'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Subdomain: <span className="text-teal-800 font-semibold">{tenantProfile?.tenant?.slug || 'rotana'}.krupet.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{isKm ? 'គ្រប់គ្រងគម្រោងជាវ - Subscription' : 'Manage Subscription'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Usage & Settlement Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="text-slate-600">
              <span className="block text-[11px] text-slate-500">{isKm ? 'ប្រតិបត្តិការ KHQR ថ្ងៃនេះ' : 'KHQR Today'}</span>
              <span className="font-bold text-slate-900 text-sm">
                {tenantProfile?.usage?.todayKhqrCount || 0} / {tenantProfile?.usage?.maxDailyKhqr || 100}
              </span>
            </div>
            <QrCode className="w-5 h-5 text-teal-800" />
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="text-slate-600">
              <span className="block text-[11px] text-slate-500">{isKm ? 'អ្នកជំងឺក្នុងខែនេះ' : 'Monthly Patients'}</span>
              <span className="font-bold text-slate-900 text-sm">
                {tenantProfile?.usage?.totalPatientsCount || 0} / {tenantProfile?.usage?.maxMonthlyPatients || 500}
              </span>
            </div>
            <Building2 className="w-5 h-5 text-teal-800" />
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="text-slate-600">
              <span className="block text-[11px] text-slate-500">{isKm ? 'ការទូទាត់ផ្ទាល់ ១០០%' : 'Direct Settlement'}</span>
              <span className="font-bold text-emerald-800 text-sm">
                {settings.bakongAccountId ? 'READY (100% Direct)' : 'PENDING SETUP'}
              </span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {backendError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{backendError}</span>
        </div>
      )}

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{isKm ? 'ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ' : 'Configuration changes saved successfully!'}</span>
        </div>
      )}

      {resetNotice && (
        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>{isKm ? 'បានកំណត់ទៅតម្លៃលំនាំដើមឡើងវិញ' : 'Settings restored to clinic defaults!'}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto touch-scroll pb-px bg-white p-1 rounded-xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'profile'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isKm ? 'ព័ត៌មានគ្លីនិក' : 'Clinic Profile'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('khqr')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'khqr'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>{isKm ? 'ទូទាត់ KHQR & PayWay' : 'KHQR & PayWay'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'fees'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{isKm ? 'តារាងថ្លៃសេវា & ពិនិត្យ' : 'Service Fees'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipt')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'receipt'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>{isKm ? 'បោះពុម្ព & បង្កាន់ដៃ' : 'Receipt & Print'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'hardware'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>{isKm ? 'ហាតវែរ & ឧបករណ៍' : 'Hardware & Devices'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sound')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'sound'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>{isKm ? 'សំឡេង & សំឡេងនិយាយ' : 'Sounds & Voice'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('telegram')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'telegram'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{isKm ? 'តេឡេក្រាម & Forum Topics' : 'Telegram Bot & Topics'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'security'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isKm ? 'សុវត្ថិភាព & ប្រព័ន្ធ' : 'Security & System'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'subscription'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{isKm ? 'គម្រោងជាវ & បង់ប្រាក់ KHQR' : 'Subscription & Billing'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: Clinic Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-700" />
                <span>{isKm ? 'អត្តសញ្ញាណ និងព័ត៌មានផ្លូវការរបស់គ្លីនិក' : 'Official Clinic Identity & Information'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isKm
                  ? 'ព័ត៌មានទាំងនេះនឹងត្រូវបង្ហាញលើក្បាលវិក្កយបត្រ បង្កាន់ដៃទទួលប្រាក់ និងរបាយការណ៍វេជ្ជសាស្ត្រ'
                  : 'Appears on medical receipts, invoices, clinical summaries, and official headers'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ឈ្មោះគ្លីនិក - អង់គ្លេស' : 'Clinic Name (English)'}
                </label>
                <input
                  type="text"
                  value={settings.clinicNameEn}
                  onChange={(e) => setSettings({ ...settings, clinicNameEn: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ឈ្មោះគ្លីនិក - ខ្មែរ' : 'Clinic Name (Khmer)'}
                </label>
                <input
                  type="text"
                  value={settings.clinicNameKh}
                  onChange={(e) => setSettings({ ...settings, clinicNameKh: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'លេខអាជ្ញាប័ណ្ណក្រសួងសុខាភិបាល - MoH License' : 'Ministry of Health License #'}
                </label>
                <input
                  type="text"
                  value={settings.mohLicenseNumber}
                  onChange={(e) => setSettings({ ...settings, mohLicenseNumber: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ប្រភេទគ្លីនិក' : 'Clinic Classification'}
                </label>
                <select
                  value={settings.clinicType}
                  onChange={(e) => setSettings({ ...settings, clinicType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                >
                  <option value="Polyclinic & Outpatient Center">Polyclinic & Outpatient Center</option>
                  <option value="General Medical Clinic">General Medical Clinic</option>
                  <option value="Specialist Center & Maternity">Specialist Center & Maternity</option>
                  <option value="Dental & Facial Center">Dental & Facial Center</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'លេខទូរស័ព្ទទូទៅ - Primary Phone' : 'Primary Telephone'}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.phonePrimary}
                    onChange={(e) => setSettings({ ...settings, phonePrimary: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'លេខសង្គ្រោះបន្ទាន់ - Emergency Hotline' : 'Emergency Hotline 24/7'}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-rose-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.phoneEmergency}
                    onChange={(e) => setSettings({ ...settings, phoneEmergency: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'អ៊ីមែលផ្លូវការ - Official Email' : 'Official Email'}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'គេហទំព័រ - Official Website' : 'Official Website'}
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'អាសយដ្ឋានគ្លីនិក - ភាសាខ្មែរ' : 'Physical Address (Khmer)'}
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.addressKh}
                    onChange={(e) => setSettings({ ...settings, addressKh: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'អាសយដ្ឋានគ្លីនិក - អង់គ្លេស' : 'Physical Address (English)'}
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.addressEn}
                    onChange={(e) => setSettings({ ...settings, addressEn: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ម៉ោងបម្រើការងារ - ខ្មែរ' : 'Working Hours (Khmer)'}
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.openingHoursKh}
                    onChange={(e) => setSettings({ ...settings, openingHoursKh: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ម៉ោងបម្រើការងារ - អង់គ្លេស' : 'Working Hours (English)'}
                </label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={settings.openingHoursEn}
                    onChange={(e) => setSettings({ ...settings, openingHoursEn: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ពាក្យស្លោកគ្លីនិក - Slogan / Mission Statement' : 'Clinic Motto / Mission'}
                </label>
                <input
                  type="text"
                  value={settings.missionSlogan}
                  onChange={(e) => setSettings({ ...settings, missionSlogan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KHQR & PayWay Integration */}
        {activeTab === 'khqr' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-700" />
                  <span>{isKm ? 'ការកំណត់ KHQR & ABA PayWay Engine - PaaS Self-Service' : 'Bakong KHQR & PayWay Self-Service Gateway'}</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{isKm ? 'ដាក់ហើយដើរភ្លាមៗ - Instant Working' : 'Instant Live Working'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isKm
                  ? 'បញ្ចូល Bakong Account ID និង ABA PayWay Direct Link របស់គ្លីនិកអ្នកផ្ទាល់។ រាល់វិក្កយបត្រអ្នកជំងឺនឹងទូទាត់ចូលគណនីធនាគាររបស់គ្លីនិក ១០០% ដោយគ្មានកាត់កម្រៃជើងសារ។'
                  : 'Configure your clinic merchant credentials. Direct 100% bank settlement with zero commission and instant activation.'}
              </p>
            </div>

            {/* 4-Step Practical Guides for Clinic Merchant Setup */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-800" />
                  <span className="text-xs font-bold text-teal-950">
                    {isKm
                      ? 'ការណែនាំរៀបចំ Merchant ដោយខ្លួនឯង - Self-Service Setup Guide'
                      : 'Self-Service Clinic Merchant Setup Guide'}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-teal-800 bg-white px-2 py-0.5 rounded-full border border-teal-200">
                  {isKm ? 'ឥតគិតថ្លៃ ១០០%' : '100% Free Direct Settlement'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                {/* Guide 1: Bakong ID */}
                <div className="p-3 bg-white rounded-lg border border-teal-100 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="text-[11px] font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>{isKm ? 'របៀបយក Bakong ID' : 'Get Bakong ID'}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {isKm
                        ? 'បើក ABA Mobile -> Services -> ABA Merchant ឬ Bakong រួច Copy Bakong ID របស់អ្នក - ឧ. your_clinic@aba ឬលេខទូរស័ព្ទ'
                        : 'Open ABA Mobile -> Services -> tap ABA Merchant / Bakong and copy your Bakong ID (e.g. your_clinic@aba)'}
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-1 rounded">
                    your_clinic@aba
                  </div>
                </div>

                {/* Guide 2: ABA PayWay Direct Link */}
                <div className="p-3 bg-white rounded-lg border border-teal-100 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="text-[11px] font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>{isKm ? 'ABA PayWay Direct Link' : 'PayWay Direct Link'}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {isKm
                        ? 'ចូល ABA Merchant Portal ឬ ABA Mobile -> បង្កើត Checkout Payment Link រួច Paste ចូលប្រអប់ PayWay Link'
                        : 'Access ABA Merchant Portal or ABA Mobile -> create Direct Payment Link and paste it below'}
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-1 rounded truncate">
                    link.payway.com.kh/...
                  </div>
                </div>

                {/* Guide 3: Merchant Name EMVCo Tag 59 */}
                <div className="p-3 bg-white rounded-lg border border-teal-100 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="text-[11px] font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">3</span>
                      <span>{isKm ? 'ឈ្មោះ Merchant - Tag 59' : 'Merchant Name - Tag 59'}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {isKm
                        ? 'ឈ្មោះអក្សរឡាតាំងធំៗ បង្ហាញលើអេក្រង់ ABA / Bakong របស់អ្នកជំងឺពេលស្កេន បង្កើនទំនុកចិត្ត ១០០%'
                        : 'Uppercase Latin characters displayed on patient banking screens, establishing instant patient trust'}
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-1 rounded uppercase">
                    SOKHAPHEAP CLINIC
                  </div>
                </div>

                {/* Guide 4: 100% Direct Settlement */}
                <div className="p-3 bg-white rounded-lg border border-teal-100 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="text-[11px] font-bold text-teal-900 mb-1 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">4</span>
                      <span>{isKm ? 'លុយចូលកុងផ្ទាល់ ១០០%' : '100% Direct Settlement'}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {isKm
                        ? 'ប្រាក់ផ្ទេរចូលគណនីធនាគាររបស់គ្លីនិកភ្លាមៗ គ្មានកាត់កម្រៃជើងសារ គ្មានឆ្លងកាត់អ្នកដទៃ ដាក់ហើយដើរភ្លាម'
                        : 'Funds settle directly to your clinic bank account 24/7 with zero commission and instant activation'}
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                    0% Platform Fees
                  </div>
                </div>
              </div>
            </div>

            {/* Input Form Fields with Real Placeholders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'គណនីបាគង - Bakong Account ID *' : 'Bakong Account ID *'}
                </label>
                <input
                  type="text"
                  value={settings.bakongAccountId}
                  onChange={(e) => setSettings({ ...settings, bakongAccountId: e.target.value })}
                  required
                  placeholder="your_clinic@aba or 012345678@aclb"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white placeholder:text-slate-400"
                />
                <span className="text-[10px] text-slate-400">
                  {isKm ? 'ឧ. your_clinic@aba ឬលេខទូរស័ព្ទគណនីបាគង' : 'e.g. your_clinic@aba or registered phone number'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ឈ្មោះអាជីវករ KHQR - Merchant Name Tag 59 *' : 'KHQR Merchant Name - Tag 59 *'}
                </label>
                <input
                  type="text"
                  value={settings.merchantName}
                  onChange={(e) => setSettings({ ...settings, merchantName: e.target.value.toUpperCase() })}
                  required
                  placeholder="SOKHAPHEAP LOR CLINIC"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700 focus:bg-white placeholder:text-slate-400"
                />
                <span className="text-[10px] text-slate-400">
                  {isKm ? 'ឈ្មោះជាអក្សរឡាតាំងធំៗ បង្ហាញលើទូរស័ព្ទពេលស្កេន' : 'Printed on EMVCo Tag 59 (Uppercase Latin only)'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ទីក្រុងអាជីវករ - Merchant City Tag 60' : 'Merchant City (Tag 60)'}
                </label>
                <input
                  type="text"
                  value={settings.merchantCity}
                  onChange={(e) => setSettings({ ...settings, merchantCity: e.target.value.toUpperCase() })}
                  placeholder="PHNOM PENH"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700 focus:bg-white placeholder:text-slate-400"
                />
                <span className="text-[10px] text-slate-400">Printed on EMVCo Tag 60 (e.g. PHNOM PENH)</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ABA PayWay Direct Link (Deep Link)' : 'ABA PayWay Direct Merchant Link'}
                </label>
                <input
                  type="url"
                  value={settings.paywayPaymentUrl || ''}
                  onChange={(e) => setSettings({ ...settings, paywayPaymentUrl: e.target.value })}
                  placeholder="https://link.payway.com.kh/ABAPAYCK539089j"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white placeholder:text-slate-400 text-slate-800"
                />
                <span className="text-[10px] text-slate-400">
                  {isKm ? 'តំណភ្ជាប់ PayWay Checkout Link ផ្ទាល់ពី ABA Mobile សម្រាប់ 1-Tap Deep Link' : 'Direct PayWay Checkout Link for instant 1-tap mobile checkout'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'រូបិយប័ណ្ណលំនាំដើម - Default Currency' : 'Default Currency'}
                </label>
                <select
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value as 'USD' | 'KHR' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-700 focus:bg-white"
                >
                  <option value="USD">USD ($ - United States Dollar)</option>
                  <option value="KHR">KHR (៛ - Khmer Riel)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'អត្រាប្តូរប្រាក់ - 1 USD to KHR' : 'Exchange Rate (1 USD = KHR)'}
                </label>
                <input
                  type="number"
                  step="10"
                  min="3800"
                  max="4500"
                  value={settings.usdToKhrRate}
                  onChange={(e) => setSettings({ ...settings, usdToKhrRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'គម្លាតពេលត្រួតពិនិត្យ - Polling Interval' : 'Settlement Polling Interval'}
                </label>
                <select
                  value={settings.pollingIntervalSeconds}
                  onChange={(e) => setSettings({ ...settings, pollingIntervalSeconds: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                >
                  <option value={2}>2 Seconds (Fastest Real-Time)</option>
                  <option value={3}>3 Seconds (Recommended Standard)</option>
                  <option value={5}>5 Seconds (Network Conservative)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'អាសយដ្ឋាន Headless Bridge Endpoint' : 'Headless Bridge Endpoint'}
                </label>
                <input
                  type="text"
                  value={settings.headlessBridgeUrl}
                  onChange={(e) => setSettings({ ...settings, headlessBridgeUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>

            {/* Live Test Dynamic KHQR Generator Widget */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-teal-800" />
                    <span>{isKm ? 'សាកល្បងបង្កើត Dynamic KHQR $1.00 ភ្លាមៗ' : 'Instant $1.00 Dynamic KHQR Verification Test'}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isKm
                      ? 'បង្កើត Dynamic KHQR ចាក់សោទឹកប្រាក់ស្វ័យប្រវត្តជាមួយ Bakong ID និង ABA PayWay Link ដើម្បីបញ្ជាក់ការទូទាត់មុនពេលប្រើប្រាស់ពិតប្រាកដ'
                      : 'Generate sample $1.00 dynamic QR with your credentials to verify 100% live connectivity'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestKhqr}
                  disabled={testingKhqr}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {testingKhqr ? (
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isKm ? 'តេស្តបង្កើត QR $1.00' : 'Test Generate $1.00 QR'}</span>
                </button>
              </div>

              {testKhqrResult && (
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-xl border border-slate-200">
                  <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs shrink-0">
                    <QRCodeSVG
                      value={testKhqrResult.qrString}
                      size={130}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-xs space-y-1.5 text-slate-600 flex-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isKm ? 'Dynamic KHQR ចាក់សោទឹកប្រាក់ត្រឹមត្រូវ ១០០% គ្មានការបន្លំ' : 'Dynamic KHQR Locked Amount 100% Valid'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="font-semibold text-slate-700">{isKm ? 'ឈ្មោះ Merchant: ' : 'Merchant: '}</span>
                        <span className="font-mono font-bold text-slate-900">{testKhqrResult.merchantName}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">{isKm ? 'Bakong ID: ' : 'Bakong ID: '}</span>
                        <code className="text-teal-800 font-bold">{testKhqrResult.bakongId}</code>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">{isKm ? 'ទឹកប្រាក់តេស្ត: ' : 'Test Amount: '}</span>
                        <span className="font-bold text-slate-900">$1.00 USD</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">{isKm ? 'វិក្កយបត្រតេស្ត: ' : 'Bill Ref: '}</span>
                        <span className="font-mono text-slate-500">{testKhqrResult.billNumber}</span>
                      </div>
                    </div>

                    {testKhqrResult.paywayPaymentUrl && (
                      <div className="pt-2 flex items-center gap-2">
                        <a
                          href={testKhqrResult.paywayPaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold shadow-2xs transition"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isKm ? 'សាកល្បងបើក ABA PayWay Link' : 'Test Open ABA PayWay Link'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Feature Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableDynamicTag0112}
                  onChange={(e) => setSettings({ ...settings, enableDynamicTag0112: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {isKm ? 'ប្រើប្រាស់ Dynamic KHQR ចាក់សោទឹកប្រាក់' : 'Enforce Dynamic KHQR Locked Amount'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isKm ? 'ចាក់សោចំនួនទឹកប្រាក់ និងលេខវិក្កយបត្រស្វ័យប្រវត្តិដើម្បីការពារកុំឱ្យបន្លំ ឬច្រឡំវាយប្រាក់ខុស' : 'Locks precise amount and invoice reference to prevent tampering or patient payment errors'}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSoundAlert}
                  onChange={(e) => setSettings({ ...settings, enableSoundAlert: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>{isKm ? 'បន្លឺសំឡេងពេលទទួលប្រាក់ជោគជ័យ' : 'Audible Sound Alert on Payment Verified'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isKm
                      ? 'បន្លឺសំឡេង chime ជូនដំណឹងដល់បេឡាពេលភ្ញៀវស្កេនរួច'
                      : 'Plays an audio chime confirming cashier settlement instant verification'}
                  </div>

                  {/* Immediate Audio Test Buttons */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        playPaymentSuccessChime();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition shadow-2xs"
                      title="Test Payment Chime"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                      <span>{isKm ? 'សាកល្បងសំឡេងបង់ប្រាក់ KHQR' : 'Test KHQR Payment Chime'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        playHospitalChime();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold transition shadow-2xs"
                      title="Test Hospital Chime"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-700" />
                      <span>{isKm ? 'សាកល្បងសំឡេងហៅជួរ Queue' : 'Test Queue Call Chime'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        playCashRegisterChime();
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition shadow-2xs"
                      title="Test Cash Chime"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>{isKm ? 'សាកល្បងសំឡេងប្រាក់សុទ្ធ' : 'Test Cash Register Chime'}</span>
                    </button>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoCloseOnSettled}
                  onChange={(e) => setSettings({ ...settings, autoCloseOnSettled: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {isKm ? 'បិទអេក្រង់ QR ដោយស្វ័យប្រវត្តិបន្ទាប់ពីទូទាត់' : 'Auto-Dismiss QR Modal After 3 Seconds'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isKm
                      ? 'បិទ modal ដោយស្វ័យប្រវត្តិនឹងបើកទំព័រវិក្កយបត្រភ្លាមៗ'
                      : 'Automatically transitions cashier back to the billing register queue'}
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}\n\n        {/* TAB 3: Service Fees Catalog */}
        {activeTab === 'fees' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-700" />
                <span>{isKm ? 'តារាងតម្លៃសេវាពិនិត្យ និងព្យាបាលគ្លីនិក' : 'Clinical Service Catalog & Fee Schedule'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isKm
                  ? 'តម្លៃសេវាទាំងនេះនឹងត្រូវបញ្ចូលជាជម្រើសរហ័សពេលបង្កើតវិក្កយបត្រថ្មី'
                  : 'Default preset rates automatically applied during quick invoicing and consultation billing'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKm ? 'ពិនិត្យទូទៅ - General Consult' : 'General Consultation'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.generalConsultationFee}
                    onChange={(e) => setSettings({ ...settings, generalConsultationFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKm ? 'ពិគ្រោះឯកទេស - Specialist Consult' : 'Specialist Consultation'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.specialistConsultationFee}
                    onChange={(e) => setSettings({ ...settings, specialistConsultationFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKm ? 'ពិនិត្យកុមារ - Pediatric Care' : 'Pediatric Consultation'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.pediatricConsultationFee}
                    onChange={(e) => setSettings({ ...settings, pediatricConsultationFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKm ? 'សេវាសង្គ្រោះបន្ទាន់ - Emergency' : 'Emergency Surcharge'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.emergencySurchargeFee}
                    onChange={(e) => setSettings({ ...settings, emergencySurchargeFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKm ? 'អេកូសាស្ត្រ - Ultrasound Scan' : 'Ultrasound Scan 2D/4D'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.ultrasoundScanFee}
                    onChange={(e) => setSettings({ ...settings, ultrasoundScanFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKm ? 'ពិនិត្យឈាម Lab - Blood Test CBC' : 'Complete Blood Count (CBC)'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.labCompleteBloodCountFee}
                    onChange={(e) => setSettings({ ...settings, labCompleteBloodCountFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKm ? 'ពិនិត្យបេះដូង - ECG Monitoring' : 'ECG Heart Monitoring'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.ecgMonitoringFee}
                    onChange={(e) => setSettings({ ...settings, ecgMonitoringFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {isKm ? 'ដេររបួស/វះកាត់តូច - Minor Surgery' : 'Minor Surgery & Suture Base'}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settings.minorSurgeryBaseFee}
                    onChange={(e) => setSettings({ ...settings, minorSurgeryBaseFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-teal-700" />
                  <span>{isKm ? 'ថ្លៃសេវាបើកថ្នាំ - Pharmacy Markup' : 'Pharmacy Dispensing Fee'}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-bold">%</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={settings.pharmacyDispenseMarkupPercent}
                    onChange={(e) => setSettings({ ...settings, pharmacyDispenseMarkupPercent: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Receipt & Printing Setup */}
        {activeTab === 'receipt' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-teal-900">
                    {isKm ? 'ឧបករណ៍រចនាម៉ូតវិក្កយបត្រ - Invoice Template Designer' : 'Custom Invoice Template Designer'}
                  </h3>
                  <p className="text-[11px] text-teal-700">
                    {isKm
                      ? 'កែសម្រួលរូបរាង Logo ពណ៌ Font ជើងទំព័រ និងការបង្ហាញទិន្នន័យលើវិក្កយបត្របែប Real-time'
                      : 'Customize layout, upload logo, choose brand colors, fonts, and preview changes live'}
                  </p>
                </div>
              </div>
              <Link
                href="/invoice-template"
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
              >
                <span>{isKm ? 'បើកផ្ទាំងរចនា' : 'Open Designer'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-teal-700" />
                <span>{isKm ? 'ទម្រង់បោះពុម្ពបង្កាន់ដៃ និងម៉ាស៊ីនព្រីន' : 'Thermal Receipt Formatting & Print Layout'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isKm
                  ? 'កំណត់ទំហំក្រដាស ក្បាលវិក្កយបត្រ ជើងទំព័រ និងការបង្ហាញ QR Code លើបង្កាន់ដៃ'
                  : 'Customize thermal 80mm slip or A4 layouts, logos, headers, and settlement signatures'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ទំហំក្រដាសព្រីន - Paper Format' : 'Paper Format & Layout'}
                </label>
                <select
                  value={settings.paperFormat}
                  onChange={(e) => setSettings({ ...settings, paperFormat: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-700 focus:bg-white"
                >
                  <option value="80MM_THERMAL">80mm Thermal Cashier Slip (POS Standard)</option>
                  <option value="A4_STANDARD">A4 Full Page (Official Medical Record)</option>
                  <option value="A5_HALF">A5 Half Page Format</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ចំណងជើងបង្កាន់ដៃ - ខ្មែរ' : 'Receipt Header (Khmer)'}
                </label>
                <input
                  type="text"
                  value={settings.receiptTitleKh}
                  onChange={(e) => setSettings({ ...settings, receiptTitleKh: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ចំណងជើងបង្កាន់ដៃ - អង់គ្លេស' : 'Receipt Header (English)'}
                </label>
                <input
                  type="text"
                  value={settings.receiptTitleEn}
                  onChange={(e) => setSettings({ ...settings, receiptTitleEn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ពាក្យជូនពរចុងបង្កាន់ដៃ - ខ្មែរ' : 'Receipt Footer Note (Khmer)'}
                </label>
                <input
                  type="text"
                  value={settings.receiptFooterNoteKh}
                  onChange={(e) => setSettings({ ...settings, receiptFooterNoteKh: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ពាក្យជូនពរចុងបង្កាន់ដៃ - អង់គ្លេស' : 'Receipt Footer Note (English)'}
                </label>
                <input
                  type="text"
                  value={settings.receiptFooterNoteEn}
                  onChange={(e) => setSettings({ ...settings, receiptFooterNoteEn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>

            {/* Layout Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showHeaderLogo}
                  onChange={(e) => setSettings({ ...settings, showHeaderLogo: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <span className="text-xs text-slate-800">
                  {isKm ? 'បង្ហាញ Logo និងលេខអាជ្ញាប័ណ្ណក្រសួងសុខាភិបាលលើក្បាលបង្កាន់ដៃ' : 'Show Clinic Logo & Ministry of Health License on Header'}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDoctorName}
                  onChange={(e) => setSettings({ ...settings, showDoctorName: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <span className="text-xs text-slate-800">
                  {isKm ? 'បង្ហាញឈ្មោះវេជ្ជបណ្ឌិតទទួលបន្ទុក - Attending Doctor' : 'Include Attending Doctor on the Receipt'}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showCashierName}
                  onChange={(e) => setSettings({ ...settings, showCashierName: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <span className="text-xs text-slate-800">
                  {isKm ? 'បង្ហាញឈ្មោះបេឡាករអ្នកគិតលុយ - Cashier Name' : 'Include Billing Cashier Name on the Receipt'}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.printAbaReferenceOnPaid}
                  onChange={(e) => setSettings({ ...settings, printAbaReferenceOnPaid: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <span className="text-xs text-slate-800">
                  {isKm ? 'ព្រីនលេខប្រតិបត្តិការ ABA / Bakong Transaction Hash លើបង្កាន់ដៃ' : 'Print ABA Transaction Reference & Settlement Hash on Paid Receipts'}
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoOpenPrintDialog}
                  onChange={(e) => setSettings({ ...settings, autoOpenPrintDialog: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <span className="text-xs text-slate-800">
                  {isKm ? 'បើកផ្ទាំង Print ដោយស្វ័យប្រវត្តិនៅពេលចុចចេញបង្កាន់ដៃ' : 'Auto-trigger browser print dialog when clicking Receipt'}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: Security & Operations */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-700" />
                <span>{isKm ? 'សុវត្ថិភាពទិន្នន័យ និងគោលការណ៍ប្រតិបត្តិការ' : 'Data Integrity, Security & Audit Policies'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isKm
                  ? 'គ្រប់គ្រងការការពារទិន្នន័យអ្នកជំងឺ ការកែប្រែស្ថានភាពវិក្កយបត្រ និងការកត់ត្រា Audit Trail'
                  : 'Prevent accidental status modifications, enforce strict authentication, and manage audit logs'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'រយៈពេលកំណត់ចាក់សោស្វ័យប្រវត្តិ - Auto Logout' : 'Session Auto-Lock Timeout'}
                </label>
                <select
                  value={settings.inactivityTimeoutMinutes}
                  onChange={(e) => setSettings({ ...settings, inactivityTimeoutMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-700 focus:bg-white"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes</option>
                  <option value={0}>Never Lock (Not Recommended)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'រយៈពេលរក្សាទុក Audit Trail - ថ្ងៃ' : 'Audit Trail Retention Period (Days)'}
                </label>
                <input
                  type="number"
                  min="30"
                  max="3650"
                  value={settings.auditTrailRetentionDays}
                  onChange={(e) => setSettings({ ...settings, auditTrailRetentionDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.confirmBeforeRevertPaid}
                  onChange={(e) => setSettings({ ...settings, confirmBeforeRevertPaid: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {isKm ? 'ទាមទារការបញ្ជាក់មុននឹងកែប្រែវិក្កយបត្រពី PAID មកវិញ' : 'Enforce Staff Confirmation When Reverting Paid Invoices'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isKm
                      ? 'ទប់ស្កាត់ការច្រឡំដៃ និងកត់ត្រាឈ្មោះបុគ្គលិកដែលបានកែប្រែចូលក្នុង Audit Log'
                      : 'Prevents unauthorized reconciliation changes and attaches staff audit identity'}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.preventDuplicatePatientId}
                  onChange={(e) => setSettings({ ...settings, preventDuplicatePatientId: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {isKm ? 'ទប់ស្កាត់ការបង្កើតអ្នកជំងឺស្ទួន - National ID / Phone Duplicate Prevention' : 'Duplicate Patient Prevention (National ID & Phone)'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isKm
                      ? 'ប្រព័ន្ធនឹងផ្ទៀងផ្ទាត់ និងព្រមានប្រសិនបើលេខអត្តសញ្ញាណប័ណ្ណធ្លាប់ចុះឈ្មោះរួច'
                      : 'Blocks duplicate electronic medical record creation when matching national identification'}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enforceStrongPassword}
                  onChange={(e) => setSettings({ ...settings, enforceStrongPassword: e.target.checked })}
                  className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {isKm ? 'តម្រូវឲ្យប្រើពាក្យសម្ងាត់រឹងមាំ - Strong Staff Passwords' : 'Enforce Complex Passwords for Medical Staff'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isKm
                      ? 'តម្រូវយ៉ាងតិច ៨ តួអក្សរ មានអក្សរធំ អក្សរតូច និងលេខ'
                      : 'Requires minimum 8 characters with upper, lower, and numeric combinations'}
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: Hardware & Peripherals */}
        {activeTab === 'hardware' && (
          <div className="space-y-6">
            <HardwareSettingsPanel />
          </div>
        )}

        {/* TAB: Sound & Real Voice */}
        {activeTab === 'sound' && (
          <div className="space-y-6">
            <SoundSettingsPanel />
          </div>
        )}

        {/* TAB 6: Telegram Bot & Forum Topics */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <TelegramSettingsPanel />
          </div>
        )}

        {/* TAB: SaaS Subscription & KHQR Billing */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <SubscriptionSettingsPanel />
          </div>
        )}

        {/* Action Buttons */}
        {activeTab !== 'hardware' &&
          activeTab !== 'telegram' &&
          activeTab !== 'sound' &&
          activeTab !== 'subscription' && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isKm ? 'កំណត់ឡើងវិញ' : 'Reset Defaults'}</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isKm ? 'រក្សាទុកការកំណត់ទាំងអស់' : 'Save All Settings'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
