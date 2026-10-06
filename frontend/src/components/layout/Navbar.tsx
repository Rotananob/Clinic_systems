'use client';

import React from 'react';
import { Stethoscope, User, LogOut, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-sm">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 leading-tight">Rotana Clinic</div>
            <div className="text-xs text-slate-500">Patient Management & KHQR</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden sm:inline">បង់ប្រាក់ KHQR / Billing</span>
            <span className="sm:hidden">KHQR</span>
          </Link>
          <LanguageSwitcher />

          {mounted && user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-slate-900">{user.fullNameEn}</div>
                <div className="text-xs text-slate-500 font-mono uppercase">{user.role}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              Staff Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
