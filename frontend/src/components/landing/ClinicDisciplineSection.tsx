'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import {
  Stethoscope,
  Activity,
  HeartPulse,
  Baby,
  Pill,
  Smile,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  ArrowRight,
  Clock,
  Printer,
  FileText,
  Volume2,
  Syringe,
  Check,
  Zap,
  Building2,
  HardDrive,
  Users,
} from 'lucide-react';

interface ClinicCategory {
  id: string;
  nameKh: string;
  nameEn: string;
  badgeKh: string;
  badgeEn: string;
  icon: React.ComponentType<{ className?: string }>;
  taglineKh: string;
  taglineEn: string;
  descriptionKh: string;
  descriptionEn: string;
  featuresKh: string[];
  featuresEn: string[];
  mockupTitleKh: string;
  mockupTitleEn: string;
}

const CATEGORIES: ClinicCategory[] = [
  {
    id: 'polyclinic',
    nameKh: 'មន្ទីរសម្រាកព្យាបាល & ពហុព្យាបាល',
    nameEn: 'Polyclinic & Outpatient Center',
    badgeKh: 'ពហុឯកទេស & គ្រែសម្រាក',
    badgeEn: 'Multi-Specialty & IPD/OPD',
    icon: Building2,
    taglineKh: 'គ្រប់គ្រងបន្ទប់ពិគ្រោះច្រើន និងសម្រាកព្យាបាល ២៤/៧ ដោយរលូន',
    taglineEn: 'Seamless multi-department queue, bed management, and 24/7 inpatient care',
    descriptionKh:
      'រៀបចំឡើងជាពិសេសសម្រាប់មន្ទីរសម្រាកព្យាបាលដែលមានវេជ្ជបណ្ឌិតច្រើនឯកទេស បន្ទប់ពិគ្រោះច្រើន និងគ្រែសម្រាកព្យាបាល។ គ្រប់គ្រងជួរអ្នកជំងឺរួមគ្នា ហៅតាម Speaker បន្ទប់នីមួយៗ និងបូកសរុបវិក្កយបត្រតែមួយ។',
    descriptionEn:
      'Engineered specifically for polyclinics with multiple specialist rooms, triage, and inpatient beds. Synchronize queue calling across consulting rooms and consolidate hospital billing.',
    featuresKh: [
      'ហៅអ្នកជំងឺតាមបន្ទប់ពិគ្រោះជាក់លាក់ជាសំឡេងខ្មែរ - បន្ទប់ ១, បន្ទប់ ២, បន្ទប់សង្គ្រោះ',
      'គ្រប់គ្រងគ្រែសម្រាកព្យាបាល - IPD Beds តាមដានអ្នកជំងឺស្នាក់នៅ និងកត់ត្រាការថែទាំ',
      'ចេញបញ្ជាមន្ទីរពិសោធន៍ - Lab Orders និងថតកាំរស្មីអ៊ិច រួមក្នុងប្រវត្តិអ្នកជំងឺ',
      'បូកសរុបថ្លៃសេវាពិគ្រោះ ថ្នាំពេទ្យ និងថ្លៃបន្ទប់ចូលវិក្កយបត្ររួមមួយជាមួយ Dynamic KHQR',
    ],
    featuresEn: [
      'Khmer voice queue calling tailored per consultation room (Room 1, Room 2, Emergency)',
      'Inpatient bed management with real-time occupancy status and round logs',
      'Integrated laboratory and imaging orders attached directly to patient records',
      'Consolidated multi-department billing with 1-click dynamic KHQR settlement',
    ],
    mockupTitleKh: 'ផ្ទាំងគ្រប់គ្រងជួរ និងបន្ទប់សម្រាកព្យាបាល',
    mockupTitleEn: 'Multi-Room Queue & Bed Management Monitor',
  },
  {
    id: 'general',
    nameKh: 'គ្លីនិកទូទៅ & វេជ្ជសាស្ត្រគ្រួសារ',
    nameEn: 'General Medical Clinic',
    badgeKh: 'ពិគ្រោះជំងឺទូទៅ & OPD',
    badgeEn: 'Family Medicine & Outpatient',
    icon: Stethoscope,
    taglineKh: 'កត់ត្រាប្រវត្តិជំងឺរហ័សក្នុង ១០ វិនាទី និងចេញវេជ្ជបញ្ជា MoH ស្តង់ដារ',
    taglineEn: '10-second rapid consultation SOAP notes and MoH standard e-prescriptions',
    descriptionKh:
      'បង្កើនល្បឿនពិគ្រោះជំងឺ និងកត់ត្រា SOAP - Subjective, Objective, Assessment, Plan ដោយរលូន។ បង្កើត Dynamic KHQR ភ្លាមៗពេលចេញវេជ្ជបញ្ជា លុយចូលកុងគ្លីនិក ១០០% គ្មានកាត់កម្រៃជើងសារ។',
    descriptionEn:
      'Accelerate patient throughput with streamlined SOAP consultation workflows. Generate Dynamic KHQR codes with locked amount automatically as prescriptions are saved.',
    featuresKh: [
      'កត់ត្រារោគសញ្ញា និងសញ្ញាជីវិត - សម្ពាធឈាម, កម្ដៅ, ជីពចរ, SpO2 ក្នុងទម្រង់តែមួយ',
      'ប្រព័ន្ធដាស់តឿនប្រតិកម្មឱសថ - Drug Allergy Alerts ការពារសុវត្ថិភាពអ្នកជំងឺ',
      'ចេញវេជ្ជបញ្ជាអេឡិចត្រូនិក និងបោះពុម្ពស្លាកថ្នាំ - Dosage Label ជាភាសាខ្មែរ',
      'ស្កេនបង់ប្រាក់ KHQR Bakong និង ABA PayWay ដោយផ្ទាល់ត្រឹម ២ វិនាទី',
    ],
    featuresEn: [
      'Single-screen vitals logging (blood pressure, temperature, pulse rate, SpO2)',
      'Automated drug-allergy warnings protecting patient clinical safety',
      'Print standard Khmer prescription slips and medical dosage instruction labels',
      'Direct Bakong and ABA PayWay dynamic KHQR payment in under 2 seconds',
    ],
    mockupTitleKh: 'កំណត់ត្រាវេជ្ជសាស្ត្រ SOAP និងវេជ្ជបញ្ជាស្វ័យប្រវត្ត',
    mockupTitleEn: 'Clinical SOAP Consultation & Instant e-Prescription',
  },
  {
    id: 'dental',
    nameKh: 'គ្លីនិកទន្តសាស្ត្រ & ធ្មេញ',
    nameEn: 'Dental & Oral Surgery Clinic',
    badgeKh: 'Odontogram ធ្មេញ ៣២ & រូបភាព',
    badgeEn: '32-Tooth Chart & Procedures',
    icon: Smile,
    taglineKh: 'គំនូសតាងធ្មេញ Odontogram និងផែនការព្យាបាលតាមដំណាក់កាល',
    taglineEn: 'Interactive 32-tooth odontogram mapping and multi-stage treatment roadmaps',
    descriptionKh:
      'រៀបចំឡើងយ៉ាងពិសេសសម្រាប់ទន្តបណ្ឌិត ជាមួយនឹងតារាងគំនូសធ្មេញ ៣២ គ្រាប់ - Universal / Palmer / FDI។ កត់ត្រាធ្មេញដង្កូវ សម្អាតកំបោរ ប៉ះធ្មេញ ពត់ធ្មេញ ដាំបង្គោល និងបង់ប្រាក់រំលោះតាមដំណាក់កាល។',
    descriptionEn:
      'Purpose-built for modern dental practices with interactive 32-tooth odontogram charting. Track multi-session treatments, root canal stages, implants, and installment billing.',
    featuresKh: [
      'ផ្ទាំងគំនូសធ្មេញ Odontogram ចុចជ្រើសរើសលេខធ្មេញ និងស្ថានភាព - Carie, Filling, Crown, Missing',
      'គ្រប់គ្រងកាលវិភាគណាត់ជួប និងការព្យាបាលបន្ត - Follow-up multi-visit stages',
      'បោះពុម្ពវិក្កយបត្រទន្តសាស្ត្រលម្អិតតាមមុខធ្មេញ និងសេវាកម្មព្រីន 80mm',
      'ភ្ជាប់រូបថតមុន និងក្រោយព្យាបាល - Before/After Dental Photos ក្នុងប្រវត្តិអ្នកជំងឺ',
    ],
    featuresEn: [
      'Interactive visual odontogram: click tooth number to record caries, restorations, crowns, implants',
      'Follow-up appointment tracking for multi-visit procedures and orthodontic sessions',
      'Detailed itemized receipt printing per tooth number on standard 80mm thermal paper',
      'Clinical before-and-after photo attachments stored securely under patient file',
    ],
    mockupTitleKh: 'តារាងគំនូសធ្មេញ Odontogram ៣២ គ្រាប់ និងផែនការព្យាបាល',
    mockupTitleEn: '32-Tooth Visual Odontogram & Dental Treatment Plan',
  },
  {
    id: 'maternity',
    nameKh: 'គ្លីនិកសម្ភព & រោគស្ត្រី',
    nameEn: 'Maternity & Women\'s Health',
    badgeKh: 'តាមដានផ្ទៃពោះ & អេកូសាស្ត្រ',
    badgeEn: 'Antenatal Care & Ultrasound',
    icon: HeartPulse,
    taglineKh: 'តាមដានសុខភាពមាតានិងទារក គណនាថ្ងៃសម្រាល និងរូបភាពអេកូសាស្ត្រ',
    taglineEn: 'Antenatal care tracking, automated due date calculation, and ultrasound records',
    descriptionKh:
      'គ្រប់គ្រងការពិនិត្យផ្ទៃពោះ - ANC តាមត្រីមាសនីមួយៗ គណនាអាយុគភ៌ និងថ្ងៃសម្រាលស្វ័យប្រវត្ត - LMP/EDD។ រក្សាទុករូបភាពអេកូសាស្ត្រ និងតាមដានសុខភាពក្រោយសម្រាល។',
    descriptionEn:
      'Complete obstetric and gynecological record keeping. Automatic gestational age and EDD calculation from LMP, ultrasound attachments, and postpartum wellness tracking.',
    featuresKh: [
      'គណនាថ្ងៃសម្រាល និងអាយុគភ៌ស្វ័យប្រវត្ត - LMP, Gestational Age, Estimated Due Date',
      'តារាងតាមដានការលូតលាស់ទារកក្នុងផ្ទៃ ទម្ងន់ម្ដាយ និងសម្ពាធឈាមតាមត្រីមាស',
      'ភ្ជាប់រូបភាពអេកូសាស្ត្រ - Ultrasound Scans ផ្ទាល់ក្នុងសឺមីវេជ្ជសាស្ត្រ',
      'ប្រព័ន្ធផ្ញើសាររំលឹកកាលបរិច្ឆេទពិនិត្យផ្ទៃពោះ និងចាក់ថ្នាំការពារស្វ័យប្រវត្ត',
    ],
    featuresEn: [
      'Automated gestational age and estimated delivery date (EDD) computation from LMP',
      'Trimester-based antenatal tracking: fundal height, fetal heart rate, and maternal vitals',
      'High-resolution ultrasound imaging attachments linked to patient profile',
      'Automated check-up and tetanus toxoid appointment reminders',
    ],
    mockupTitleKh: 'សៀវភៅតាមដានសុខភាពមាតា និងទារកក្នុងផ្ទៃ - ANC Profile',
    mockupTitleEn: 'Antenatal Care Profile & Gestational Tracker',
  },
  {
    id: 'pediatrics',
    nameKh: 'គ្លីនិកកុមារ & វ៉ាក់សាំង',
    nameEn: 'Pediatric & Child Health',
    badgeKh: 'វ៉ាក់សាំងជាតិ & បន្ទាត់លូតលាស់',
    badgeEn: 'Immunization & WHO Growth Chart',
    icon: Baby,
    taglineKh: 'កាលវិភាគវ៉ាក់សាំងកម្ពុជា បន្ទាត់លូតលាស់ WHO និងគណនាកម្រិតថ្នាំតាមគីឡូ',
    taglineEn: 'Cambodian immunization schedule, WHO growth percentiles, and weight dosage calculator',
    descriptionKh:
      'រៀបចំឡើងសម្រាប់វេជ្ជបណ្ឌិតកុមារ ដោយមានកាលវិភាគចាក់វ៉ាក់សាំងជាតិកម្ពុជា បន្ទាត់លូតលាស់កុមារស្តង់ដារ WHO និងប្រព័ន្ធគណនាកម្រិតថ្នាំកុមារយ៉ាងសុក្រឹតតាមទម្ងន់ - mg/kg។',
    descriptionEn:
      'Tailored for pediatricians with the official Cambodian National Immunization Schedule, WHO growth percentiles (weight/height/age), and precise weight-based dosing calculations.',
    featuresKh: [
      'កាលវិភាគចាក់វ៉ាក់សាំងជាតិកម្ពុជា - BCG, Pentavalent, Polio, Measles/Rubella',
      'បន្ទាត់លូតលាស់កុមារស្តង់ដារ WHO - ទម្ងន់-អាយុ, កម្ពស់-អាយុ, BMI បង្ហាញជាក្រាហ្វិក',
      'ម៉ាស៊ីនគណនាកម្រិតថ្នាំកុមារស្វ័យប្រវត្តតាមទម្ងន់ - mg/kg/day ជៀសវាងការច្រឡំ',
      'កត់ត្រាព័ត៌មានអាណាព្យាបាល និងប្រវត្តិប្រតិកម្មអាហារ/ថ្នាំតាំងពីកំណើត',
    ],
    featuresEn: [
      'Integrated Cambodian National Immunization Programme timetable with overdue flags',
      'WHO standard pediatric growth percentile charting (weight-for-age, height-for-age)',
      'Automated pediatric dosage calculator (mg/kg/day) preventing medication errors',
      'Parent/guardian contact registry and birth milestone history logging',
    ],
    mockupTitleKh: 'កាលវិភាគចាក់វ៉ាក់សាំងកុមារ និងក្រាហ្វិកលូតលាស់ WHO',
    mockupTitleEn: 'Pediatric Immunization Record & WHO Growth Curve',
  },
  {
    id: 'pharmacy',
    nameKh: 'ឱសថស្ថាន & ឃ្លាំងឱសថ',
    nameEn: 'Pharmacy & Drug Dispensing',
    badgeKh: 'FEFO ស្តុក & Barcode ស្កេន',
    badgeEn: 'FEFO Expiry & Barcode Scanner',
    icon: Pill,
    taglineKh: 'គ្រប់គ្រងស្តុកថ្នាំតាមកាលបរិច្ឆេទផុតកំណត់ FEFO និងស្កេនបាកូដលឿនរហ័ស',
    taglineEn: 'FEFO expiration date tracking, barcode scanner speed, and low-stock alerts',
    descriptionKh:
      'ការពារការខូចខាតថ្នាំជាមួយប្រព័ន្ធ First-Expired-First-Out - FEFO។ ស្កេនបាកូដលក់ថ្នាំភ្លាមៗ ដាស់តឿនថ្នាំជិតផុតកំណត់ និងបាញ់ដំណឹង Telegram ពេលស្តុកធ្លាក់ចុះទាប។',
    descriptionEn:
      'Eliminate expired medication losses with strict FEFO batch controls. Supports USB/Bluetooth barcode scanners, automated low-stock warnings, and Telegram restocking alerts.',
    featuresKh: [
      'ប្រព័ន្ធ FEFO - First-Expired-First-Out បញ្ចេញថ្នាំជិតផុតកំណត់មុនស្វ័យប្រវត្ត',
      'ស្កេនបាកូដថ្នាំតាម Barcode Scanner - 1D / 2D លឿនត្រឹម ១ វិនាទី',
      'ប្រព័ន្ធដាស់តឿនថ្នាំជិតផុតកំណត់មុន ៩០ ថ្ងៃ និងថ្នាំជិតអស់ពីស្តុក',
      'បោះពុម្ពស្លាករបៀបប្រើថ្នាំជាភាសាខ្មែរ - ព្រឹក, ថ្ងៃ, ល្ងាច, យប់, មុន ឬក្រោយបាយ',
    ],
    featuresEn: [
      'FEFO batch tracking prioritizes dispensing medicines nearing expiration date first',
      'Instant 1-second 1D/2D barcode scanning directly at pharmacy dispensing counter',
      'Automated 90-day expiry warning radar and minimum inventory threshold triggers',
      'Khmer dosage instruction labels printing (Morning, Noon, Evening, Night, Before/After Food)',
    ],
    mockupTitleKh: 'ប្រព័ន្ធគ្រប់គ្រងឃ្លាំងឱសថ FEFO និងស្កេនបាកូដ',
    mockupTitleEn: 'Pharmacy FEFO Batch Inventory & Dispensing Terminal',
  },
];

