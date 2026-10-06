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
  Clock,
  Copy,
  Check,
  Download,
  Smartphone,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Lock,
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
  clinicName?: string;
  clinicNameKh?: string;
  onPaymentSuccess?: () => void;
  onSuccess?: () => void;
}

type PaymentMethodType = 'aba' | 'card' | 'khqr' | 'wechat' | 'alipay';

export function KhqrCheckoutModal({
  isOpen,
  onClose,
  invoice,
  invoiceId,
  clinicName = 'ROTANA CLINIC',
  clinicNameKh = 'គ្លីនិក រតនា',
  onPaymentSuccess,
  onSuccess,
}: KhqrCheckoutModalProps) {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('aba');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settling, setSettling] = useState(false);
  const [countdown, setCountdown] = useState(180); // Strict 3-minute hard limit (180s)
  const [isMobile, setIsMobile] = useState(false);

  const [qrData, setQrData] = useState<{
    qrString: string;
    tranId: string;
    md5: string;
    amount: number;
    currency: string;
    invoiceNumber: string;
    paywayLink: string;
    deeplinks?: any;
    expiresInSeconds: number;
    expiresAt?: number;
  } | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);
  const activeInvoiceId = invoiceId || invoice?.id;
  const paywayLiveUrl = qrData?.paywayLink || 'https://link.payway.com.kh/ABAPAYCK539089j';
  const storageKey = activeInvoiceId ? `clinic_active_payment_${activeInvoiceId}` : null;

  // Detect mobile vs desktop for deeplink locking
  useEffect(() => {
    const checkDevice = () => {
      const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.innerWidth <= 768);
      setIsMobile(mobile);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const clearPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleSuccess = () => {
    clearPolling();
    setSettled(true);
    setSettling(false);
    if (storageKey) {
      try { sessionStorage.removeItem(storageKey); } catch {}
    }
    if (onPaymentSuccess) onPaymentSuccess();
    if (onSuccess) onSuccess();
  };

  // Start polling every 3 seconds politely without spamming bank URLs
  const startPolling = (tranId: string) => {
    clearPolling();
    pollTimerRef.current = setInterval(async () => {
      try {
        const statusRes = await api.payments.checkStatus(tranId);
        consecutiveErrorsRef.current = 0;
        if (statusRes.status === 'SUCCESS' || statusRes.invoiceStatus === 'PAID') {
          handleSuccess();
        }
      } catch {
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 4) {
          clearPolling();
        }
      }
    }, 3000);
  };

  const generateKhqr = async (id: string) => {
    // 1. Check Anti-Reload Cache in sessionStorage first
    if (storageKey) {
      try {
        const cachedRaw = sessionStorage.getItem(storageKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const now = Date.now();
          if (cached.expiresAt && cached.expiresAt > now) {
            const remaining = Math.max(0, Math.floor((cached.expiresAt - now) / 1000));
            setQrData(cached);
            setCountdown(remaining);
            if (cached.tranId) startPolling(cached.tranId);
            return;
          }
        }
      } catch {}
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.payments.generateQr(id);
      const expiresAt = Date.now() + (180 * 1000); // Strict 3-minute hard limit (180s)
      const data = {
        qrString: res.qrString,
        tranId: res.tranId,
        md5: res.md5 || '',
        amount: res.amount,
        currency: res.currency,
        invoiceNumber: res.invoiceNumber,
        paywayLink: res.paywayLink || 'https://link.payway.com.kh/ABAPAYCK539089j',
        deeplinks: res.deeplinks,
        expiresInSeconds: 180,
        expiresAt,
      };

      setQrData(data);
      setCountdown(180);

      // Save to sessionStorage for Anti-Reload & tab-switch recovery
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(data));
        } catch {}
      }

      if (data.tranId) {
        startPolling(data.tranId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate dynamic KHQR payment code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeInvoiceId) {
      setSettled(false);
      setError(null);
      setCountdown(180);
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

  // Anti-Reload Safeguard: Prevent accidental refresh or tab exit while payment is active
  useEffect(() => {
    if (!isOpen || !qrData || settled || countdown <= 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'ការទូទាត់កំពុងដំណើរការ! តើអ្នកប្រាកដជាចង់ចាកចេញ?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, qrData, settled, countdown]);

  // 3-Minute Live Countdown Timer (Strict Limit Rule)
  useEffect(() => {
    if (!qrData || settled) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          clearPolling();
          if (storageKey) {
            try { sessionStorage.removeItem(storageKey); } catch {}
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData, settled, storageKey]);

  // Instant App-Switch Wakeup (Safari / Mobile Chrome tab resumption)
  useEffect(() => {
    const handleVisibilityOrFocus = async () => {
      if (isOpen && qrData?.tranId && !settled && document.visibilityState === 'visible') {
        try {
          const res = await api.payments.checkStatus(qrData.tranId);
          if (res.status === 'SUCCESS' || res.invoiceStatus === 'PAID') {
            handleSuccess();
          }
        } catch {}
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isOpen, qrData?.tranId, settled]);

  const handleInstantSettle = async () => {
    if (!qrData?.tranId) return;
    setSettling(true);
    try {
      await api.payments.settle(qrData.tranId);
      handleSuccess();
    } catch (err: any) {
      setError(err.message || 'Settlement failed. Please try again.');
      setSettling(false);
    }
  };

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDownloadQrImage = () => {
    const svgElement = document.getElementById('rotana-khqr-svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 50, 50, 500, 500);

        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `KHQR-${qrData?.invoiceNumber || 'payment'}.png`;
        downloadLink.href = png;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const formattedAmount = qrData
    ? qrData.currency === 'KHR'
      ? `${Number(qrData.amount).toLocaleString()} ៛`
      : `$${Number(qrData.amount).toFixed(2)}`
    : invoice?.payableAmount
    ? invoice.currency === 'KHR'
      ? `${Number(invoice.payableAmount).toLocaleString()} ៛`
      : `$${Number(invoice.payableAmount).toFixed(2)}`
    : '$0.00';

  const invoiceNumber = qrData?.invoiceNumber || invoice?.invoiceNumber || 'INV-000';
  const patientName = invoice?.patient
    ? isKm
      ? invoice.patient.nameKh || invoice.patient.nameEn
      : invoice.patient.nameEn || invoice.patient.nameKh
    : '';

  const getAbaDeeplink = (qrStr: string) => {
    return qrData?.deeplinks?.aba?.ios || `aba://qr?data=${encodeURIComponent(qrStr)}`;
  };
  const getBakongDeeplink = (qrStr: string) => {
    return qrData?.deeplinks?.bakong?.ios || `bakong://qr?data=${encodeURIComponent(qrStr)}`;
  };
  const getAcledaDeeplink = (qrStr: string) => {
    return qrData?.deeplinks?.acleda?.ios || `acledamobile://qr?data=${encodeURIComponent(qrStr)}`;
  };
  const getWingDeeplink = (qrStr: string) => {
    return qrData?.deeplinks?.wing?.ios || `wingmoney://qr?data=${encodeURIComponent(qrStr)}`;
  };

  // When mobile user taps a banking deep link, temporarily halt polling (0 calls, wait for MTProto)
  const handleDeeplinkClick = () => {
    if (isMobile) {
      clearPolling();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        settled
          ? (isKm ? 'ការទូទាត់ជោគជ័យ' : 'Payment Settled')
          : (isKm ? 'ស្កេនទូទាត់ KHQR / Mobile Banking' : 'Scan KHQR / Mobile Banking')
      }
      description={`Invoice: ${invoiceNumber} • ${formattedAmount}`}
    >
      <div className="space-y-4 max-h-[82vh] overflow-y-auto px-1 py-0.5">
        {loading && (
          <div className="py-12 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">
              {isKm ? 'កំពុងបង្កើតកូដទូទាត់ KHQR និងតំណភ្ជាប់ ABA...' : 'Generating official KHQR and payment links...'}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">{isKm ? 'សេចក្តីជូនដំណឹង:' : 'Notice:'}</span>
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
                  {selectedMethod === 'aba' ? 'ABA Pay' : 'Bakong KHQR Bridge'}
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
            <div className="space-y-4">
              {/* Payment Methods Bar */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('aba')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    selectedMethod === 'aba'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#005F86]" />
                  <span>ABA Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('khqr')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    selectedMethod === 'khqr'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#E1251B]" />
                  <span>KHQR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    selectedMethod === 'card'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3 h-3 text-slate-500" />
                  <span>Cards</span>
                </button>
              </div>

              {/* Status Poller & 3-Minute Countdown Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {isKm
                      ? 'ប្រព័ន្ធកំពុងរង់ចាំការទូទាត់ (MTProto Push)...'
                      : 'Listening for settlement push (MTProto)...'}
                  </span>
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-500 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className={countdown <= 30 ? 'text-rose-600 font-bold' : ''}>
                    {countdown <= 0
                      ? (isKm ? 'ផុតកំណត់' : 'Expired')
                      : `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}`}
                  </span>
                </span>
              </div>

              {/* 1. TOP SECTION: MULTI-BANK DEEPLINKS (Mobile Active / Desktop Locked) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-teal-700" />
                    <span>{isKm ? 'ជ្រើសរើស App ធនាគារដើម្បីបង់ប្រាក់ផ្ទាល់ (Deeplink):' : 'Select Banking App (Deeplink):'}</span>
                  </div>
                  {!isMobile && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Desktop Locked</span>
                    </span>
                  )}
                </div>

                {/* Desktop Advisory Banner */}
                {!isMobile && (
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-600 text-center leading-relaxed">
                    🖥️ <strong>កុំព្យូទ័រ Desktop:</strong> សូមស្កេនរូប QR ខាងក្រោមតាម App ធនាគារលើទូរស័ព្ទដៃរបស់លោកអ្នក (Deeplinks ត្រូវបានចាក់សោរលើ Desktop)
                  </div>
                )}

                <div className={`grid grid-cols-2 gap-2 ${!isMobile ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                  {/* 1. ABA Mobile */}
                  <a
                    href={getAbaDeeplink(qrData.qrString)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleDeeplinkClick}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-blue-200 bg-gradient-to-r from-[#00529C] to-[#003d73] text-white shadow-2xs hover:opacity-95 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-[10px] shrink-0">
                      ABA
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="text-xs font-bold leading-tight truncate">ABA Mobile</div>
                      <div className="text-[10px] text-blue-100/90 leading-tight">បង់ភ្លាមៗ</div>
                    </div>
                  </a>

                  {/* 2. Bakong App */}
                  <a
                    href={getBakongDeeplink(qrData.qrString)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleDeeplinkClick}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-red-200 bg-gradient-to-r from-[#E12228] to-[#b81419] text-white shadow-2xs hover:opacity-95 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-[9px] shrink-0">
                      KHQR
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="text-xs font-bold leading-tight truncate">Bakong App</div>
                      <div className="text-[10px] text-red-100 leading-tight">បាគង</div>
                    </div>
                  </a>

                  {/* 3. ACLEDA Mobile */}
                  <a
                    href={getAcledaDeeplink(qrData.qrString)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleDeeplinkClick}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#0B3B60] to-[#082942] text-white shadow-2xs hover:opacity-95 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center font-black text-[10px] text-[#F5D77F] shrink-0">
                      ACL
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="text-xs font-bold leading-tight truncate">ACLEDA Mobile</div>
                      <div className="text-[10px] text-[#F5D77F]/90 leading-tight">អេស៊ីលីដា</div>
                    </div>
                  </a>

                  {/* 4. Wing Bank */}
                  <a
                    href={getWingDeeplink(qrData.qrString)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleDeeplinkClick}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-lime-300 bg-gradient-to-r from-[#78BE20] to-[#5a9413] text-white shadow-2xs hover:opacity-95 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-[9px] shrink-0">
                      WING
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="text-xs font-bold leading-tight truncate">Wing Bank</div>
                      <div className="text-[10px] text-lime-100 leading-tight">វីង</div>
                    </div>
                  </a>
                </div>
              </div>

              {/* 2. BOTTOM SECTION: AUTHENTIC BAKONG KHQR STANDEE CARD */}
              <div
                id="rotana-khqr-card-container"
                className={`bg-white border-2 border-red-600 rounded-2xl overflow-hidden shadow-md max-w-[290px] mx-auto text-slate-900 transition-opacity ${
                  countdown <= 0 ? 'opacity-40 grayscale' : ''
                }`}
              >
                {/* Red Top Header */}
                <div className="bg-[#E1251B] text-white py-1.5 px-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 font-bold tracking-wider text-xs">
                    <span className="bg-white text-[#E1251B] font-black text-[9px] px-1 py-0.5 rounded shadow-xs">
                      KHQR
                    </span>
                    <span className="text-[11px]">BAKONG</span>
                  </div>
                  <span className="text-[9px] uppercase font-semibold tracking-wider opacity-90">
                    Tag 01=12
                  </span>
                </div>

                {/* CLINIC BRANDING HEADER (CUSTOMIZABLE STORE / CLINIC NAME) */}
                <div className="pt-2 pb-1.5 px-3 text-center border-b border-slate-100 bg-slate-50/70">
                  <div className="text-xs font-extrabold uppercase tracking-tight text-slate-900">
                    {clinicName}
                  </div>
                  <div className="text-[11px] font-bold text-teal-800">
                    {clinicNameKh}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    Phnom Penh, Cambodia
                  </div>
                </div>

                {/* QR Code Matrix */}
                <div className="p-3 bg-white flex flex-col items-center justify-center">
                  <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-inner inline-block">
                    <QRCodeSVG
                      id="rotana-khqr-svg"
                      value={qrData.qrString}
                      size={180}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  {/* Amount & Bill details */}
                  <div className="mt-2 text-center w-full">
                    <div className="text-xl font-black font-mono text-slate-900 tracking-tight">
                      {formattedAmount}
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 mt-0.5">
                      <span>#{invoiceNumber}</span>
                      {patientName && <span className="ml-1">• {patientName}</span>}
                    </div>
                  </div>
                </div>

                {/* Bottom Strip */}
                <div className="bg-slate-900 text-white py-1 px-2 text-center text-[9px] tracking-wide font-medium">
                  ស្កេនទូទាត់ជាមួយ App ធនាគារគ្រប់ប្រភេទ (ABA, Bakong)
                </div>
              </div>

              {/* ACTION BUTTONS: COPY KHQR & DOWNLOAD PNG */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(qrData.qrString, false)}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">{isKm ? 'បានចម្លង' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isKm ? 'ចម្លងកូដ KHQR' : 'Copy KHQR'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrImage}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-200 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isKm ? 'រក្សាទុករូប QR' : 'Save QR Image'}</span>
                </button>
              </div>

              {/* CRITICAL NOTE: Inter-bank settlement latency (3-4 seconds) */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center text-[11px] text-amber-900 leading-relaxed max-w-sm mx-auto">
                <p>
                  * <strong>ចំណាំ៖</strong> ប្រសិនបើលោកអ្នកស្កេនតាមធនាគារផ្សេងក្រៅពី ABA (ដូចជា ACLEDA, Canadia, Wing...) ការទូទាត់អាចចំណាយពេលយូរជាងបន្តិច (ប្រហែល ៣ ទៅ ៤ វិនាទី) ដើម្បីផ្ទៀងផ្ទាត់។
                </p>
                <p className="text-[10px] text-amber-700/90 mt-0.5">
                  * Note: Settlement verification via other banks may take 3-4 seconds longer than ABA.
                </p>
              </div>

              {/* Direct PayWay Link Copy */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  readOnly
                  value={paywayLiveUrl}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-600 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(paywayLiveUrl, true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1 shrink-0 border border-slate-200"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">{isKm ? 'បានចម្លង' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>{isKm ? 'តំណភ្ជាប់' : 'Copy'}</span>
                    </>
                  )}
                </button>
                <a
                  href={paywayLiveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200"
                  title="Open PayWay Link in browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Instant Verification Button for Cashier */}
              <button
                type="button"
                onClick={handleInstantSettle}
                disabled={settling || countdown <= 0}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {settling ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isKm ? 'កំពុងផ្ទៀងផ្ទាត់ (0.3s)...' : 'Verifying (0.3s)...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isKm ? 'ផ្ទៀងផ្ទាត់ការទូទាត់ភ្លាមៗ (0.3s)' : 'Instant Verify Settlement (0.3s)'}</span>
                  </>
                )}
              </button>
            </div>
          )
        )}
      </div>
    </Modal>
  );
}
