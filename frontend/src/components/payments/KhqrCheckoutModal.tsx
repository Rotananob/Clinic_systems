'use client';

import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building,
  Clock,
  Copy,
  Check,
  Download,
  ArrowLeft,
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

type PaymentMethodType = 'aba' | 'card' | 'khqr' | 'wechat' | 'alipay';

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

  // Wizard state: SELECT_METHOD -> PAYMENT_VIEW
  const [step, setStep] = useState<'SELECT_METHOD' | 'PAYMENT_VIEW'>('SELECT_METHOD');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('aba');

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

  const [copied, setCopied] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settling, setSettling] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);

  const activeInvoiceId = invoiceId || invoice?.id;
  const paywayLiveUrl = qrData?.paywayLink || 'https://link.payway.com.kh/ABAPAYCK539089j';

  // Reset modal state on open
  useEffect(() => {
    if (isOpen && activeInvoiceId) {
      setStep('SELECT_METHOD');
      setSelectedMethod('aba');
      setSettled(false);
      setError(null);
      setCountdown(300);
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
    } catch (err: any) {
      setError(err.message || 'Failed to generate dynamic KHQR payment code');
    } finally {
      setLoading(false);
    }
  };

  // Start polling only when staff enters the PAYMENT_VIEW
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
        // Circuit breaker: pause if 4 consecutive failures
        if (consecutiveErrorsRef.current >= 4) {
          clearPolling();
        }
      }
    }, 3000);
  };

  // Proceed from Method Selector to Payment View
  const handleProceedToPayment = () => {
    setStep('PAYMENT_VIEW');
    if (qrData?.tranId) {
      startPolling(qrData.tranId);
    }

    // If ABA Pay selected on mobile, attempt opening deeplink directly
    if (selectedMethod === 'aba' && qrData?.deeplinks?.aba) {
      triggerAbaDeeplink();
    }
  };

  const triggerAbaDeeplink = () => {
    if (!qrData) return;
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    if (isMobile) {
      const targetUrl = isAndroid
        ? (qrData.deeplinks?.aba?.android || paywayLiveUrl)
        : (qrData.deeplinks?.aba?.ios || paywayLiveUrl);
      window.location.href = targetUrl;
    } else {
      window.open(paywayLiveUrl, '_blank');
    }
  };

  const triggerBakongDeeplink = () => {
    if (!qrData) return;
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    if (isMobile) {
      const targetUrl = isAndroid
        ? (qrData.deeplinks?.bakong?.android || `bakong://open?qr=${encodeURIComponent(qrData.qrString)}`)
        : (qrData.deeplinks?.bakong?.ios || `bakong://open?qr=${encodeURIComponent(qrData.qrString)}`);
      window.location.href = targetUrl;
    } else {
      window.open(paywayLiveUrl, '_blank');
    }
  };

  // Instant App-Switch Wakeup
  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      if (isOpen && step === 'PAYMENT_VIEW' && qrData?.tranId && !settled) {
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
  }, [isOpen, step, qrData, settled]);

  // Countdown
  useEffect(() => {
    if (!qrData || settled || step !== 'PAYMENT_VIEW') return;
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
  }, [qrData, settled, step]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(paywayLiveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Manual Instant Settlement (0.3s)
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

  // Download high-resolution PNG image with clinic name embedded
  const handleDownloadQrImage = () => {
    if (!qrData) return;
    const svg = document.getElementById('rotana-khqr-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 640;
    const height = 820;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Red Header Banner
    ctx.fillStyle = '#E1251B';
    ctx.fillRect(0, 0, width, 80);

    // KHQR Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('KHQR  BAKONG', 30, 52);

    ctx.font = '16px sans-serif';
    ctx.fillText('DYNAMIC PAYMENT', width - 210, 52);

    // Clinic Brand Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROTANA CLINIC', width / 2, 130);

    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('គ្លីនិក រតនា', width / 2, 162);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText('Phnom Penh, Cambodia', width / 2, 188);

    // Draw QR SVG into canvas
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    img.onload = () => {
      const qrSize = 380;
      ctx.drawImage(img, (width - qrSize) / 2, 215, qrSize, qrSize);

      // Amount & Bill details
      const amtText = `${currency === 'KHR' ? '៛' : '$'}${Number(rawAmount).toFixed(2)}`;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(amtText, width / 2, 650);

      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      const patientLabel = patientName ? ` • ${patientName}` : '';
      ctx.fillText(`Bill #${invoiceNumber}${patientLabel}`, width / 2, 685);

      // Footer
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, height - 70, width, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText('Scan with any Banking App (ABA, Bakong, Wing, ACLEDA)', width / 2, height - 28);

      // Download
      const link = document.createElement('a');
      link.download = `rotana-clinic-khqr-${invoiceNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  if (!activeInvoiceId) return null;

  const invoiceNumber = invoice?.invoiceNumber || qrData?.invoiceNumber || 'Processing...';
  const currency = invoice?.currency || qrData?.currency || 'USD';
  const rawAmount = invoice?.payableAmount ?? qrData?.amount ?? 0;
  const formattedAmount = `${currency === 'KHR' ? '៛' : '$'}${Number(rawAmount).toFixed(2)}`;
  const patientName = invoice?.patient?.nameEn || invoice?.patient?.nameKh || '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        settled
          ? (isKm ? 'ការទូទាត់ជោគជ័យ' : 'Payment Settled')
          : step === 'SELECT_METHOD'
          ? (isKm ? 'ជ្រើសរើសវិធីសាស្ត្រទូទាត់' : 'Select payment method')
          : (isKm ? 'ស្កេនទូទាត់ KHQR / ABA Pay' : 'Scan KHQR / ABA Pay')
      }
      description={`Invoice: ${invoiceNumber} • ${formattedAmount}`}
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
              <span className="font-semibold">{isKm ? 'សេចក្តីជូនដំណឹងទូទាត់:' : 'Payment Notice:'}</span>
              <p className="mt-0.5">{error}</p>
              <button
                type="button"
                onClick={() => activeInvoiceId && generateKhqr(activeInvoiceId)}
                className="mt-2 inline-flex items-center gap-1 font-semibold text-rose-900 underline"
              >
                <RefreshCw className="w-3 h-3" />
                {isKm ? 'ព្យាយាមបង្កើតម្តងទៀត' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* SETTLED SUCCESS SCREEN */}
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
                <span className="font-medium text-slate-800">
                  {selectedMethod === 'aba' ? 'ABA Pay (Live Deeplink)' : 'Bakong KHQR Bridge'}
                </span>
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
          !loading && qrData && (
            <>
              {/* STEP 1: EXACT REPLICA OF USER SCREENSHOT (Select payment method) */}
              {step === 'SELECT_METHOD' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {/* Method List */}
                    <div className="divide-y divide-slate-100">
                      {/* 1. ABA Pay */}
                      <label
                        className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                          selectedMethod === 'aba' ? 'bg-cyan-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-800">ABA Pay</span>
                          <div className="w-12 h-6 rounded bg-[#005F86] text-white flex flex-col items-center justify-center font-bold leading-none select-none px-1 shadow-xs">
                            <span className="text-[8px] tracking-tight">ABA</span>
                            <span className="text-[6.5px] font-semibold tracking-wider text-cyan-200">PAY</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="payment_method"
                          value="aba"
                          checked={selectedMethod === 'aba'}
                          onChange={() => setSelectedMethod('aba')}
                          className="w-4 h-4 text-cyan-700 border-slate-300 focus:ring-cyan-600"
                        />
                      </label>

                      {/* 2. Credit Card */}
                      <label
                        className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                          selectedMethod === 'card' ? 'bg-cyan-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-semibold text-slate-800">Credit Card</span>
                          <div className="flex items-center gap-1 select-none">
                            <div className="h-5 px-1 bg-white border border-slate-200 rounded flex items-center justify-center">
                              <span className="font-black italic text-[9px] text-[#1A1F71] tracking-tighter">VISA</span>
                            </div>
                            <div className="h-5 w-7 bg-white border border-slate-200 rounded flex items-center justify-center">
                              <div className="flex items-center -space-x-1">
                                <div className="w-3 h-3 rounded-full bg-[#EB001B] opacity-90" />
                                <div className="w-3 h-3 rounded-full bg-[#F79E1B] opacity-90" />
                              </div>
                            </div>
                            <div className="h-5 px-1 bg-white border border-slate-200 rounded flex items-center justify-center">
                              <span className="font-extrabold text-[7.5px] text-[#007b83]">UnionPay</span>
                            </div>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="payment_method"
                          value="card"
                          checked={selectedMethod === 'card'}
                          onChange={() => setSelectedMethod('card')}
                          className="w-4 h-4 text-cyan-700 border-slate-300 focus:ring-cyan-600"
                        />
                      </label>

                      {/* 3. KHQR */}
                      <label
                        className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                          selectedMethod === 'khqr' ? 'bg-cyan-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-800">KHQR</span>
                          <div className="w-12 h-6 rounded bg-[#E1251B] text-white flex items-center justify-center font-black text-[9px] tracking-wide select-none shadow-xs">
                            <span>KHQR</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="payment_method"
                          value="khqr"
                          checked={selectedMethod === 'khqr'}
                          onChange={() => setSelectedMethod('khqr')}
                          className="w-4 h-4 text-cyan-700 border-slate-300 focus:ring-cyan-600"
                        />
                      </label>

                      {/* 4. WeChat */}
                      <label
                        className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                          selectedMethod === 'wechat' ? 'bg-cyan-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-800">WeChat</span>
                          <div className="w-11 h-6 rounded bg-[#07C160] text-white flex items-center justify-center select-none shadow-xs">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M9.5 4C5.36 4 2 6.91 2 10.5c0 2.05 1.07 3.88 2.76 5.08L4 18l3.05-1.22c.76.22 1.58.34 2.45.34.24 0 .47-.01.71-.03-.23-.52-.37-1.09-.37-1.69 0-3.31 3.13-6 7-6 .18 0 .36.01.54.02C16.5 6.07 13.3 4 9.5 4zm-2.25 4.5c.69 0 1.25.56 1.25 1.25S7.94 11 7.25 11 6 10.44 6 9.75 6.56 8.5 7.25 8.5zm4.5 0c.69 0 1.25.56 1.25 1.25S12.44 11 11.75 11 10.5 10.44 10.5 9.75 11.06 8.5 11.75 8.5zm4.75 4.5c-3.31 0-6 2.24-6 5s2.69 5 6 5c.7 0 1.36-.1 1.97-.27L21 23.5l-.65-1.95c1.35-.96 2.15-2.35 2.15-3.85 0-2.76-2.69-5-6-5zm-2 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
                            </svg>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="payment_method"
                          value="wechat"
                          checked={selectedMethod === 'wechat'}
                          onChange={() => setSelectedMethod('wechat')}
                          className="w-4 h-4 text-cyan-700 border-slate-300 focus:ring-cyan-600"
                        />
                      </label>

                      {/* 5. Alipay */}
                      <label
                        className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                          selectedMethod === 'alipay' ? 'bg-cyan-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-800">Alipay</span>
                          <div className="w-11 h-6 rounded bg-[#1677FF] text-white flex items-center justify-center select-none shadow-xs font-bold text-xs">
                            <span>支</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="payment_method"
                          value="alipay"
                          checked={selectedMethod === 'alipay'}
                          onChange={() => setSelectedMethod('alipay')}
                          className="w-4 h-4 text-cyan-700 border-slate-300 focus:ring-cyan-600"
                        />
                      </label>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    By proceeding you accept the Terms of use and Privacy policy
                  </p>

                  {/* PROCEED TO PAYMENT BUTTON (Matching screenshot) */}
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="w-full py-3 bg-black hover:bg-slate-900 text-white font-bold rounded-lg text-xs tracking-wide shadow-sm transition-all"
                  >
                    Proceed to Payment
                  </button>
                </div>
              )}

              {/* STEP 2: PAYMENT QR & DEEPLINK TEST VIEW */}
              {step === 'PAYMENT_VIEW' && (
                <div className="space-y-4">
                  {/* Back button */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        clearPolling();
                        setStep('SELECT_METHOD');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{isKm ? 'ប្តូរវិធីសាស្ត្រទូទាត់' : 'Change method'}</span>
                    </button>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                      Method: {selectedMethod.toUpperCase()}
                    </span>
                  </div>

                  {/* AUTHENTIC BAKONG KHQR STANDEE CARD (WITH CLINIC NAME EMBEDDED) */}
                  <div
                    id="rotana-khqr-card-container"
                    className="bg-white border-2 border-red-600 rounded-2xl overflow-hidden shadow-md max-w-[310px] mx-auto text-slate-900"
                  >
                    {/* Red Top Header */}
                    <div className="bg-[#E1251B] text-white py-2 px-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold tracking-wider text-xs">
                        <span className="bg-white text-[#E1251B] font-black text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                          KHQR
                        </span>
                        <span>BAKONG</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider opacity-90">
                        Tag 01=12
                      </span>
                    </div>

                    {/* CLINIC BRANDING HEADER (DISPLAYED DIRECTLY IN THE CARD) */}
                    <div className="pt-2.5 pb-2 px-3 text-center border-b border-slate-100 bg-slate-50/60">
                      <div className="text-sm font-extrabold uppercase tracking-tight text-slate-900">
                        ROTANA CLINIC
                      </div>
                      <div className="text-xs font-bold text-teal-800">
                        គ្លីនិក រតនា
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Medical Center & Polyclinic
                      </div>
                    </div>

                    {/* QR Code Matrix with Quiet Zone */}
                    <div className="p-3.5 bg-white flex flex-col items-center justify-center">
                      <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-inner inline-block">
                        <QRCodeSVG
                          id="rotana-khqr-svg"
                          value={qrData.qrString}
                          size={195}
                          level="M"
                          includeMargin={true}
                        />
                      </div>

                      {/* Amount & Invoice Info on the Card */}
                      <div className="mt-2.5 text-center w-full">
                        <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                          {formattedAmount}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                          <span>#{invoiceNumber}</span>
                          {patientName && <span className="ml-1">• {patientName}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Strip */}
                    <div className="bg-slate-900 text-white py-1.5 px-3 text-center text-[10px] tracking-wide font-medium">
                      ស្កេនទូទាត់ជាមួយ App ធនាគារគ្រប់ប្រភេទ (ABA, Bakong)
                    </div>
                  </div>

                  {/* DEEPLINK ACTIONS & CONTROLS */}
                  <div className="space-y-2">
                    {/* If ABA Pay method selected */}
                    {selectedMethod === 'aba' ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={triggerAbaDeeplink}
                          className="w-full py-2.5 px-3 bg-[#005F86] hover:bg-[#004e6e] text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>
                            {isKm ? 'បើកដំណើរការ ABA Mobile (Test Deeplink)' : 'Open in ABA Mobile (Test Deeplink)'}
                          </span>
                        </button>

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
                      /* KHQR or other methods */
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadQrImage}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-200"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>{isKm ? 'រក្សាទុករូប QR' : 'Save QR Image'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={triggerBakongDeeplink}
                          className="py-2 px-3 bg-[#E1251B] hover:bg-[#c91f16] text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Bakong App</span>
                        </button>
                      </div>
                    )}

                    {/* Countdown and poller status */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{isKm ? 'កំពុងរង់ចាំការទូទាត់...' : 'Listening for payment...'}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                        </span>
                      </span>
                    </div>

                    {/* Instant verification button (0.3s) */}
                    <button
                      type="button"
                      onClick={handleInstantSettle}
                      disabled={settling}
                      className="w-full py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {settling ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{isKm ? 'កំពុងផ្ទៀងផ្ទាត់ (0.3s)...' : 'Verifying (0.3s)...'}</span>
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
              )}
            </>
          )
        )}
      </div>
    </Modal>
  );
}
