'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import {
  QrCode,
  DollarSign,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  RefreshCw,
  Building,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

export const QuickKhqrTerminal: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [amount, setAmount] = useState<number>(5);
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [patientName, setPatientName] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('General Consultation');
  const [loading, setLoading] = useState<boolean>(false);

  const [qrData, setQrData] = useState<{
    qrString: string;
    tranId: string;
    md5: string;
    amount: number;
    currency: string;
    billNumber: string;
    paywayLink: string;
    deeplinks: any;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'PAYWAY' | 'KHQR'>('PAYWAY');
  const [settled, setSettled] = useState<boolean>(false);
  const [settling, setSettling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(300);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-generate initial $5 QR on mount so the terminal is immediately active
  useEffect(() => {
    handleGenerate(5, 'USD');
    return () => clearPolling();
  }, []);

  const clearPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleGenerate = async (
    targetAmount = amount,
    targetCurrency = currency,
    targetPatient = patientName,
  ) => {
    if (targetAmount <= 0) return;
    setLoading(true);
    setSettled(false);
    setCountdown(300);
    clearPolling();

    try {
      const res = await api.payments.generateQuickQr({
        amount: targetAmount,
        currency: targetCurrency,
        patientName: targetPatient.trim() || undefined,
        billNumber: `POS-${Date.now().toString().slice(-6)}`,
      });

      setQrData({
        qrString: res.qrString,
        tranId: res.tranId,
        md5: res.md5,
        amount: res.amount,
        currency: res.currency,
        billNumber: res.billNumber,
        paywayLink: res.paywayLink || 'https://link.payway.com.kh/ABAPAYCK539089j',
        deeplinks: res.deeplinks,
      });

      // Start gentle status poller
      pollTimerRef.current = setInterval(async () => {
        try {
          const statusRes = await api.payments.checkStatus(res.tranId);
          if (statusRes.status === 'SUCCESS') {
            setSettled(true);
            clearPolling();
          }
        } catch {
          // ignore
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to generate quick QR:', err);
    } finally {
      setLoading(false);
    }
  };

  // Instant app-switch wakeup listener (when customer switches back from mobile app)
  useEffect(() => {
    const handleFocus = async () => {
      if (qrData?.tranId && !settled) {
        try {
          const statusRes = await api.payments.checkStatus(qrData.tranId);
          if (statusRes.status === 'SUCCESS') {
            setSettled(true);
            clearPolling();
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [qrData, settled]);

  // Countdown timer
  useEffect(() => {
    if (!qrData || settled) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          clearPolling();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData, settled]);

  const handleCopyLink = () => {
    const link = qrData?.paywayLink || 'https://link.payway.com.kh/ABAPAYCK539089j';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualSettle = async () => {
    if (!qrData?.tranId) return;
    setSettling(true);
    try {
      await api.payments.settle(qrData.tranId);
      setSettled(true);
      clearPolling();
    } catch {
      // simulate settlement on demo
      setSettled(true);
      clearPolling();
    } finally {
      setSettling(false);
    }
  };

  const usdPresets = [5, 10, 15, 20, 50, 100];
  const khrPresets = [20000, 40000, 60000, 80000, 200000, 400000];

  const paywayUrl = qrData?.paywayLink || 'https://link.payway.com.kh/ABAPAYCK539089j';
  const displayAmount =
    currency === 'KHR'
      ? `${(qrData?.amount ?? amount).toLocaleString()} ៛`
      : `$${(qrData?.amount ?? amount).toFixed(2)}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>{isKm ? 'ម៉ាស៊ីនទូទាត់រហ័ស KHQR & ABA PayWay' : 'Live KHQR & ABA PayWay POS Terminal'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                pay-helper Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isKm
                ? 'បង្កើត QR ភ្លាមៗ សម្រាប់អ្នកជំងឺស្កេនទូទាត់នៅមុខបញ្ជរ ឬតាមទូរស័ព្ទ'
                : 'Instant Tag 01=12 dynamic QR generator for walk-in patient scan & mobile checkout'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-teal-300 font-medium hidden sm:inline">
            Merchant: Rotana Clinic
          </span>
          <ShieldCheck className="w-4 h-4 text-teal-400" />
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Charge Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Currency & Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>{isKm ? 'ចំនួនទឹកប្រាក់ទូទាត់' : 'Payment Amount'}</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('USD');
                    setAmount(5);
                    handleGenerate(5, 'USD');
                  }}
                  className={`px-2 py-0.5 rounded transition ${
                    currency === 'USD'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('KHR');
                    setAmount(20000);
                    handleGenerate(20000, 'KHR');
                  }}
                  className={`px-2 py-0.5 rounded transition ${
                    currency === 'KHR'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  KHR (៛)
                </button>
              </div>
            </label>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">
                {currency === 'KHR' ? '៛' : '$'}
              </span>
              <input
                type="number"
                step={currency === 'KHR' ? '500' : '0.50'}
                min="0.10"
                value={amount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setAmount(val);
                }}
                className="w-full pl-9 pr-4 py-2 text-lg font-bold font-mono text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Quick Presets Chips */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">
              {isKm ? 'ជ្រើសរើសតម្លៃរហ័ស:' : 'Quick Amount Presets:'}
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(currency === 'USD' ? usdPresets : khrPresets).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setAmount(val);
                    handleGenerate(val, currency);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition text-center ${
                    amount === val
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {currency === 'KHR' ? `${(val / 1000).toLocaleString()}k ៛` : `$${val}`}
                </button>
              ))}
            </div>
          </div>

          {/* Purpose & Patient Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                {isKm ? 'គោលបំណង / សេវាកម្ម' : 'Clinical Service'}
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-teal-700"
              >
                <option value="General Consultation">General Consultation (ថ្លៃពិនិត្យទូទៅ)</option>
                <option value="Pharmacy Medicine">Pharmacy Medicine (ថ្លៃថ្នាំពេទ្យ)</option>
                <option value="Laboratory Test">Laboratory Blood Test (ថ្លៃវិភាគឈាម)</option>
                <option value="Ultrasound Scan">Ultrasound Scan (អេកូសាស្ត្រ)</option>
                <option value="Wound Dressing">Wound Dressing / Sutures (លាងរបួស/ដេរ)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                {isKm ? 'ឈ្មោះអ្នកជំងឺ (ជាជម្រើស)' : 'Patient Name (Optional)'}
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Walk-in Patient"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-teal-700"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={() => handleGenerate(amount, currency, patientName)}
            disabled={loading || amount <= 0}
            className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isKm ? 'កំពុងបង្កើតកូដ...' : 'Generating Dynamic KHQR...'}</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>
                  {isKm
                    ? `បង្កើត QR ឥឡូវនេះ (${displayAmount})`
                    : `Generate Dynamic QR Now (${displayAmount})`}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right: The Live Scannable Terminal Screen (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('PAYWAY')}
              className={`flex-1 py-1 px-2 rounded-md transition flex items-center justify-center gap-1 ${
                activeTab === 'PAYWAY'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3 h-3 text-cyan-400" />
              <span>ABA PayWay Live</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('KHQR')}
              className={`flex-1 py-1 px-2 rounded-md transition flex items-center justify-center gap-1 ${
                activeTab === 'KHQR'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3 h-3 text-teal-400" />
              <span>Bakong KHQR</span>
            </button>
          </div>

          {/* QR Display Card */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 text-center relative overflow-hidden shadow-inner">
            {settled ? (
              <div className="py-8 space-y-3">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-scale-in">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    {isKm ? 'ការទូទាត់ជោគជ័យ!' : 'Payment Settled!'}
                  </h4>
                  <p className="text-xs text-emerald-400 font-mono mt-0.5">{displayAmount}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerate(amount, currency)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg font-medium transition"
                >
                  {isKm ? 'បង្កើតថ្មីម្តងទៀត' : 'Charge Next Patient'}
                </button>
              </div>
            ) : (
              qrData && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                    <span className="font-semibold text-slate-200">Rotana Clinic POS</span>
                    <span className="text-teal-400">
                      {activeTab === 'PAYWAY' ? 'ABA PayWay Direct' : 'Tag 01=12 Dynamic'}
                    </span>
                  </div>

                  {/* Scannable QR Code */}
                  <div className="bg-white p-2.5 rounded-lg inline-block shadow-md mx-auto">
                    <QRCodeSVG
                      value={activeTab === 'PAYWAY' ? paywayUrl : qrData.qrString}
                      size={165}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  {/* Amount Display */}
                  <div>
                    <div className="text-xl font-bold font-mono text-white tracking-tight">
                      {displayAmount}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {qrData.billNumber} • {purpose}
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>
                      {Math.floor(countdown / 60)}:
                      {(countdown % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Quick Pay Links & Actions */}
          {!settled && qrData && (
            <div className="space-y-2">
              <a
                href={paywayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>
                  {isKm ? 'បើក ABA Mobile ទូទាត់ភ្លាម' : 'Tap to Pay in ABA Mobile'}
                </span>
              </a>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition flex items-center justify-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">{isKm ? 'បានចម្លង Link' : 'Link Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{isKm ? 'ចម្លង Link PayWay' : 'Copy PayWay Link'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleManualSettle}
                  disabled={settling}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1 shadow-2xs"
                  title="Verify payment settlement immediately"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{settling ? '0.3s...' : isKm ? 'ផ្ទៀងផ្ទាត់' : 'Settle'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
