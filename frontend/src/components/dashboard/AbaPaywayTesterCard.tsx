'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  HelpCircle,
  DollarSign,
} from 'lucide-react';

export const AbaPaywayTesterCard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const tenant = user?.tenant;
  const initialLink = tenant?.paywayPaymentUrl || '';

  const [paywayUrl, setPaywayUrl] = useState(initialLink);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test KHQR Generator State
  const [testAmount, setTestAmount] = useState('1.00');
  const [testCurrency, setTestCurrency] = useState<'USD' | 'KHR'>('USD');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResult, setQrResult] = useState<any | null>(null);
  const [qrCountdown, setQrCountdown] = useState(180);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Quota tracking
  const [usageCount, setUsageCount] = useState<number>(0);
  const [maxQuota, setMaxQuota] = useState<number>(10);
  const planTier = tenant?.planTier || 'FREE';
  const isFreePlan = planTier === 'FREE';

  useEffect(() => {
    if (tenant?.paywayPaymentUrl) {
      setPaywayUrl(tenant.paywayPaymentUrl);
    }
    // Fetch initial quota status
    loadQuota();
  }, [tenant]);

  // Countdown timer for generated KHQR
  useEffect(() => {
    if (!qrResult) return;
    setQrCountdown(180);
    const interval = setInterval(() => {
      setQrCountdown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [qrResult]);

  const loadQuota = async () => {
    try {
      const res = await api.payments.getQuotaStatus();
      if (res?.khqr) {
        setUsageCount(res.khqr.usedToday || 0);
        setMaxQuota(isFreePlan ? 10 : (res.khqr.limit || 10));
      }
    } catch {
      // Default to 0 usage
    }
  };

  const handleSavePaywayLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!paywayUrl.trim()) {
      setSaveError(
        isKm
          ? 'សូមបញ្ចូលតំណភ្ជាប់ ABA PayWay Merchant Link'
          : 'Please enter your ABA PayWay Merchant Link'
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await api.tenants.updateProfile({
        paywayPaymentUrl: paywayUrl.trim(),
      });

      if (res.success) {
        setSaveSuccess(true);
        // Sync local storage
        try {
          const userStr = localStorage.getItem('clinic_user');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            if (parsed.tenant) {
              parsed.tenant.paywayPaymentUrl = paywayUrl.trim();
              localStorage.setItem('clinic_user', JSON.stringify(parsed));
            }
          }
        } catch {}

        if (refreshProfile) {
          await refreshProfile();
        }
        window.dispatchEvent(new CustomEvent('clinic_profile_updated'));
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update ABA PayWay link.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestGenerateKhqr = async () => {
    if (!paywayUrl.trim()) {
      setGenerateError(
        isKm
          ? 'សូម Paste តំណភ្ជាប់ ABA PayWay Link មុននឹងតេស្តបង្កើត KHQR'
          : 'Please paste your ABA PayWay link before test generating KHQR'
      );
      return;
    }

    if (isFreePlan && usageCount >= 10) {
      setGenerateError(
        isKm
          ? 'លោកអ្នកបានប្រើប្រាស់កូតា Dynamic KHQR ពេញ ១០/១០ សម្រាប់ថ្ងៃនេះហើយ (គម្រោង Free)។ សូម Upgrade គម្រោងដើម្បីទទួលបានកូតាបន្ថែម!'
          : 'Free plan limit reached: 10/10 dynamic KHQR transactions used today. Please upgrade for higher quota!'
      );
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await api.payments.testKhqr({
        amount: parseFloat(testAmount) || 1.0,
        currency: testCurrency,
      });

      if (res.success) {
        setQrResult(res);
        setUsageCount(res.currentUsage || (usageCount + 1));
        if (res.maxLimit) setMaxQuota(res.maxLimit);
      }
    } catch (err: any) {
      setGenerateError(
        err.message || 'Failed to generate test KHQR. Please verify your ABA link.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const isQuotaExceeded = isFreePlan && usageCount >= 10;
  const isConfigured = Boolean(paywayUrl && paywayUrl.includes('link.payway.com.kh'));

  return (
    <div className="bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] shadow-md overflow-hidden card-3d">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-stone-900 text-white px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-200 shrink-0 shadow-xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight font-sans">
                {isKm
                  ? 'កំណត់ ABA PayWay & តេស្តបង្កើត Dynamic KHQR'
                  : 'ABA PayWay Quick Setup & Live KHQR Tester'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-200 border border-teal-300/30">
                Tag 01=12 Ready
              </span>
            </div>
            <p className="text-xs text-teal-100/80 mt-0.5">
              {isKm
                ? 'Paste តំណភ្ជាប់ ABA PayWay របស់អ្នកគ្រប់ពេល ដើម្បីដំណើរការប្រព័ន្ធបង់ប្រាក់ KHQR និងតេស្តស្កេនផ្ទាល់'
                : 'Paste or update your ABA PayWay Merchant Link anytime to activate dynamic KHQR & test live scans'}
            </p>
          </div>
        </div>

        {/* Quota Badge */}
        <div className="bg-black/30 border border-white/15 px-3.5 py-2 rounded-2xl shrink-0 text-left sm:text-right">
          <div className="text-[10px] font-medium text-teal-200/90 uppercase tracking-wider">
            {isFreePlan
              ? (isKm ? 'គម្រោង Free (កំណត់ ១០ KHQR/ថ្ងៃ)' : 'Free Tier (10 KHQR/day Limit)')
              : (isKm ? `គម្រោង ${planTier}` : `Plan ${planTier}`)}
          </div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
            <span className={isQuotaExceeded ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}>
              {usageCount} / {isFreePlan ? 10 : maxQuota} KHQR
            </span>
            <span className="text-[10px] text-stone-300 font-normal">
              {isKm ? 'ថ្ងៃនេះ' : 'today'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Messages */}
        {saveSuccess && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isKm
                ? 'តំណភ្ជាប់ ABA PayWay ត្រូវបានរក្សាទុក និង Sync ចូលក្នុងគ្លីនិករបស់អ្នកជោគជ័យ!'
                : 'ABA PayWay link successfully saved and synced to your clinic profile!'}
            </span>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {generateError && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{generateError}</span>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Link Input & Setup Guide (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <form onSubmit={handleSavePaywayLink} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-teal-800" />
                  <span>{isKm ? 'តំណភ្ជាប់ ABA Merchant Link (PayWay URL)' : 'ABA Merchant Link (PayWay URL)'}</span>
                </label>
                <span className="text-[11px] text-stone-500 font-medium">
                  {isConfigured ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      {isKm ? 'បានភ្ជាប់រួចរាល់' : 'Connected'}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-semibold">
                      {isKm ? 'មិនទាន់កំណត់' : 'Not configured'}
                    </span>
                  )}
                </span>
              </div>

              <div className="relative">
                <input
                  type="url"
                  value={paywayUrl}
                  onChange={(e) => setPaywayUrl(e.target.value)}
                  placeholder="https://link.payway.com.kh/ABAPAY..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDBD] rounded-2xl text-xs sm:text-sm font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition shadow-2xs placeholder:text-stone-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-stone-500">
                  {isKm
                    ? 'លោកអ្នកអាចប្តូរ Link នេះគ្រប់ពេល។ វានឹងដំណើរការស្វ័យប្រវត្តក្នុងវិក្កយបត្រទាំងអស់។'
                    : 'You can update this link anytime. It applies automatically across all invoices.'}
                </p>
                <button
                  type="submit"
                  disabled={isSaving || paywayUrl === initialLink}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? (isKm ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKm ? 'រក្សាទុក Link' : 'Save Link')}</span>
                </button>
              </div>
            </form>

            {/* 1-Minute ABA Mobile Instructions */}
            <div className="bg-[#F8F5EE] border border-[#E7DFC9] p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <HelpCircle className="w-4 h-4 text-teal-800" />
                <span>
                  {isKm
                    ? 'របៀបយក ABA Merchant Link ឥតគិតថ្លៃ (Free) ក្នុង ABA Mobile ត្រឹម ១ នាទី'
                    : 'How to get free ABA Merchant Link in ABA Mobile (1-minute guide)'}
                </span>
              </div>
              <ol className="text-xs text-stone-600 space-y-1.5 pl-5 list-decimal font-medium leading-relaxed">
                <li>
                  {isKm
                    ? 'បើកកម្មវិធី ABA Mobile រួចចុចចូលគណនីរបស់អ្នក ឬផ្នែក PayWay / KHQR'
                    : 'Open ABA Mobile and tap on your Account or PayWay / KHQR section'}
                </li>
                <li>
                  {isKm
                    ? 'ចុចលើ "ទទួលប្រាក់ (Receive / QR)" ឬ "PayWay Mobile Link"'
                    : 'Tap on "Receive Money (QR)" or "PayWay Mobile Link"'}
                </li>
                <li>
                  {isKm
                    ? 'ចុចប៊ូតុង "ចម្លងតំណភ្ជាប់ (Copy Link)" រួចយកមក Paste ក្នុងប្រអប់ខាងលើនេះ'
                    : 'Tap "Copy Link" and paste it into the box above'}
                </li>
              </ol>
            </div>
          </div>

          {/* Right Column: Live Preview & Test KHQR Generator (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-[#DFD7C7] p-4 sm:p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-800" />
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  {isKm ? 'ផ្ទាំងតេស្តបង្កើត KHQR ផ្ទាល់' : 'Live Test KHQR Generator'}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                {planTier}
              </span>
            </div>

            {/* Test Input Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    {isKm ? 'ចំនួនទឹកប្រាក់តេស្ត' : 'Test Amount'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-stone-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 bg-[#FAF7F2] border border-[#DDD5C5] rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    {isKm ? 'រូបិយប័ណ្ណ' : 'Currency'}
                  </label>
                  <select
                    value={testCurrency}
                    onChange={(e) => setTestCurrency(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-[#FAF7F2] border border-[#DDD5C5] rounded-xl text-xs font-semibold text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                </div>
              </div>

              {/* Preset quick buttons */}
              <div className="flex items-center gap-1.5">
                {['0.50', '1.00', '2.50', '5.00'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTestAmount(amt)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors ${
                      testAmount === amt
                        ? 'bg-teal-800 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Action Generate Button */}
              <button
                type="button"
                onClick={handleTestGenerateKhqr}
                disabled={isGenerating || isQuotaExceeded}
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 active:scale-98"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isKm ? 'កំពុងបង្កើត KHQR...' : 'Generating KHQR...'}</span>
                  </>
                ) : isQuotaExceeded ? (
                  <span>{isKm ? 'កូតាពេញ ១០/១០ (Free Limit)' : 'Daily Quota Exceeded (10/10)'}</span>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isKm ? 'តេស្តបង្កើត Dynamic KHQR ភ្លាមៗ' : 'Test Generate Dynamic KHQR'}</span>
                  </>
                )}
              </button>

              {/* Quota Progress Bar for Free Plan */}
              {isFreePlan && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
                    <span>{isKm ? 'កូតា Free ថ្ងៃនេះ' : 'Free Quota Today'}</span>
                    <span className="font-bold font-mono text-stone-700">
                      {usageCount} / 10 KHQR
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        usageCount >= 10
                          ? 'bg-rose-500'
                          : usageCount >= 8
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (usageCount / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generated KHQR Display Box */}
            {qrResult && (
              <div className="mt-4 p-4 rounded-2xl bg-[#FAF7F2] border border-teal-200/80 space-y-3 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-900">
                    {qrResult.merchantName || 'X-Clinic'}
                  </span>
                  <span className="font-bold font-mono text-teal-800">
                    {qrResult.amount.toFixed(2)} {qrResult.currency}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200 flex flex-col items-center justify-center shadow-xs">
                  <QRCodeSVG
                    value={qrResult.qrString}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                  <div className="mt-2 text-[10px] font-mono text-stone-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>
                      {isKm ? 'ផុតកំណត់ក្នុង' : 'Expires in'} {qrCountdown}s
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 text-center font-medium">
                  {isKm
                    ? 'បើក ABA Mobile ឬ Bakong App ដើម្បីស្កេនតេស្តជាក់ស្តែង'
                    : 'Scan with ABA Mobile or Bakong app to test payment'}
                </p>

                <div className="text-[10px] font-mono text-stone-400 truncate text-center">
                  TranID: {qrResult.tranId}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
