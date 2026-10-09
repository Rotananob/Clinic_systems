'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { ClinicLogo } from '../../components/common/ClinicLogo';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck, Stethoscope, CreditCard, UserCheck, Pill } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, locale } = useTranslation();
  const [email, setEmail] = useState('admin@clinic.com');
  const [password, setPassword] = useState('Clinic@12345');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    {
      role: 'ADMIN',
      label: t.auth.adminRole,
      email: 'admin@clinic.com',
      password: 'Clinic@12345',
      icon: ShieldCheck,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
    },
    {
      role: 'DOCTOR',
      label: t.auth.doctorRole,
      email: 'doctor.sok@clinic.com',
      password: 'Clinic@12345',
      icon: Stethoscope,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    },
    {
      role: 'CASHIER',
      label: t.auth.cashierRole,
      email: 'cashier@clinic.com',
      password: 'Clinic@12345',
      icon: CreditCard,
      color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    },
    {
      role: 'RECEPTIONIST',
      label: t.auth.receptionRole,
      email: 'reception@clinic.com',
      password: 'Clinic@12345',
      icon: UserCheck,
      color: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100',
    },
    {
      role: 'PHARMACIST',
      label: t.auth.pharmacyRole,
      email: 'pharmacy@clinic.com',
      password: 'Clinic@12345',
      icon: Pill,
      color: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',
    },
  ];

  const handleSelectRole = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || t.auth.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl relative overflow-hidden animate-in fade-in duration-200">
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
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.auth.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@clinic.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.auth.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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

        {/* 1-Click Role Login for Quick Testing */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold text-slate-600 font-sans">
              {t.auth.demoRolesTitle}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {t.auth.selectRole}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectRole(acc)}
                  className={`px-2.5 py-2 rounded-xl border text-left transition-all flex items-center gap-2 text-xs ${
                    acc.color
                  } ${isSelected ? 'ring-2 ring-teal-600 shadow-xs' : ''}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-[11px] leading-tight truncate">
                      {acc.label}
                    </div>
                    <div className="text-[9px] font-mono opacity-70 truncate">
                      {acc.email.split('@')[0]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400 font-mono">
              Password for all roles: <code className="text-teal-800 font-bold">Clinic@12345</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
