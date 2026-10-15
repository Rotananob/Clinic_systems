'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../../components/common/ClinicLogo';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { getHumanErrorMessage } from '../../lib/errorHandler';
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  ShieldAlert,
  Clock,
  Zap,
  KeyRound,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, locale } = useTranslation();
  const isKm = locale === 'km';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Anti-Brute-Force Lockout Defense
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

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
      await login(email.trim(), password);
      setFailedAttempts(0);
      router.push('/');
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

  const DEMO_EMAIL = 'demo.superadmin@hounvannak.com';
  const DEMO_PASS = 'Demo#SuperAdmin2026!MasterKey';

  const handleOneClickDemoLogin = async () => {
    if (lockoutSeconds > 0 || isLoading) return;
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setError(null);
    setIsLoading(true);

    try {
      await login(DEMO_EMAIL, DEMO_PASS);
      setFailedAttempts(0);
      router.push('/');
    } catch (err: unknown) {
      const friendlyMsg = getHumanErrorMessage(err, locale);
      setError(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASS);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-3xl border border-[#E7E1D4] p-6 sm:p-8 shadow-xl relative overflow-hidden animate-in fade-in duration-200">
        {/* Language Switcher at Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>

        {/* Brand Clinic Logo & Header */}
        <div className="mb-6 pt-2">
          <ClinicLogo variant="full" size="lg" showSubtitle={true} />
        </div>

        {/* Security Compliance Ribbon */}
        <div className="mb-5 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7E1D4] flex items-center gap-2.5 text-[11px] text-stone-600">
          <ShieldCheck className="w-4 h-4 text-teal-800 shrink-0" />
          <span className="font-medium">
            {isKm
              ? 'ច្រកចូលសុវត្ថិភាពវេជ្ជសាស្ត្រ MoH - ការពារដោយ bcrypt & JWT'
              : 'MoH Clinical Security Gateway - Protected by bcrypt & JWT'}
          </span>
        </div>

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
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              {t.auth.passwordLabel}
            </label>
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
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
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

        {/* Test / Evaluation Account Showcase with 1-Click Login */}
        <div className="mt-5 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-stone-50 border border-teal-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-teal-800 text-white font-mono uppercase">
                SUPER_ADMIN
              </span>
              <span className="text-[11px] font-semibold text-stone-700">
                {isKm ? 'គណនីសាកល្បង' : 'Demo Account'}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md font-mono border border-emerald-200/60">
              {isKm ? 'ផុតកំណត់: 31/12/2026' : 'Expires: 31/12/2026'}
            </span>
          </div>

          <div className="text-[11px] text-stone-600 space-y-1 mb-3 font-mono bg-white/90 p-2.5 rounded-xl border border-teal-100/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 font-sans text-[10px]">Email:</span>
              <span className="font-semibold text-stone-800 selection:bg-teal-100 select-all">
                demo.superadmin@hounvannak.com
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400 font-sans text-[10px]">{isKm ? 'ពាក្យសម្ងាត់:' : 'Password:'}</span>
              <span className="font-semibold text-stone-800 selection:bg-teal-100 select-all">
                Demo#SuperAdmin2026!MasterKey
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px]">
              <span className="text-stone-400 font-sans">{isKm ? 'សិទ្ធិ:' : 'Access:'}</span>
              <span className="text-teal-800 font-sans font-bold">
                {isKm ? 'មហាសិទ្ធិ (Full Access & All Modules)' : 'Full Master Access (100%)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleOneClickDemoLogin}
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full py-2 px-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isKm ? 'ចូលប្រើភ្លាមៗ (1-Click)' : '1-Click Demo Login'}</span>
            </button>
            <button
              type="button"
              onClick={handleAutoFillDemo}
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full py-2 px-3 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-stone-500" />
              <span>{isKm ? 'បំពេញស្វ័យប្រវត្តិ' : 'Auto-fill Form'}</span>
            </button>
          </div>
        </div>

        {/* Security Policy Notice Footer */}
        <div className="mt-6 pt-4 border-t border-[#E7E1D4] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-stone-600">
            <ShieldAlert className="w-3.5 h-3.5 text-stone-500" />
            <span>
              {isKm
                ? 'ប្រព័ន្ធសុវត្ថិភាពព័ត៌មានវិទ្យាគ្លីនិក ហាមការចូលដោយគ្មានសិទ្ធិ'
                : 'Authorized Clinic Staff Personnel Only'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">
            {isKm
              ? 'គ្រប់សកម្មភាពចូលប្រព័ន្ធត្រូវបានកត់ត្រាក្នុង Audit Trail ដើម្បីការពារអ្នកជំងឺ'
              : 'All authentication events are logged for patient confidentiality and audit compliance.'}
          </p>
        </div>
      </div>
    </div>
  );
}
