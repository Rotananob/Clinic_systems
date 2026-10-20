'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import {
  Store,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Copy,
} from 'lucide-react';

interface MerchantSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: {
    bakongAccountId?: string;
    merchantName?: string;
    merchantCity?: string;
    paywayPaymentUrl?: string;
  };
  onSuccess?: (updatedTenant: any) => void;
}

export const MerchantSetupModal: React.FC<MerchantSetupModalProps> = ({
  isOpen,
  onClose,
  initialValues,
  onSuccess,
}) => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [bakongAccountId, setBakongAccountId] = useState(initialValues?.bakongAccountId || '');
  const [merchantName, setMerchantName] = useState(initialValues?.merchantName || '');
  const [merchantCity, setMerchantCity] = useState(initialValues?.merchantCity || 'Phnom Penh');
  const [paywayPaymentUrl, setPaywayPaymentUrl] = useState(initialValues?.paywayPaymentUrl || '');

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestKhqr = async () => {
    if (!bakongAccountId.trim() || !merchantName.trim()) {
      setErrorMessage(
        isKm
          ? 'សូមបញ្ចូល Bakong Account ID និងឈ្មោះ Merchant ជាមុនសិន។'
          : 'Please enter both Bakong Account ID and Merchant Name first.'
      );
      return;
    }

    setTesting(true);
    setErrorMessage(null);

    try {
      const res = await api.tenants.testMerchantKhqr({
        bakongAccountId: bakongAccountId.trim(),
        merchantName: merchantName.trim(),
        merchantCity: merchantCity.trim() || 'Phnom Penh',
        paywayPaymentUrl: paywayPaymentUrl.trim() || undefined,
      });

      if (res.success) {
        setTestResult(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate test KHQR.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bakongAccountId.trim() || !merchantName.trim()) {
      setErrorMessage(
        isKm
          ? 'សូមបញ្ចូល Bakong Account ID និងឈ្មោះ Merchant ជាមុនសិន។'
          : 'Please enter both Bakong Account ID and Merchant Name.'
      );
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.tenants.setupMerchant({
        bakongAccountId: bakongAccountId.trim(),
        merchantName: merchantName.trim(),
        merchantCity: merchantCity.trim() || 'Phnom Penh',
        paywayPaymentUrl: paywayPaymentUrl.trim() || undefined,
      });

      if (res.success) {
        setSuccessMessage(
          isKm
            ? 'រក្សាទុកព័ត៌មាន Merchant ជោគជ័យ។ Dynamic KHQR Engine បានដំណើរការពេញលេញ។'
            : 'Merchant credentials saved successfully. Isolated dynamic KHQR is active.'
        );
        if (onSuccess) {
          onSuccess(res.tenant);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save merchant configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E7E1D4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                {isKm ? 'រៀបចំ Merchant ដោយគ្រាន់តែ Paste Link / ID' : 'Paste & Go Merchant Setup'}
              </h2>
              <p className="text-xs text-stone-500">
                {isKm
                  ? 'ដំណើរការ Dynamic KHQR ដោយស្វ័យប្រវត្តក្នុង ៣០ វិនាទី'
                  : 'Activate isolated dynamic KHQR in 30 seconds'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* 30-Second Visual Guide Banner */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
              <Smartphone className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                {isKm
                  ? 'ការណែនាំ ៣០ វិនាទីពី ABA Mobile (ឥតគិតថ្លៃ ១០០%)'
                  : '30-Second ABA Mobile Guide (100% Free)'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-teal-950">
              <div className="p-2.5 bg-white/80 rounded-lg border border-teal-100 flex flex-col gap-1">
                <span className="font-bold text-teal-800 text-[11px]">
                  {isKm ? 'ជំហាន ១' : 'Step 1'}
                </span>
                <span className="text-[11px] leading-relaxed">
                  {isKm
                    ? 'បើក App ABA Mobile -> ចុច Services -> ចុច ABA Merchant'
                    : 'Open ABA Mobile -> tap Services -> tap ABA Merchant'}
                </span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-lg border border-teal-100 flex flex-col gap-1">
                <span className="font-bold text-teal-800 text-[11px]">
                  {isKm ? 'ជំហាន ២' : 'Step 2'}
                </span>
                <span className="text-[11px] leading-relaxed">
                  {isKm
                    ? 'Copy Bakong ID (ឧ. clinic@aba) ឬ Merchant Link'
                    : 'Copy Bakong ID (e.g. clinic@aba) or Merchant Link'}
                </span>
              </div>
              <div className="p-2.5 bg-white/80 rounded-lg border border-teal-100 flex flex-col gap-1">
                <span className="font-bold text-teal-800 text-[11px]">
                  {isKm ? 'ជំហាន ៣' : 'Step 3'}
                </span>
                <span className="text-[11px] leading-relaxed">
                  {isKm
                    ? 'Paste ចូលប្រអប់ខាងក្រោម រួចចុចតេស្ត និងរក្សាទុក'
                    : 'Paste below, test dynamic QR, and save'}
                </span>
              </div>
            </div>
          </div>

          {/* Error & Success Feedback */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isKm ? 'Bakong Account ID *' : 'Bakong Account ID *'}
                </label>
                <input
                  type="text"
                  required
                  value={bakongAccountId}
                  onChange={(e) => setBakongAccountId(e.target.value)}
                  placeholder="e.g. my_clinic@aba"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  {isKm ? 'គណនីបាគង ឬ ABA Mobile ID' : 'Bakong ID or ABA Mobile account'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isKm ? 'ឈ្មោះ Merchant លើ KHQR *' : 'Merchant Name on KHQR *'}
                </label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Sokhapheap Clinic"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  {isKm ? 'ឈ្មោះផ្លូវការបង្ហាញពេលស្កេន' : 'Official display name on customer screen'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isKm ? 'ទីក្រុង / ខេត្ត' : 'Merchant City'}
                </label>
                <input
                  type="text"
                  value={merchantCity}
                  onChange={(e) => setMerchantCity(e.target.value)}
                  placeholder="Phnom Penh"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isKm ? 'ABA PayWay Checkout Link (បើមាន)' : 'ABA PayWay Checkout Link (Optional)'}
                </label>
                <input
                  type="url"
                  value={paywayPaymentUrl}
                  onChange={(e) => setPaywayPaymentUrl(e.target.value)}
                  placeholder="https://link.payway.com.kh/ABAPAYCK..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  {isKm ? 'តំណភ្ជាប់ PayWay ឥតគិតថ្លៃសម្រាប់ Deep Link' : 'Free direct PayWay link for deep linking'}
                </p>
              </div>
            </div>

            {/* Test Dynamic KHQR Area */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-teal-800" />
                    <span>{isKm ? 'ផ្ទៀងផ្ទាត់ Dynamic KHQR ភ្លាមៗ' : 'Instant KHQR Test Verification'}</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {isKm
                      ? 'បង្កើតកូដ KHQR សាកល្បង $1.00 ដើម្បីបញ្ជាក់ភាពត្រឹមត្រូវនៃគណនី'
                      : 'Generate sample $1.00 Tag 01=12 dynamic QR with your credentials'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestKhqr}
                  disabled={testing}
                  className="px-3 py-1.5 bg-white border border-stone-300 hover:border-teal-700 text-stone-800 text-xs font-semibold rounded-lg shadow-2xs hover:bg-stone-50 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>{isKm ? 'តេស្តបង្កើត QR' : 'Generate Test QR'}</span>
                </button>
              </div>

              {testResult && (
                <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2 bg-white rounded-lg border border-stone-200 shadow-xs shrink-0">
                    <QRCodeSVG
                      value={testResult.qrString}
                      size={120}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-xs space-y-1 text-stone-600 flex-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isKm ? 'Dynamic KHQR Tag 01=12 ត្រឹមត្រូវ' : 'Tag 01=12 Dynamic KHQR Verified'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700">{isKm ? 'ឈ្មោះ Merchant: ' : 'Merchant Name: '}</span>
                      <span>{testResult.merchantName}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700">{isKm ? 'Bakong ID: ' : 'Bakong ID: '}</span>
                      <code>{testResult.bakongId}</code>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-700">{isKm ? 'ចំនួនទឹកប្រាក់: ' : 'Amount: '}</span>
                      <span className="font-bold text-stone-900">$1.00 USD</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-stone-300 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 transition-colors"
              >
                {isKm ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {saving
                    ? isKm ? 'កំពុងរក្សាទុក...' : 'Saving...'
                    : isKm ? 'រក្សាទុក & ដំណើរការ KHQR' : 'Save & Activate KHQR'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
