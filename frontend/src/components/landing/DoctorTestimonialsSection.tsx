'use client';

import React from 'react';
import { useTranslation } from '../../context/I18nContext';
import {
  Quote,
  Building2,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Stethoscope,
  Zap,
  CreditCard,
} from 'lucide-react';

export const DoctorTestimonialsSection: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const testimonials = [
    {
      nameKh: 'វេជ្ជបណ្ឌិត ចាន់ សុវណ្ណ',
      nameEn: 'Dr. Chan Sovann, MD',
      roleKh: 'ប្រធានគ្លីនិក សុខភាពរុងរឿង - រាជធានីភ្នំពេញ',
      roleEn: 'Founder, Sokhapheap Rungroeung Clinic (Phnom Penh)',
      disciplineKh: 'គ្លីនិកពិគ្រោះជំងឺទូទៅ & OPD',
      disciplineEn: 'General Outpatient Practice',
      feedbackKh:
        'ពីមុនគ្លីនិកខ្ញុំមានអ្នកជំងឺច្រើន តែតុទទួលភ្ញៀវរញ៉េរញ៉ៃណាស់ ស្រែកហៅអ្នកជំងឺឡើងស្អកក ហើយពេលភ្ញៀវស្កេនបង់លុយតាម QR ក្រដាស ជួនកាលវាយលុយខ្វះ ពិបាកផ្ទៀងផ្ទាត់។ តាំងពីប្តូរមកប្រើ KruPet មក ការហៅអ្នកជំងឺបន្លឺតាម Speaker យ៉ាងស្រួល ហើយ Dynamic KHQR ចេញលឿនត្រឹម ២ វិនាទី លុយចូលកុង ABA របស់ខ្ញុំផ្ទាល់ ១០០% គ្មានខុសសូម្បីតែ ១ រៀល!',
      feedbackEn:
        'Before KruPet, our front desk was chaotic with nurses shouting names and paper QR stickers causing payment discrepancies. Now, 1-click Khmer voice queue announcements and 2-second dynamic KHQR settle funds straight to my ABA bank account with zero errors.',
      badgeKh: 'ប្រើប្រាស់ជាង ៨ ខែ',
      badgeEn: 'Active for 8+ months',
    },
    {
      nameKh: 'វេជ្ជបណ្ឌិត ហេង សិរី',
      nameEn: 'Dr. Heng Serey, MD, MPH',
      roleKh: 'នាយកមន្ទីរសម្រាកព្យាបាលមិត្តភាព - ខេត្តបាត់ដំបង',
      roleEn: 'Medical Director, Mittapheap Polyclinic (Battambang)',
      disciplineKh: 'មន្ទីរសម្រាកព្យាបាល & ពហុឯកទេស',
      disciplineEn: 'Polyclinic & Inpatient Care',
      feedbackKh:
        'មុខងារ AI Voice Dictation ជំនាន់ក្រោយដ៏វ័យឆ្លាត ជួយគ្រូពេទ្យក្នុងមន្ទីរសម្រាកព្យាបាលរបស់ខ្ញុំបានច្រើនបំផុត! គ្រូពេទ្យគ្រាន់តែនិយាយជាភាសាខ្មែរ ប្រព័ន្ធរៀបចំជាទម្រង់ SOAP និងកូដជំងឺ ICD-11 ត្រឹមត្រូវតាមក្បួនក្រសួងសុខាភិបាល។ លើសពីនេះ របាយការណ៍បាញ់ចូល Telegram ធ្វើឱ្យខ្ញុំនៅទីណាក៏ដឹងពីចំណូល និងចំនួនអ្នកជំងឺគ្រប់វិនាទី។',
      feedbackEn:
        'Next-Gen Intelligent AI Voice Dictation is a game changer for our inpatient teams. Doctors dictate clinical observations in Khmer, and structured SOAP notes with ICD-11 codes are generated instantly. The Telegram forum bridge gives me 100% real-time oversight.',
      badgeKh: 'ពហុបន្ទប់ពិគ្រោះ & គ្រែសម្រាក',
      badgeEn: 'Multi-Room & IPD Beds',
    },
    {
      nameKh: 'ទន្តបណ្ឌិត កែវ ពេជ្រ',
      nameEn: 'Dr. Keo Pich, DDS',
      roleKh: 'ម្ចាស់គ្លីនិកព្យាបាលធ្មេញ ស្មាយ - ខេត្តសៀមរាប',
      roleEn: 'Principal Dentist, Smile Dental Clinic (Siem Reap)',
      disciplineKh: 'ទន្តសាស្ត្រ & សោភ័ណភាពធ្មេញ',
      disciplineEn: 'Dental & Orthodontics',
      feedbackKh:
        'ការគ្រប់គ្រងវេនអ្នកជំងឺ និងការកត់ត្រាប្រវត្តិព្យាបាលធ្មេញរលូនខ្លាំង។ ខ្ញុំចូលចិត្តត្រង់ថា មិនបាច់ដំឡើង App អ្វីស្មុគស្មាញទេ បើកលើ iPad ឬកុំព្យូទ័រណាក៏ដើរលឿន។ បុគ្គលិកខ្ញុំចេះប្រើប្រាស់ត្រឹមតែ ១០ នាទីដំបូងប៉ុណ្ណោះ ព្រោះទម្រង់បង្កើតឡើងស័ក្តិសមជាមួយវប្បធម៌ខ្មែរ។',
      feedbackEn:
        'Managing dental chair queues and patient charting is completely fluid. I love that zero software installation is required; it runs flawlessly on iPads and laptops. My staff learned the entire interface in less than 10 minutes.',
      badgeKh: 'ដំណើរការលើ iPad & PC',
      badgeEn: 'Runs on iPad & PC',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F2ECE1] border-b border-[#E2D8C7] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D5CDBD] text-stone-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-800" />
            <span>
              {isKm
                ? 'សំឡេងពិតពីវេជ្ជបណ្ឌិត • Real Physician Testimonials'
                : 'Physician Feedback • Clinical Community Trust'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight font-sans">
            {isKm
              ? 'ការជឿជាក់ពីសំណាក់វេជ្ជបណ្ឌិត និងម្ចាស់គ្លីនិកទូទាំងប្រទេស'
              : 'Trusted by Doctors & Healthcare Directors Across Cambodia'}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            {isKm
              ? 'ស្តាប់ការចែករំលែកបទពិសោធន៍ផ្ទាល់ពីអ្នកប្រើប្រាស់ជាក់ស្តែងដែលបានធ្វើទំនើបកម្មគ្លីនិករបស់ពួកគេជាមួយ KruPet។'
              : 'Discover how healthcare clinics elevate patient care and eliminate cashier friction with our PaaS workspace.'}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-[#DFD6C6] shadow-sm p-6 sm:p-7 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow relative"
            >
              <div className="space-y-4">
                {/* Top Discipline Tag & Quote Icon */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl">
                    {isKm ? t.disciplineKh : t.disciplineEn}
                  </span>
                  <Quote className="w-6 h-6 text-stone-300" />
                </div>

                {/* Quote Content */}
                <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed font-sans italic">
                  "{isKm ? t.feedbackKh : t.feedbackEn}"
                </p>
              </div>

              {/* Doctor Details */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900 font-sans">
                    {isKm ? t.nameKh : t.nameEn}
                  </div>
                  <div className="text-[11px] text-stone-500 font-sans">
                    {isKm ? t.roleKh : t.roleEn}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cambodia Nationwide Deployment & System Capabilities */}
        <div className="mt-14 bg-gradient-to-b from-white via-[#FCFAF7] to-[#F7F3EB] rounded-3xl border border-[#D8CEBE] p-6 sm:p-8 shadow-sm">
          {/* Top Live Status Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#EAE2D5]">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-xs font-bold text-stone-800 tracking-tight font-sans">
                {isKm
                  ? 'ដំណើរការទូទាំងប្រទេស • ត្រៀមរួចរាល់សម្រាប់គ្លីនិកគ្រប់ ២៥ រាជធានី-ខេត្ត'
                  : 'Nationwide Clinical Deployment • Ready Across All 25 Cambodian Provinces'}
              </span>
            </div>
            <div className="text-[11px] font-semibold text-teal-800 font-mono bg-teal-50/80 px-2.5 py-1 rounded-full border border-teal-200/60">
              {isKm ? 'ប្រព័ន្ធ Cloud PaaS ក្នុងស្រុក ១០០%' : '100% Cloud-Native Clinical OS'}
            </div>
          </div>

          {/* 4 Sleek Interactive Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. 25 Provinces */}
            <div className="group bg-white rounded-2xl border border-[#E3DCCE] hover:border-teal-700/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 group-hover:bg-teal-50 group-hover:text-teal-800 transition-colors">
                    {isKm ? 'ទូទាំងប្រទេស' : 'Nationwide'}
                  </span>
                </div>
                <div className="mt-4 text-3xl sm:text-4xl font-black text-stone-900 group-hover:text-teal-900 font-mono tracking-tight">
                  25
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-stone-800 font-sans">
                  {isKm ? 'ដំណើរការ ២៥ រាជធានី-ខេត្ត' : '25 Provinces & Capital'}
                </div>
                <p className="mt-1.5 text-xs text-stone-500 font-sans leading-relaxed">
                  {isKm
                    ? 'គ្លីនិកឯកជន និងមន្ទីរសម្រាកព្យាបាលទូទាំងកម្ពុជា អាចចុះឈ្មោះប្រើប្រាស់បានភ្លាមៗ'
                    : 'Open for immediate self-service onboarding for medical clinics across Cambodia.'}
                </p>
              </div>
            </div>

            {/* 2. 1-Minute Rapid Deploy */}
            <div className="group bg-white rounded-2xl border border-[#E3DCCE] hover:border-teal-700/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 group-hover:bg-amber-50 group-hover:text-amber-800 transition-colors">
                    {isKm ? 'គ្មានការដំឡើង' : 'Zero Setup'}
                  </span>
                </div>
                <div className="mt-4 text-3xl sm:text-4xl font-black text-stone-900 group-hover:text-teal-900 font-mono tracking-tight">
                  1-Min
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-stone-800 font-sans">
                  {isKm ? 'រៀបចំរួចរាល់ក្នុង ១ នាទី' : 'Instant 1-Minute Setup'}
                </div>
                <p className="mt-1.5 text-xs text-stone-500 font-sans leading-relaxed">
                  {isKm
                    ? 'ចុះឈ្មោះ និងបង្កើត Workspace គ្លីនិកភ្លាមៗ ដំណើរការស្រួលលើ Browser និង iPad'
                    : 'Provision independent multi-tenant clinical workspace in under 60 seconds.'}
                </p>
              </div>
            </div>

            {/* 3. 2-Second Dynamic KHQR */}
            <div className="group bg-white rounded-2xl border border-[#E3DCCE] hover:border-teal-700/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 group-hover:bg-teal-50 group-hover:text-teal-800 transition-colors">
                    {isKm ? 'បាគង & ABA' : 'Bakong KHQR'}
                  </span>
                </div>
                <div className="mt-4 text-3xl sm:text-4xl font-black text-teal-900 font-mono tracking-tight">
                  2-Sec
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-stone-800 font-sans">
                  {isKm ? 'ល្បឿន Dynamic KHQR' : 'Dynamic KHQR Speed'}
                </div>
                <p className="mt-1.5 text-xs text-stone-500 font-sans leading-relaxed">
                  {isKm
                    ? 'បង្កើត QR ចាក់សោទឹកប្រាក់ស្វ័យប្រវត្តិ ធានាគ្មានការភ័ន្តច្រឡំ ឬបាញ់លុយខ្វះ'
                    : 'Automated amount-locking QR generated in 2 seconds with zero cashier errors.'}
                </p>
              </div>
            </div>

            {/* 4. 0% Commission */}
            <div className="group bg-white rounded-2xl border border-[#E3DCCE] hover:border-emerald-700/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-800 transition-colors">
                    {isKm ? 'លុយចូលកុងផ្ទាល់' : '100% Direct'}
                  </span>
                </div>
                <div className="mt-4 text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
                  0%
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-stone-800 font-sans">
                  {isKm ? 'កម្រៃជើងសារ ០%' : 'Zero Platform Commission'}
                </div>
                <p className="mt-1.5 text-xs text-stone-500 font-sans leading-relaxed">
                  {isKm
                    ? 'ទឹកប្រាក់អ្នកជំងឺបាញ់ ចូលគណនីធនាគាររបស់គ្លីនិកលោកអ្នកផ្ទាល់ ១០០%'
                    : '100% patient payments settle directly into your clinic bank account instantly.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
