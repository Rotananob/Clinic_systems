'use client';

import React from 'react';
import { User, LogOut, QrCode, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ClinicLogo } from '../common/ClinicLogo';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, locale } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-95 transition-opacity">
          <ClinicLogo variant="navbar" size="md" />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/queue"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-xs"
            title={locale === 'km' ? 'ក្ដារជួរ & ហៅលេខអ្នកជំងឺ' : 'Patient Queue & Calling Screen'}
          >
            <Monitor className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden md:inline">{t.nav.queue}</span>
            <span className="md:hidden">Queue</span>
          </Link>

          <Link
            href="/billing"
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden sm:inline">KHQR & Billing</span>
            <span className="sm:hidden">KHQR</span>
          </Link>

          <LanguageSwitcher />

          {mounted && user ? (
            <div className="flex items-center gap-1 sm:gap-3 pl-1 sm:pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {locale === 'km' && user.fullNameKh ? user.fullNameKh : user.fullNameEn}
                </div>
                <div className="text-[10px] text-teal-700 font-mono font-semibold uppercase">
                  {user.role}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title={t.nav.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t.auth.signInBtn}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
