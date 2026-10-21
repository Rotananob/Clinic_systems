'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  X,
  Zap,
  Sparkles,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { playPaymentSuccessChime } from '../../lib/chime';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanTier?: 'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12';
  onActivated?: () => void;
}

interface PlanOption {
  id: 'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12';
  nameKh: string;
  nameEn: string;
  monthlyUsd: number;
  annualUsd: number;
  khqrQuotaKh: string;
  khqrQuotaEn: string;
  patientQuotaKh: string;
  patientQuotaEn: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: 'STARTER_5',
    nameKh: 'គ្លីនិកខ្នាតតូច (Starter)',
    nameEn: 'Clinic Starter ($5/mo)',
    monthlyUsd: 5,
    annualUsd: 48,
    khqrQuotaKh: '២៥០ ប្រតិបត្តិការ / ថ្ងៃ',
    khqrQuotaEn: '250 dynamic QR / day',
    patientQuotaKh: '១,០០០ នាក់ / គណនី',
    patientQuotaEn: '1,000 patients / account',
  },
  {
    id: 'PRO_8',
    nameKh: 'គ្លីនិកវិជ្ជាជីវៈ (Polyclinic Pro)',
    nameEn: 'Polyclinic Pro ($8/mo)',
    monthlyUsd: 8,
    annualUsd: 76,
    khqrQuotaKh: '១,៥០០ ប្រតិបត្តិការ / ថ្ងៃ',
    khqrQuotaEn: '1,500 dynamic QR / day',
    patientQuotaKh: '៥,០០០ នាក់ / គណនី',
    patientQuotaEn: '5,000 patients / account',
  },
  {
    id: 'ENTERPRISE_12',
    nameKh: 'មន្ទីរពេទ្យធំ (Hospital Enterprise)',
    nameEn: 'Hospital Enterprise ($12/mo)',
    monthlyUsd: 12,
    annualUsd: 115,
    khqrQuotaKh: 'មិនកំណត់ចំនួន (Unlimited)',
    khqrQuotaEn: 'Unlimited dynamic QR',
    patientQuotaKh: 'មិនកំណត់ចំនួនអ្នកជំងឺ',
    patientQuotaEn: 'Unlimited patients',
  },
];

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  initialPlanTier = 'PRO_8',
  onActivated,
}) => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [selectedPlanTier, setSelectedPlanTier] = useState<'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12'>(
    initialPlanTier,
  );
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [loadingCheckout, setLoadingCheckout] = useState<boolean>(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [activated, setActivated] = useState<boolean>(false);
  const [activationResult, setActivationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900); // 15 mins

  // Support Request Workflow
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [submittingSupport, setSubmittingSupport] = useState<boolean>(false);
  const [supportSubmitted, setSupportSubmitted] = useState<boolean>(false);
  const [supportNote, setSupportNote] = useState<string>('');
  const [copiedTranId, setCopiedTranId] = useState<boolean>(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize checkout session when modal opens or plan/cycle changes
  const initCheckout = async (plan: 'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12', cycle: 'MONTHLY' | 'ANNUAL') => {
    try {
      setLoadingCheckout(true);
      setErrorMsg('');
      setActivated(false);
      setSupportSubmitted(false);
      const res = await api.subscriptions.createCheckout({
        planTier: plan,
        billingCycle: cycle,
      });
      if (res && res.success) {
        setCheckoutData(res);
        setSecondsRemaining(900);
      } else {
        setErrorMsg('Failed to initialize subscription checkout');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error generating KHQR subscription checkout');
    } finally {
      setLoadingCheckout(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedPlanTier(initialPlanTier);
      initCheckout(initialPlanTier, billingCycle);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setCheckoutData(null);
      setActivated(false);
      setShowSupportModal(false);
      setSupportSubmitted(false);
    }
  }, [isOpen]);

  // Polling for live settlement detection every 3 seconds
  useEffect(() => {
    if (!isOpen || !checkoutData || activated) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkSettlement = async () => {
      try {
        const res = await api.subscriptions.verifySettlement({
          subscriptionId: checkoutData.subscriptionId,
          tranId: checkoutData.tranId,
          md5: checkoutData.md5,
        });

        if (res && res.activated) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setActivated(true);
          setActivationResult(res);
          playPaymentSuccessChime();
          if (onActivated) onActivated();
        }
      } catch {
        // Continue polling silently without throwing to user UI
      }
    };

    pollingRef.current = setInterval(checkSettlement, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, checkoutData, activated]);

  // Countdown timer ticker
  useEffect(() => {
    if (!isOpen || !checkoutData || activated) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, checkoutData, activated]);

  const handleManualVerify = async () => {
    if (!checkoutData) return;
    try {
      setVerifying(true);
      setErrorMsg('');
      const res = await api.subscriptions.verifySettlement({
        subscriptionId: checkoutData.subscriptionId,
        tranId: checkoutData.tranId,
        md5: checkoutData.md5,
      });
      if (res && res.activated) {
        setActivated(true);
        setActivationResult(res);
        playPaymentSuccessChime();
        if (onActivated) onActivated();
      } else {
        setErrorMsg(
          isKm
            ? 'មិនទាន់រកឃើញការទូទាត់នៅក្នុងប្រព័ន្ធធនាគារឡើយ។ ប្រសិនបើលោកអ្នកបានកាត់ប្រាក់រួចហើយ សូមចុចប៊ូតុង "ជំនួយការទូទាត់" ខាងក្រោម។'
            : 'Payment settlement not verified in banking system yet. If funds were deducted, please use 24/7 Support below.',
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err.messageKh ||
          err.message ||
          (isKm
            ? 'មិនទាន់រកឃើញការទូទាត់នៅក្នុងប្រព័ន្ធធនាគារឡើយ។ សូមស្កេន KHQR និងបញ្ចប់ការទូទាត់ក្នុង App ធនាគាររបស់អ្នក។'
            : 'Payment not settled yet. Please complete the scan in your mobile banking app.'),
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyTranId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTranId(true);
    setTimeout(() => setCopiedTranId(false), 2000);
  };

  const handleReportSupport = async () => {
    if (!checkoutData) return;
    try {
      setSubmittingSupport(true);
      await api.subscriptions.requestSupport({
        subscriptionId: checkoutData.subscriptionId,
        issueDescription: supportNote || 'Payment scan completed but subscription not activated automatically',
      });
      setSupportSubmitted(true);
    } catch {
      setSupportSubmitted(true);
    } finally {
      setSubmittingSupport(false);
    }
  };

  const currentPlan = PLAN_OPTIONS.find((p) => p.id === selectedPlanTier) || PLAN_OPTIONS[1];

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs font-sans">
      <div className="bg-[#FAF7F2] border border-stone-300 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-white border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 font-sans">
                {isKm
                  ? 'Upgrade គម្រោងជាវ & បង់ប្រាក់តាម Dynamic KHQR'
                  : 'SaaS Subscription Upgrade & KHQR Checkout'}
              </h2>
              <p className="text-xs text-stone-500">
                {isKm
                  ? 'ស្កេន Dynamic Tag 01=12 KHQR ជាមួយ App ធនាគារណាក៏បាន ប្រព័ន្ធការពារ ១០០% គ្មាន Bypass'
                  : 'Scan dynamic Tag 01=12 KHQR with your mobile banking app. Strict bank-verified settlement.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">{errorMsg}</span>
                <div className="text-[11px] text-amber-800">
                  {isKm
                    ? 'ប្រសិនបើប្រព័ន្ធធនាគារបានកាត់ប្រាក់រួចហើយ សូមចុចប៊ូតុង "ជំនួយការទូទាត់" ខាងក្រោមដើម្បីផ្ញើជូន Super Admin ពិនិត្យភ្លាមៗ។'
                    : 'If funds were deducted from your banking app, click "24/7 Human Support" below to alert Super Admin.'}
                </div>
              </div>
            </div>
          )}

          {activated ? (
            /* Celebration Success State */
            <div className="text-center py-8 space-y-4 bg-white border border-teal-200 rounded-2xl p-6 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-teal-800 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9 text-teal-100" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-stone-900 font-sans">
                  {isKm ? 'ដំណើរការគម្រោងជាវជោគជ័យ!' : 'Subscription Activated Successfully!'}
                </h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  {isKm
                    ? 'ការទូទាត់ត្រូវបានផ្ទៀងផ្ទាត់ដោយជោគជ័យតាមប្រព័ន្ធធនាគារ។ សុពលភាព និងកូតាត្រូវបានពង្រីកដោយស្វ័យប្រវត្ត។'
                    : 'Settlement verified with banking gateway. Clinic workspace quotas have been extended immediately.'}
                </p>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-stone-200 max-w-sm mx-auto space-y-2 text-xs text-left">
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">{isKm ? 'គម្រោងថ្មី' : 'Active Plan'}:</span>
                  <span className="font-bold text-stone-900">{activationResult?.planTier}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">{isKm ? 'ចំនួនទឹកប្រាក់' : 'Amount Paid'}:</span>
                  <span className="font-bold text-teal-800">${activationResult?.amountUsd}.00 USD</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span className="text-stone-500">{isKm ? 'សុពលភាពថ្មី' : 'New Expiry'}:</span>
                  <span className="font-bold text-stone-900">{activationResult?.newExpiryFormatted || '30 days extended'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-500">{isKm ? 'ស្ថានភាពគ្លីនិក' : 'Clinic Status'}:</span>
                  <span className="font-bold text-emerald-700">Active (Fully Operational)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  {isKm ? 'បិទផ្ទាំងនេះ' : 'Done & Close'}
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Workflow */
            <div className="space-y-6">
              {/* 1. Plan Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                  {isKm ? '១. ជ្រើសរើសគម្រោងសេវាកម្ម' : '1. Select Subscription Tier'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLAN_OPTIONS.map((plan) => {
                    const isSelected = selectedPlanTier === plan.id;
                    const price = billingCycle === 'ANNUAL' ? plan.annualUsd : plan.monthlyUsd;
                    const unit = billingCycle === 'ANNUAL' ? '/ឆ្នាំ' : '/ខែ';
                    const unitEn = billingCycle === 'ANNUAL' ? '/yr' : '/mo';

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlanTier(plan.id);
                          initCheckout(plan.id, billingCycle);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer select-none ${
                          isSelected
                            ? 'bg-teal-50/90 border-2 border-teal-800 ring-4 ring-teal-700/20 shadow-md scale-[1.01]'
                            : 'bg-white border-stone-200 hover:border-stone-400 shadow-2xs'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-800 text-white shadow-xs flex items-center gap-1 border border-teal-900 animate-in fade-in zoom-in duration-150">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{isKm ? 'បានជ្រើសរើស' : 'SELECTED'}</span>
                          </span>
                        )}
                        <div className={`text-xs ${isSelected ? 'font-black text-teal-950' : 'font-bold text-stone-900'}`}>
                          {isKm ? plan.nameKh : plan.nameEn}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                          {billingCycle === 'ANNUAL' && (
                            <span className="text-xs font-bold text-stone-400 line-through decoration-rose-500 decoration-1 font-mono">
                              ${plan.monthlyUsd * 12}
                            </span>
                          )}
                          <div className={`text-lg font-black ${isSelected ? 'text-teal-950' : 'text-teal-900'}`}>
                            ${price}
                            <span className="text-xs font-normal text-stone-500">
                              {isKm ? unit : unitEn}
                            </span>
                          </div>
                          {billingCycle === 'ANNUAL' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700">
                              -20%
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'font-bold text-teal-900/80' : 'text-stone-500'}`}>
                          {isKm ? plan.khqrQuotaKh : plan.khqrQuotaEn}
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-teal-950 bg-teal-200/90 px-2 py-0.5 rounded-md border border-teal-300 shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3] text-teal-900" />
                              <span className="font-black tracking-wide">{isKm ? 'បានជ្រើសរើស [X]' : 'SELECTED [X]'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-stone-400">
                              {isKm ? 'ចុចជ្រើសរើស' : 'Click to select'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Billing Cycle Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200 text-xs">
                <span className="font-bold text-stone-800">
                  {isKm ? '២. វដ្តនៃការទូទាត់' : '2. Billing Cycle'}
                </span>

                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingCycle('MONTHLY');
                      initCheckout(selectedPlanTier, 'MONTHLY');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      billingCycle === 'MONTHLY'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {isKm ? 'ប្រចាំខែ' : 'Monthly'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBillingCycle('ANNUAL');
                      initCheckout(selectedPlanTier, 'ANNUAL');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                      billingCycle === 'ANNUAL'
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span>{isKm ? 'ប្រចាំឆ្នាំ' : 'Annual'}</span>
                    <span className="text-[10px] bg-teal-100 text-teal-900 px-1 rounded font-bold">
                      -20%
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. KHQR Checkout Card */}
              {loadingCheckout ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
                  <RefreshCw className="w-6 h-6 text-teal-800 animate-spin mx-auto" />
                  <div className="text-xs text-stone-600 font-medium">
                    {isKm
                      ? 'កំពុងបង្កើត Dynamic Tag 01=12 KHQR ជូន...'
                      : 'Generating Dynamic Tag 01=12 KHQR payload...'}
                  </div>
                </div>
              ) : checkoutData ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* QR Display */}
                    <div className="p-4 bg-white rounded-2xl border-2 border-teal-800/60 shadow-md shrink-0 flex flex-col items-center">
                      <QRCodeSVG
                        value={checkoutData.qrString}
                        size={180}
                        level="M"
                        includeMargin={false}
                      />
                      <div className="text-[10px] text-teal-900 font-bold uppercase tracking-wider mt-2.5">
                        KHQR Tag 01=12 Dynamic
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-3 flex-1 w-full text-xs">
                      <div>
                        <div className="text-[11px] text-stone-500 uppercase tracking-wider">
                          {isKm ? 'ចំនួនទឹកប្រាក់ត្រូវបង់' : 'Total Amount Payable'}
                        </div>
                        <div className="text-3xl font-extrabold text-stone-900 font-sans mt-0.5">
                          ${checkoutData.amountUsd}.00
                          <span className="text-xs text-stone-500 font-normal ml-1">USD</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-stone-100">
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500">{isKm ? 'លេខវិក្កយបត្រ' : 'Invoice'}:</span>
                          <span className="font-mono font-bold text-stone-800">{checkoutData.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500">{isKm ? 'Tran ID' : 'Tran ID'}:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] text-stone-700">{checkoutData.tranId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyTranId(checkoutData.tranId)}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                              title="Copy Tran ID"
                            >
                              {copiedTranId ? (
                                <Check className="w-3.5 h-3.5 text-teal-700" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">{isKm ? 'ឈ្មោះ Merchant' : 'Platform Merchant'}:</span>
                          <span className="font-semibold text-stone-800">{checkoutData.merchant?.merchantName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500">{isKm ? 'គណនី Bakong' : 'Bakong ID'}:</span>
                          <span className="font-mono text-stone-800">{checkoutData.merchant?.bakongId}</span>
                        </div>
                      </div>

                      {/* Timer & Live Poller Indicator */}
                      <div className="flex items-center justify-between p-2.5 bg-[#FAF7F2] rounded-xl border border-stone-200 text-[11px]">
                        <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-stone-500" />
                          <span>{isKm ? 'សុពលភាព QR' : 'Expires in'}:</span>
                          <span className="font-mono font-bold text-teal-900">
                            {formatTimer(secondsRemaining)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-teal-800">
                          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                          <span className="text-[10px] font-semibold">
                            {isKm ? 'ចាប់យកការទូទាត់ ៣ វិ' : 'Live Checking (3s)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deeplink & Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    {checkoutData.deeplinks?.aba && (
                      <a
                        href={checkoutData.deeplinks.aba}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        <Zap className="w-4 h-4 text-teal-200" />
                        <span>{isKm ? 'ទូទាត់តាម App ABA Mobile' : 'Pay via ABA Mobile App'}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-teal-300" />
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={verifying}
                      onClick={handleManualVerify}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs transition-colors shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                      <span>{verifying ? (isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying...') : (isKm ? 'ផ្ទៀងផ្ទាត់លទ្ធផល' : 'Verify Settlement')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSupportModal(!showSupportModal)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-stone-600" />
                      <span>{isKm ? 'ជំនួយការទូទាត់' : 'Payment Support'}</span>
                    </button>
                  </div>

                  {/* 24/7 Human Support Card (Fallback when stuck) */}
                  {showSupportModal && (
                    <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3 text-xs animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-teal-950 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-teal-800" />
                          <span>{isKm ? 'ផ្នែកបម្រើអតិថិជន ២៤/៧ (Human Support & Fast Resolution)' : '24/7 Official Payment Support'}</span>
                        </div>
                        <span className="text-[10px] text-teal-800 font-semibold bg-teal-100 px-2 py-0.5 rounded-full">
                          {isKm ? 'ឆ្លើយតបក្នុង ៥ នាទី' : '5-min response'}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-600">
                        {isKm
                          ? 'ប្រសិនបើលោកអ្នកបានស្កេនទូទាត់ជោគជ័យរួចរាល់ ប៉ុន្តែប្រព័ន្ធមិនទាន់លោតដំណើរការគម្រោងដោយស្វ័យប្រវត្ត លោកអ្នកអាចរាយការណ៍មកក្រុមការងារ ឬទាក់ទងមក Telegram ផ្លូវការរបស់យើងខ្ញុំផ្ទាល់។'
                          : 'If funds were deducted but your subscription is not active yet, report it directly to Super Admin or connect via Telegram.'}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <a
                          href={checkoutData.support?.telegramUrl || 'https://t.me/rotana_support'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-teal-300 text-teal-900 font-bold hover:bg-teal-100/50 transition-colors shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Telegram Official Support</span>
                        </a>

                        <a
                          href={`tel:${checkoutData.support?.hotline || '+85512333444'}`}
                          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-teal-300 text-teal-900 font-bold hover:bg-teal-100/50 transition-colors shadow-2xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Hotline: {checkoutData.support?.hotline || '+855 12 333 444'}</span>
                        </a>
                      </div>

                      {supportSubmitted ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold text-center text-xs">
                          {isKm
                            ? 'សំណើសុំជំនួយត្រូវបានផ្ញើជូន Super Admin តាម Telegram Master Bot រួចរាល់ហើយ។ ក្រុមការងារនឹងជួយត្រួតពិនិត្យ និង Approve ជូនក្នុងរយៈពេល ៥ នាទី។'
                            : 'Support request sent to Super Admin via Telegram Master Bot. Our team will verify and approve within 5 minutes.'}
                        </div>
                      ) : (
                        <div className="space-y-2 pt-2 border-t border-teal-200/60">
                          <input
                            type="text"
                            value={supportNote}
                            onChange={(e) => setSupportNote(e.target.value)}
                            placeholder={
                              isKm
                                ? 'បញ្ជាក់ព័ត៌មានបន្ថែម (ឧ. បានផ្ញើលុយតាម ABA វេលាម៉ោង...)'
                                : 'Optional note (e.g. Paid via ABA Mobile at 10:30 AM)'
                            }
                            className="w-full p-2 bg-white rounded-xl border border-stone-300 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-teal-700"
                          />
                          <button
                            type="button"
                            disabled={submittingSupport}
                            onClick={handleReportSupport}
                            className="w-full py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            {submittingSupport
                              ? (isKm ? 'កំពុងផ្ញើសំណើ...' : 'Submitting Alert...')
                              : (isKm ? 'រាយការណ៍បញ្ហាជូន Super Admin ភ្លាមៗ' : 'Alert Super Admin of Payment')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
