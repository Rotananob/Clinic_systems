'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { PublicFooter } from '../../components/landing/PublicFooter';
import { MerchantSetupModal } from '../../components/tenants/MerchantSetupModal';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  QrCode,
  Layers,
  Check,
  RefreshCw,
  KeyRound,
  ArrowLeft,
  Send,
} from 'lucide-react';

const PLAN_CARDS = [
  {
    id: 'FREE',
    nameKh: 'Free Starter',
    nameEn: 'Free Starter',
    price: '$0',
    khqrLimitKh: '៥ ប្រតិបត្តិការ / ថ្ងៃ',
    khqrLimitEn: '5 transactions / day',
    patientsKh: 'អ្នកជំងឺ ៥០ នាក់',
    patientsEn: '50 patients',
  },
  {
    id: 'STARTER_5',
    nameKh: 'Clinic Starter',
    nameEn: 'Clinic Starter',
    price: '$5/mo',
    khqrLimitKh: '២៥០ ប្រតិបត្តិការ / ថ្ងៃ',
    khqrLimitEn: '250 transactions / day',
    patientsKh: 'អ្នកជំងឺ ៥០០ នាក់',
    patientsEn: '500 patients',
  },
  {
    id: 'PRO_8',
    nameKh: 'Polyclinic Pro',
    nameEn: 'Polyclinic Pro',
    price: '$8/mo',
    khqrLimitKh: '១,៥០០ ប្រតិបត្តិការ / ថ្ងៃ',
    khqrLimitEn: '1,500 transactions / day',
    patientsKh: 'មិនកំណត់ចំនួនអ្នកជំងឺ',
    patientsEn: 'Unlimited patients',
    popular: true,
  },
  {
    id: 'ENTERPRISE_12',
    nameKh: 'Hospital Enterprise',
    nameEn: 'Hospital Enterprise',
    price: '$12/mo',
    khqrLimitKh: 'Unlimited KHQR',
    khqrLimitEn: 'Unlimited KHQR',
    patientsKh: 'មិនកំណត់ចំនួនអ្នកជំងឺ',
    patientsEn: 'Unlimited patients',
  },
];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const initialPlan = searchParams.get('plan') || 'FREE';
  const [selectedPlan, setSelectedPlan] = useState<string>(initialPlan);

  const [clinicNameKh, setClinicNameKh] = useState('');
  const [clinicNameEn, setClinicNameEn] = useState('');
  const [adminName, setAdminName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2-step verification code state
  const [step, setStep] = useState<'FORM' | 'VERIFY_CODE'>('FORM');
  const [verificationCode, setVerificationCode] = useState('');
  const [devCodePreview, setDevCodePreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<any>(null);
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);

  // Countdown timer for verification code
  useEffect(() => {
    if (step !== 'VERIFY_CODE' || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, countdown]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Compute live slug preview from clinicNameEn
  const liveSlug = clinicNameEn
    ? clinicNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'clinic'
    : 'your-clinic';

  // Step 1: Send 6-digit confirmation code to Gmail
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!clinicNameKh.trim() || !clinicNameEn.trim() || !email.trim() || !password || !phone.trim()) {
      setErrorMessage(
        isKm
          ? 'សូមបំពេញរាល់ព័ត៌មានចាំបាច់ទាំងអស់ជាមុនសិន។'
          : 'Please complete all required fields first.'
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

    setLoading(true);

    try {
      const res = await api.auth.sendVerificationCode(email.trim().toLowerCase());
      if (res.success) {
        setStep('VERIFY_CODE');
        setCountdown(600);
        setInfoMessage(res.message);
        if (res.devCode) {
          setDevCodePreview(res.devCode);
          setVerificationCode(res.devCode);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code and register clinic
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
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
        clinicNameKh: clinicNameKh.trim(),
        clinicNameEn: clinicNameEn.trim(),
        adminName: adminName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
        planTier: selectedPlan,
        verificationCode: verificationCode.trim(),
      });

      if (res.success && res.accessToken) {
        localStorage.setItem('clinic_access_token', res.accessToken);
        localStorage.setItem('clinic_user', JSON.stringify(res.user));
        setRegisteredData(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await api.auth.sendVerificationCode(email.trim().toLowerCase());
      if (res.success) {
        setCountdown(600);
        setInfoMessage(res.message);
        if (res.devCode) {
          setDevCodePreview(res.devCode);
          setVerificationCode(res.devCode);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans text-stone-900">
      <PublicNavbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header Title & Speed Badge */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-semibold shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              <span>{isKm ? 'ដំណើរការចុះឈ្មោះរហ័ស ៦០ វិនាទី' : '60-Second Instant Onboarding'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-sans tracking-tight">
              {isKm
                ? 'បង្កើត Workspace គ្លីនិករបស់លោកអ្នក'
                : 'Create Your Clinic Workspace'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
              {isKm
                ? 'ប្រព័ន្ធបង្កើត Isolated Workspace ជូនក្នុង ២ វិនាទី រួមជាមួយ Dynamic KHQR និងការគ្រប់គ្រងវេជ្ជសាស្ត្រស្តង់ដារ។'
                : 'Auto-provision your isolated clinic workspace within 2 seconds with native dynamic KHQR and HIPAA medical standards.'}
            </p>
          </div>

          {/* Success Screen After Auto-Provisioning */}
          {registeredData ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-stone-900 font-sans">
                  {isKm ? 'បង្កើត Workspace ជោគជ័យ!' : 'Workspace Created Successfully!'}
                </h2>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  {isKm
                    ? `គ្លីនិក ${registeredData.tenant?.clinicNameKh} ត្រូវបានបង្កើតរួចរាល់ ជាមួយ Subdomain ផ្លូវការ:`
                    : `Clinic workspace for ${registeredData.tenant?.clinicNameEn} is provisioned with official subdomain:`}
                </p>
                <div className="inline-block px-4 py-2 bg-stone-100 rounded-xl border border-stone-200 text-xs font-mono font-bold text-teal-800">
                  {registeredData.tenant?.slug}.clinicplatform.com
                </div>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-left space-y-2 max-w-lg mx-auto">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                  <QrCode className="w-4 h-4 text-teal-700" />
                  <span>
                    {isKm
                      ? 'ជំហានបន្ទាប់៖ រៀបចំ Merchant KHQR (Paste & Go)'
                      : 'Next Step: Setup Merchant KHQR (Paste & Go)'}
                  </span>
                </div>
                <p className="text-[11px] text-teal-950 leading-relaxed">
                  {isKm
                    ? 'គ្រាន់តែ Paste Bakong ID ឬ ABA Merchant Link របស់លោកអ្នក នោះ Dynamic KHQR នឹងដំណើរការភ្លាមៗ។'
                    : 'Paste your Bakong ID or ABA Merchant Link to immediately activate isolated dynamic KHQR generation.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMerchantModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isKm ? 'រៀបចំ Merchant ឥឡូវនេះ (Paste & Go)' : 'Configure Merchant Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 transition-colors"
                >
                  {isKm ? 'ចូលទៅកាន់ផ្ទាំងគ្រប់គ្រង' : 'Go to Clinic Dashboard'}
                </button>
              </div>
            </div>
          ) : step === 'VERIFY_CODE' ? (
            /* Step 2: 6-Digit Gmail Confirmation Code Screen */
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('FORM');
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isKm ? 'កែប្រែព័ត៌មាន (Back to Edit)' : 'Back to Edit Details'}</span>
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
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Dev/Fallback Preview Banner */}
              {devCodePreview && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-700" />
                    <span>{isKm ? 'លេខកូដបញ្ជាក់ (Local Preview):' : 'Local Testing Code Preview:'}</span>
                    <span className="font-mono text-sm bg-white px-2 py-0.5 rounded border border-amber-300 font-extrabold text-amber-900">
                      {devCodePreview}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    {isKm
                      ? 'លេខកូដត្រូវបានបំពេញស្វ័យប្រវត្តសម្រាប់សាកល្បង Local ឬសូមពិនិត្យមើល Gmail របស់អ្នក។'
                      : 'Auto-filled for rapid local evaluation, or check your Gmail inbox.'}
                  </p>
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

              <form onSubmit={handleVerifyAndRegister} className="space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="______"
                    className="w-full text-center text-3xl font-mono tracking-[0.5em] font-extrabold px-4 py-3 bg-[#FAF7F2] border-2 border-teal-700/60 rounded-2xl text-teal-950 focus:outline-hidden focus:ring-4 focus:ring-teal-700/20 transition-all placeholder:text-stone-300 shadow-inner"
                  />
                  <p className="text-[11px] text-center text-stone-500">
                    {isKm ? 'បញ្ចូលលេខ ៦ ខ្ទង់ដែលបានទទួលតាម Gmail' : 'Enter the 6-digit digits received via Gmail'}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || verificationCode.trim().length !== 6}
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isKm ? 'កំពុងផ្ទៀងផ្ទាត់ និងបង្កើតគ្លីនិក...' : 'Verifying and provisioning workspace...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isKm ? 'បញ្ជាក់លេខកូដ និងបង្កើតគ្លីនិក' : 'Verify Code & Create Clinic Workspace'}</span>
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
                      {isKm ? 'ផ្ញើលេខកូដឡើងវិញ (Resend)' : 'Resend Verification Code'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* Step 1: Registration Form Card */
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xl space-y-6">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-6">
                {/* 1. Plan Tier Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                    {isKm ? '១. ជ្រើសរើសគម្រោង (Select Plan Tier)' : '1. Select Plan Tier'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PLAN_CARDS.map((p) => {
                      const isSelected = selectedPlan === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlan(p.id)}
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? 'bg-teal-50 border-teal-700 ring-2 ring-teal-700/20 shadow-xs'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          {p.popular && (
                            <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white">
                              Popular
                            </span>
                          )}
                          <div className="font-bold text-xs text-stone-900 font-sans">
                            {isKm ? p.nameKh : p.nameEn}
                          </div>
                          <div className="text-sm font-extrabold text-teal-800 mt-0.5">
                            {p.price}
                          </div>
                          <div className="text-[10px] text-stone-500 mt-1">
                            {isKm ? p.khqrLimitKh : p.khqrLimitEn}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Clinic Details */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                    {isKm ? '២. ព័ត៌មានគ្លីនិក (Clinic Profile)' : '2. Clinic Profile'}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {isKm ? 'ឈ្មោះគ្លីនិកជាភាសាខ្មែរ *' : 'Clinic Name (Khmer) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={clinicNameKh}
                        onChange={(e) => setClinicNameKh(e.target.value)}
                        placeholder="ឧ. គ្លីនិក សុខភាពល្អ"
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {isKm ? 'ឈ្មោះគ្លីនិកជាភាសាអង់គ្លេស *' : 'Clinic Name (English) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={clinicNameEn}
                        onChange={(e) => setClinicNameEn(e.target.value)}
                        placeholder="e.g. Sokhapheap LOR Clinic"
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  {/* Subdomain Preview */}
                  <div className="p-2.5 bg-stone-100/70 rounded-xl border border-stone-200 text-xs flex items-center justify-between text-stone-600">
                    <span className="text-[11px] font-medium">
                      {isKm ? 'Subdomain ស្វ័យប្រវត្ត:' : 'Subdomain Preview:'}
                    </span>
                    <span className="font-mono font-bold text-teal-800 text-[11px]">
                      {liveSlug}.clinicplatform.com
                    </span>
                  </div>
                </div>

                {/* 3. Administrator Account */}
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                    {isKm ? '៣. គណនីអ្នកគ្រប់គ្រង (Admin Account)' : '3. Administrator Credentials'}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {isKm ? 'ឈ្មោះពេញអ្នកគ្រប់គ្រង' : 'Admin Full Name'}
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Dr. Sok Chea"
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {isKm ? 'លេខទូរស័ព្ទ *' : 'Contact Phone *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="012 345 678"
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {isKm ? 'អ៊ីមែល Gmail សម្រាប់ទទួលលេខកូដបញ្ជាក់ *' : 'Gmail Email for Verification Code *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        {isKm ? 'ពាក្យសម្ងាត់សុវត្ថិភាព *' : 'Secure Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#DCD5C8] rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition-all placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-stone-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>
                          {isKm
                            ? 'កំពុងផ្ញើលេខកូដ ៦ ខ្ទង់ទៅកាន់ Gmail...'
                            : 'Dispatching 6-digit confirmation code...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>
                          {isKm
                            ? 'ផ្ញើលេខកូដបញ្ជាក់ទៅកាន់ Gmail (Get Verification Code)'
                            : 'Send Verification Code to Gmail'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center text-xs text-stone-500">
                  {isKm ? 'មានគណនីគ្លីនិករួចហើយ?' : 'Already have a clinic account?'}{' '}
                  <Link href="/login" className="font-bold text-teal-800 hover:underline">
                    {isKm ? 'ចូលប្រើប្រាស់' : 'Sign In'}
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />

      {/* Modal for Merchant Setup */}
      {registeredData && (
        <MerchantSetupModal
          isOpen={isMerchantModalOpen}
          onClose={() => setIsMerchantModalOpen(false)}
          initialValues={{
            merchantName: registeredData.tenant?.clinicNameEn || '',
            merchantCity: 'Phnom Penh',
          }}
          onSuccess={() => {
            router.push('/');
          }}
        />
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-teal-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
