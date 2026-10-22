'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../../components/common/ClinicLogo';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { getHumanErrorMessage } from '../../lib/errorHandler';
import { getClinicTargetRoute } from '../../lib/rbac';
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  ArrowRight,
  Home,
  CreditCard,
} from 'lucide-react';

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
      const loggedInUser = await login(email.trim(), password);
      setFailedAttempts(0);
      const targetDestination = getClinicTargetRoute(loggedInUser);
      router.push(targetDestination);
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

        {/* Real Free Account Registration Callout - Ultra Cool & Modern Card */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-b from-white via-[#FAF7F2] to-[#F5EFE4] border border-[#DDD5C5] shadow-sm hover:border-teal-700/40 transition-all duration-300 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isKm ? 'មិនទាន់មាន Workspace គ្លីនិកផ្ទាល់ខ្លួន?' : "Don't have a workspace yet?"}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono tracking-wide uppercase">
              Free 0$
            </span>
          </div>

          <Link
            href="/register"
            className="group w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-between"
          >
            <span className="font-sans">
              {isKm ? 'ចុះឈ្មោះបង្កើតគ្លីនិក Free Starter' : 'Register Free Starter Account'}
            </span>
            <div className="flex items-center gap-1 text-teal-200 group-hover:text-white transition-colors">
              <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">
                {isKm ? 'ចាប់ផ្តើម' : 'Start'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <div className="flex items-center justify-between text-[11px] text-stone-500 font-sans px-1">
            <span>{isKm ? 'ដំឡើងត្រឹម 60 វិនាទី' : '60-second setup'}</span>
            <span className="text-stone-300">•</span>
            <span>{isKm ? '5 KHQR ក្នុងមួយថ្ងៃ' : '5 KHQR daily'}</span>
            <span className="text-stone-300">•</span>
            <span>{isKm ? 'គ្មានកាតធនាគារ' : 'No credit card'}</span>
          </div>
        </div>

        {/* Public SaaS Navigation Links - Clean Tactile Pills without parentheses */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-stone-600">
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
            {isKm ? 'រក្សាសិទ្ធិគ្រប់យ៉ាងដោយ Krupet.com' : 'All rights reserved by Krupet.com'}
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
