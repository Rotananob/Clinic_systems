'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Zap,
} from 'lucide-react';

export const BottomCtaBanner: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const router = useRouter();

  const [clinicName, setClinicName] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(
      `/register${clinicName.trim() ? `?clinicName=${encodeURIComponent(clinicName.trim())}` : ''}`
    );
  };

  return (
    <section className="py-16 md:py-24 bg-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-stone-900 text-white p-8 sm:p-12 md:p-16 border border-teal-800/80 shadow-2xl overflow-hidden">
          {/* 3D Atmospheric Lighting Canvas */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none -z-0" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            {/* Urgency Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-800/80 border border-teal-700 text-teal-200 text-xs font-bold shadow-xs">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {isKm
                  ? 'ចាប់ផ្តើមភ្លាមៗ • ដំណើរការត្រឹមតែ ៦០ វិនាទី'
                  : 'Instant Onboarding • Ready in 60 Seconds'}
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight font-sans text-white">
              {isKm
                ? 'ផ្លាស់ប្តូរគ្លីនិករបស់អ្នកទៅជាគ្លីនិកឌីជីថលឆ្លាតវៃថ្ងៃនេះ'
                : 'Modernize Your Medical Clinic to an Intelligent Digital Platform Today'}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-teal-100/90 leading-relaxed max-w-2xl mx-auto font-sans">
              {isKm
                ? 'កុំឱ្យគ្លីនិករបស់អ្នកនៅបន្តយឺតយ៉ាវ និងខាតបង់ពេលវេលាជាមួយប្រព័ន្ធចាស់ទៀតឡើយ។ ចុះឈ្មោះប្រើប្រាស់គម្រោង Free Starter ជារៀងរហូត ឬសាកល្បងមុខងារ AI និងហៅជួរ ១៤ ថ្ងៃពេញដោយឥតគិតថ្លៃ!'
                : 'Stop wasting hours on manual paperwork and cashier errors. Claim your workspace now with Free Starter tier or test all AI features for 14 days risk-free.'}
            </p>

            {/* Fast Clinic Name Registration Box */}
            <form onSubmit={handleRegister} className="max-w-md mx-auto pt-2">
              <div className="flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-inner focus-within:border-emerald-400 transition-colors">
                <div className="pl-3 text-teal-200">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder={
                    isKm
                      ? 'បញ្ចូលឈ្មោះគ្លីនិករបស់អ្នក...'
                      : 'Enter clinic name (e.g. Rotana Clinic)...'
                  }
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm font-semibold text-white placeholder:text-stone-300 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-stone-950 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 shrink-0"
                >
                  <span>{isKm ? 'ចុះឈ្មោះភ្លាមៗ' : 'Get Started'}</span>
                </button>
              </div>
            </form>

            {/* Trust Badges Row */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-teal-200 font-sans">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isKm ? 'មិនបាច់ប្រើកាតធនាគារ' : 'No Credit Card Required'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isKm ? 'លុយចូល ABA ផ្ទាល់ ១០០%' : '100% Direct ABA Settle'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isKm ? 'ជំនួយបច្ចេកទេស ២៤/៧' : '24/7 Priority Support'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
