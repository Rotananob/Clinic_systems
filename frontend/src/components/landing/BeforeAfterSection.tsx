'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import {
  XCircle,
  CheckCircle2,
  Volume2,
  QrCode,
  FileText,
  Package,
  Send,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const BeforeAfterSection: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const comparisons = [
    {
      titleKh: 'ការហៅអ្នកជំងឺ និងសណ្ដាប់ធ្នាប់បន្ទប់រង់ចាំ',
      titleEn: 'Patient Queue & Waiting Area Order',
      icon: Volume2,
      beforeKh:
        'បុគ្គលិក ឬគ្រូពេទ្យត្រូវស្រែកហៅឈ្មោះអ្នកជំងឺរហូតដល់ស្អកក អ្នកជំងឺអង្គុយប្រជ្រៀតគ្នាមិនដឹងដល់វេនណា បង្កការរញ៉េរញ៉ៃ និងបាត់បង់សោភ័ណភាពគ្លីនិក។',
      beforeEn:
        'Nurses shout patient names repeatedly across noisy lobbies; patients crowd reception counters with no queue visibility, creating frustration.',
      afterKh:
        'គ្រូពេទ្យគ្រាន់តែចុច Call លើកុំព្យូទ័រ ប្រព័ន្ធនឹងបន្លឺសំឡេងហៅឈ្មោះ និងបន្ទប់ពិគ្រោះជាភាសាខ្មែរតាម Speaker ស្វ័យប្រវត្ត អ្នកជំងឺដឹងវេនច្បាស់លាស់តាមអេក្រង់ TV។',
      afterEn:
        '1-click calling triggers crystal clear Khmer voice audio to waiting room speakers while the lobby TV displays ticket numbers, eliminating all shouting.',
    },
    {
      titleKh: 'ការគិតលុយ និងទូទាត់ប្រាក់ KHQR',
      titleEn: 'Invoice Checkout & Dynamic KHQR Payments',
      icon: QrCode,
      beforeKh:
        'ភ្ញៀវស្កេន Static QR ក្រដាស ហើយត្រូវវាយលេខទឹកប្រាក់ដោយខ្លួនឯង ជួនកាលវាយខ្វះ វាយលើស គិតលុយយឺតយ៉ាវ ឬមានហានិភ័យពីការផ្ញើរូប Fake Screenshot ក្លែងបន្លំ។',
      beforeEn:
        'Paper static QR stickers require patients to manually type amounts; staff struggle with mistyped figures, cash discrepancies, and fake payment screenshots.',
      afterKh:
        'បង្កើត Dynamic KHQR ចាក់សោទឹកប្រាក់ត្រឹមតែ ២ វិនាទី ការពារកុំឱ្យបន្លំ ឬច្រឡំ លុយរត់ចូលកុង ABA ផ្ទាល់ ១០០% គ្មានកាត់កម្រៃជើងសារ និងដឹងលទ្ធផលភ្លាមៗ។',
      afterEn:
        'Instant 2-second Dynamic KHQR locks the exact invoice amount to prevent tampering; funds deposit straight into your clinic ABA account with zero fee and instant audit trail.',
    },
    {
      titleKh: 'ការកត់ត្រាពិគ្រោះជំងឺ និងប្រវត្តិព្យាបាល - EMR',
      titleEn: 'Clinical Consultation Notes & EMR Records',
      icon: FileText,
      beforeKh:
        'សរសេរដៃលើសៀវភៅ ឬវាយ Word យឺតយ៉ាវ ពិបាកអានអក្សរគ្រូពេទ្យ ឯកសារក្រដាសងាយនឹងបាត់បង់ ហើយពេលចង់រកប្រវត្តិជំងឺចាស់ត្រូវចំណាយពេលរើកកាយរាប់ម៉ោង។',
      beforeEn:
        'Messy handwritten paper books or disconnected Word files; finding past visits wastes valuable consultation minutes, and paper notes easily tear or get lost.',
      afterKh:
        'គ្រូពេទ្យគ្រាន់តែនិយាយជាភាសាខ្មែរ ប្រព័ន្ធ AI ជំនាន់ក្រោយដ៏ល្បីនិងវ័យឆ្លាត រៀបចំទម្រង់ SOAP និងកូដជំងឺ ICD-11 ត្រឹម ៥ វិនាទី ចំណេញពេលពិនិត្យ និងស្វែងរកប្រវត្តិអ្នកជំងឺឃើញក្នុង ១ វិនាទី។',
      afterEn:
        'Doctors dictate naturally in Khmer; Next-Gen Intelligent Medical AI formats structured SOAP notes and ICD-11 diagnosis in 5 seconds, slashing documentation time by 75%.',
    },
    {
      titleKh: 'ការគ្រប់គ្រងស្តុកឱសថ និងកាលបរិច្ឆេទផុតកំណត់',
      titleEn: 'Pharmacy Stock Tracking & Expiration Safety',
      icon: Package,
      beforeKh:
        'មិនដឹងចំនួនថ្នាំពិតប្រាកដក្នុងស្តុក ថ្នាំជិតផុតកំណត់មិនបានដឹងរហូតដល់ត្រូវបោះចោលខាតបង់ប្រាក់រាប់រយដុល្លារ ឬអ្នកជំងឺត្រូវការថ្នាំទើបដឹងថាអស់ពីស្តុក។',
      beforeEn:
        'Unmonitored medicine cabinets lead to expired stock losses of hundreds of dollars, inventory theft, and embarrassing moments when vital drugs run out.',
      afterKh:
        'ប្រព័ន្ធកាត់ស្តុកស្វ័យប្រវត្តភ្លាមៗពេលចេញវេជ្ជបញ្ជា ព្រមទាំងដាស់តឿនជាមុនពេលថ្នាំជិតអស់ ឬជិតផុតកំណត់តាមគោលការណ៍ FEFO ធានាគ្មានការខាតបង់។',
      afterEn:
        'Automatic stock deductions upon prescription saving, paired with FEFO batch tracking and proactive early expiration warnings to eliminate wasted medicines.',
    },
    {
      titleKh: 'ការត្រួតពិនិត្យចំណូល និងប្រតិបត្តិការរបស់ម្ចាស់គ្លីនិក',
      titleEn: 'Clinic Owner Revenue Visibility & Peace of Mind',
      icon: Send,
      beforeKh:
        'ពេលម្ចាស់គ្លីនិកមិននៅគ្លីនិក គឺពុំមានវិធីណាដឹងចំនួនអ្នកជំងឺ ឬចំណូលប្រចាំថ្ងៃពិតប្រាកដឡើយ ត្រូវរង់ចាំទូរស័ព្ទសួរបុគ្គលិក ឬរង់ចាំបិទបញ្ជីពេលល្ងាច។',
      beforeEn:
        'Owners are trapped at the clinic; leaving means zero visibility into daily collections, patient counts, or cashier irregularities until late night reconciliations.',
      afterKh:
        'របាយការណ៍បាញ់ចូល Telegram របស់ម្ចាស់គ្លីនិកដោយស្វ័យប្រវត្តិរាល់ពេលមានអ្នកជំងឺបង់ប្រាក់ ដឹងចំនួនអ្នកជំងឺ និងចំណូលជាក់ស្តែងគ្រប់វិនាទីទោះបីនៅទីណាក៏ដោយ។',
      afterEn:
        'Instant multi-channel Telegram forum alerts ping the clinic owner on every payment, prescription, and patient intake—granting 100% control from anywhere.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F2ECE1] border-y border-[#E2D8C7] relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-900/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D5CDBD] text-stone-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-800" />
            <span>
              {isKm
                ? 'ការប្រៀបធៀបជាក់ស្តែង • Before & After Transformation'
                : 'Direct Comparison • Before vs After Krupet.com'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight font-sans">
            {isKm
              ? 'ហេតុអ្វីបានជាគ្លីនិកឈានមុខគេប្តូរមកប្រើ Krupet.com?'
              : 'Why Leading Clinics Across Cambodia Choose Krupet.com'}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            {isKm
              ? 'ការផ្លាស់ប្តូរពីប្រព័ន្ធចាស់បែបបុរាណ មកកាន់ប្រព័ន្ធឌីជីថលឆ្លាតវៃ ជួយសន្សំពេលវេលា កាត់បន្ថយកំហុស និងបង្កើនប្រាក់ចំណេញរបស់គ្លីនិកលោកអ្នកយ៉ាងពិតប្រាកដ។'
              : 'Witness the dramatic upgrade in clinical throughput, zero financial leakage, and effortless patient satisfaction.'}
          </p>
        </div>

        {/* Comparisons Stack */}
        <div className="mt-12 space-y-6">
          {comparisons.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-[#DFD6C6] shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Comparison Title Ribbon */}
                <div className="bg-[#FAF7F2] px-6 py-3 border-b border-[#E7DFCF] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-800/10 text-teal-900 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-stone-900 font-sans">
                      {isKm ? c.titleKh : c.titleEn}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 font-bold hidden sm:inline">
                    Point 0{idx + 1}
                  </span>
                </div>

                {/* Side by Side Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200">
                  {/* BEFORE (Old Way) */}
                  <div className="p-6 bg-rose-50/25 space-y-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider text-rose-800 font-mono">
                        {isKm ? 'មុនពេលប្រើ - គ្លីនិកបែបបុរាណ' : 'Before: Traditional Manual Clinic'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans pl-6">
                      {isKm ? c.beforeKh : c.beforeEn}
                    </p>
                  </div>

                  {/* AFTER (With Krupet.com) */}
                  <div className="p-6 bg-teal-50/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider text-teal-900 font-mono">
                        {isKm ? 'ក្រោយពេលប្រើ Krupet.com - គ្លីនិកទំនើប' : 'After: Powered by Krupet PaaS'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-800 font-medium leading-relaxed font-sans pl-6">
                      {isKm ? c.afterKh : c.afterEn}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Transformation CTA */}
        <div className="mt-10 p-6 rounded-3xl bg-teal-900 text-white text-center md:flex md:items-center md:justify-between md:text-left gap-6 border border-teal-800 shadow-xl">
          <div className="space-y-1">
            <div className="text-base sm:text-lg font-bold font-sans">
              {isKm
                ? 'ត្រៀមខ្លួនរួចរាល់ដើម្បីធ្វើឱ្យគ្លីនិករបស់អ្នកកាន់តែទំនើបហើយឬនៅ?'
                : 'Ready to modernize your clinic operations today?'}
            </div>
            <div className="text-xs text-teal-200 font-sans">
              {isKm
                ? 'ចុះឈ្មោះសាកល្បងឥតគិតថ្លៃ ១៤ ថ្ងៃពេញ • មិនទាមទារកាតធនាគារ • ដំឡើងរួចរាល់ក្នុង ៦០ វិនាទី'
                : 'Start 14-day free trial • No credit card required • Ready in 60 seconds'}
            </div>
          </div>
          <Link
            href="/register"
            className="mt-4 md:mt-0 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-teal-900 hover:bg-stone-100 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 shrink-0"
          >
            <span>{isKm ? 'បង្កើត Workspace ឥឡូវនេះ' : 'Claim Your Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
