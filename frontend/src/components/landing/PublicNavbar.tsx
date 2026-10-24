'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ClinicLogo } from '../common/ClinicLogo';
import { ArrowRight, Menu, X, LayoutDashboard } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E7E1D4] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={user ? '/dashboard' : '/'} className="flex items-center group">
          <ClinicLogo variant="navbar" size="md" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-600">
          <Link
            href="/#features"
            className="hover:text-stone-900 transition-colors"
          >
            {isKm ? 'លក្ខណៈពិសេស' : 'Features'}
          </Link>
          <Link
            href="/#how-it-works"
            className="hover:text-stone-900 transition-colors"
          >
            {isKm ? 'របៀបដំណើរការ' : 'How It Works'}
          </Link>
          <Link
            href="/pricing"
            className={`hover:text-stone-900 transition-colors ${
              pathname === '/pricing' ? 'text-teal-800 font-bold' : ''
            }`}
          >
            {isKm ? 'គម្រោងតម្លៃ' : 'Pricing Matrix'}
          </Link>
          <Link
            href="/#security"
            className="hover:text-stone-900 transition-colors"
          >
            {isKm ? 'សន្តិសុខទិន្នន័យ' : 'Security'}
          </Link>
          <Link
            href="/#faq"
            className="hover:text-stone-900 transition-colors"
          >
            {isKm ? 'សំណួរញឹកញាប់' : 'FAQ'}
          </Link>
          <Link
            href="/help"
            className={`hover:text-stone-900 transition-colors ${
              pathname === '/help' ? 'text-teal-800 font-bold' : ''
            }`}
          >
            {isKm ? 'មជ្ឈមណ្ឌលជំនួយ' : 'Help Center'}
          </Link>
        </nav>

        {/* Right CTA Actions: Separated Desktop vs Clean Mobile Menu Only */}
        <div className="flex items-center gap-3">
          {/* Desktop Only Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors active:scale-95"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{isKm ? 'ផ្ទាំងគ្រប់គ្រង - Dashboard' : 'Clinic Dashboard'}</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors rounded-xl hover:bg-stone-100"
                >
                  {isKm ? 'ចូលប្រើប្រាស់' : 'Sign In'}
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors active:scale-95"
                >
                  <span>{isKm ? 'ឥតគិតថ្លៃរហូត' : 'Start Free Forever'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Site Header Bar: Clean Menu Icon ONLY */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-700 hover:text-stone-900 rounded-xl hover:bg-stone-100 border border-stone-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7E1D4] bg-[#FAF7F2] px-4 py-4 space-y-3">
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-stone-700 hover:text-teal-800"
          >
            {isKm ? 'លក្ខណៈពិសេស' : 'Features'}
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-stone-700 hover:text-teal-800"
          >
            {isKm ? 'របៀបដំណើរការ' : 'How It Works'}
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-teal-800 font-bold"
          >
            {isKm ? 'គម្រោងតម្លៃ' : 'Pricing Matrix'}
          </Link>
          <Link
            href="/#security"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-stone-700 hover:text-teal-800"
          >
            {isKm ? 'សន្តិសុខទិន្នន័យ' : 'Security'}
          </Link>
          <Link
            href="/#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-stone-700 hover:text-teal-800"
          >
            {isKm ? 'សំណួរញឹកញាប់' : 'FAQ'}
          </Link>
          <Link
            href="/help"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-stone-700 hover:text-teal-800"
          >
            {isKm ? 'មជ្ឈមណ្ឌលជំនួយ' : 'Help Center'}
          </Link>

          <div className="pt-2 flex items-center justify-between border-t border-[#E7E1D4]">
            <span className="text-xs text-stone-500 font-medium">{isKm ? 'ភាសា:' : 'Language:'}</span>
            <LanguageSwitcher />
          </div>

          <div className="pt-2 border-t border-[#E7E1D4] space-y-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 bg-teal-800 text-white text-xs font-bold rounded-xl text-center block shadow-xs"
              >
                {isKm ? 'ចូលទៅកាន់ Dashboard គ្លីនិក' : 'Open Clinic Dashboard'}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 bg-stone-100 text-stone-800 text-xs font-semibold rounded-xl text-center block"
                >
                  {isKm ? 'ចូលប្រើប្រាស់' : 'Sign In'}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-teal-800 text-white text-xs font-bold rounded-xl text-center block shadow-xs"
                >
                  {isKm ? 'ឥតគិតថ្លៃរហូត' : 'Start Free Forever'}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
