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
