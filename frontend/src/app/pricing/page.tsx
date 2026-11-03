'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { PricingMatrix } from '../../components/landing/PricingMatrix';
import { PublicFooter } from '../../components/landing/PublicFooter';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Building2,
  Sparkles,
  ArrowRight,
  Layers,
  HelpCircle,
} from 'lucide-react';

export default function PricingPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-stone-900 selection:bg-teal-800 selection:text-white font-sans antialiased">
      <PublicNavbar />

      {/* Enterprise Trust & SLA Metric Banner */}
      <div className="bg-[#FAF7F2] border-b border-[#E7DFCF] py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-stone-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-stone-800">
              {isKm ? 'ស្តង់ដារវេជ្ជសាស្ត្រថ្នាក់ជាតិ ២០២៦' : 'Flagship 2026 Clinical SaaS'}
            </span>
            <span className="hidden sm:inline text-stone-400">•</span>
            <span className="hidden sm:inline text-stone-600">
              {isKm
                ? 'ទូទាត់ប្រាក់តាម Dynamic Bakong KHQR ហូរចូលគណនីធនាគារគ្លីនិកផ្ទាល់ ១០០% គ្មានកាត់កម្រៃជើងសារ 0%'
                : '100% direct Bakong KHQR settlement into clinic bank account with 0% platform fee'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold text-stone-500">
            <div className="flex items-center gap-1 text-teal-900">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-800 shrink-0" />
              <span>MoH DHIS2 Ready</span>
            </div>
            <div className="flex items-center gap-1 text-teal-900">
              <Lock className="w-3.5 h-3.5 text-teal-800 shrink-0" />
              <span>Multi-Tenant Isolated</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-teal-900">
              <Zap className="w-3.5 h-3.5 text-teal-800 shrink-0" />
              <span>99.99% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Breadcrumb Jump Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-[#E7DFCF]">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-stone-500 hover:text-stone-900 font-semibold transition-colors">
              {isKm ? 'ទំព័រដើម' : 'Home'}
            </Link>
            <span className="text-stone-400">/</span>
            <span className="font-bold text-teal-950">
              {isKm ? 'គម្រោងតម្លៃ និងឧបករណ៍ប្រព័ន្ធ' : 'Pricing Matrix & Arsenal'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-bold">
            <a
              href="#pricing"
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-900 text-stone-700 transition-colors whitespace-nowrap"
            >
              {isKm ? 'គម្រោងទាំង ៦' : '6 Pricing Tiers'}
            </a>
            <a
              href="#system-tools"
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-900 text-stone-700 transition-colors whitespace-nowrap"
            >
              {isKm ? 'ឧបករណ៍ទាំង ២៦' : '26 System Tools'}
            </a>
            <a
              href="#faq"
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-teal-50 hover:text-teal-900 text-stone-700 transition-colors whitespace-nowrap"
            >
              {isKm ? 'សំណួរញឹកញាប់' : 'FAQ'}
            </a>
            {user && (
              <Link
                href="/settings?tab=subscription"
                className="px-2.5 py-1 rounded-lg bg-teal-800 hover:bg-teal-900 text-white transition-colors whitespace-nowrap flex items-center gap-1 shadow-2xs"
              >
                <span>{isKm ? 'គ្រប់គ្រងគម្រោងគ្លីនិក' : 'Manage Subscription'}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 py-4">
        <PricingMatrix />
      </main>

      <PublicFooter />
    </div>
  );
}
