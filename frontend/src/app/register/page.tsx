'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { PublicFooter } from '../../components/landing/PublicFooter';
import { VerificationCodeInput } from '../../components/common/VerificationCodeInput';
import { AbaPayButton } from '../../components/payments/AbaPayButton';
import { playPaymentSuccessChime } from '../../lib/chime';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Check,
  RefreshCw,
  ArrowLeft,
  Send,
  User,
  Copy,
  ExternalLink,
  Zap,
} from 'lucide-react';

const PLAN_CARDS = [
  {
    id: 'FREE',
    nameKh: 'Free Forever',
    nameEn: 'Free Forever',
    price: '$0 ឥតគិតថ្លៃរហូត',
    priceYearly: '$0 ឥតគិតថ្លៃរហូត',
    priceYearlyEn: '$0 Free Forever',
    khqrLimitKh: '៥ ប្រតិបត្តិការ / ថ្ងៃ',
    khqrLimitEn: '5 transactions / day',
    patientsKh: 'អ្នកជំងឺ ៥០ នាក់ / គណនី',
    patientsEn: '50 patients / account',
  },
  {
    id: 'STARTER_5',
    nameKh: 'Clinic Starter',
    nameEn: 'Clinic Starter',
    price: '$5/mo',
    priceYearly: '$48/ឆ្នាំ ចុះ ២០%',
    priceYearlyEn: '$48/yr Save 20%',
    khqrLimitKh: '២៥០ ប្រតិបត្តិការ / ថ្ងៃ',
    khqrLimitEn: '250 transactions / day',
    patientsKh: 'អ្នកជំងឺ ១,០០០ នាក់ / គណនី',
    patientsEn: '1,000 patients / account',
  },
  {
    id: 'PRO_8',
    nameKh: 'Polyclinic Pro',
    nameEn: 'Polyclinic Pro',
    price: '$8/mo',
    priceYearly: '$76/ឆ្នាំ ចុះ ២០%',
    priceYearlyEn: '$76/yr Save 20%',
    khqrLimitKh: '១,៥០០ ប្រតិបត្តិការ / ថ្ងៃ',
    khqrLimitEn: '1,500 transactions / day',
    patientsKh: 'អ្នកជំងឺ ៨,០០០ នាក់ / គណនី',
    patientsEn: '8,000 patients / account',
    popular: true,
  },
  {
    id: 'ENTERPRISE_12',
    nameKh: 'Hospital Enterprise',
    nameEn: 'Hospital Enterprise',
    price: '$12/mo',
    priceYearly: '$115/ឆ្នាំ ចុះ ២០%',
    priceYearlyEn: '$115/yr Save 20%',
    khqrLimitKh: 'Unlimited KHQR',
    khqrLimitEn: 'Unlimited KHQR',
    patientsKh: 'មិនកំណត់ចំនួនអ្នកជំងឺ / គណនី',
    patientsEn: 'Unlimited patients / account',
  },
];

function normalizePlanTier(raw?: string | null): string {
  if (!raw) return 'FREE';
  const clean = raw.trim().toUpperCase();
  if (clean === 'STARTER' || clean === 'STARTER_5') return 'STARTER_5';
  if (clean === 'PRO' || clean === 'PRO_8') return 'PRO_8';
  if (clean === 'ENTERPRISE' || clean === 'ENTERPRISE_12') return 'ENTERPRISE_12';
  return 'FREE';
}

const REGISTRATION_SESSION_KEY = 'krupet_verification_session_v1';

function saveVerificationSession(data: {
  email: string;
  password: string;
  adminName: string;
  selectedPlan: string;
  expiresAt: number;
}) {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(data);
    sessionStorage.setItem(REGISTRATION_SESSION_KEY, raw);
    localStorage.setItem(REGISTRATION_SESSION_KEY, raw);
  } catch {}
}

function clearVerificationSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(REGISTRATION_SESSION_KEY);
    localStorage.removeItem(REGISTRATION_SESSION_KEY);
  } catch {}
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const initialPlan = normalizePlanTier(searchParams.get('plan'));
  const isYearly = searchParams.get('billing') === 'yearly';
  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan);

  useEffect(() => {
    const raw = searchParams.get('plan');
    if (raw) {
      setSelectedPlan(normalizePlanTier(raw));
    }
  }, [searchParams]);

  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Multi-step registration state: FORM -> VERIFY_CODE -> PAYMENT (if paid tier selected)
  const [step, setStep] = useState<'FORM' | 'VERIFY_CODE' | 'PAYMENT'>('FORM');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Payment Step State
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState<boolean>(false);
  const [paymentCountdown, setPaymentCountdown] = useState<number>(180); // Strictly 3 minutes (180s)
  const [verifyingSettlement, setVerifyingSettlement] = useState<boolean>(false);
  const [activatedSuccess, setActivatedSuccess] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [copiedTranId, setCopiedTranId] = useState<boolean>(false);

  // Redirect if already authenticated and not in payment step
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;
    if (token && step !== 'PAYMENT') {
      router.replace('/dashboard');
    }
  }, [router, step]);

  // Restore active verification session on page reload or app return
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw =
        sessionStorage.getItem(REGISTRATION_SESSION_KEY) ||
        localStorage.getItem(REGISTRATION_SESSION_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      const now = Date.now();
      if (data && data.expiresAt && data.expiresAt > now) {
        if (data.email) setEmail(data.email);
        if (data.password) setPassword(data.password);
        if (data.adminName) setAdminName(data.adminName);
        if (data.selectedPlan) setSelectedPlan(data.selectedPlan);
        setStep('VERIFY_CODE');
        const remaining = Math.max(1, Math.round((data.expiresAt - now) / 1000));
        setCountdown(remaining);
        setInfoMessage(
          isKm
            ? 'បានរក្សាផ្ទាំងផ្ទៀងផ្ទាត់លេខកូដ - មិនបាត់បង់ទិន្នន័យពេលប្តូរ Tab ឬ Reload ឡើយ'
            : 'Active verification session preserved across tabs and reloads'
        );
      } else {
        clearVerificationSession();
      }
    } catch {
      clearVerificationSession();
    }
  }, [isKm]);

  // Block accidental page reload or tab navigation while verification or payment is in progress
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step === 'VERIFY_CODE' || step === 'PAYMENT') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [step]);

  // Countdown timer for email verification code (10 mins)
  useEffect(() => {
    if (step !== 'VERIFY_CODE' || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, countdown]);

  // Strict 3-Minute Countdown timer for Payment QR code (180s)
  useEffect(() => {
    if (step !== 'PAYMENT' || paymentCountdown <= 0 || activatedSuccess) return;
    const interval = setInterval(() => {
      setPaymentCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, paymentCountdown, activatedSuccess]);

  // Auto-polling settlement verification (every 3 seconds)
  useEffect(() => {
    if (step !== 'PAYMENT' || !checkoutData?.tranId || paymentCountdown <= 0 || activatedSuccess) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.subscriptions.verifySettlement({
          subscriptionId: checkoutData.tranId,
          tranId: checkoutData.tranId,
          md5: checkoutData.md5,
        });

        if (res && res.success && (res.activated || res.alreadySettled)) {
          clearInterval(pollInterval);
          setActivatedSuccess(true);
          playPaymentSuccessChime().catch(() => {});

          // Update user in localStorage to reflect newly active paid tier
          try {
            const userRaw = localStorage.getItem('clinic_user');
            if (userRaw) {
              const u = JSON.parse(userRaw);
              if (u.tenant) {
                u.tenant.planTier = selectedPlan;
                u.tenant.subscriptionStatus = 'ACTIVE';
              }
              localStorage.setItem('clinic_user', JSON.stringify(u));
            }
          } catch {}

          // Auto-direct to dashboard after celebration
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', '/dashboard');
            }
            router.replace('/dashboard');
          }, 1800);
        }
      } catch {}
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [step, checkoutData, paymentCountdown, activatedSuccess, selectedPlan, router]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Send 6-digit confirmation code to Gmail
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage(
        isKm
          ? 'សូមបញ្ចូលអ៊ីមែល Gmail និងពាក្យសម្ងាត់របស់អ្នក។'
          : 'Please enter your email and password.'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        isKm
          ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ។'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const DUMMY_EMAILS = [
      'test.user@gmail.com',
      'test@gmail.com',
      'testing@gmail.com',
      'test1@gmail.com',
      'admin@gmail.com',
      'user@gmail.com',
      'dummy@gmail.com',
      'sample@gmail.com',
      'example@gmail.com',
      'asdf@gmail.com',
      'foo@bar.com',
    ];
    if (
      DUMMY_EMAILS.includes(cleanEmail) ||
      cleanEmail.endsWith('@example.com') ||
      cleanEmail.endsWith('@test.com')
    ) {
      setErrorMessage(
        isKm
          ? 'សូមបញ្ចូលអាសយដ្ឋាន Email ពិតប្រាកដរបស់អ្នកដែលមានដំណើរការធម្មតា។ មិនអនុញ្ញាតឱ្យប្រើប្រាស់ Email សាកល្បងដូចជា test.user@gmail.com ឡើយ។'
          : 'Please enter a genuine, active email address. Placeholder test emails like test.user@gmail.com are not accepted.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await api.auth.sendVerificationCode(cleanEmail);
      if (res?.success) {
        const expiresAt = Date.now() + 600 * 1000;
        saveVerificationSession({
          email: cleanEmail,
          password,
          adminName,
          selectedPlan,
          expiresAt,
        });
        setStep('VERIFY_CODE');
        setCountdown(600);
        setVerificationCode('');
        setInfoMessage(res.message);
      } else {
        setErrorMessage(
          res?.message || (isKm ? 'មិនអាចផ្ញើលេខកូដបានទេ។ សូមព្យាយាមម្ដងទៀត។' : 'Failed to send code.')
        );
      }
    } catch (err: any) {
      console.error('sendVerificationCode error:', err);
      setErrorMessage(
        err?.message ||
          (isKm
            ? 'មិនអាចផ្ញើលេខកូដទៅកាន់ Gmail បានទេ។ សូមពិនិត្យមើលអាសយដ្ឋាន Gmail របស់អ្នកឡើងវិញ ឬព្យាយាមម្តងទៀត។'
            : 'Failed to dispatch verification code. Please check your Gmail address.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Initialize Payment Checkout Session
  const initPaymentCheckout = async (plan: string, cycle: 'MONTHLY' | 'ANNUAL') => {
    try {
      setLoadingPayment(true);
      setPaymentError(null);
      setActivatedSuccess(false);
      const res = await api.subscriptions.createCheckout({
        planTier: plan as any,
        billingCycle: cycle,
      });
      if (res && res.success) {
        setCheckoutData(res);
        setPaymentCountdown(180); // Strictly 3 minutes
      } else {
        setPaymentError(
          isKm
            ? 'មិនអាចបង្កើត QR Code សម្រាប់បង់ប្រាក់បានទេ។ សូមចុចបង្កើតឡើងវិញ។'
            : 'Failed to generate payment QR code. Please try again.'
        );
      }
    } catch (err: any) {
      setPaymentError(
        err.message ||
          (isKm
            ? 'មានបញ្ហាក្នុងការបង្កើត KHQR សូមចុចបង្កើតឡើងវិញ។'
            : 'Error generating KHQR checkout session.')
      );
    } finally {
      setLoadingPayment(false);
    }
  };

  // Step 2: Verify code and register account
  const handleVerifyAndRegister = async (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const targetCode = (directCode || verificationCode).trim();
    if (!targetCode || targetCode.length !== 6) {
      setErrorMessage(
        isKm
          ? 'សូមបញ្ចូលលេខកូដបញ្ជាក់ ៦ ខ្ទង់ឱ្យបានត្រឹមត្រូវ។'
          : 'Please enter a valid 6-digit confirmation code.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await api.auth.registerWithCode({
        email: email.trim().toLowerCase(),
        password,
        adminName: adminName.trim() || undefined,
        planTier: selectedPlan,
        verificationCode: targetCode,
      });

      if (res.success && res.accessToken) {
        clearVerificationSession();
        const fullUser = {
          ...res.user,
          tenant: res.tenant,
          targetRoute: (res as any).targetRoute || '/dashboard',
        };
        localStorage.setItem('clinic_access_token', res.accessToken);
        localStorage.setItem('clinic_user', JSON.stringify(fullUser));

        // SECURITY CHECK: If user selected a paid tier, transition to PAYMENT step!
        if (selectedPlan && selectedPlan !== 'FREE') {
          setStep('PAYMENT');
          initPaymentCheckout(selectedPlan, isYearly ? 'ANNUAL' : 'MONTHLY');
        } else {
          // Free tier: proceed directly to dashboard
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/dashboard');
          }
          router.replace('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Manual verify settlement trigger
  const handleManualVerifyPayment = async () => {
    if (!checkoutData?.tranId || verifyingSettlement) return;
    setVerifyingSettlement(true);
    setPaymentError(null);
    try {
      const res = await api.subscriptions.verifySettlement({
        subscriptionId: checkoutData.tranId,
        tranId: checkoutData.tranId,
        md5: checkoutData.md5,
      });

      if (res && res.success && (res.activated || res.alreadySettled)) {
        setActivatedSuccess(true);
        playPaymentSuccessChime().catch(() => {});

        try {
          const userRaw = localStorage.getItem('clinic_user');
          if (userRaw) {
            const u = JSON.parse(userRaw);
            if (u.tenant) {
              u.tenant.planTier = selectedPlan;
              u.tenant.subscriptionStatus = 'ACTIVE';
            }
            localStorage.setItem('clinic_user', JSON.stringify(u));
          }
        } catch {}

        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', '/dashboard');
          }
          router.replace('/dashboard');
        }, 1800);
      } else {
        setPaymentError(
          isKm
            ? 'មិនទាន់រកឃើញប្រតិបត្តិការបង់ប្រាក់នៅឡើយទេ។ សូមស្កេនទូទាត់តាម App ធនាគារជាមុនសិន។'
            : 'Payment transaction not verified yet. Please scan and pay via your banking app.'
        );
      }
    } catch (err: any) {
      setPaymentError(err.message || (isKm ? 'ការផ្ទៀងផ្ទាត់មិនទាន់បានជោគជ័យ' : 'Verification failed'));
    } finally {
      setVerifyingSettlement(false);
    }
  };

  // Continue with Free plan if user skips or doesn't pay
  const handleContinueWithFree = () => {
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/dashboard');
    }
    router.replace('/dashboard');
  };

  const handleCopyTranId = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedTranId(true);
      setTimeout(() => setCopiedTranId(false), 2000);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await api.auth.sendVerificationCode(email.trim().toLowerCase());
      if (res?.success) {
        const expiresAt = Date.now() + 600 * 1000;
        saveVerificationSession({
          email: email.trim().toLowerCase(),
          password,
          adminName,
          selectedPlan,
          expiresAt,
        });
        setCountdown(600);
        setVerificationCode('');
        setInfoMessage(res.message);
      } else {
        setErrorMessage(res?.message || (isKm ? 'មិនអាចផ្ញើលេខកូដបានទេ។ សូមព្យាយាមម្ដងទៀត។' : 'Failed to resend code.'));
      }
    } catch (err: any) {
      console.error('resendVerificationCode error:', err);
      setErrorMessage(
        err.message ||
          (isKm
            ? 'មិនអាចផ្ញើលេខកូដទៅកាន់ Gmail បានទេ។ សូមពិនិត្យមើលអាសយដ្ឋាន Gmail របស់អ្នកឡើងវិញ។'
            : 'Failed to resend code. Please check your Gmail address.')
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanInfo = PLAN_CARDS.find((p) => p.id === selectedPlan) || PLAN_CARDS[0];

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans text-stone-900 overscroll-y-contain">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Title & Speed Badge */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-semibold shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>{isKm ? 'ចុះឈ្មោះរហ័សត្រឹម ១៥ វិនាទី' : '15-Second Instant Signup'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans tracking-tight">
              {isKm
                ? 'បង្កើតគណនី KruPet របស់លោកអ្នក'
                : 'Create Your KruPet Account'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
              {isKm
                ? 'ចុះឈ្មោះភ្លាមៗតាម Gmail។ លោកអ្នកអាចកំណត់ឈ្មោះគ្លីនិក និងដាក់ ABA Merchant Link ពេល Login លើកដំបូង។'
                : 'Sign up instantly with Gmail. You can configure your clinic identity and free ABA Merchant Link upon first login.'}
            </p>
          </div>

          {step === 'PAYMENT' ? (
            /* Step 3: Mandatory Real Payment for Paid Subscription */
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xl space-y-6 card-3d animate-spring-pop">
              {activatedSuccess ? (
                /* Celebration Success Screen */
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-800 text-white flex items-center justify-center mx-auto shadow-md animate-bounce">
                    <CheckCircle2 className="w-9 h-9 text-teal-100" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-stone-900 font-sans">
                      {isKm ? 'ដំណើរការគម្រោងជាវជោគជ័យ' : 'Subscription Activated Successfully'}
                    </h2>
                    <p className="text-xs text-stone-600 max-w-md mx-auto">
                      {isKm
                        ? 'ការទូទាត់ត្រូវបានផ្ទៀងផ្ទាត់ជាមួយធនាគារ ABA រួចរាល់។ ប្រព័ន្ធបាន Upgrade គម្រោងរបស់អ្នកភ្លាមៗ។'
                        : 'Settlement verified with ABA PayWay. Workspace quotas upgraded immediately.'}
                    </p>
                  </div>

                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl max-w-sm mx-auto text-xs space-y-2 text-left">
                    <div className="flex justify-between py-1 border-b border-teal-200/60">
                      <span className="text-stone-500">{isKm ? 'គម្រោងថ្មី' : 'Active Plan'}:</span>
                      <span className="font-bold text-teal-950 font-sans">{selectedPlanInfo[isKm ? 'nameKh' : 'nameEn']}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-teal-200/60">
                      <span className="text-stone-500">{isKm ? 'ស្ថានភាព' : 'Status'}:</span>
                      <span className="font-bold text-emerald-700">Active</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">{isKm ? 'ទិសដៅ' : 'Redirecting'}:</span>
                      <span className="font-mono text-teal-900 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin text-teal-700" />
                        <span>/dashboard</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Payment Screen */
                <div className="space-y-6">
                  {/* Step Header */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-800 text-white shadow-2xs">
                        {isKm ? 'ជំហានទី ៣' : 'Step 3'}
                      </span>
                      <h2 className="text-sm font-bold text-stone-900">
                        {isKm ? 'បង់ប្រាក់ដើម្បីដំណើរការគម្រោង' : 'Complete Payment to Activate Plan'}
                      </h2>
                    </div>

                    <span className="text-xs font-bold text-teal-900 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      {selectedPlanInfo[isKm ? 'nameKh' : 'nameEn']}
                    </span>
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {loadingPayment ? (
                    <div className="py-12 text-center space-y-2">
                      <RefreshCw className="w-7 h-7 text-teal-800 animate-spin mx-auto" />
                      <p className="text-xs text-stone-600 font-medium">
                        {isKm ? 'កំពុងបង្កើត Dynamic KHQR ចាក់សោទឹកប្រាក់ជូន...' : 'Generating dynamic KHQR session...'}
                      </p>
                    </div>
                  ) : checkoutData ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 sm:p-5 bg-stone-50/80 rounded-2xl border border-stone-200">
                        {/* QR Code Display */}
                        <div className="p-4 bg-white rounded-2xl border-2 border-[#055E7C] shadow-md shrink-0 flex flex-col items-center">
                          <QRCodeSVG
                            value={checkoutData.qrString}
                            size={180}
                            level="M"
                            includeMargin={false}
                          />
                          <div className="text-[10px] text-[#055E7C] font-bold uppercase tracking-wider mt-2.5 flex items-center gap-1">
                            <img src="/images/aba-pay.svg" alt="ABA" className="h-3 w-auto" />
                            <span>KHQR Dynamic Locked</span>
                          </div>
                        </div>

                        {/* Transaction & Billing Info */}
                        <div className="space-y-3 flex-1 w-full text-xs">
                          <div>
                            <div className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                              {isKm ? 'ចំនួនទឹកប្រាក់ត្រូវបង់' : 'Total Amount Payable'}
                            </div>
                            <div className="text-3xl font-extrabold text-stone-900 font-sans mt-0.5">
                              ${checkoutData.amountUsd}.00
                              <span className="text-xs text-stone-500 font-normal ml-1">USD</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-stone-200/80">
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500">{isKm ? 'គម្រោងជ្រើសរើស' : 'Selected Tier'}:</span>
                              <span className="font-bold text-stone-900 font-sans">
                                {selectedPlanInfo[isKm ? 'nameKh' : 'nameEn']}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500">{isKm ? 'វដ្តនៃការបង់' : 'Billing Cycle'}:</span>
                              <span className="font-semibold text-stone-800">
                                {isYearly ? (isKm ? 'ប្រចាំឆ្នាំ - ចុះ ២០%' : 'Annual - 20% Discount') : (isKm ? 'ប្រចាំខែ' : 'Monthly')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500">{isKm ? 'លេខកូដ Tran ID' : 'Tran ID'}:</span>
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
                          </div>

                          {/* Strict 3-Minute Timer Banner */}
                          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 text-[11px] shadow-2xs">
                            <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                              <Clock className="w-3.5 h-3.5 text-stone-500" />
                              <span>{isKm ? 'សុពលភាព QR' : 'Expires in'}:</span>
                              <span className={`font-mono font-bold ${paymentCountdown <= 30 ? 'text-rose-600' : 'text-[#055E7C]'}`}>
                                {formatCountdown(paymentCountdown)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[#055E7C]">
                              <span className="w-2 h-2 rounded-full bg-[#055E7C] animate-pulse"></span>
                              <span className="text-[10px] font-semibold">
                                {isKm ? 'ឆែកស្វ័យប្រវត្ត ៣ វិ' : 'Live Checking 3s'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expiry Warning & Action Buttons */}
                      {paymentCountdown <= 0 ? (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
                          <p className="text-xs text-rose-800 font-semibold">
                            {isKm
                              ? 'កូដ QR នេះបានផុតកំណត់ ៣ នាទីហើយ។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើត QR ថ្មី។'
                              : 'This payment QR session has expired after 3 minutes. Please regenerate a new code.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => initPaymentCheckout(selectedPlan, isYearly ? 'ANNUAL' : 'MONTHLY')}
                            className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                          >
                            {isKm ? 'បង្កើត QR ថ្មី' : 'Regenerate QR Code'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Real ABA Mobile Deeplink Button */}
                          {checkoutData.deeplinks?.aba && (
                            <AbaPayButton
                              href={checkoutData.deeplinks.aba}
                              isKm={isKm}
                              labelKh="ទូទាត់តាម App ABA Mobile"
                              labelEn="Pay via ABA Mobile App"
                              sublabelKh="ABA Pay - បង់ប្រាក់រួច Upgrade ស្វ័យប្រវត្ត"
                              sublabelEn="Instant Auto-Upgrade Settlement"
                              className="w-full"
                            />
                          )}

                          {/* Manual Verify Button */}
                          <button
                            type="button"
                            disabled={verifyingSettlement}
                            onClick={handleManualVerifyPayment}
                            className="w-full py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${verifyingSettlement ? 'animate-spin' : ''}`} />
                            <span>
                              {verifyingSettlement
                                ? (isKm ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying settlement...')
                                : (isKm ? 'ផ្ទៀងផ្ទាត់លទ្ធផល' : 'Verify Settlement')}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Safe Option: Continue with Free Plan */}
                      <div className="pt-2 border-t border-stone-100 text-center">
                        <button
                          type="button"
                          onClick={handleContinueWithFree}
                          className="text-xs text-stone-500 hover:text-stone-800 hover:underline transition-colors font-medium cursor-pointer"
                        >
                          {isKm
                            ? 'បន្តជាមួយគម្រោង Free បណ្ដោះអាសន្ន - អាច Upgrade ពេលក្រោយក្នុង Settings'
                            : 'Continue with Free Plan - Upgrade anytime later in Settings'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : step === 'VERIFY_CODE' ? (
            /* Step 2: 6-Digit Gmail Confirmation Code Screen */
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xl space-y-6 card-3d animate-spring-pop">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    clearVerificationSession();
                    setStep('FORM');
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isKm ? 'ត្រឡប់ក្រោយ' : 'Back to Edit Details'}</span>
                </button>
                <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                  {isKm ? 'សុពលភាព:' : 'Expires in:'} {formatCountdown(countdown)}
                </span>
              </div>

              {infoMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3 animate-shake">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{errorMessage}</span>
                  </div>
                  {(errorMessage.includes('Login') || errorMessage.includes('exists') || errorMessage.includes('ចុះឈ្មោះរួចរាល់')) && (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      <span>{isKm ? 'ចូលប្រើប្រាស់ - Sign In' : 'Sign In'}</span>
                    </Link>
                  )}
                </div>
              )}

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-stone-900">
                  {isKm ? 'បញ្ចូលលេខកូដបញ្ជាក់ ៦ ខ្ទង់' : 'Enter 6-Digit Confirmation Code'}
                </h2>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  {isKm
                    ? `ប្រព័ន្ធបានផ្ញើលេខកូដបញ្ជាក់ទៅកាន់:`
                    : 'A verification code was dispatched to:'}{' '}
                  <span className="font-bold text-teal-900 font-mono">{email}</span>
                </p>
              </div>

              <form onSubmit={(e) => handleVerifyAndRegister(e)} className="space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <VerificationCodeInput
                    value={verificationCode}
                    onChange={(val) => setVerificationCode(val)}
                    onComplete={(code) => handleVerifyAndRegister(undefined, code)}
                    disabled={loading}
                    isKm={isKm}
                    autoFocus
                  />
                  <p className="text-[11px] text-center text-stone-500 pt-1">
                    {isKm ? 'លេខកូដសម្ងាត់ ៦ ខ្ទង់ដែលបានផ្ញើទៅ Gmail' : '6-digit security code dispatched to Gmail'}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || verificationCode.trim().length !== 6}
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer interactive-tap"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isKm ? 'កំពុងផ្ទៀងផ្ទាត់ និងបង្កើតគណនី...' : 'Verifying and creating account...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>
                          {selectedPlan !== 'FREE'
                            ? (isKm ? 'បញ្ជាក់លេខកូដ & ទៅកាន់ការបង់ប្រាក់' : 'Verify Code & Proceed to Payment')
                            : (isKm ? 'បញ្ជាក់លេខកូដ & ចូលប្រើប្រាស់' : 'Verify Code & Launch Dashboard')}
                        </span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-stone-500">
                      {isKm ? 'មិនបានទទួលលេខកូដ?' : "Didn't receive code?"}
                    </span>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading}
                      className="font-bold text-teal-800 hover:underline disabled:opacity-50"
                    >
                      {isKm ? 'ផ្ញើលេខកូដឡើងវិញ' : 'Resend Code'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* Step 1: Ultra-Fast Registration Form Card */
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xl space-y-6 card-3d animate-spring-pop">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3 animate-shake">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{errorMessage}</span>
                  </div>
                  {(errorMessage.includes('Login') || errorMessage.includes('exists') || errorMessage.includes('ចុះឈ្មោះរួចរាល់')) && (
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      <span>{isKm ? 'ចូលប្រើប្រាស់ - Sign In' : 'Sign In'}</span>
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-6">
                {/* 1. Plan Tier Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                        {isKm ? '១. ជ្រើសរើសគម្រោង' : '1. Select Plan Tier'}
                      </label>
                      {isYearly && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          {isKm ? 'វដ្តបង់ប្រចាំឆ្នាំ ចុះ ២០%' : 'Yearly Plan 20% OFF'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-teal-900 bg-teal-100/90 px-2.5 py-0.5 rounded-md border border-teal-300">
                      {isKm ? 'គម្រោងដែលបានជ្រើស៖ ' : 'Selected: '}
                      <strong className="font-black text-teal-950 font-sans">
                        {selectedPlanInfo[isKm ? 'nameKh' : 'nameEn']}
                      </strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PLAN_CARDS.map((p) => {
                      const isSelected = selectedPlan === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlan(p.id)}
                          className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer select-none interactive-tap ${
                            isSelected
                              ? 'bg-teal-50/90 border-2 border-teal-800 ring-2 ring-teal-700/20 shadow-md animate-spring-pop'
                              : 'bg-white border-stone-200 hover:border-stone-400 hover:bg-stone-50/80 shadow-2xs hover:-translate-y-0.5'
                          }`}
                        >
                          {isSelected ? (
                            <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-teal-800 text-white shadow-xs flex items-center gap-0.5 animate-badge-bounce">
                              <Check className="w-2.5 h-2.5 text-white" />
                              <span>{isKm ? 'បានជ្រើស' : 'ACTIVE'}</span>
                            </span>
                          ) : p.popular ? (
                            <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white shadow-2xs">
                              Popular
                            </span>
                          ) : null}

                          <div className={`text-xs font-sans ${isSelected ? 'font-black text-teal-950' : 'font-bold text-stone-900'}`}>
                            {isKm ? p.nameKh : p.nameEn}
                          </div>
                          <div className={`text-sm sm:text-base font-sans mt-0.5 ${isSelected ? 'font-black text-teal-900' : 'font-extrabold text-stone-800'}`}>
                            {isYearly ? (isKm ? p.priceYearly : p.priceYearlyEn) : p.price}
                          </div>
                          <div className={`text-[10px] mt-1 ${isSelected ? 'font-bold text-teal-900/80' : 'text-stone-500'}`}>
                            {isKm ? p.khqrLimitKh : p.khqrLimitEn}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Admin Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    {isKm ? '២. ឈ្មោះអ្នកគ្រប់គ្រងគ្លីនិក - អាចបំពេញពេលក្រោយ' : '2. Administrator Name (Optional)'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder={isKm ? 'ឧទាហរណ៍៖ វេជ្ជបណ្ឌិត សុខ សាន' : 'Dr. Sok San'}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#DDD5C5] rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition"
                    />
                  </div>
                </div>

                {/* 3. Gmail Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    {isKm ? '៣. អាសយដ្ឋាន Gmail ផ្លូវការ' : '3. Official Gmail Address'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="clinic.owner@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#DDD5C5] rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {isKm
                      ? 'ប្រព័ន្ធនឹងផ្ញើលេខកូដសម្ងាត់ ៦ ខ្ទង់ទៅកាន់ Gmail នេះដើម្បីផ្ទៀងផ្ទាត់'
                      : 'We will dispatch a 6-digit confirmation code to this Gmail address'}
                  </p>
                </div>

                {/* 4. Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    {isKm ? '៤. ពាក្យសម្ងាត់' : '4. Secure Password'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#DDD5C5] rounded-xl text-xs sm:text-sm font-mono text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {isKm ? 'យ៉ាងតិច ៦ តួអក្សរ' : 'Minimum 6 characters'}
                  </p>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-teal-800 hover:bg-teal-900 disabled:bg-stone-300 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer interactive-tap"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isKm ? 'កំពុងផ្ញើលេខកូដបញ្ជាក់...' : 'Dispatching confirmation code...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isKm ? 'ចុះឈ្មោះ និងទទួលលេខកូដបញ្ជាក់' : 'Sign Up & Get 6-Digit Code'}</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-stone-500">
                    {isKm ? 'មានគណនីរួចហើយ?' : 'Already have an account?'}{' '}
                    <Link href="/login" className="font-bold text-teal-800 hover:underline">
                      {isKm ? 'ចូលប្រើប្រាស់ទីនេះ' : 'Sign In here'}
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-xs text-stone-500">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
