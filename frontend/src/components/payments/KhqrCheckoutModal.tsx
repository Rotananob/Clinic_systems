'use client';

import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building,
  Clock,
  Copy,
  Check,
  CreditCard,
  Smartphone,
} from 'lucide-react';

interface KhqrCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: {
    id: string;
    invoiceNumber: string;
    payableAmount: number | string;
    currency?: string;
    patient?: {
      nameEn?: string;
      nameKh?: string;
      phone?: string;
    };
  } | null;
  invoiceId?: string;
  onPaymentSuccess?: () => void;
  onSuccess?: () => void;
}

export function KhqrCheckoutModal({
  isOpen,
  onClose,
  invoice,
  invoiceId,
  onPaymentSuccess,
  onSuccess,
}: KhqrCheckoutModalProps) {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<{
    qrString: string;
    tranId: string;
    md5: string;
    amount: number;
    currency: string;
    invoiceNumber: string;
    paywayLink?: string;
    deeplinks?: any;
    expiresInSeconds: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'KHQR' | 'PAYWAY'>('KHQR');
  const [copied, setCopied] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settling, setSettling] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);

  const activeInvoiceId = invoiceId || invoice?.id;
  const paywayLiveUrl = qrData?.paywayLink || 'https://link.payway.com.kh/ABAPAYCK539089j';

  // Generate dynamic KHQR on modal open
  useEffect(() => {
    if (isOpen && activeInvoiceId) {
      setSettled(false);
      setError(null);
      setCountdown(300);
      setActiveTab('KHQR');
      consecutiveErrorsRef.current = 0;
      generateKhqr(activeInvoiceId);
    } else {
      clearPolling();
      setQrData(null);
    }

    return () => {
      clearPolling();
    };
  }, [isOpen, activeInvoiceId]);

  const clearPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const generateKhqr = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.payments.generateQr(id);
      setQrData({
        qrString: res.qrString,
        tranId: res.tranId,
        md5: res.md5,
        amount: res.amount,
        currency: res.currency,
        invoiceNumber: res.invoiceNumber,
        paywayLink: res.paywayLink || 'https://link.payway.com.kh/ABAPAYCK539089j',
        deeplinks: res.deeplinks,
        expiresInSeconds: res.expiresInSeconds || 300,
      });
      // Start polite 3.0s background settlement poller (anti-spam)
      startPolling(res.tranId);
    } catch (err: any) {
      setError(err.message || 'Failed to generate dynamic KHQR payment code');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (tranId: string) => {
    clearPolling();
    pollTimerRef.current = setInterval(async () => {
      try {
        const statusRes = await api.payments.checkStatus(tranId);
        consecutiveErrorsRef.current = 0;
        if (statusRes.status === 'SUCCESS' || statusRes.invoiceStatus === 'PAID') {
          handleSuccess();
        }
      } catch (err) {
        consecutiveErrorsRef.current += 1;
        // Circuit breaker: if 4 consecutive failures, pause polling to prevent spamming
        if (consecutiveErrorsRef.current >= 4) {
          clearPolling();
        }
      }
    }, 3000);
  };

  // Instant App-Switch Wakeup (when patient returns to browser from ABA Mobile)
  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      if (isOpen && qrData?.tranId && !settled) {
        try {
          const statusRes = await api.payments.checkStatus(qrData.tranId);
          if (statusRes.status === 'SUCCESS' || statusRes.invoiceStatus === 'PAID') {
            handleSuccess();
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [isOpen, qrData, settled]);

  // Timer countdown
  useEffect(() => {
    if (!qrData || settled) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          clearPolling();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData, settled]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(paywayLiveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Instant settlement button (0.3s manual settlement verification)
  const handleInstantSettle = async () => {
    if (!qrData?.tranId) return;
    setSettling(true);
    try {
      await api.payments.settle(qrData.tranId);
      handleSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to settle transaction');
    } finally {
      setSettling(false);
    }
  };

  const handleSuccess = () => {
    clearPolling();
    setSettled(true);
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
    if (onSuccess) {
      onSuccess();
    }
  };

  if (!activeInvoiceId) return null;

  const invoiceNumber = invoice?.invoiceNumber || qrData?.invoiceNumber || 'Processing...';
  const currency = invoice?.currency || qrData?.currency || 'USD';
  const rawAmount = invoice?.payableAmount ?? qrData?.amount ?? 0;
  const formattedAmount = `${currency === 'KHR' ? '៛' : '$'}${Number(rawAmount).toFixed(2)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isKm ? 'ការទូទាត់ប្រាក់ KHQR និង ABA PayWay' : 'Dynamic KHQR & ABA PayWay Checkout'}
      description={`Invoice: ${invoiceNumber}`}
    >
      <div className="space-y-4">
        {loading && (
          <div className="py-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">
              {isKm ? 'កំពុងបង្កើតកូដទូទាត់ KHQR និងតំណភ្ជាប់ ABA...' : 'Synthesizing Tag 01=12 KHQR and ABA PayWay link...'}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">{isKm ? 'សេចក្តីជូនដំណឹងទូទាត់:' : 'Payment Engine Notice:'}</span>
              <p className="mt-0.5">{error}</p>
              <button
                type="button"
                onClick={() => activeInvoiceId && generateKhqr(activeInvoiceId)}
                className="mt-2 inline-flex items-center gap-1 font-semibold text-rose-900 underline"
              >
                <RefreshCw className="w-3 h-3" />
                {isKm ? 'ព្យាយាមបង្កើតម្តងទៀត' : 'Retry generating QR'}
              </button>
            </div>
          </div>
        )}

        {settled ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isKm ? 'ការទូទាត់ត្រូវបានផ្ទៀងផ្ទាត់ជោគជ័យ' : 'Payment Successfully Verified'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isKm ? 'ចំនួនទឹកប្រាក់ទូទាត់ ' : 'Settled amount '}
                <span className="font-semibold text-slate-900">{formattedAmount}</span>
                {isKm ? ' សម្រាប់វិក្កយបត្រ ' : ' for '}
                {invoiceNumber}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 max-w-sm mx-auto text-left space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-medium text-slate-800">{qrData?.tranId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="font-medium text-slate-800">ABA PayWay / KHQR Bridge</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-emerald-700">Settled (PAID)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              {isKm ? 'រួចរាល់ និងបិទ' : 'Done & Close'}
            </button>
          </div>
        ) : (
          qrData &&
          !loading && (
            <div className="space-y-4">
              {/* Payment Mode Selector Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('PAYWAY')}
                  className={`flex-1 py-1.5 px-3 rounded-md transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'PAYWAY'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
                  <span>ABA PayWay Live</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('KHQR')}
                  className={`flex-1 py-1.5 px-3 rounded-md transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'KHQR'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-600" />
                  <span>Bakong KHQR (Tag 01=12)</span>
                </button>
              </div>

              {/* QR Container */}
              <div className="bg-slate-900 text-white rounded-xl p-4 text-center relative overflow-hidden shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-teal-400" />
                    <span className="font-medium text-slate-200">
                      {isKm ? 'គ្លីនិក រតនា (Rotana Clinic)' : 'Rotana Clinic Payment Bridge'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-teal-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{activeTab === 'PAYWAY' ? 'ABA PayWay Direct' : 'EMVCo Tag 01=12'}</span>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3.5 rounded-lg inline-block shadow-inner mx-auto mb-3">
                  <QRCodeSVG
                    value={activeTab === 'PAYWAY' ? paywayLiveUrl : qrData.qrString}
                    size={190}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                {/* Amount Display */}
                <div className="mt-1">
                  <div className="text-2xl font-bold tracking-tight text-white font-mono">
                    {formattedAmount}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isKm ? `ចំនួនទឹកប្រាក់ចាក់សោរ • វិក្កយបត្រ #${invoiceNumber}` : `Exact Amount Locked • Bill #${invoiceNumber}`}
                  </div>
                </div>

                {/* Countdown */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>
                    {isKm ? 'ផុតកំណត់ក្នុងរយៈពេល ' : 'Expires in '}
                    {Math.floor(countdown / 60)}:
                    {(countdown % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Direct Actions: ABA Pay Button & Copy Link */}
              {activeTab === 'PAYWAY' ? (
                <div className="space-y-2">
                  <a
                    href={paywayLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>
                      {isKm ? 'ចុចទីនេះដើម្បីបើក ABA Mobile ទូទាត់ភ្លាម' : 'Tap to Pay with ABA Mobile / PayWay'}
                    </span>
                  </a>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={paywayLiveUrl}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-600 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">{isKm ? 'បានចម្លង' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isKm ? 'ចម្លង' : 'Copy'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Bank Apps Deeplinks */
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                    {isKm ? 'បើកកម្មវិធីធនាគារដោយផ្ទាល់' : 'Direct Mobile Bank App Deeplinks'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={paywayLiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-900 hover:bg-cyan-950 text-white rounded-lg text-xs font-semibold shadow-sm transition text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      ABA Mobile
                    </a>

                    {qrData.deeplinks?.bakong?.android ? (
                      <a
                        href={qrData.deeplinks.bakong.android}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-900 hover:bg-rose-950 text-white rounded-lg text-xs font-semibold shadow-sm transition text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Bakong App
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="py-2 px-3 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed text-center"
                      >
                        Bakong App
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Instant Verification Trigger */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {isKm ? 'កំពុងរង់ចាំការទូទាត់ប្រាក់...' : 'Listening for payment settlement...'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleInstantSettle}
                  disabled={settling}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {settling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isKm ? 'កំពុងផ្ទៀងផ្ទាត់ (0.3s)...' : 'Verifying Settlement (0.3s)...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isKm ? 'ផ្ទៀងផ្ទាត់ការទូទាត់ឥឡូវនេះ (0.3s)' : 'Verify Settlement Now (0.3s)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
