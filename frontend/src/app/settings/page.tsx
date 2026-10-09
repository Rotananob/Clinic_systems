'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/I18nContext';
import {
  Building2,
  QrCode,
  DollarSign,
  Printer,
  ShieldAlert,
  Save,
  RotateCcw,
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
  Volume2,
  Percent,
} from 'lucide-react';

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
  clinicNameEn: 'Rotana Medical Center & Polyclinic',
  clinicNameKh: 'មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ និងពហុព្យាបាល រតនៈ',
  mohLicenseNumber: 'MoH-2024-8841-KHM',
  clinicType: 'Polyclinic & Outpatient Center',
  phonePrimary: '+855 23 888 999',
  phoneEmergency: '+855 12 333 444',
  email: 'info@rotanaclinic.com.kh',
  website: 'https://rotanaclinic.com.kh',
  addressEn: '#128, St. 271, Sangkat Phsar Doeum Thkov, Khan Chamkarmon, Phnom Penh',
  addressKh: 'ផ្ទះលេខ ១២៨ ផ្លូវ ២៧១ សង្កាត់ផ្សារដើមថ្កូវ ខណ្ឌចំការមន រាជធានីភ្នំពេញ',
  openingHoursEn: 'Monday - Sunday: 07:30 AM - 08:30 PM (Emergency 24/7)',
  openingHoursKh: 'ច័ន្ទ ដល់ អាទិត្យ៖ ម៉ោង ៧:៣០ ព្រឹក ដល់ ៨:៣០ យប់ (សង្គ្រោះបន្ទាន់ ២៤/៧)',
  missionSlogan: 'Professional Medical Care With Compassion & Precision',

  // 2. KHQR & PayWay
  merchantName: 'ROTANA CLINIC',
  merchantCity: 'PHNOM PENH',
  bakongAccountId: 'rotana_clinic@aclb',
  defaultCurrency: 'USD',
  usdToKhrRate: 4100,
  pollingIntervalSeconds: 3,
  enableDynamicTag0112: true,
  autoCloseOnSettled: false,
  enableSoundAlert: true,
  headlessBridgeUrl: 'http://localhost:4000/api/payments/khqr',

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
  receiptFooterNoteEn: 'Thank you for choosing Rotana Clinic. Wishing you a speedy recovery!',
  autoOpenPrintDialog: true,

  // 5. Security & Operations
  confirmBeforeRevertPaid: true,
  inactivityTimeoutMinutes: 30,
  preventDuplicatePatientId: true,
  auditTrailRetentionDays: 365,
  enforceStrongPassword: true,
};

const STORAGE_KEY = 'rotana_clinic_settings_v1';

