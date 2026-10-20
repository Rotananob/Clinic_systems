'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Activity, ArrowRight, Shield, CheckCircle2, ChevronRight, Menu, X } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E7E1D4] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/landing" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs group-hover:bg-teal-900 transition-colors">
            <Activity className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-stone-900 tracking-tight font-sans">
                ClinicOS
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                PaaS
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              {isKm ? 'ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក & KHQR Cambodia' : 'Cambodia Medical Cloud Platform'}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-600">
          <Link
            href="/landing#features"
            className="hover:text-stone-900 transition-colors"
          >
            {isKm ? 'លក្ខណៈពិសេស' : 'Features'}
          </Link>
          <Link
            href="/landing#how-it-works"
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
            href="/landing#security"
            className="hover:text-stone-900 transition-colors"
          >
            {isKm ? 'សន្តិសុខទិន្នន័យ' : 'Security'}
          </Link>
          <Link
            href="/landing#faq"
            className="hover:text-stone-900 transition-colors"
          >
            {isKm ? 'សំណួរញឹកញាប់' : 'FAQ'}
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

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
            <span>{isKm ? 'សាកល្បងឥតគិតថ្លៃ' : 'Start Free Trial'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E7E1D4] bg-[#FAF7F2] px-4 py-4 space-y-3">
          <Link
            href="/landing#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-stone-700 hover:text-teal-800"
          >
            {isKm ? 'លក្ខណៈពិសេស' : 'Features'}
          </Link>
          <Link
            href="/landing#how-it-works"
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
            href="/landing#security"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-stone-700 hover:text-teal-800"
          >
            {isKm ? 'សន្តិសុខទិន្នន័យ' : 'Security'}
          </Link>
          <Link
            href="/landing#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs font-semibold text-stone-700 hover:text-teal-800"
          >
            {isKm ? 'សំណួរញឹកញាប់' : 'FAQ'}
          </Link>
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500">{isKm ? 'ភាសា' : 'Language'}</span>
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
};
