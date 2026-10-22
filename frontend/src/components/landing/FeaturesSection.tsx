'use client';

import React from 'react';
import { useTranslation } from '../../context/I18nContext';
import {
  QrCode,
  Volume2,
  Send,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Zap,
  HardDrive,
  Users,
  Building,
  KeyRound,
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const features = [
    {
      icon: QrCode,
      titleKh: 'បង្កើត Dynamic KHQR ត្រឹមតែ ២ វិនាទី',
      titleEn: 'Instant Dynamic KHQR Engine',
      descKh:
        'បង្កើត Dynamic KHQR ចាក់សោចំនួនទឹកប្រាក់ និងលេខវិក្កយបត្រស្វ័យប្រវត្តដើម្បីការពារកុំឱ្យបន្លំ ឬច្រឡំ។ អតិថិជនស្កេនបង់តាម ABA Mobile, Bakong ឬ App ធនាគារណាក៏បាន ដោយលុយចូលគណនីគ្លីនិកផ្ទាល់ ១០០% គ្មានកាត់កម្រៃជើងសារ។',
      descEn:
        'Automated Dynamic KHQR with locked exact invoice amount to eliminate fraud. Patients pay via ABA Mobile or Bakong app; funds settle directly to your clinic bank account with 0% platform fee.',
      badge: 'Bakong EMVCo',
    },
    {
      icon: Volume2,
      titleKh: 'ប្រព័ន្ធហៅអ្នកជំងឺជាសំឡេងខ្មែរស្វ័យប្រវត្ត',
      titleEn: 'Natural Khmer Audio Voice Calling',
      descKh:
        'គ្រាន់តែចុច Call លើកុំព្យូទ័ររបស់គ្រូពេទ្យ ប្រព័ន្ធនឹងបន្លឺសំឡេងហៅលេខ និងបន្ទប់ពិគ្រោះជាភាសាខ្មែរតាម Speaker ក្នុងបន្ទប់រង់ចាំ ជួយកាត់បន្ថយភាពរញ៉េរញ៉ៃ និងបង្កើនសណ្ដាប់ធ្នាប់។',
      descEn:
        '1-click patient calling announces queue numbers and consulting rooms in crystal clear native Khmer audio speech to waiting area speakers.',
      badge: 'Native Khmer Audio',
    },
    {
      icon: Send,
      titleKh: 'បាញ់ដំណឹងស្វ័យប្រវត្តតាម Telegram Topics',
      titleEn: 'Telegram Forum Topics Multi-Channel',
      descKh:
        'ដំណឹងការទូទាត់ប្រាក់ KHQR, វេនអ្នកជំងឺចូលពិនិត្យ, ស្តុកថ្នាំជិតអស់, និងសន្តិសុខ ត្រូវបានបាញ់ចូល Topic ដាច់ដោយឡែកពីគ្នាក្នុង Telegram គ្លីនិក ជាមួយប្រព័ន្ធ Dual-Bot Lock ការពារ Hacker។',
      descEn:
        'Real-time alerts for payment settlement, patient queue check-in, pharmacy low stock, and system security organized neatly into Telegram forum topics.',
      badge: 'Dual-Bot Security',
    },
    {
      icon: HardDrive,
      titleKh: 'Local-First Offline Sync & ESC/POS Hardware',
      titleEn: 'Offline Resilience & POS Printing',
      descKh:
        'ដំណើរការបានជាប្រក្រតីទោះបីដាច់អ៊ីនធឺណិត ដោយសារប្រព័ន្ធរក្សាទុកលើ IndexedDB និង Sync ពេលមាន Online វិញ។ គាំទ្រការព្រីនវិក្កយបត្រ 80mm និងបញ្ជាបើកថតប្រាក់ភ្លាមៗ។',
      descEn:
        'Operates smoothly even during internet outages via local IndexedDB caching. Direct TCP and USB printing to 80mm ESC/POS thermal printers and RJ11 cash drawers.',
      badge: 'Local-First Sync',
    },
    {
      icon: FileSpreadsheet,
      titleKh: 'គ្រប់គ្រងអ្នកជំងឺ ស្តុកឱសថ និងវេជ្ជបញ្ជា',
      titleEn: 'Complete Patient EMR & Pharmacy Inventory',
      descKh:
        'កត់ត្រាប្រវត្តិព្យាបាល, គណនាសញ្ញាជីវិត - BMI, សម្ពាធឈាម, ចេញវេជ្ជបញ្ជាអេឡិចត្រូនិក, និងដាស់តឿនស្វ័យប្រវត្តពេលថ្នាំជិតអស់ស្តុក ដើម្បីឱ្យគ្លីនិកគ្រប់គ្រងបានរលូន ២៤/៧។',
      descEn:
        'Comprehensive clinical record keeping, vitals indexing, multi-item electronic prescriptions, and automated low-stock inventory alerts for 24/7 reliability.',
      badge: 'Clinical EMR',
    },
    {
      icon: ShieldCheck,
      titleKh: 'សន្តិសុខទិន្នន័យវេជ្ជសាស្ត្រកម្រិត Multi-Tenant',
      titleEn: 'HIPAA-Grade Multi-Tenant Isolation',
      descKh:
        'រាល់ទិន្នន័យអ្នកជំងឺ និងប្រតិបត្តិការហិរញ្ញវត្ថុ ត្រូវបានញែកដាច់ពីគ្នា ១០០% តាមរយៈ Tenant Isolation Layer។ គ្មានគ្លីនិកណាអាចមើលឃើញទិន្នន័យរបស់គ្លីនិកផ្សេងបានឡើយ។',
      descEn:
        'Strict tenant-level cryptographic and Prisma schema isolation. Zero cross-tenant data leakage guaranteed by automated tenant-context middlewares.',
      badge: 'Data Isolated',
    },
  ];

  const steps = [
    {
      num: '01',
      titleKh: 'ចុះឈ្មោះបង្កើត Workspace គ្លីនិក',
      titleEn: 'Register Clinic Workspace',
      descKh: 'បញ្ចូលឈ្មោះគ្លីនិក លេខទូរស័ព្ទ និងអ៊ីមែលអ្នកគ្រប់គ្រង ត្រឹមតែ ៣០ វិនាទី។',
      descEn: 'Enter clinic name, contact phone, and admin credentials in under 30 seconds.',
    },
    {
      num: '02',
      titleKh: 'Paste Link ឬ Bakong ID របស់គ្លីនិក',
      titleEn: 'Paste ABA Merchant Link or Bakong ID',
      descKh: 'យក Merchant Link ឬ Bakong Account ID ពី ABA App មកដាក់ក្នុងប្រអប់ Setup។',
      descEn: 'Copy your ABA Merchant Link or Bakong ID from mobile banking into the setup box.',
    },
    {
      num: '03',
      titleKh: 'ចាប់ផ្ដើមបង្កើត KHQR & គ្រប់គ្រងគ្លីនិក',
      titleEn: 'Start Processing KHQR & Patients',
      descKh: 'ប្រព័ន្ធដំណើរការភ្លាមៗ បង្កើត KHQR ហៅអ្នកជំងឺ និងបោះពុម្ពវិក្កយបត្រដោយរលូន!។',
      descEn: 'Platform is immediately active: generate dynamic KHQR, announce queue, and print receipts.',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-[#FAF7F2] border-t border-[#EAE3D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            <span>{isKm ? 'លក្ខណៈពិសេសកម្រិតខ្ពស់' : 'Enterprise Capabilities'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {isKm
              ? 'បំពាក់បច្ចេកវិទ្យាទំនើប ដើម្បីជំរុញប្រសិទ្ធភាពគ្លីនិករបស់អ្នក'
              : 'Engineered for Cambodian Clinics, Polyclinics, and Hospitals'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {isKm
              ? 'គ្រប់មុខងារទាំងអស់ត្រូវបានរៀបចំឡើងយ៉ាងផ្ចិតផ្ចង់ ដោយរួមបញ្ចូលទាំងការទូទាត់ប្រាក់ ជួរអ្នកជំងឺ ឱសថស្ថាន និងសន្តិសុខទិន្នន័យ។'
              : 'Everything you need to run high-throughput clinic operations seamlessly: KHQR payments, queue management, pharmacy, and data security.'}
          </p>
        </div>

        {/* 6 Grid Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#E7E0D2] shadow-2xs hover:shadow-md transition-all hover:border-[#D8CFBF] space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-800/10 text-teal-800 flex items-center justify-center group-hover:bg-teal-800 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAE2D2] text-stone-700">
                    {f.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug">
                  {isKm ? f.titleKh : f.titleEn}
                </h3>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {isKm ? f.descKh : f.descEn}
                </p>
              </div>
            );
          })}
        </div>

        {/* How It Works in 3 Steps */}
        <div id="how-it-works" className="pt-10 border-t border-[#EAE3D5]">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {isKm ? 'ចាប់ផ្ដើមប្រើប្រាស់ក្នុងរយៈពេលត្រឹមតែ ៦០ វិនាទី' : 'Get Started in Under 60 Seconds'}
            </h3>
            <p className="text-xs text-stone-600">
              {isKm
                ? 'មិនត្រូវការការដំឡើងស្មុគស្មាញឡើយ គ្រាន់តែអនុវត្តតាម ៣ ជំហានងាយៗខាងក្រោម៖'
                : 'Zero complex setup or IT hardware required. Simple 3-step instant onboarding.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#FDFBF7] border border-[#E7E0D2] shadow-2xs space-y-3 relative"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-teal-400 font-mono font-bold flex items-center justify-center text-sm shadow-xs">
                  {s.num}
                </div>
                <h4 className="text-sm font-bold text-stone-900">
                  {isKm ? s.titleKh : s.titleEn}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isKm ? s.descKh : s.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
