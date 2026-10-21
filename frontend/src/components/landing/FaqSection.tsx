'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const FaqSection: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      qKh: 'តើខ្ញុំត្រូវមានកុំព្យូទ័រថ្លៃៗ ឬដំឡើងកម្មវិធីស្មុគស្មាញទើបប្រើបានមែនទេ?',
      qEn: 'Do I need expensive computers or complex installation to use X-Clinic?',
      aKh:
        'មិនបាច់ទាល់តែសោះ! X-Clinic ជាប្រព័ន្ធ Cloud-Native PaaS ទំនើបដែលដំណើរការរលូនលើ Web Browser គ្រប់ប្រភេទ មិនថាលើកុំព្យូទ័រយួរដៃ (Laptop), កុំព្យូទ័រលើតុ (Desktop), iPad, Tablet ឬទូរស័ព្ទដៃស្មាតហ្វូនឡើយ។ លោកអ្នកគ្រាន់តែមាន Browser ដូចជា Chrome ឬ Safari គឺអាចចូលប្រើប្រាស់បានភ្លាមៗ មិនបាច់ជួលជាង IT មកដំឡើងឡើយ។',
      aEn:
        'Not at all! X-Clinic is a modern cloud PaaS accessible directly from any web browser on laptops, desktops, iPads, tablets, or smartphones. No local software installation or IT technician is ever required.',
    },
    {
      qKh: 'តើប្រាក់ដែលអ្នកជំងឺស្កេនបង់ ចូលទៅណា? ហើយ X-Clinic មានកាត់កម្រៃជើងសារដែរឬទេ?',
      qEn: 'Where does patient scan money go? Does X-Clinic take any transaction commission?',
      aKh:
        'ប្រាក់ដែលអ្នកជំងឺស្កេនបង់ គឺរត់ចូលគណនីធនាគារ ABA Bank ឬ Bakong របស់គ្លីនិកលោកអ្នកផ្ទាល់ ១០០% ភ្លាមៗក្នុងរយៈពេលប៉ុន្មានវិនាទី! X-Clinic មិនមែនជាស្ថាប័នកាត់ប្រាក់កម្រៃជើងសារពីការទូទាត់ប្រាក់របស់អ្នកឡើយ (0% Transaction Fee)។ គ្លីនិករបស់លោកអ្នកទទួលបានប្រាក់ពេញលេញគ្រប់ចំនួន។',
      aEn:
        '100% of patient scan payments deposit directly into your clinic ABA Bank or Bakong account instantly. X-Clinic charges zero transaction commission (0% fee). Every single riel and cent belongs directly to your clinic.',
    },
    {
      qKh: 'តើការដំឡើង ABA Merchant Link ពិបាកដែរឬទេ?',
      qEn: 'How difficult is it to configure the ABA Merchant Link?',
      aKh:
        'ងាយស្រួលបំផុត! លោកអ្នកគ្រាន់តែចូលទៅកាន់ ABA Mobile App របស់គ្លីនិកអ្នក រួចបង្កើត ABA Merchant Link ដោយឥតគិតថ្លៃ (ចំណាយពេលត្រឹមតែ ១ នាទីប៉ុណ្ណោះ) ហើយយក Link នោះមក Paste ចូលទៅក្នុងប្រអប់ Settings របស់ X-Clinic ជាការស្រេច។ ប្រព័ន្ធនឹងចាប់ផ្តើមបង្កើត Dynamic KHQR ដោយស្វ័យប្រវត្តភ្លាមៗ។',
      aEn:
        'Extremely easy! Simply open your clinic ABA Mobile app, generate a free merchant link in under 1 minute, and paste that link into your X-Clinic settings. Dynamic Tag 01=12 KHQR activates instantly.',
    },
    {
      qKh: 'តើទិន្នន័យអ្នកជំងឺ និងគ្លីនិករបស់ខ្ញុំមានសុវត្ថិភាពកម្រិតណា?',
      qEn: 'How secure is my clinic and patient clinical data?',
      aKh:
        'ទិន្នន័យទាំងអស់ត្រូវបានការពារដោយប្រព័ន្ធ Multi-Tenant Cryptographic Isolation ស្តង់ដារវេជ្ជសាស្ត្រ HIPAA និង MoH។ គ្លីនិកនីមួយៗមានទិន្នន័យឯកោដាច់ដោយឡែកពីគ្នា ១០០% គ្មានគ្លីនិកណា ឬបុគ្គលខាងក្រៅអាចលួចមើលឃើញទិន្នន័យរបស់អ្នកជំងឺអ្នកបានឡើយ។ ទិន្នន័យត្រូវបាន Backup រៀងរាល់ថ្ងៃលើ Cloud Server ប្រកបដោយសុវត្ថិភាពខ្ពស់។',
      aEn:
        'All data is protected by HIPAA-grade multi-tenant schema isolation and automated daily encrypted cloud backups. Cross-tenant leakage is strictly blocked at the architectural database layer.',
    },
    {
      qKh: 'ចុះបើដាច់អ៊ីនធឺណិត តើគ្លីនិកខ្ញុំនៅតែអាចដំណើរការបានទេ?',
      qEn: 'Can my clinic continue operating if the internet goes down?',
      aKh:
        'ដំណើរការបានជាប្រក្រតី! ប្រព័ន្ធ X-Clinic ត្រូវបានបង្កើតឡើងជាមួយស្ថាបត្យកម្ម Local-First Cache រក្សាទុកទិន្នន័យលើឧបករណ៍កុំព្យូទ័ររបស់អ្នកជាបណ្តោះអាសន្ន ដូច្នេះគ្រូពេទ្យនៅតែអាចកត់ត្រា និងពិនិត្យអ្នកជំងឺបាន។ នៅពេលអ៊ីនធឺណិតមានដំណើរការឡើងវិញ ប្រព័ន្ធនឹងធ្វើសមកាលកម្ម (Auto-Sync) ឡើងទៅកាន់ Cloud ដោយស្វ័យប្រវត្តិ។',
      aEn:
        'Yes! With local-first offline caching, your clinic can continue patient check-in and consultations during connection outages. Data automatically synchronizes back to the cloud as soon as internet restores.',
    },
    {
      qKh: 'តើបុគ្គលិករបស់ខ្ញុំអាចបែងចែកតួនាទី និងសិទ្ធិមើលឃើញទិន្នន័យបានកម្រិតណា?',
      qEn: 'Can I restrict staff access based on their clinical roles?',
      aKh:
        'ប្រព័ន្ធមានមុខងារ Role-Based Access Control (RBAC) ពេញលេញ៖ វេជ្ជបណ្ឌិតអាចមើលឃើញទម្រង់ពិគ្រោះ និង SOAP Note, ឱសថការីឃើញតែផ្នែកចេញថ្នាំ និងស្តុក, បុគ្គលិកគិតលុយឃើញតែផ្នែកវិក្កយបត្រ, រីឯម្ចាស់គ្លីនិកអាចគ្រប់គ្រង និងមើលឃើញរបាយការណ៍សរុបទាំងអស់។ គ្លីនិកអាចបង្កើតគណនីបុគ្គលិកបានរហូតដល់គ្មានដែនកំណត់តាមគម្រោងដែលបានជ្រើសរើស។',
      aEn:
        'Yes, granular Role-Based Access Control isolates roles strictly: Doctors see clinical charts and SOAP, pharmacists see dispensaries and stock, cashiers see billing, while clinic owners retain full administrative oversight.',
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D5CDBD] text-stone-800 text-xs font-bold shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-teal-800" />
            <span>
              {isKm ? 'សំណួរដែលសួរញឹកញាប់ • Frequently Asked Questions' : 'Frequently Asked Questions'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight font-sans">
            {isKm
              ? 'ចម្ងល់ដែលម្ចាស់គ្លីនិកតែងតែចង់ដឹង'
              : 'Everything You Need to Know Before Getting Started'}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            {isKm
              ? 'ស្វែងយល់បន្ថែមអំពីរបៀបដំណើរការ សុវត្ថិភាព និងការទូទាត់ប្រាក់ ដើម្បីឱ្យលោកអ្នកកាន់តែមានទំនុកចិត្តខ្ពស់ក្នុងការប្រើប្រាស់។'
              : 'Clear answers on billing, setup speed, data privacy, and hardware compatibility.'}
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-12 space-y-4">
          {faqs.map((f, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#DFD6C6] shadow-2xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-stone-900 font-sans leading-snug">
                    {isKm ? f.qKh : f.qEn}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 bg-teal-100 text-teal-800' : 'text-stone-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-xs text-stone-600 leading-relaxed font-sans border-t border-stone-100 pt-3">
                    {isKm ? f.aKh : f.aEn}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions card */}
        <div className="mt-10 p-6 rounded-3xl bg-[#F2ECE1] border border-[#DDD6C5] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="text-xs sm:text-sm font-bold text-stone-900 font-sans">
              {isKm
                ? 'នៅតែមានសំណួរ ឬត្រូវការជំនួយក្នុងការដំឡើង?'
                : 'Still have specific questions or need onboarding assistance?'}
            </div>
            <div className="text-[11px] text-stone-500 font-sans mt-0.5">
              {isKm
                ? 'ក្រុមការងារជំនួយបច្ចេកទេសរបស់យើងត្រៀមខ្លួនជួយសម្របសម្រួលលោកអ្នក ២៤/៧'
                : 'Our clinical deployment specialists are available 24/7 to assist your team'}
            </div>
          </div>
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <span>{isKm ? 'ទាក់ទងមកកាន់យើងខ្ញុំ' : 'Contact Support'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
