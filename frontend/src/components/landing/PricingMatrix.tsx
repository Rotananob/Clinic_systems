'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Building2,
  Zap,
} from 'lucide-react';

export interface PricingPlan {
  id: 'FREE' | 'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12';
  nameKh: string;
  nameEn: string;
  descKh: string;
  descEn: string;
  monthlyUsd: number;
  yearlyUsd: number;
  originalYearlyUsd: number;
  yearlySavingsUsd: number;
  equivalentMonthlyUsd: string;
  isPopular?: boolean;
  khqrLimitKh: string;
  khqrLimitEn: string;
  patientLimitKh: string;
  patientLimitEn: string;
  staffLimitKh: string;
  staffLimitEn: string;
  featuresKh: string[];
  featuresEn: string[];
}

export const PricingMatrix: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('PRO_8');

  const plans: PricingPlan[] = [
    {
      id: 'FREE',
      nameKh: 'គម្រោងសាកល្បង Free Starter',
      nameEn: 'Free Starter',
      descKh: 'ល្អបំផុតសម្រាប់គ្លីនិកតូច ឬគ្រូពេទ្យចាប់ផ្ដើមដំបូង ដើម្បីសាកល្បងមុខងារ។',
      descEn: 'Perfect for small medical cabinets or evaluation before upgrading.',
      monthlyUsd: 0,
      yearlyUsd: 0,
      originalYearlyUsd: 0,
      yearlySavingsUsd: 0,
      equivalentMonthlyUsd: '0.00',
      khqrLimitKh: '៥ ប្រតិបត្តិការ / ថ្ងៃ',
      khqrLimitEn: '5 dynamic QR / day',
      patientLimitKh: '៥០ នាក់ / គណនី',
      patientLimitEn: '50 patients / account',
      staffLimitKh: '២ គណនីបុគ្គលិក',
      staffLimitEn: '2 staff accounts',
      featuresKh: [
        'បង្កើត Dynamic KHQR កូតា ៥ ដង/ថ្ងៃ',
        'កត់ត្រាអ្នកជំងឺមូលដ្ឋាន ៥០ នាក់ / គណនី',
        'ចេញវិក្កយបត្រអេឡិចត្រូនិច',
        'ជំនួយតាមរយៈសហគមន៍ Community Support',
      ],
      featuresEn: [
        'Dynamic KHQR (5 transactions / day)',
        'Basic patient records (50 patients / account)',
        'Electronic invoice generator',
        'Community documentation support',
      ],
    },
    {
      id: 'STARTER_5',
      nameKh: 'គម្រោងស្ដង់ដារ Clinic Starter',
      nameEn: 'Clinic Starter 5$/mo',
      descKh: 'សម្រាប់គ្លីនិកឯកជនទូទៅដែលត្រូវការការទូទាត់ប្រាក់ KHQR និងការហៅអ្នកជំងឺជាសំឡេង។',
      descEn: 'For private outpatient practices requiring daily KHQR and voice queue calling.',
      monthlyUsd: 5,
      yearlyUsd: 48, // 20% discount ($4/mo)
      originalYearlyUsd: 60,
      yearlySavingsUsd: 12,
      equivalentMonthlyUsd: '4.00',
      khqrLimitKh: '២៥០ ប្រតិបត្តិការ / ថ្ងៃ',
      khqrLimitEn: '250 dynamic QR / day',
      patientLimitKh: '១,០០០ នាក់ / គណនី',
      patientLimitEn: '1,000 patients / account',
      staffLimitKh: '៥ គណនីបុគ្គលិក',
      staffLimitEn: '5 staff accounts',
      featuresKh: [
        'បង្កើត Dynamic KHQR ២៥០ ដង/ថ្ងៃ',
        'កត់ត្រាអ្នកជំងឺ ១,០០០ នាក់ / គណនី',
        'ហៅអ្នកជំងឺជាសំឡេងខ្មែរ Khmer Voice Queue',
        'គ្រប់គ្រងស្តុកឱសថស្ថានកម្រិតស្តង់ដារ',
        'Telegram Bot ជូនដំណឹងស្វ័យប្រវត្ត',
        'បោះពុម្ពវិក្កយបត្រតាមម៉ាស៊ីន Thermal 80mm',
      ],
      featuresEn: [
        'Dynamic KHQR (250 transactions / day)',
        '1,000 patient registrations / account',
        'Khmer audio voice queue announcement',
        'Medication inventory & stock tracking',
        'Automated Telegram alert bot',
        '80mm ESC/POS thermal printing & cash drawer',
      ],
    },
    {
      id: 'PRO_8',
      nameKh: 'គម្រោងវិជ្ជាជីវៈ Polyclinic Pro',
      nameEn: 'Polyclinic Pro 8$/mo',
      descKh: 'គម្រោងពេញនិយមបំផុតសម្រាប់មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ និងគ្លីនិកពិគ្រោះជំងឺច្រើនបន្ទប់។',
      descEn: 'Most popular tier for high-volume polyclinics and multi-consultant practices.',
      monthlyUsd: 8,
      yearlyUsd: 76, // 20% discount ($6.33/mo)
      originalYearlyUsd: 96,
      yearlySavingsUsd: 20,
      equivalentMonthlyUsd: '6.33',
      isPopular: true,
      khqrLimitKh: '១,៥០០ ប្រតិបត្តិការ / ថ្ងៃ',
      khqrLimitEn: '1,500 dynamic QR / day',
      patientLimitKh: '៥,០០០ នាក់ / គណនី',
      patientLimitEn: '5,000 patients / account',
      staffLimitKh: '១៥ គណនីបុគ្គលិក',
      staffLimitEn: '15 staff accounts',
      featuresKh: [
        'បង្កើត Dynamic KHQR ១,៥០០ ដង/ថ្ងៃ',
        'កត់ត្រាអ្នកជំងឺ ៥,០០០ នាក់ / គណនី',
        'Telegram Forum Topics ដាច់ដោយឡែក ៤ បន្ទប់',
        'ហៅអ្នកជំងឺជាសំឡេងខ្មែរច្រើនបន្ទប់ពិគ្រោះ',
        'របាយការណ៍ហិរញ្ញវត្ថុ និងវិភាគទិន្នន័យកម្រិតខ្ពស់',
        'ភ្ជាប់ម៉ាស៊ីនព្រីន POS បណ្ដាញជាច្រើនគ្រឿង',
        'ការគាំទ្រអាទិភាព ២៤/៧ Priority Support',
      ],
      featuresEn: [
        'Dynamic KHQR (1,500 transactions / day)',
        '5,000 patient registry / account',
        'Full Telegram Forum Topics (Payments, Queue, Pharmacy, Security)',
        'Multi-room Khmer voice queue calling',
        'Advanced financial analytics & export',
        'Multi-printer network POS support',
        'Priority 24/7 technical customer support',
      ],
    },
    {
      id: 'ENTERPRISE_12',
      nameKh: 'គម្រោងមន្ទីរពេទ្យ Hospital Enterprise',
      nameEn: 'Hospital Enterprise 12$/mo',
      descKh: 'សម្រាប់មន្ទីរសម្រាកព្យាបាលធំៗ និងបណ្ដាញគ្លីនិកដែលត្រូវការកូតា Unlimited ពេញលេញ។',
      descEn: 'For hospitals and medical centers requiring full unlimited throughput and custom subdomain.',
      monthlyUsd: 12,
      yearlyUsd: 115, // 20% discount ($9.58/mo)
      originalYearlyUsd: 144,
      yearlySavingsUsd: 29,
      equivalentMonthlyUsd: '9.58',
      khqrLimitKh: 'មិនកំណត់ចំនួន Unlimited',
      khqrLimitEn: 'Unlimited dynamic QR / day',
      patientLimitKh: 'មិនកំណត់ចំនួន / គណនី',
      patientLimitEn: 'Unlimited patients / account',
      staffLimitKh: 'មិនកំណត់ចំនួន Unlimited',
      staffLimitEn: 'Unlimited staff accounts',
      featuresKh: [
        'មិនកំណត់រាល់ប្រតិបត្តិការ KHQR Unlimited',
        'មិនកំណត់ចំនួនអ្នកជំងឺ និងបុគ្គលិក / គណនី',
        'ទទួលបាន Subdomain ផ្លូវការ ឧទាហរណ៍ yourclinic.clinic.com',
        'គ្រប់គ្រងសាខាច្រើន និងគ្រូពេទ្យឯកទេសច្រើនផ្នែក',
        'Dedicated Database Performance & Cloud Backup',
        'ជំនួយពិសេសផ្ទាល់តាមទូរស័ព្ទ និង Telegram 24/7 VIP SLA',
      ],
      featuresEn: [
        'Unlimited dynamic KHQR transactions',
        'Unlimited patients and staff accounts',
        'Dedicated custom subdomain (e.g. yourclinic.clinic.com)',
        'Multi-branch & multi-department routing',
        'Dedicated high-performance database instance',
        '24/7 VIP Phone and Telegram SLA support',
      ],
    },
  ];

  const faqs = [
    {
      qKh: 'តើខ្ញុំអាចចាប់ផ្ដើមប្រើប្រាស់គម្រោងដោយរបៀបណា?',
      qEn: 'How do I get started with a plan?',
      aKh: 'លោកអ្នកគ្រាន់តែចុះឈ្មោះបង្កើតគណនីគ្លីនិក រួចបញ្ចូល Bakong Account ID ឬ ABA Merchant Link របស់លោកអ្នក ដែលទទួលបាន Free ពី ABA Mobile App ក្នុងរយៈពេល ៣០ វិនាទី នោះប្រព័ន្ធនឹងដំណើរការភ្លាមៗ។',
      aEn: 'Simply register your clinic workspace, enter your Bakong Account ID or ABA Merchant Link (which you can generate for free from your ABA Mobile App in 30 seconds), and your workspace is live immediately.',
    },
    {
      qKh: 'តើប្រាក់ដែលអ្នកជំងឺស្កេនបង់ ចូលទៅគណនីធនាគារណា?',
      qEn: 'Where do patient payments settle?',
      aKh: 'ប្រាក់ដែលអ្នកជំងឺស្កេនបង់តាម Dynamic KHQR នឹងហូរចូលគណនីធនាគាររបស់គ្លីនិកលោកអ្នកដោយផ្ទាល់ ១០០% ភ្លាមៗ គ្មានការកាត់កម្រៃជើងសារពី Platform ឡើយ។',
      aEn: '100% of patient payments settle directly into your clinic bank account immediately. The platform does not deduct any transaction commissions.',
    },
    {
      qKh: 'តើខ្ញុំអាចផ្លាស់ប្តូរ ឬ Upgrade គម្រោងនៅពេលណា?',
      qEn: 'Can I upgrade or change my plan anytime?',
      aKh: 'លោកអ្នកអាច Upgrade គម្រោងបានគ្រប់ពេលវេលាពីក្នុង Dashboard គ្លីនិក។ ប្រព័ន្ធនឹងគណនាសុពលភាព និងកូតាថ្មីជូនលោកអ្នកភ្លាមៗ។',
      aEn: 'You can upgrade or modify your plan tier at any time from your clinic dashboard. New quotas take effect instantly.',
    },
    {
      qKh: 'តើទិន្នន័យអ្នកជំងឺរបស់ខ្ញុំមានសុវត្ថិភាពកម្រិតណា?',
      qEn: 'How is patient medical data protected?',
      aKh: 'ប្រព័ន្ធដំណើរការលើ Multi-Tenant Architecture ដាច់ដោយឡែកពីគ្នា ១០០% ស្របតាមស្តង់ដារវេជ្ជសាស្ត្រអន្តរជាតិ។ គ្មានគ្លីនិកណាផ្សេងអាចមើលឃើញទិន្នន័យរបស់លោកអ្នកបានឡើយ។',
      aEn: 'The platform enforces strict multi-tenant isolation. Patient vitals and clinical records of your clinic are cryptographically protected and completely inaccessible to other clinics.',
    },
  ];

  return (
    <div id="pricing" className="py-12 md:py-20 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
          <span>{isKm ? 'តារាងតម្លៃសមរម្យ និងតម្លាភាព' : 'Transparent & Predictable Pricing'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
          {isKm
            ? 'ជ្រើសរើសគម្រោងដែលសមស្របនឹងទំហំគ្លីនិករបស់អ្នក'
            : 'Find the Perfect Plan for Your Clinical Practice'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl mx-auto">
          {isKm
            ? 'គម្រោងតម្លៃសមរម្យបំផុតនៅកម្ពុជា គ្មានការគិតកម្រៃបន្ថែមលើប្រតិបត្តិការទូទាត់ KHQR ឡើយ។ អាចសាកល្បងឥតគិតថ្លៃបាន។'
            : 'Affordable monthly subscription with 0% transaction commission. Upgrade, downgrade, or cancel at any time.'}
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-[#EBE4D5] border border-[#DDD3C2] text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                !isAnnual
                  ? 'bg-white text-stone-900 shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900 font-bold'
              }`}
            >
              {isKm ? 'បង់ប្រចាំខែ' : 'Billed Monthly'}
            </button>

            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                isAnnual
                  ? 'bg-teal-800 text-white shadow-md font-black'
                  : 'text-stone-600 hover:text-stone-900 font-bold'
              }`}
            >
              <span>{isKm ? 'បង់ប្រចាំឆ្នាំ' : 'Billed Annually'}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${
                  isAnnual
                    ? 'bg-amber-400 text-stone-950 shadow-xs ring-1 ring-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isKm ? 'ចុះ ២០% សន្សំ ២ ខែ' : 'Save 20% (2 Months Free)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Pricing Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((p) => {
          const isSelected = selectedPlanId === p.id;

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#FDFBF7] border-2 border-teal-800 shadow-xl ring-4 ring-teal-700/25 scale-[1.01]'
                  : p.isPopular
                  ? 'bg-[#FDFBF7] border-2 border-teal-700/70 shadow-md ring-2 ring-teal-700/10 hover:shadow-lg'
                  : 'bg-[#FDFBF7] border border-[#E3DBCB] shadow-2xs hover:shadow-md hover:border-stone-400'
              }`}
            >
              {isSelected ? (
                <div className="absolute -top-3.5 right-6 px-3 py-1 bg-teal-800 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 border border-teal-900 animate-in fade-in zoom-in duration-150">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{isKm ? 'បានជ្រើសរើស' : 'Selected'}</span>
                </div>
              ) : p.isPopular ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-teal-800 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-xs">
                  {isKm ? 'ពេញនិយមបំផុត' : 'Most Popular'}
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <h3 className={`text-base font-sans transition-colors ${isSelected ? 'font-black text-teal-950' : 'font-bold text-stone-900'}`}>
                    {isKm ? p.nameKh : p.nameEn}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-1 min-h-[32px] leading-relaxed">
                    {isKm ? p.descKh : p.descEn}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 border-t border-[#EFEAE0]">
                  {p.id === 'FREE' ? (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-3xl sm:text-4xl font-black font-sans tracking-tight ${
                            isSelected ? 'text-teal-950' : 'text-stone-900'
                          }`}
                        >
                          $0
                        </span>
                        <span className="text-xs font-bold text-stone-500">
                          {isKm ? 'ឥតគិតថ្លៃរហូត' : 'Free forever'}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium mt-1">
                        {isKm ? 'សាកល្បងដោយគ្មានការប្តេជ្ញាចិត្ត' : 'No credit card required'}
                      </div>
                    </div>
                  ) : isAnnual ? (
                    <div>
                      {/* Original price strike-through + discount badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className="text-xs font-bold text-stone-400 line-through decoration-rose-500 decoration-2 font-mono">
                          ${p.originalYearlyUsd}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                          {isKm ? 'ចុះ ២០%' : '20% OFF'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {isKm ? `សន្សំ $${p.yearlySavingsUsd}/ឆ្នាំ` : `Save $${p.yearlySavingsUsd}/yr`}
                        </span>
                      </div>

                      {/* Prominent Hero Yearly Price */}
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-4xl sm:text-5xl font-black font-sans tracking-tight ${
                            isSelected ? 'text-teal-950' : 'text-teal-900'
                          }`}
                        >
                          ${p.yearlyUsd}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-stone-900 leading-tight">
                            {isKm ? '/ ឆ្នាំ' : '/ year'}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700">
                            {isKm ? 'គិតជាឆ្នាំ' : 'Billed annually'}
                          </span>
                        </div>
                      </div>

                      {/* Equivalent monthly breakdown banner */}
                      <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/80 text-[11px] text-emerald-950 font-semibold flex items-center justify-between">
                        <span>
                          {isKm ? 'ស្មើនឹង: ' : 'Equivalent: '}
                          <strong className="font-black text-emerald-900 font-mono">
                            ${p.equivalentMonthlyUsd}
                          </strong>
                          {isKm ? ' / ខែ' : ' / mo'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-700 text-white font-extrabold text-[9px]">
                          {isKm ? 'ចំណេញ ២ ខែ' : '2 Mo Free'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Monthly pricing with yearly incentive hint */}
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-3xl sm:text-4xl font-extrabold font-sans tracking-tight ${
                            isSelected ? 'text-teal-950' : 'text-stone-900'
                          }`}
                        >
                          ${p.monthlyUsd}
                        </span>
                        <span className="text-xs font-bold text-stone-600">
                          {isKm ? '/ ខែ' : '/ month'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500 font-medium">
                        <span>
                          {isKm ? `សរុប $${p.originalYearlyUsd}/ឆ្នាំ` : `$${p.originalYearlyUsd}/yr full price`}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAnnual(true);
                          }}
                          className="text-[10px] font-bold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer"
                        >
                          {isKm ? 'បង់ប្រចាំឆ្នាំ សន្សំ ២០%' : 'Switch to annual, save 20%'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Key Quota Highlights */}
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#EAE3D5] text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="text-[11px] font-medium">{isKm ? 'កូតា KHQR:' : 'KHQR Daily:'}</span>
                    <span className={`text-[11px] ${isSelected ? 'font-black text-teal-950' : 'font-bold text-stone-900'}`}>
                      {isKm ? p.khqrLimitKh : p.khqrLimitEn}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="text-[11px] font-medium">{isKm ? 'កូតាអ្នកជំងឺ:' : 'Patients:'}</span>
                    <span className={`text-[11px] ${isSelected ? 'font-black text-teal-950' : 'font-bold text-stone-900'}`}>
                      {isKm ? p.patientLimitKh : p.patientLimitEn}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span className="text-[11px] font-medium">{isKm ? 'គណនីបុគ្គលិក:' : 'Staff Users:'}</span>
                    <span className={`text-[11px] ${isSelected ? 'font-black text-teal-950' : 'font-bold text-stone-900'}`}>
                      {isKm ? p.staffLimitKh : p.staffLimitEn}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    {isKm ? 'មុខងាររួមមាន:' : 'Features Included:'}
                  </div>
                  <ul className="space-y-2 text-xs text-stone-600">
                    {(isKm ? p.featuresKh : p.featuresEn).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-700 mt-0.5 shrink-0 font-bold" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <Link
                  href={`/register?plan=${p.id}${isAnnual ? '&billing=yearly' : '&billing=monthly'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanId(p.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-teal-800 hover:bg-teal-900 text-white shadow-md ring-2 ring-teal-700/30'
                      : p.isPopular
                      ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                      : 'bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-800 border border-[#DFD6C6]'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="font-black">
                        {p.id === 'FREE'
                          ? isKm ? 'បានជ្រើសរើស ចាប់ផ្ដើម Free' : 'Selected Start Free'
                          : isAnnual
                          ? isKm ? `បានជ្រើសរើស ចុះឈ្មោះ ${p.yearlyUsd}/ឆ្នាំ` : `Selected Register (${p.yearlyUsd}/yr)`
                          : isKm ? `បានជ្រើសរើស ចុះឈ្មោះ ${p.monthlyUsd}/ខែ` : `Selected Register (${p.monthlyUsd}/mo)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold">
                        {p.id === 'FREE'
                          ? isKm ? 'ចាប់ផ្ដើមដោយឥតគិតថ្លៃ' : 'Start Free Trial'
                          : isAnnual
                          ? isKm ? `ជ្រើសរើស ${p.yearlyUsd}/ឆ្នាំ` : `Select Plan (${p.yearlyUsd}/yr)`
                          : isKm ? `ជ្រើសរើស ${p.monthlyUsd}/ខែ` : `Select Plan (${p.monthlyUsd}/mo)`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      {!compact && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="bg-[#FDFBF7] rounded-3xl border border-[#E3DBCB] shadow-xs overflow-hidden">
            <div className="p-6 border-b border-[#EAE3D5]">
              <h3 className="text-lg font-bold text-stone-900">
                {isKm ? 'តារាងប្រៀបធៀបមុខងារលម្អិត' : 'Detailed Feature Comparison Matrix'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {isKm
                  ? 'ប្រៀបធៀបរាល់សមត្ថភាព និងដែនកំណត់តាមកម្រិតគម្រោងនីមួយៗ'
                  : 'Compare technical quotas and support levels across all subscription tiers.'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-[#FAF7F2] border-b border-[#EAE3D5] text-[11px] font-bold text-stone-600 uppercase">
                  <tr>
                    <th className="p-4 w-1/3">{isKm ? 'លក្ខណៈពិសេស' : 'Capability'}</th>
                    <th className="p-4 text-center">Free Starter</th>
                    <th className="p-4 text-center">Clinic Starter $5</th>
                    <th className="p-4 text-center bg-teal-50/50 text-teal-900 font-extrabold">Polyclinic Pro $8</th>
                    <th className="p-4 text-center">Hospital Enterprise $12</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D5]">
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'កូតាប្រតិបត្តិការ KHQR' : 'Dynamic KHQR Daily Limit'}</td>
                    <td className="p-4 text-center font-mono">5 / ថ្ងៃ</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800">250 / ថ្ងៃ</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800 bg-teal-50/30">1,500 / ថ្ងៃ</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'កូតាអ្នកជំងឺក្នុងមួយគណនី' : 'Patient Records / Account'}</td>
                    <td className="p-4 text-center font-mono">50 នាក់ / គណនី</td>
                    <td className="p-4 text-center font-mono">1,000 នាក់ / គណនី</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800 bg-teal-50/30">5,000 នាក់ / គណនី</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ចំនួនគណនីបុគ្គលិក' : 'Staff Accounts'}</td>
                    <td className="p-4 text-center font-mono">2</td>
                    <td className="p-4 text-center font-mono">5</td>
                    <td className="p-4 text-center font-mono bg-teal-50/30">15</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ហៅអ្នកជំងឺជាសំឡេងខ្មែរ' : 'Khmer Audio Voice Queue'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'Telegram Forum Topics Bridge' : 'Telegram Forum Topics'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-600">{isKm ? 'មូលដ្ឋាន' : 'Standard'}</td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30">4 Topics (Full)</td>
                    <td className="p-4 text-center text-teal-800 font-bold">4 Topics (Full)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ម៉ាស៊ីនព្រីន 80mm & ថតប្រាក់' : '80mm POS Thermal Printing'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'Dedicated Custom Subdomain' : 'Custom Subdomain'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300 bg-teal-50/30"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'កម្រិតសេវាគាំទ្របច្ចេកទេស' : 'Support SLA'}</td>
                    <td className="p-4 text-center text-stone-500">Community</td>
                    <td className="p-4 text-center text-stone-700">Email & Docs</td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30">Priority 24/7</td>
                    <td className="p-4 text-center text-teal-800 font-bold">VIP 24/7 Phone & Telegram</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Accordion */}
      {!compact && (
        <div id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {isKm ? 'សំណួរដែលសួរញឹកញាប់ (FAQ)' : 'Frequently Asked Questions'}
            </h3>
            <p className="text-xs text-stone-600">
              {isKm
                ? 'ចម្លើយច្បាស់ៗអំពីការប្រើប្រាស់ ការទូទាត់ និងសន្តិសុខទិន្នន័យ'
                : 'Clear answers about onboarding, KHQR settlement, and tenant security.'}
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#E7DFCF] bg-[#FDFBF7] overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-stone-900 hover:text-teal-800 transition-colors"
                  >
                    <span>{isKm ? faq.qKh : faq.qEn}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-500 transition-transform ${
                        isOpen ? 'rotate-180 text-teal-800' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-stone-600 leading-relaxed border-t border-[#F0EAE0] pt-3">
                      {isKm ? faq.aKh : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
