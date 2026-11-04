'use client';

import React from 'react';
import { User, LogOut, QrCode, Monitor, Search, Menu, Zap } from 'lucide-react';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/I18nContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ClinicLogo } from '../common/ClinicLogo';
import { isRouteAllowed } from '../../lib/rbac';
import { RestrictedActionGuard } from '../common/RestrictedActionGuard';
import Link from 'next/link';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, locale } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E7E1D4] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Mobile Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-[#EFE9DD] border border-[#DFD8CA] bg-[#FAF8F5] transition-colors shadow-2xs shrink-0"
            title={locale === 'km' ? 'បញ្ជីឧបករណ៍ & មុខងារទាំងអស់' : 'Open All Clinical Tools'}
          >
            <Menu className="w-4 h-4 text-stone-800" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2 shrink-0 hover:opacity-95 transition-opacity">
            <ClinicLogo variant="navbar" size="md" />
          </Link>

          {/* Desktop Command Palette Trigger */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F2EDE2] hover:bg-[#EBE4D6] text-stone-600 hover:text-stone-900 text-xs border border-[#DFD7C7] transition-all shadow-2xs w-44 lg:w-60 justify-between ml-2 active:scale-98"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Search className="w-3.5 h-3.5 text-stone-700 shrink-0" />
              <span className="truncate">{locale === 'km' ? 'ស្វែងរក ឬពាក្យបញ្ជា...' : 'Search or command...'}</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-600 bg-white/80 border border-[#DDD5C5] rounded shadow-xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="md:hidden p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-[#EFE9DD] transition-colors border border-[#E2DBD0] bg-[#F7F4EE]"
            title="Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-stone-700" />
          </button>

          {mounted && user && (
            <RestrictedActionGuard
              isAllowed={isRouteAllowed(user.role, '/reports')}
              actionNameKh="របាយការណ៍ & ស្ថិតិហិរញ្ញវត្ថុ"
              actionNameEn="Financial Reports & Analytics"
              className="hidden sm:inline-block"
            >
              <Link
                href={isRouteAllowed(user.role, '/reports') ? '/reports' : '#'}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5EFE4] hover:bg-[#EFE6D8] text-stone-800 border border-[#DFD6C6] text-xs font-semibold transition-colors shadow-xs"
                title={locale === 'km' ? 'របាយការណ៍ & ស្ថិតិ' : 'Reports & Analytics'}
              >
                <span className="hidden md:inline">{locale === 'km' ? 'របាយការណ៍' : 'Reports'}</span>
                <span className="md:hidden">Report</span>
              </Link>
            </RestrictedActionGuard>
          )}

          {mounted && user && (
            <RestrictedActionGuard
              isAllowed={isRouteAllowed(user.role, '/queue')}
              actionNameKh="ក្ដារជួរ & ហៅលេខអ្នកជំងឺ"
              actionNameEn="Patient Queue Screen"
              className="hidden sm:inline-block"
            >
              <Link
                href={isRouteAllowed(user.role, '/queue') ? '/queue' : '#'}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-700 border border-[#E5DFD2] text-xs font-semibold transition-colors shadow-xs"
                title={locale === 'km' ? 'ក្ដារជួរ & ហៅលេខអ្នកជំងឺ' : 'Patient Queue & Calling Screen'}
              >
                <Monitor className="w-3.5 h-3.5 text-teal-800" />
                <span className="hidden md:inline">{t.nav.queue}</span>
                <span className="md:hidden">Queue</span>
              </Link>
            </RestrictedActionGuard>
          )}

          {mounted && user && (
            <RestrictedActionGuard
              isAllowed={isRouteAllowed(user.role, '/billing')}
              actionNameKh="វិក្កយបត្រ & ទូទាត់ KHQR"
              actionNameEn="Invoicing & KHQR POS Settlement"
            >
              <Link
                href={isRouteAllowed(user.role, '/billing') ? '/billing' : '#'}
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 text-xs font-semibold transition-colors shadow-xs"
              >
                <QrCode className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline">KHQR & Billing</span>
                <span className="sm:hidden">KHQR</span>
              </Link>
            </RestrictedActionGuard>
          )}

          {mounted && user && user.tenant?.planTier !== 'UNLIMITED_20' && (
            <button
              type="button"
              onClick={() => {
                const currentTier = user.tenant?.planTier || 'FREE';
                const nextTier =
                  currentTier === 'FREE' ? 'STARTER_5' :
                  currentTier === 'STARTER_5' ? 'PRO_8' :
                  currentTier === 'PRO_8' ? 'ENTERPRISE_12' :
                  currentTier === 'ENTERPRISE_12' ? 'SPECIALIST_15' : 'UNLIMITED_20';
                window.dispatchEvent(new CustomEvent('open-subscription-modal', { detail: { tier: nextTier } }));
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer"
              title={locale === 'km' ? 'ដំឡើងកញ្ចប់ឧបករណ៍គ្លីនិក' : 'Upgrade Clinical Tools'}
            >
              <Zap className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
              <span className="hidden md:inline">{locale === 'km' ? 'Upgrade Tool' : 'Upgrade Tools'}</span>
            </button>
          )}

          <LanguageSwitcher />

          {mounted && user ? (
            <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-[#E7DFC9]">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-[#F2ECE0] transition-colors group active:scale-95"
                title={locale === 'km' ? 'មើល និងកែសម្រួលព័ត៌មានផ្ទាល់ខ្លួន' : 'View & Edit Profile'}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.fullNameEn}
                    className="w-8 h-8 rounded-full object-cover border border-[#DFD6C6] shadow-2xs group-hover:border-teal-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center shadow-2xs group-hover:bg-teal-900 transition-colors">
                    {(user.fullNameEn || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-stone-900 leading-tight group-hover:text-teal-900">
                    {locale === 'km' && user.fullNameKh ? user.fullNameKh : user.fullNameEn}
                  </div>
                  <div className="text-[10px] font-mono font-semibold uppercase">
                    {user.role === 'SUPER_ADMIN' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[9px] tracking-wide">
                        {locale === 'km' ? 'ម្ចាស់គ្លីនិក - OWNER' : 'SUPER ADMIN'}
                      </span>
                    ) : (
                      <span className="text-teal-800 font-semibold">{user.role}</span>
                    )}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 sm:p-2 rounded-xl text-stone-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all active:scale-95 cursor-pointer"
                title={t.nav.logout}
                aria-label={t.nav.logout}
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
      <MobileMenuDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />
    </header>
  );
};