export default function SettingsPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const [activeTab, setActiveTab] = useState<'profile' | 'khqr' | 'fees' | 'receipt' | 'security'>('profile');
  const [settings, setSettings] = useState<ClinicSettingsState>(defaultSettings);
  const [savedNotice, setSavedNotice] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch {
      // Fallback to defaultSettings if corrupted
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to save settings to localStorage', err);
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
    downloadAnchor.setAttribute('download', `rotana_clinic_config_${new Date().toISOString().slice(0, 10)}.json`);
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

      {/* Notifications */}
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
                  {isKm ? 'ឈ្មោះគ្លីនិក (អង់គ្លេស)' : 'Clinic Name (English)'}
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
                  {isKm ? 'ឈ្មោះគ្លីនិក (ខ្មែរ)' : 'Clinic Name (Khmer)'}
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
                  {isKm ? 'លេខអាជ្ញាប័ណ្ណក្រសួងសុខាភិបាល (MoH License)' : 'Ministry of Health License #'}
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
                  {isKm ? 'លេខទូរស័ព្ទទូទៅ (Primary Phone)' : 'Primary Telephone'}
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
                  {isKm ? 'លេខសង្គ្រោះបន្ទាន់ (Emergency Hotline)' : 'Emergency Hotline 24/7'}
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
                  {isKm ? 'អ៊ីមែលផ្លូវការ (Official Email)' : 'Official Email'}
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
                  {isKm ? 'គេហទំព័រ (Official Website)' : 'Official Website'}
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
                  {isKm ? 'អាសយដ្ឋានគ្លីនិក (ភាសាខ្មែរ)' : 'Physical Address (Khmer)'}
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
                  {isKm ? 'អាសយដ្ឋានគ្លីនិក (អង់គ្លេស)' : 'Physical Address (English)'}
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
                  {isKm ? 'ម៉ោងបម្រើការងារ (ខ្មែរ)' : 'Working Hours (Khmer)'}
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
                  {isKm ? 'ម៉ោងបម្រើការងារ (អង់គ្លេស)' : 'Working Hours (English)'}
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
                  {isKm ? 'ពាក្យស្លោកគ្លីនិក (Slogan / Mission Statement)' : 'Clinic Motto / Mission'}
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
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-teal-700" />
                <span>{isKm ? 'ការកំណត់ KHQR & ABA PayWay Engine' : 'Bakong KHQR & PayWay Engine Settings'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isKm
                  ? 'កំណត់ប៉ារ៉ាម៉ែត្រ Tag 01=12 ឈ្មោះអាជីវកម្មលើ KHQR និងការផ្ទៀងផ្ទាត់ការទូទាត់ភ្លាមៗ'
                  : 'Configure Tag 01=12 dynamic QR fields, Bakong merchant identity, and instant polling reconciliation'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ឈ្មោះអាជីវករ KHQR (Merchant Name)' : 'KHQR Merchant Name'}
                </label>
                <input
                  type="text"
                  value={settings.merchantName}
                  onChange={(e) => setSettings({ ...settings, merchantName: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">Printed on EMVCo Tag 59</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'ទីក្រុងអាជីវករ (Merchant City)' : 'Merchant City'}
                </label>
                <input
                  type="text"
                  value={settings.merchantCity}
                  onChange={(e) => setSettings({ ...settings, merchantCity: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">Printed on EMVCo Tag 60</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'គណនីបាគង (Bakong Account ID)' : 'Bakong Account ID'}
                </label>
                <input
                  type="text"
                  value={settings.bakongAccountId}
                  onChange={(e) => setSettings({ ...settings, bakongAccountId: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400">e.g. rotana_clinic@aclb or mobile number</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isKm ? 'រូបិយប័ណ្ណលំនាំដើម (Default Currency)' : 'Default Currency'}
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
                  {isKm ? 'អត្រាប្តូរប្រាក់ (1 USD to KHR)' : 'Exchange Rate (1 USD = KHR)'}
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
                  {isKm ? 'គម្លាតពេលត្រួតពិនិត្យ (Polling Interval)' : 'Settlement Polling Interval'}
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

              <div className="sm:col-span-2">
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
                    {isKm ? 'ប្រើប្រាស់ Dynamic KHQR (Tag 01=12)' : 'Enforce Dynamic Tag 01=12 KHQR Specification'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isKm
                      ? 'ចាក់បញ្ចូលចំនួនទឹកប្រាក់ និងលេខវិក្កយបត្រដោយស្វ័យប្រវត្តិដើម្បីទប់ស្កាត់ការវាយប្រាក់ខុស'
                      : 'Embeds precise amount and bill reference to eliminate patient manual input errors'}
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
        )}

        {/* TAB 3: Service Fees Catalog */}
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
                  {isKm ? 'ពិនិត្យទូទៅ (General Consult)' : 'General Consultation'}
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
                  {isKm ? 'ពិគ្រោះឯកទេស (Specialist Consult)' : 'Specialist Consultation'}
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
                  {isKm ? 'ពិនិត្យកុមារ (Pediatric Care)' : 'Pediatric Consultation'}
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
                  {isKm ? 'សេវាសង្គ្រោះបន្ទាន់ (Emergency)' : 'Emergency Surcharge'}
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
                  {isKm ? 'អេកូសាស្ត្រ (Ultrasound Scan)' : 'Ultrasound Scan 2D/4D'}
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
                  {isKm ? 'ពិនិត្យឈាម Lab (Blood Test CBC)' : 'Complete Blood Count (CBC)'}
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
                  {isKm ? 'ពិនិត្យបេះដូង (ECG Monitoring)' : 'ECG Heart Monitoring'}
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
                  {isKm ? 'ដេររបួស/វះកាត់តូច (Minor Surgery)' : 'Minor Surgery & Suture Base'}
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
                  <span>{isKm ? 'ថ្លៃសេវាបើកថ្នាំ (Pharmacy Markup)' : 'Pharmacy Dispensing Fee'}</span>
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
                  {isKm ? 'ទំហំក្រដាសព្រីន (Paper Format)' : 'Paper Format & Layout'}
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
                  {isKm ? 'ចំណងជើងបង្កាន់ដៃ (ខ្មែរ)' : 'Receipt Header (Khmer)'}
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
                  {isKm ? 'ចំណងជើងបង្កាន់ដៃ (អង់គ្លេស)' : 'Receipt Header (English)'}
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
                  {isKm ? 'ពាក្យជូនពរចុងបង្កាន់ដៃ (ខ្មែរ)' : 'Receipt Footer Note (Khmer)'}
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
                  {isKm ? 'ពាក្យជូនពរចុងបង្កាន់ដៃ (អង់គ្លេស)' : 'Receipt Footer Note (English)'}
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
                  {isKm ? 'បង្ហាញឈ្មោះវេជ្ជបណ្ឌិតទទួលបន្ទុក (Attending Doctor)' : 'Include Attending Doctor on the Receipt'}
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
                  {isKm ? 'បង្ហាញឈ្មោះបេឡាករអ្នកគិតលុយ (Cashier Name)' : 'Include Billing Cashier Name on the Receipt'}
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
                  {isKm ? 'រយៈពេលកំណត់ចាក់សោស្វ័យប្រវត្តិ (Auto Logout)' : 'Session Auto-Lock Timeout'}
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
                  {isKm ? 'រយៈពេលរក្សាទុក Audit Trail (ថ្ងៃ)' : 'Audit Trail Retention Period (Days)'}
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
                    {isKm ? 'ទប់ស្កាត់ការបង្កើតអ្នកជំងឺស្ទួន (National ID / Phone Duplicate Prevention)' : 'Duplicate Patient Prevention (National ID & Phone)'}
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
                    {isKm ? 'តម្រូវឲ្យប្រើពាក្យសម្ងាត់រឹងមាំ (Strong Staff Passwords)' : 'Enforce Complex Passwords for Medical Staff'}
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

        {/* Action Buttons */}
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
      </form>
    </div>
  );
}
