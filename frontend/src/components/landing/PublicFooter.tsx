'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import { Activity, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  return (
    <footer className="bg-[#FAF7F2] border-t border-[#E7E0D2] pt-14 pb-12 text-stone-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs">
                <Activity className="w-4 h-4 text-teal-100" />
              </div>
              <span className="font-bold text-base text-stone-900 tracking-tight font-sans">
                ClinicOS PaaS
              </span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              {isKm
                ? 'ប្រព័ន្ធគ្រប់គ្រងគ្លីនិក និងទូទាត់ប្រាក់ KHQR ទំនើបឈានមុខគេនៅកម្ពុជា។ បង្កើតឡើងដោយការយកចិត្តទុកដាក់ខ្ពស់លើសុវត្ថិភាពទិន្នន័យវេជ្ជសាស្ត្រ។'
                : 'Next-generation clinical operating platform for Cambodia. Built with strict medical data isolation and instant dynamic KHQR settlement.'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multi-Tenant Architecture Compliant</span>
            </div>
          </div>

          {/* Links Column 1: Capabilities */}
          <div className="space-y-2.5">
            <div className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              {isKm ? 'មុខងារប្រព័ន្ធ' : 'Capabilities'}
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/landing#features" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'បង្កើត Dynamic KHQR 2 វិនាទី' : '2-Second Dynamic KHQR'}
                </Link>
              </li>
              <li>
                <Link href="/landing#features" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'ហៅអ្នកជំងឺជាសំឡេងខ្មែរ' : 'Native Khmer Voice Calling'}
                </Link>
              </li>
              <li>
                <Link href="/landing#features" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'Telegram Forum Topics Bridge' : 'Telegram Forum Topics'}
                </Link>
              </li>
              <li>
                <Link href="/landing#features" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'ម៉ាស៊ីនព្រីន 80mm & ថតប្រាក់' : 'ESC/POS 80mm Thermal Hardware'}
                </Link>
              </li>
              <li>
                <Link href="/landing#features" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'គ្រប់គ្រងអ្នកជំងឺ EMR & ឱសថ' : 'Clinical Records & Pharmacy'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Pricing & Plans */}
          <div className="space-y-2.5">
            <div className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              {isKm ? 'គម្រោងតម្លៃ' : 'Subscription Plans'}
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/pricing" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'Free Starter ($0/ខែ)' : 'Free Starter ($0/mo)'}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'Clinic Starter ($5/ខែ - 250 KHQR/ថ្ងៃ)' : 'Clinic Starter ($5/mo - 250 KHQR/day)'}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'Polyclinic Pro ($8/ខែ - 1,500 KHQR/ថ្ងៃ)' : 'Polyclinic Pro ($8/mo - 1,500 KHQR/day)'}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'Hospital Enterprise ($12/ខែ - Unlimited)' : 'Hospital Enterprise ($12/mo - Unlimited)'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Trust & Portal */}
          <div className="space-y-2.5">
            <div className="font-bold text-stone-900 text-xs uppercase tracking-wider">
              {isKm ? 'ចូលប្រើប្រាស់' : 'Access & Support'}
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-teal-800 font-semibold transition-colors">
                  {isKm ? 'ចូលគណនីគ្លីនិក (Sign In)' : 'Clinic Staff Login Portal'}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-stone-900 transition-colors">
                  {isKm ? 'សាកល្បងឥតគិតថ្លៃ (Free Trial)' : 'Start 14-Day Free Trial'}
                </Link>
              </li>
              <li>
                <span className="text-stone-500">
                  {isKm ? 'ការគាំទ្របច្ចេកទេស: Telegram 24/7' : 'Support: 24/7 Telegram & Hotline'}
                </span>
              </li>
              <li>
                <span className="text-stone-500">
                  Phnom Penh, Kingdom of Cambodia
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="pt-8 border-t border-[#EAE3D5] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <div>
            &copy; {new Date().getFullYear()} ClinicOS PaaS (Cambodia). All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/landing#security" className="hover:text-stone-800 transition-colors">
              {isKm ? 'គោលការណ៍សន្តិសុខទិន្នន័យ' : 'Security Policy'}
            </Link>
            <span>•</span>
            <Link href="/landing#faq" className="hover:text-stone-800 transition-colors">
              {isKm ? 'សំណួរញឹកញាប់' : 'FAQ'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