export const ClinicDisciplineSection: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const [activeTab, setActiveTab] = useState<string>('polyclinic');

  const selectedCategory =
    CATEGORIES.find((cat) => cat.id === activeTab) || CATEGORIES[0];
  const IconComponent = selectedCategory.icon;

  return (
    <section className="py-16 md:py-24 bg-[#F5F1E8] border-t border-[#E5DECF] relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-teal-800/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/90 border border-teal-200 text-teal-900 text-xs font-bold shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-teal-800" />
            <span>
              {isKm
                ? 'ដំណោះស្រាយកាត់ដេរយ៉ាងផ្ចិតផ្ចង់សម្រាប់គ្រប់ប្រភេទគ្លីនិក'
                : 'Tailored Solutions for Every Medical Discipline'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-snug">
            {isKm
              ? 'គាំទ្រគ្រប់ឯកទេសវេជ្ជសាស្ត្រទូទាំងប្រទេសកម្ពុជា'
              : 'Built for Cambodia\'s Polyclinics, General Practices & Specialties'}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl mx-auto">
            {isKm
              ? 'មិនថាអ្នកដំណើរការមន្ទីរសម្រាកព្យាបាល, គ្លីនិកទូទៅ, គ្លីនិកធ្មេញ, សម្ភព, ឬគ្លីនិកកុមារ ប្រព័ន្ធ PaaS របស់យើងផ្ដល់នូវទម្រង់ព្យាបាល និងមុខងារស័ក្តិសម ១០០% ស្របតាមស្តង់ដារក្រសួងសុខាភិបាល។'
              : 'Whether operating a high-volume outpatient hospital, dental center, maternity clinic, or pediatric office, our cloud PaaS provides tailored workflows and MoH standards.'}
          </p>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === activeTab;
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 shadow-2xs ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-md ring-2 ring-teal-800/20'
                    : 'bg-[#FDFBF7] text-stone-700 border border-[#E2DAD0] hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <CatIcon className={`w-4 h-4 ${isActive ? 'text-teal-200' : 'text-stone-500'}`} />
                <span>{isKm ? cat.nameKh : cat.nameEn}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Feature Showcase Card */}
        <div className="bg-[#FAF7F2] rounded-3xl border border-[#DFD6C6] p-6 sm:p-8 lg:p-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Description (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                  <IconComponent className="w-3.5 h-3.5 text-teal-700" />
                  <span>{isKm ? selectedCategory.badgeKh : selectedCategory.badgeEn}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                  {isKm ? selectedCategory.nameKh : selectedCategory.nameEn}
                </h3>

                <p className="text-xs sm:text-sm font-semibold text-teal-800">
                  {isKm ? selectedCategory.taglineKh : selectedCategory.taglineEn}
                </p>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {isKm ? selectedCategory.descriptionKh : selectedCategory.descriptionEn}
                </p>
              </div>

              {/* Bullet Features Grid */}
              <div className="space-y-2.5 pt-2 border-t border-[#EAE3D5]">
                {(isKm ? selectedCategory.featuresKh : selectedCategory.featuresEn).map(
                  (feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <span>{isKm ? 'ចុះឈ្មោះគ្លីនិករបស់អ្នក' : 'Create Clinic Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-[#D5CDBD] rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>{isKm ? 'ចាប់ផ្តើម Free រហូត' : 'Start Free Forever'}</span>
                </Link>
              </div>
            </div>

            {/* Right Interactive Mockup Simulation (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-md p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold text-xs">
                      <IconComponent className="w-4 h-4 text-teal-800" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {isKm ? selectedCategory.mockupTitleKh : selectedCategory.mockupTitleEn}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">Live Workspace Preview</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Specific Dynamic Visual Mockup per category */}
                {selectedCategory.id === 'polyclinic' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold text-teal-900">បន្ទប់ពិគ្រោះ ១ (OPD 1)</div>
                        <div className="text-sm font-extrabold text-teal-800 font-mono">Queue: A-014</div>
                        <div className="text-[10px] text-teal-700">Dr. Chea Sokha (ពិនិត្យរួច)</div>
                      </div>
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold text-amber-900">បន្ទប់សង្គ្រោះ (ER Room)</div>
                        <div className="text-sm font-extrabold text-amber-800 font-mono">Queue: ER-002</div>
                        <div className="text-[10px] text-amber-700">Dr. Vanna Rath (កំពុងព្យាបាល)</div>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold text-stone-700">
                        <span>គ្រែសម្រាកព្យាបាល - IPD Beds</span>
                        <span className="font-mono text-teal-800 font-bold">8 / 10 គ្រែ</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-700 h-full w-[80%]" />
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-500">
                        <span>បន្ទប់ VIP: 2/2 ពេញ</span>
                        <span>បន្ទប់ទូទៅ: 6/8 ទំនេរ 2</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-medium">វិក្កយបត្ររួមបូកសរុប</span>
                      <span className="font-mono font-bold text-emerald-800">$65.00 (KHQR Paid)</span>
                    </div>
                  </div>
                )}

                {selectedCategory.id === 'general' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-stone-700">
                        <span>សញ្ញាជីវិតអ្នកជំងឺ (Patient Vitals)</span>
                        <span className="font-mono text-teal-800 font-bold">36.8 C</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                          <div className="text-stone-500">BP</div>
                          <div className="font-bold font-mono text-stone-800">120/80</div>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                          <div className="text-stone-500">HR</div>
                          <div className="font-bold font-mono text-stone-800">76 bpm</div>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                          <div className="text-stone-500">SpO2</div>
                          <div className="font-bold font-mono text-stone-800">99%</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-teal-900 uppercase">SOAP Assessment</div>
                      <div className="text-[11px] text-teal-900 font-medium">
                        Acute Rhinitis & Mild Pharyngitis (រលាកច្រមុះ និងបំពង់កស្រាល)
                      </div>
                      <div className="text-[10px] text-teal-700 font-mono">
                        Rx: Paracetamol 500mg (1x3), Cetirizine 10mg (1x1)
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-medium">Dynamic KHQR Locked Amount</span>
                      <span className="font-mono font-bold text-emerald-800">$18.50 Ready</span>
                    </div>
                  </div>
                )}

                {selectedCategory.id === 'dental' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-stone-700">
                        <span>គំនូសធ្មេញ Odontogram (Upper/Lower Arch)</span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          #16 Caries
                        </span>
                      </div>
                      <div className="grid grid-cols-8 gap-1 text-center font-mono text-[9px]">
                        {[18, 17, 16, 15, 14, 13, 12, 11].map((tooth) => (
                          <div
                            key={tooth}
                            className={`p-1 rounded border ${
                              tooth === 16
                                ? 'bg-amber-100 border-amber-400 font-bold text-amber-900'
                                : 'bg-white border-stone-200 text-stone-600'
                            }`}
                          >
                            {tooth}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-8 gap-1 text-center font-mono text-[9px]">
                        {[48, 47, 46, 45, 44, 43, 42, 41].map((tooth) => (
                          <div
                            key={tooth}
                            className={`p-1 rounded border ${
                              tooth === 46
                                ? 'bg-teal-100 border-teal-400 font-bold text-teal-900'
                                : 'bg-white border-stone-200 text-stone-600'
                            }`}
                          >
                            {tooth}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-teal-900">
                        <span>ផែនការព្យាបាល (Dental Procedures)</span>
                        <span className="font-mono text-teal-800">$45.00</span>
                      </div>
                      <div className="text-[10px] text-teal-800 space-y-0.5">
                        <div>• ប៉ះធ្មេញ Composite Tooth #16 ($25.00)</div>
                        <div>• សម្អាតកំបោរធ្មេញ Full Scaling ($20.00)</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-medium">80mm Receipt Thermal Ready</span>
                      <span className="font-mono font-bold text-emerald-800">Print 1-Click</span>
                    </div>
                  </div>
                )}

                {selectedCategory.id === 'maternity' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-stone-700">
                        <span>សៀវភៅតាមដានផ្ទៃពោះ (ANC Tracker)</span>
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono">
                          28w 4d
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 bg-white rounded-lg border border-stone-200">
                          <div className="text-stone-500">LMP (ថ្ងៃមករដូវចុងក្រោយ)</div>
                          <div className="font-bold font-mono text-stone-800">01/04/2026</div>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-stone-200">
                          <div className="text-stone-500">EDD (ថ្ងៃសម្រាលប៉ាន់ស្មាន)</div>
                          <div className="font-bold font-mono text-teal-800">08/01/2027</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-teal-900 uppercase">Ultrasound Examination</div>
                      <div className="text-[11px] text-teal-900 font-medium">
                        Fetal Heart Rate: 144 bpm • Estimated Weight: 1,180g
                      </div>
                      <div className="text-[10px] text-teal-700">Normal amniotic fluid, cephalic presentation</div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-medium">ANC Check-up & Ultrasound Fee</span>
                      <span className="font-mono font-bold text-emerald-800">$30.00 Settled</span>
                    </div>
                  </div>
                )}

                {selectedCategory.id === 'pediatrics' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-stone-700">
                        <span>បន្ទាត់លូតលាស់ WHO (Growth Percentile)</span>
                        <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-mono">
                          65th Percentile
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                          <div className="text-stone-500">អាយុ (Age)</div>
                          <div className="font-bold font-mono text-stone-800">18 months</div>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                          <div className="text-stone-500">ទម្ងន់ (Weight)</div>
                          <div className="font-bold font-mono text-stone-800">11.4 kg</div>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                          <div className="text-stone-500">កម្ពស់ (Height)</div>
                          <div className="font-bold font-mono text-stone-800">83.5 cm</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-teal-900 uppercase">Cambodian Vaccination Calendar</div>
                      <div className="text-[11px] text-teal-900 font-medium">
                        DPT-HepB-Hib Booster & Measles 2 (បានចាក់គ្រប់)
                      </div>
                      <div className="text-[10px] text-teal-700 font-mono">Next: Japanese Encephalitis in 6 months</div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-medium">Dosage Calculator (15mg/kg)</span>
                      <span className="font-mono font-bold text-emerald-800">170mg / dose</span>
                    </div>
                  </div>
                )}

                {selectedCategory.id === 'pharmacy' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-stone-700">
                        <span>ឃ្លាំងឱសថ FEFO (Batch Control)</span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                          In Stock (120 units)
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between p-1.5 bg-white rounded border border-stone-200">
                          <span className="font-medium text-stone-800">Batch #B2026-04</span>
                          <span className="font-mono text-amber-700 font-semibold">Exp: 11/2026 (Priority)</span>
                        </div>
                        <div className="flex justify-between p-1.5 bg-white rounded border border-stone-200">
                          <span className="font-medium text-stone-800">Batch #B2026-09</span>
                          <span className="font-mono text-stone-500">Exp: 08/2027</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                      <div className="text-[10px] font-bold text-teal-900 uppercase">Barcode Scanner Input</div>
                      <div className="text-[11px] text-teal-900 font-medium font-mono">
                        SCAN: 8934567890123 &rarr; Amoxicillin 500mg
                      </div>
                      <div className="text-[10px] text-teal-700">Auto-decrements batch with earliest expiry</div>
                    </div>

                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-emerald-900 font-medium">1-Click Dispense & Invoice</span>
                      <span className="font-mono font-bold text-emerald-800">$12.00 Locked</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Platform as a Service (PaaS) vs Legacy Software Comparison */}
        <div className="pt-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight">
              {isKm
                ? 'ប្រៀបធៀប Cloud PaaS របស់យើង ជាមួយប្រព័ន្ធចាស់ៗ - Legacy Systems'
                : 'Why Leading Clinics Migrate from Legacy Software to Our Cloud PaaS'}
            </h3>
            <p className="text-xs text-stone-500">
              {isKm
                ? 'សន្សំសំចៃថ្លៃដើមរាប់ពាន់ដុល្លារ មិនបាច់ទិញ Server ថ្លៃៗ និងទូទាត់ប្រាក់ KHQR ដោយស្វ័យប្រវត្ត។'
                : 'Save thousands on hardware, eliminate manual data silos, and automate KHQR payment settlements.'}
            </p>
          </div>

          <div className="bg-[#FAF7F2] rounded-2xl border border-[#DFD6C6] overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#EDE5D6] text-stone-800 font-bold border-b border-[#D8CEBE]">
                    <th className="p-3.5 sm:p-4">មុខងារប្រព័ន្ធ (Capabilities)</th>
                    <th className="p-3.5 sm:p-4 text-teal-900 bg-teal-50/80 border-x border-teal-200/60">
                      Cloud Medical PaaS (ប្រព័ន្ធយើង)
                    </th>
                    <th className="p-3.5 sm:p-4 text-stone-500">ប្រព័ន្ធ POS/កម្មវិធីលើកុំព្យូទ័រចាស់ៗ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-stone-700">
                  <tr className="hover:bg-stone-50/50">
                    <td className="p-3.5 sm:p-4 font-semibold text-stone-900">
                      ការទូទាត់ប្រាក់ (Payment Settlement)
                    </td>
                    <td className="p-3.5 sm:p-4 bg-teal-50/40 border-x border-teal-200/40 font-medium text-teal-900">
                      ១០០% ចូលកុងធនាគារគ្លីនិកផ្ទាល់ (ABA / Bakong) គ្មានកាត់កម្រៃជើងសារ 0%
                    </td>
                    <td className="p-3.5 sm:p-4 text-stone-500">
                      ក្រដាស QR ធម្មតាត្រូវអង្គុយឆែកដោយដៃ ឬកាត់កម្រៃជើងសារ ១-៣%
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50/50">
                    <td className="p-3.5 sm:p-4 font-semibold text-stone-900">
                      ពេលវេលាចាប់ផ្ដើមដំណើរការ (Setup Speed)
                    </td>
                    <td className="p-3.5 sm:p-4 bg-teal-50/40 border-x border-teal-200/40 font-medium text-teal-900">
                      ចុះឈ្មោះ ៦០ វិនាទី បង្កើត Workspace ស្វ័យប្រវត្តក្នុង ២ វិនាទី
                    </td>
                    <td className="p-3.5 sm:p-4 text-stone-500">
                      រង់ចាំជាង ១-២ សប្ដាហ៍ ត្រូវមានអ្នកជំនាញមក Setup ផ្ទាល់
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50/50">
                    <td className="p-3.5 sm:p-4 font-semibold text-stone-900">
                      ឧបករណ៍ប្រើប្រាស់ (Device Compatibility)
                    </td>
                    <td className="p-3.5 sm:p-4 bg-teal-50/40 border-x border-teal-200/40 font-medium text-teal-900">
                      ដំណើរការលើ iPad, Tablet, Mac, Windows, ទូរស័ព្ទ និងម៉ាស៊ីនព្រីន 80mm
                    </td>
                    <td className="p-3.5 sm:p-4 text-stone-500">
                      ដំណើរការតែលើកុំព្យូទ័រ ១ គ្រឿងគត់ មិនអាចយកតាមខ្លួនបាន
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50/50">
                    <td className="p-3.5 sm:p-4 font-semibold text-stone-900">
                      បម្រុងទុកទិន្នន័យ (Backup & Isolation)
                    </td>
                    <td className="p-3.5 sm:p-4 bg-teal-50/40 border-x border-teal-200/40 font-medium text-teal-900">
                      ញែកដាច់ពីគ្នា ១០០% (Tenant Isolation) និង Auto Backup Cloud + Offline Sync
                    </td>
                    <td className="p-3.5 sm:p-4 text-stone-500">
                      រក្សាទុកក្នុង Hard drive បើកុំព្យូទ័រខូច បាត់ទិន្នន័យអ្នកជំងឺទាំងអស់
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-50/50">
                    <td className="p-3.5 sm:p-4 font-semibold text-stone-900">
                      ប្រព័ន្ធដំណឹងស្វ័យប្រវត្ត (Automated Alerts)
                    </td>
                    <td className="p-3.5 sm:p-4 bg-teal-50/40 border-x border-teal-200/40 font-medium text-teal-900">
                      Telegram Dual-Bot បាញ់ដំណឹងចូល Topic (ទូទាត់, ជួរ, ស្តុក, សន្តិសុខ)
                    </td>
                    <td className="p-3.5 sm:p-4 text-stone-500">
                      គ្មានប្រព័ន្ធដំណឹង ឬគិតថ្លៃផ្ញើសារ SMS បន្ថែមប្រចាំខែ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
