'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../../components/common/ClinicLogo';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { VerificationCodeInput } from '../../components/common/VerificationCodeInput';
import { getHumanErrorMessage } from '../../lib/errorHandler';
import { getClinicTargetRoute } from '../../lib/rbac';
import { api } from '../../lib/api';
import {
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  ArrowLeft,
  Home,
  CreditCard,
  KeyRound,
} from 'lucide-react';

const FORGOT_PASSWORD_SESSION_KEY = 'krupet_forgot_password_session_v1';

function saveForgotPasswordSession(data: {
  resetEmail: string;
  expiresAt: number;
}) {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(data);
    sessionStorage.setItem(FORGOT_PASSWORD_SESSION_KEY, raw);
    localStorage.setItem(FORGOT_PASSWORD_SESSION_KEY, raw);
  } catch {}
}

function clearForgotPasswordSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(FORGOT_PASSWORD_SESSION_KEY);
    localStorage.removeItem(FORGOT_PASSWORD_SESSION_KEY);
  } catch {}
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user, token } = useAuth();
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';

  // Strict browser history trap: prevents back button from navigating into previous protected session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  // If already logged in, redirect straight to specialized clinic target
  useEffect(() => {
    if (user && token) {
      router.replace(getClinicTargetRoute(user));
    }
  }, [user, token, router]);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Anti-Brute-Force Lockout Defense
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Forgot password flow state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'EMAIL' | 'CODE_AND_NEW_PASSWORD' | 'SUCCESS'>('EMAIL');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Restore forgot-password verification state on reload or app return
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw =
        sessionStorage.getItem(FORGOT_PASSWORD_SESSION_KEY) ||
        localStorage.getItem(FORGOT_PASSWORD_SESSION_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      const now = Date.now();
      if (data && data.expiresAt && data.expiresAt > now && data.resetEmail) {
        setResetEmail(data.resetEmail);
        setIsForgotPassword(true);
        setResetStep('CODE_AND_NEW_PASSWORD');
        setResetSuccessMessage(
          isKm
            ? 'បានរក្សាផ្ទាំងផ្ទៀងផ្ទាត់លេខកូដកែប្រែពាក្យសម្ងាត់ - មិនបាត់បង់ទិន្នន័យពេលប្តូរ Tab ឡើយ'
            : 'Password reset verification session preserved across tabs'
        );
      } else {
        clearForgotPasswordSession();
      }
    } catch {
      clearForgotPasswordSession();
    }
  }, [isKm]);

  // Block accidental reload or leaving during password reset verification
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isForgotPassword && resetStep === 'CODE_AND_NEW_PASSWORD') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isForgotPassword, resetStep]);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const loggedInUser = await login(email.trim(), password);
      setFailedAttempts(0);
      const targetDestination = getClinicTargetRoute(loggedInUser);
      if (typeof window !== 'undefined') { window.history.replaceState(null, '', targetDestination); }
      router.replace(targetDestination);
    } catch (err: unknown) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (nextFailures >= 5) {
        setLockoutSeconds(60);
        setError(
          isKm
            ? 'បញ្ចូលពាក្យសម្ងាត់ខុស ៥ ដង។ ប្រព័ន្ធត្រូវបានចាក់សោសុវត្ថិភាព ៦០ វិនាទី'
            : '5 consecutive failed attempts. Authentication locked for 60 seconds.',
        );
      } else {
        const friendlyMsg = getHumanErrorMessage(err, locale);
        setError(friendlyMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password: Step 1 - Send 6-digit reset code
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccessMessage(null);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setResetError(
        isKm ? 'សូមបញ្ចូលអាសយដ្ឋាន Email របស់អ្នក' : 'Please enter your email address'
      );
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.auth.forgotPassword(cleanEmail);
      if (res?.success) {
        const expiresAt = Date.now() + 600 * 1000;
        saveForgotPasswordSession({
          resetEmail: cleanEmail,
          expiresAt,
        });
        setResetCode('');
        setResetSuccessMessage(res.message);
        setResetStep('CODE_AND_NEW_PASSWORD');
      } else {
        setResetError(res?.message || (isKm ? 'មិនអាចផ្ញើលេខកូដបានទេ' : 'Failed to send reset code'));
      }
    } catch (err: any) {
      setResetError(
        err.message ||
          (isKm ? 'មិនមានគណនីដែលបានចុះឈ្មោះជាមួយ Email នេះទេ' : 'No account found with this email')
      );
    } finally {
      setResetLoading(false);
    }
  };

  // Forgot password: Step 2 - Verify code and save new password
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setResetError(
        isKm
          ? 'សូមបញ្ចូលលេខកូដបញ្ជាក់ ៦ ខ្ទង់ឱ្យបានត្រឹមត្រូវ'
          : 'Please enter a valid 6-digit confirmation code'
      );
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetError(
        isKm
          ? 'ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ'
          : 'New password must be at least 6 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError(
        isKm
          ? 'ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ'
          : 'Passwords do not match'
      );
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.auth.resetPasswordWithCode({
        email: resetEmail.trim().toLowerCase(),
        resetCode: resetCode.trim(),
        newPassword,
      });

      if (res?.success) {
        clearForgotPasswordSession();
        setResetStep('SUCCESS');
        setEmail(resetEmail.trim().toLowerCase());
        setPassword(newPassword);
      } else {
        setResetError(res?.message || (isKm ? 'ការផ្លាស់ប្តូរពាក្យសម្ងាត់មិនជោគជ័យ' : 'Failed to reset password'));
      }
    } catch (err: any) {
      setResetError(err.message || (isKm ? 'លេខកូដបញ្ជាក់មិនត្រឹមត្រូវ ឬផុតកំណត់' : 'Invalid or expired code'));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overscroll-y-contain">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] p-6 sm:p-8 shadow-xl relative overflow-hidden animate-in fade-in duration-200">
        {/* Language Switcher at Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>

        {/* Brand Clinic Logo & Header */}
        <div className="mb-6 pt-2">
          <ClinicLogo variant="full" size="lg" showSubtitle={true} />
        </div>

        {/* VIEW 1: FORGOT PASSWORD FLOW */}
        {isForgotPassword ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                clearForgotPasswordSession();
                setIsForgotPassword(false);
                setResetError(null);
                setResetSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isKm ? 'ត្រឡប់ទៅការចូលប្រើប្រាស់' : 'Back to sign in'}</span>
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 font-sans flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-800" />
                <span>{isKm ? 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ' : 'Reset Account Password'}</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {resetStep === 'EMAIL' &&
                  (isKm
                    ? 'បញ្ចូល Email របស់អ្នកដើម្បីទទួលបានលេខកូដបញ្ជាក់ ៦ ខ្ទង់'
                    : 'Enter your registered email to receive a 6-digit confirmation code')}
                {resetStep === 'CODE_AND_NEW_PASSWORD' &&
                  (isKm
                    ? `លេខកូដត្រូវបានផ្ញើទៅកាន់ ${resetEmail}`
                    : `Confirmation code sent to ${resetEmail}`)}
                {resetStep === 'SUCCESS' &&
                  (isKm
                    ? 'ពាក្យសម្ងាត់របស់អ្នកត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ'
                    : 'Your password has been reset successfully')}
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="leading-relaxed">{resetError}</span>
              </div>
            )}

            {resetSuccessMessage && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="leading-relaxed">{resetSuccessMessage}</span>
              </div>
            )}

            {/* Sub-step 1: Request Email */}
            {resetStep === 'EMAIL' && (
              <form onSubmit={handleRequestResetCode} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {t.auth.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="staff@rotanaclinic.com.kh"
                      disabled={resetLoading}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all font-sans text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || !resetEmail.trim()}
                  className="w-full py-2.5 sm:py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKm ? 'កំពុងផ្ញើ...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <span>{isKm ? 'ផ្ញើលេខកូដបញ្ជាក់' : 'Send Reset Code'}</span>
                  )}
                </button>
              </form>
            )}

            {/* Sub-step 2: Enter Code & New Password */}
            {resetStep === 'CODE_AND_NEW_PASSWORD' && (
              <form onSubmit={handleConfirmResetPassword} className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    {isKm ? 'លេខកូដបញ្ជាក់ ៦ ខ្ទង់' : '6-digit Confirmation Code'}
                  </label>
                  <VerificationCodeInput
                    value={resetCode}
                    onChange={(val) => setResetCode(val)}
                    disabled={resetLoading}
                    isKm={isKm}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {isKm ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      disabled={resetLoading}
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all font-mono text-stone-900 placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    {isKm ? 'ផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      disabled={resetLoading}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all font-mono text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || resetCode.length !== 6 || newPassword.length < 6}
                  className="w-full py-2.5 sm:py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isKm ? 'កំពុងផ្លាស់ប្តូរ...' : 'Updating...'}</span>
                    </>
                  ) : (
                    <span>{isKm ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Confirm & Reset Password'}</span>
                  )}
                </button>
              </form>
            )}

            {/* Sub-step 3: Success Screen */}
            {resetStep === 'SUCCESS' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isKm
                    ? 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។ លោកអ្នកអាចចូលប្រើប្រាស់គណនីបានឥឡូវនេះ។'
                    : 'Your password has been changed successfully. You can now sign in.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearForgotPasswordSession();
                    setIsForgotPassword(false);
                    setResetStep('EMAIL');
                    setResetError(null);
                    setResetSuccessMessage(null);
                  }}
                  className="w-full py-2.5 sm:py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isKm ? 'ចូលប្រើប្រាស់ឥឡូវនេះ' : 'Sign In Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 2: CLEAN MINIMALIST LOGIN FORM */
          <>
            {error && (
              <div className="p-3 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {lockoutSeconds > 0 && (
              <div className="p-3 mb-5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
                <span>
                  {isKm
                    ? `សូមរង់ចាំ ${lockoutSeconds} វិនាទី មុននឹងព្យាយាមម្តងទៀត`
                    : `Please wait ${lockoutSeconds} seconds before next attempt.`}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  {t.auth.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@rotanaclinic.com.kh"
                    disabled={isLoading || lockoutSeconds > 0}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all font-sans text-stone-900 placeholder:text-stone-400 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t.auth.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email.trim());
                      setIsForgotPassword(true);
                      setResetStep('EMAIL');
                      setResetError(null);
                      setResetSuccessMessage(null);
                    }}
                    className="text-xs font-semibold text-teal-800 hover:text-teal-950 transition-colors cursor-pointer"
                  >
                    {isKm ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    disabled={isLoading || lockoutSeconds > 0}
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-[#E7E1D4] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 transition-all font-mono text-stone-900 placeholder:text-stone-400 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 p-0.5 rounded transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || lockoutSeconds > 0 || !email || !password}
                className="w-full py-2.5 sm:py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.auth.signingIn}</span>
                  </>
                ) : (
                  <span>{t.auth.signInBtn}</span>
                )}
              </button>
            </form>

            {/* Clean, Elegant Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#FDFBF7] px-3 text-stone-400 font-sans">
                  {isKm ? 'ឬ' : 'or'}
                </span>
              </div>
            </div>

            {/* Clean, Modern Register Callout */}
            <div className="text-center space-y-2">
              <p className="text-xs text-stone-600 font-sans">
                {isKm ? 'មិនទាន់មាន Workspace គ្លីនិកផ្ទាល់ខ្លួន?' : "Don't have a workspace yet?"}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-teal-800/30 bg-teal-50/50 hover:bg-teal-50 text-teal-900 text-xs sm:text-sm font-semibold transition-all hover:border-teal-800"
              >
                <span>{isKm ? 'ចុះឈ្មោះបង្កើតគ្លីនិក Free Starter' : 'Register Free Starter Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}

        {/* Public SaaS Navigation Links */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-stone-600">
          <Link
            href="/landing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-200/60 hover:text-teal-900 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-stone-500" />
            <span>{isKm ? 'ទំព័រដើម' : 'Public Home'}</span>
          </Link>
          <span className="text-stone-300">•</span>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-stone-200/60 hover:text-teal-900 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-stone-500" />
            <span>{isKm ? 'គម្រោងតម្លៃសេវាកម្ម' : 'Pricing Plans'}</span>
          </Link>
        </div>

        {/* Minimal Professional Footer */}
        <div className="mt-6 pt-4 border-t border-[#E7E1D4] text-center">
          <p className="text-[11px] text-stone-400 font-sans">
            {isKm ? 'រក្សាសិទ្ធិគ្រប់យ៉ាងដោយ KruPet' : 'All rights reserved by KruPet'}
            {' • '}
            <Link href="/privacy" className="hover:text-stone-700 underline underline-offset-2">
              {isKm ? 'គោលការណ៍ឯកជនភាព' : 'Privacy Policy'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
