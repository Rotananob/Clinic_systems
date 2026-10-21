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
} from 'lucide-react';

export const DoctorTestimonialsSection: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const testimonials = [
    {
      nameKh: 'វេជ្ជបណ្ឌិត ចាន់ សុវណ្ណ',
      nameEn: 'Dr. Chan Sovann, MD',
      roleKh: 'ប្រធានគ្លីនិក សុខភាពរុងរឿង (រាជធានីភ្នំពេញ)',
      roleEn: 'Founder, Sokhapheap Rungroeung Clinic (Phnom Penh)',
      disciplineKh: 'គ្លីនិកពិគ្រោះជំងឺទូទៅ & OPD',
      disciplineEn: 'General Outpatient Practice',
      feedbackKh:
        'ពីមុនគ្លីនិកខ្ញុំមានអ្នកជំងឺច្រើន តែតុទទួលភ្ញៀវរញ៉េរញ៉ៃណាស់ ស្រែកហៅអ្នកជំងឺឡើងស្អកក ហើយពេលភ្ញៀវស្កេនបង់លុយតាម QR ក្រដាស ជួនកាលវាយលុយខ្វះ ពិបាកផ្ទៀងផ្ទាត់។ តាំងពីប្តូរមកប្រើ X-Clinic មក ការហៅអ្នកជំងឺបន្លឺតាម Speaker យ៉ាងស្រួល ហើយ Dynamic KHQR ចេញលឿនត្រឹម ២ វិនាទី លុយចូលកុង ABA របស់ខ្ញុំផ្ទាល់ ១០០% គ្មានខុសសូម្បីតែ ១ រៀល!',
      feedbackEn:
        'Before X-Clinic, our front desk was chaotic with nurses shouting names and paper QR stickers causing payment discrepancies. Now, 1-click Khmer voice queue announcements and 2-second dynamic KHQR settle funds straight to my ABA bank account with zero errors.',
      badgeKh: 'ប្រើប្រាស់ជាង ៨ ខែ',
      badgeEn: 'Active for 8+ months',
    },
    {
      nameKh: 'វេជ្ជបណ្ឌិត ហេង សិរី',
      nameEn: 'Dr. Heng Serey, MD, MPH',
      roleKh: 'នាយកមន្ទីរសម្រាកព្យាបាលមិត្តភាព (ខេត្តបាត់ដំបង)',
      roleEn: 'Medical Director, Mittapheap Polyclinic (Battambang)',
      disciplineKh: 'មន្ទីរសម្រាកព្យាបាល & ពហុឯកទេស',
      disciplineEn: 'Polyclinic & Inpatient Care',
      feedbackKh:
        'មុខងារ Gemini AI Voice Dictation ជួយគ្រូពេទ្យក្នុងមន្ទីរសម្រាកព្យាបាលរបស់ខ្ញុំបានច្រើនបំផុត! គ្រូពេទ្យគ្រាន់តែនិយាយជាភាសាខ្មែរ ប្រព័ន្ធរៀបចំជាទម្រង់ SOAP និងកូដជំងឺ ICD-11 ត្រឹមត្រូវតាមក្បួនក្រសួងសុខាភិបាល។ លើសពីនេះ របាយការណ៍បាញ់ចូល Telegram ធ្វើឱ្យខ្ញុំនៅទីណាក៏ដឹងពីចំណូល និងចំនួនអ្នកជំងឺគ្រប់វិនាទី។',
      feedbackEn:
        'Gemini AI Voice Dictation is a game changer for our inpatient teams. Doctors dictate clinical observations in Khmer, and structured SOAP notes with ICD-11 codes are generated instantly. The Telegram forum bridge gives me 100% real-time oversight.',
      badgeKh: 'ពហុបន្ទប់ពិគ្រោះ & គ្រែសម្រាក',
      badgeEn: 'Multi-Room & IPD Beds',
    },
    {
      nameKh: 'ទន្តបណ្ឌិត កែវ ពេជ្រ',
      nameEn: 'Dr. Keo Pich, DDS',
      roleKh: 'ម្ចាស់គ្លីនិកព្យាបាលធ្មេញ ស្មាយ (ខេត្តសៀមរាប)',
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
              ? 'ស្តាប់ការចែករំលែកបទពិសោធន៍ផ្ទាល់ពីអ្នកប្រើប្រាស់ជាក់ស្តែងដែលបានធ្វើទំនើបកម្មគ្លីនិករបស់ពួកគេជាមួយ X-Clinic។'
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

        {/* Platform Trust Stats Counter */}
        <div className="mt-12 bg-white rounded-3xl border border-[#DFD6C6] p-6 sm:p-8 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-teal-900 font-mono">120+</div>
            <div className="text-xs font-bold text-stone-700 font-sans">
              {isKm ? 'គ្លីនិកកំពុងដំណើរការ' : 'Clinics Onboarded'}
            </div>
            <div className="text-[10px] text-stone-400 font-sans">
              {isKm ? 'ទូទាំង ២៥ រាជធានី-ខេត្ត' : 'Across 25 provinces'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-teal-900 font-mono">99.98%</div>
            <div className="text-xs font-bold text-stone-700 font-sans">
              {isKm ? 'ស្ថិរភាពប្រព័ន្ធ Uptime' : 'System Uptime SLA'}
            </div>
            <div className="text-[10px] text-stone-400 font-sans">
              {isKm ? 'ដំណើរការ ២៤/៧ ឥតរអាក់រអួល' : 'Continuous 24/7 reliability'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-teal-900 font-mono">2-Sec</div>
            <div className="text-xs font-bold text-stone-700 font-sans">
              {isKm ? 'ល្បឿន Dynamic KHQR' : 'Dynamic KHQR Speed'}
            </div>
            <div className="text-[10px] text-stone-400 font-sans">
              {isKm ? 'Tag 01=12 Bakong Compliant' : 'EMVCo certified payload'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono">0%</div>
            <div className="text-xs font-bold text-stone-700 font-sans">
              {isKm ? 'កម្រៃជើងសារប្រតិបត្តិការ' : 'Platform Fee / Commission'}
            </div>
            <div className="text-[10px] text-stone-400 font-sans">
              {isKm ? 'លុយចូលកុង ABA ផ្ទាល់ ១០០%' : '100% direct merchant settlement'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
