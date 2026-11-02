'use client';

import React, { useState, useMemo } from 'react';
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
  Search,
  Layers,
  Lock,
  Pill,
  Boxes,
  CreditCard,
  Film,
  FlaskConical,
  BedDouble,
  Video,
  HeartHandshake,
  CalendarDays,
  FileCheck,
  FolderOpen,
  Tv,
  FileSpreadsheet,
  LayoutTemplate,
  Settings,
  ShieldPlus,
  TrendingUp,
  BarChart3,
  Calendar,
  Monitor,
  Users,
} from 'lucide-react';

export interface PricingPlan {
  id: 'FREE' | 'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12' | 'SPECIALIST_15' | 'UNLIMITED_20';
  nameKh: string;
  nameEn: string;
  badgeKh?: string;
  badgeEn?: string;
  moduleCountKh: string;
  moduleCountEn: string;
  descKh: string;
  descEn: string;
  monthlyUsd: number;
  yearlyUsd: number;
  originalYearlyUsd: number;
  yearlySavingsUsd: number;
  equivalentMonthlyUsd: string;
  isPopular?: boolean;
  isRecommended?: boolean;
  khqrLimitKh: string;
  khqrLimitEn: string;
  patientLimitKh: string;
  patientLimitEn: string;
  staffLimitKh: string;
  staffLimitEn: string;
  featuresKh: string[];
  featuresEn: string[];
}

export interface SystemToolItem {
  id: string;
  category: 'clinical' | 'care' | 'pharmacy' | 'finance' | 'enterprise';
  titleKh: string;
  titleEn: string;
  descKh: string;
  descEn: string;
  minTier: 'FREE' | 'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12' | 'SPECIALIST_15' | 'UNLIMITED_20';
  icon: React.ComponentType<{ className?: string }>;
  isSpecial?: boolean;
}

export const PricingMatrix: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('PRO_8');
  const [activeToolCategory, setActiveToolCategory] = useState<string>('all');
  const [toolSearchQuery, setToolSearchQuery] = useState<string>('');

  const plans: PricingPlan[] = [
    {
      id: 'FREE',
      nameKh: 'គម្រោង Free Forever - ឥតគិតថ្លៃរហូត',
      nameEn: 'Free Forever',
      moduleCountKh: '៥ មុខងារស្នូល',
      moduleCountEn: '5 Core Modules',
      descKh: 'ប្រើប្រាស់ឥតគិតថ្លៃរហូតសម្រាប់គ្លីនិកតូច ឬគ្រូពេទ្យទើបបើកអាជីវកម្ម - ដំឡើងពេលណាស្រេចចិត្តដោយគ្មានការប្តេជ្ញាចិត្ត',
      descEn: 'Free forever for small practices - register and start instantly, upgrade anytime when ready with zero friction.',
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
        'បង្កើត Dynamic KHQR កូតា ៥ ដង / ថ្ងៃ',
        'កត់ត្រាអ្នកជំងឺមូលដ្ឋាន ៥០ នាក់ / គណនី',
        'ពិគ្រោះ និងសញ្ញាជីវិត Vitals SOAP Notes',
        'ហៅលេខជួរអ្នកជំងឺ Outpatient Queue',
        'ចេញវិក្កយបត្រអេឡិចត្រូនិច POS',
        'ជំនួយតាមរយៈឯកសារ Community Support',
      ],
      featuresEn: [
        'Dynamic KHQR (5 transactions / day)',
        'Basic patient records (50 patients / account)',
        'Consultation SOAP notes & vitals tracking',
        'Outpatient token queue workflow',
        'Electronic invoice generator',
        'Community documentation support',
      ],
    },
    {
      id: 'STARTER_5',
      nameKh: 'គម្រោងស្តង់ដារ Clinic Starter',
      nameEn: 'Clinic Starter 5$/mo',
      badgeKh: 'គ្រឹះគ្លីនិកពេញលេញ',
      badgeEn: 'Essential Foundation',
      moduleCountKh: '១០ ឧបករណ៍ស្នូល',
      moduleCountEn: '10 Core Modules',
      descKh: 'គ្រឹះប្រតិបត្តិការគ្លីនិកដ៏រហ័ស និងសន្សំសំចៃ - ស្កេនបង់ប្រាក់ Dynamic KHQR ចូលគណនីផ្ទាល់, ហៅអ្នកជំងឺជាសំឡេងខ្មែរ, ចេញវិក្កយបត្រ និងគ្រប់គ្រងវេជ្ជបញ្ជា',
      descEn: 'Fast, dependable clinical operating foundation for outpatient practices - Dynamic KHQR cashiering, Khmer audio voice calling, pharmacy dispensing, and 80mm thermal printing.',
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
        'បង្កើត Dynamic KHQR ២៥០ ប្រតិបត្តិការ / ថ្ងៃ',
        'កត់ត្រាអ្នកជំងឺ ១,០០០ នាក់ / គណនី',
        'ហៅអ្នកជំងឺជាសំឡេងខ្មែរស្វ័យប្រវត្តិ Khmer Voice Queue',
        'ម៉ាស៊ីនព្រីនវិក្កយបត្រ Thermal 80mm & កេះទាញថតលុយ',
        'ចេញថ្នាំឱសថស្ថាន និងគ្រប់គ្រងស្តុកកម្រិតស្តង់ដារ',
        'ចេញលិខិតសម្រាកព្យាបាលផ្លូវការ A4 Medical Certificates',
        'ផ្ទុកឯកសារវេជ្ជសាស្ត្រស្កេន និងរូបភាព Digital Archives',
        'Telegram Alert Bot ជូនដំណឹងប្រតិបត្តិការបន្ទាន់',
        'របាយការណ៍ហិរញ្ញវត្ថុ និងចំណូលប្រចាំថ្ងៃ',
        '៥ គណនីបុគ្គលិកជាមួយ Role-Based Access Control',
      ],
      featuresEn: [
        'Dynamic KHQR (250 transactions / day)',
        '1,000 patient registrations / account',
        'Khmer audio voice queue announcement',
        'Medication inventory & stock tracking',
        '80mm ESC/POS thermal printing & cash drawer',
        'Official A4 medical certificates (sick leave)',
        'Digital clinical document archives',
        'Automated Telegram alert bot notifications',
        'Daily financial revenue reports & export',
        '5 staff accounts with granular RBAC permissions',
      ],
    },
    {
      id: 'PRO_8',
      nameKh: 'គម្រោងវិជ្ជាជីវៈ Polyclinic Pro',
      nameEn: 'Polyclinic Pro 8$/mo',
      badgeKh: 'ណែនាំពិសេស - RECOMMENDED',
      badgeEn: 'RECOMMENDED - Best Value',
      isRecommended: true,
      moduleCountKh: '២០ ឧបករណ៍ទំនើប',
      moduleCountEn: '20 Advanced Modules',
      descKh: 'គម្រោងពេញនិយមបំផុតសម្រាប់មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ និងគ្លីនិកពហុព្យាបាល - គ្រប់គ្រង ២០ ឧបករណ៍ទំនើបរួមមានធ្មេញ Odontogram, រូបភាព PACS DICOM, ឃ្លាំងឱសថ FEFO, មន្ទីរពិសោធន៍ LIS, គ្រែសម្រាក IPD និង CDSS ការពារអន្តរកម្មថ្នាំ',
      descEn: 'Most popular tier for polyclinics and medical centers - includes Dental Odontogram, PACS DICOM, FEFO Inventory, LIS Lab, IPD Beds, and CDSS Drug Safety.',
      monthlyUsd: 8,
      yearlyUsd: 76, // 20% discount ($6.33/mo)
      originalYearlyUsd: 96,
      yearlySavingsUsd: 20,
      equivalentMonthlyUsd: '6.33',
      isPopular: true,
      khqrLimitKh: '១,៥០០ ប្រតិបត្តិការ / ថ្ងៃ',
      khqrLimitEn: '1,500 dynamic QR / day',
      patientLimitKh: '៨,០០០ នាក់ / គណនី',
      patientLimitEn: '8,000 patients / account',
      staffLimitKh: '១៥ គណនីបុគ្គលិក',
      staffLimitEn: '15 staff accounts',
      featuresKh: [
        'បង្កើត Dynamic KHQR ១,៥០០ ប្រតិបត្តិការ / ថ្ងៃ',
        'កត់ត្រាអ្នកជំងឺ ៨,០០០ នាក់ / គណនី',
        'ពេទ្យធ្មេញ FDI Odontogram ៣២ ធ្មេញ & WHO DMFT',
        'រូបភាពវេជ្ជសាស្ត្រ WebGL PACS DICOM - X-Ray, CT, Ultrasound',
        'ឃ្លាំងឱសថ FEFO ច្រើនសាខា & តាមដាន Batch No ផុតកំណត់',
        'មន្ទីរពិសោធន៍ LIS - តេស្តឈាម CBC & ជូនដំណឹង Panic Values',
        'គ្រែសម្រាកពេទ្យ IPD & e-MAR តារាងផ្តល់ថ្នាំ 5-Rights',
        'CDSS ឆ្លាតវៃ - ត្រួតពិនិត្យអន្តរកម្មថ្នាំ Drug-Drug Interaction',
        'Smart TV Signage បង្ហាញជួរហៅលេខលើកញ្ចក់ទូរទស្សន៍',
        'Telegram Forum Topics Supergroup ៤ បន្ទប់ដាច់ដោយឡែក',
        'គណនាប្រាក់កម្រៃគ្រូពេទ្យ Doctor Commissions & EBITDA P&L',
        '១៥ គណនីបុគ្គលិក និងការគាំទ្រអាទិភាព ២៤/៧ Priority Support',
      ],
      featuresEn: [
        'Dynamic KHQR (1,500 transactions / day)',
        '8,000 patient registry / account',
        'FDI 32-tooth dental odontogram & WHO DMFT index',
        'WebGL PACS DICOM viewer (X-Ray, CT, MRI, Ultrasound)',
        'Central warehouse inventory with FEFO & batch expiry tracking',
        'Laboratory Information System (LIS) & panic value alerts',
        'Inpatient bed ward management & 5-rights bedside e-MAR',
        'Intelligent CDSS drug-drug interaction & allergy safety engine',
        'Smart TV waiting room signage & token board',
        'Full 4-topic Telegram Forum bridge (Payments, Queue, Pharmacy, Security)',
        'Doctor split commissions & EBITDA profit/loss ledger',
        'Priority 24/7 technical customer support',
      ],
    },
    {
      id: 'ENTERPRISE_12',
      nameKh: 'គម្រោងមន្ទីរពេទ្យ Hospital Enterprise',
      nameEn: 'Hospital Enterprise 12$/mo',
      badgeKh: 'ល្បីបំផុត - MOST POPULAR',
      badgeEn: 'MOST POPULAR - Hospital Enterprise',
      isPopular: true,
      moduleCountKh: '២៦ មុខងារពេញលេញ',
      moduleCountEn: '26 Complete Modules',
      descKh: 'អំណាចប្រតិបត្តិការពេញលេញសម្រាប់មន្ទីរសម្រាកព្យាបាល និងបណ្តាញគ្លីនិក - គ្មានដែនកំណត់ KHQR និងអ្នកជំងឺ, ពិគ្រោះវីដេអូ Teleconsult, ចេញវេជ្ជបញ្ជាឌីជីថល e-Prescription, បញ្ជូនរបាយការណ៍ MoH DHIS2 និងទទួលបាន Subdomain ផ្លូវការផ្ទាល់ខ្លួន',
      descEn: 'Definitive hospital-grade operating system - unlimited KHQR and patient capacity, WebRTC Teleconsultation, signed QR e-Prescriptions, MoH DHIS2 reporting, and custom subdomain.',
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
        'មិនកំណត់រាល់ប្រតិបត្តិការ Dynamic KHQR Unlimited',
        'មិនកំណត់ចំនួនអ្នកជំងឺ និងបុគ្គលិក Unlimited Patients & Staff',
        'ពិគ្រោះជំងឺពីចម្ងាយតាមវីដេអូ WebRTC Teleconsultation HD',
        'ចេញវេជ្ជបញ្ជាឌីជីថលមាន QR Code Cryptographic Signed',
        'បញ្ជូនរបាយការណ៍ជំងឺឆ្លង MoH DHIS2 & សំណង eClaim',
        'ទទួលបាន Dedicated Custom Subdomain - ឧទាហរណ៍ yourclinic',
        'រចនាម៉ូតវិក្កយបត្រផ្លូវការ Custom Invoice Designer',
        'គ្រប់គ្រងបណ្តាញសាខាច្រើន Multi-Branch Synchronization',
        'Dedicated High-Performance Database & Cloud Backup',
        'រួមបញ្ចូលគ្រប់ ២០ ឧបករណ៍ទំនើបនៃគម្រោង Pro ទាំងអស់',
        'ជំនួយពិសេសផ្ទាល់តាមទូរស័ព្ទ និង Telegram 24/7 VIP SLA',
      ],
      featuresEn: [
        'Unlimited dynamic KHQR transactions',
        'Unlimited patients and staff accounts',
        'Encrypted WebRTC HD video teleconsultations',
        'Digitally signed QR cryptographic e-prescriptions',
        'MoH DHIS2 national surveillance & electronic claims engine',
        'Dedicated workspace subdomain - e.g. yourclinic',
        'Visual invoice and thermal receipt designer',
        'Multi-branch fleet synchronization & central audit',
        'Dedicated high-performance database & cloud backup',
        'All 20 advanced modules from Polyclinic Pro included',
        '24/7 VIP Phone and Telegram SLA support with 1-hr response',
      ],
    },
    {
      id: 'SPECIALIST_15',
      nameKh: 'គម្រោងឯកទេសជាន់ខ្ពស់ Specialist Clinic',
      nameEn: 'Specialist Clinic 15$/mo',
      badgeKh: 'ឯកទេសវេជ្ជសាស្ត្រ',
      badgeEn: 'Specialist Tier',
      moduleCountKh: '២៨ មុខងារឯកទេស',
      moduleCountEn: '28 Specialist Modules',
      descKh: 'ប្រព័ន្ធគ្រប់គ្រងវេជ្ជសាស្ត្រឯកទេសកម្រិតខ្ពស់ - AI សំឡេងកត់ត្រាពិគ្រោះជំងឺ Dictation, SOAP Structuring ស្វ័យប្រវត្ត, CDSS ពិនិត្យប្រតិកម្មថ្នាំ DDI, ឃ្លាំងស្តុកច្រើនសាខា និងវិបផតថលសមាគមវេជ្ជសាស្ត្រ',
      descEn: 'Advanced medical specialty system - AI voice medical dictation, automated SOAP structuring, CDSS drug-drug interaction safety guard, multi-branch inventory, and TMA portal.',
      monthlyUsd: 15,
      yearlyUsd: 144, // 20% discount ($12.00/mo)
      originalYearlyUsd: 180,
      yearlySavingsUsd: 36,
      equivalentMonthlyUsd: '12.00',
      khqrLimitKh: 'មិនកំណត់ចំនួន Unlimited',
      khqrLimitEn: 'Unlimited dynamic QR / day',
      patientLimitKh: 'មិនកំណត់ចំនួន / គណនី',
      patientLimitEn: 'Unlimited patients / account',
      staffLimitKh: '៥០ គណនីបុគ្គលិក',
      staffLimitEn: '50 staff accounts',
      featuresKh: [
        'មិនកំណត់រាល់ប្រតិបត្តិការ Dynamic KHQR Unlimited',
        'មិនកំណត់ចំនួនអ្នកជំងឺ និង ៥០ គណនីបុគ្គលិក',
        'AI Voice Dictation សំឡេងខ្មែរ កត់ត្រាពិគ្រោះជំងឺដោយស្វ័យប្រវត្តិ',
        'Automated Medical SOAP Notes Structuring',
        'CDSS Clinical Decision Support ពិនិត្យប្រតិកម្មថ្នាំ DDI Guard',
        'បណ្តាញឃ្លាំងស្តុកច្រើនសាខា Multi-Branch Depot Sync',
        'វិបផតថលសមាគមវេជ្ជសាស្ត្រ TMA Portal & EMR Hub',
        'រួមបញ្ចូលរាល់ ២៦ មុខងារនៃ Hospital Enterprise ទាំងអស់',
        'ជំនួយបច្ចេកទេសពិសេស 24/7 Priority SLA',
      ],
      featuresEn: [
        'Unlimited dynamic KHQR transactions',
        'Unlimited patients & 50 staff accounts',
        'AI Khmer Voice Clinical Dictation & Speech-to-Text',
        'Automated Medical SOAP Notes Structuring engine',
        'CDSS Clinical Decision Support & Drug-Drug Interaction guard',
        'Multi-Branch central inventory depot & inter-branch transfer',
        'Medical association TMA Portal & specialty referral engine',
        'All 26 Hospital Enterprise features included',
        '24/7 Priority Engineering SLA support',
      ],
    },
    {
      id: 'UNLIMITED_20',
      nameKh: 'គម្រោងគ្មានដែនកំណត់ Unlimited PaaS',
      nameEn: 'Unlimited PaaS 20$/mo',
      badgeKh: 'PaaS គ្មានដែនកំណត់',
      badgeEn: 'Unlimited Enterprise PaaS',
      moduleCountKh: '៣០+ គ្មានដែនកំណត់',
      moduleCountEn: '30+ Unlimited Modules',
      descKh: 'ដំណោះស្រាយ Platform as a Service ពេញលេញ - ប្រើប្រាស់ដូមេនផ្ទាល់ខ្លួន White-label Domain, Dedicated Database Instance ឯករាជ្យ, Telegram Master Super Admin Bot, មិនកំណត់ចំនួនសាខា និងបុគ្គលិក 24/7 Priority SLA',
      descEn: 'Full Platform as a Service solution - white-label custom domain, dedicated isolated cloud database instance, Telegram Master Bot, unlimited branches & staff, 24/7 dedicated engineering SLA.',
      monthlyUsd: 20,
      yearlyUsd: 192, // 20% discount ($16.00/mo)
      originalYearlyUsd: 240,
      yearlySavingsUsd: 48,
      equivalentMonthlyUsd: '16.00',
      khqrLimitKh: 'មិនកំណត់ចំនួន Unlimited',
      khqrLimitEn: 'Unlimited dynamic QR / day',
      patientLimitKh: 'មិនកំណត់ចំនួន / គណនី',
      patientLimitEn: 'Unlimited patients / account',
      staffLimitKh: 'មិនកំណត់ចំនួន Unlimited',
      staffLimitEn: 'Unlimited staff accounts',
      featuresKh: [
        'ដំណោះស្រាយ PaaS ពេញលេញសម្រាប់បណ្តាញមន្ទីរពេទ្យ',
        'សៀវភៅតាមដានឱសថញៀន MoH DDF Narcotic Register ផ្ទៀងផ្ទាត់សាក្សីពីររូប',
        'ប្រព័ន្ធវាស់វែង PACS Caliper & Densitometry HU Tissue Classification',
        'បណ្តាញសាខាច្រើន Multi-Branch Cloud Fleet Real-time Replication',
        'White-label Custom Domain ប្រើប្រាស់ដូមេនផ្ទាល់ខ្លួនរបស់គ្លីនិក',
        'Dedicated Cloud Database Instance ឯករាជ្យសុវត្ថិភាពខ្ពស់',
        'AI Voice Dictation សំឡេងខ្មែរ កត់ត្រាពិគ្រោះជំងឺ និង SOAP Structuring',
        'Telegram Super Admin Master Bot គ្រប់គ្រងសាខា និងប្រតិបត្តិការ',
        'មិនកំណត់ចំនួនសាខា និងមិនកំណត់ចំនួនបុគ្គលិក Unlimited Fleet',
        'មិនកំណត់ចំនួនអ្នកជំងឺ និង Unlimited KHQR',
        'រួមបញ្ចូលរាល់ឧបករណ៍ និងមុខងារទាំងអស់ក្នុងប្រព័ន្ធ ១០០%',
        '24/7 Dedicated Engineering Support & VIP SLA 15-minute response',
      ],
      featuresEn: [
        'Complete Hospital PaaS operating infrastructure',
        'MoH DDF Statutory Controlled Substances & Narcotic Register with Dual-Signoff Witness',
        'PACS WebGL Caliper & Densitometry Engine with HU Tissue Attenuation',
        'Multi-Branch Cloud Fleet Real-time Replication & Central Audit Lake',
        'White-label custom domain - e.g. emr.yourhospital.com',
        'Dedicated isolated cloud database instance',
        'AI Khmer Voice Clinical Dictation & Automated SOAP Structuring',
        'Telegram Master Super Admin Bot for remote executive control',
        'Unlimited hospital branches and unlimited staff accounts',
        'Unlimited patient records & unlimited KHQR transactions',
        'Full 100% platform feature access across all present & future modules',
        '24/7 Dedicated engineering team & 15-minute response SLA',
      ],
    },
  ];

  // 26 Real System Tools and Modules
  const systemTools: SystemToolItem[] = [
    // 1. Clinical & Diagnostics
    {
      id: 'emr',
      category: 'clinical',
      titleKh: 'ប្រព័ន្ធស្រង់ប្រវត្តិអ្នកជំងឺ Master EMR',
      titleEn: 'Master Patient Dossier & Index',
      descKh: 'ស្វែងរកប្រវត្តិជំងឺ អាឡែហ្ស៊ី ក្រុមឈាម និងឯកសារចាស់ៗតាមកូដ HN ក្នុងពេល ០.១ វិនាទី',
      descEn: 'Search master patient index, allergies, blood types, and past clinical dossiers in 0.1s.',
      minTier: 'FREE',
      icon: Users,
    },
    {
      id: 'vitals',
      category: 'clinical',
      titleKh: 'ពិគ្រោះជំងឺ & Vitals សញ្ញាជីវិត SOAP Notes',
      titleEn: 'SOAP Notes & Multi-Vitals Tracking',
      descKh: 'កត់ត្រាសម្ពាធឈាម BP, ចង្វាក់បេះដូង HR, អុកស៊ីសែន SpO2, សីតុណ្ហភាព និងកំណត់សម្គាល់ពិគ្រោះ SOAP',
      descEn: 'Track multi-vitals (BP, HR, SpO2, Temp), calculate BMI, and record structured SOAP clinical notes.',
      minTier: 'FREE',
      icon: Calendar,
    },
    {
      id: 'queue',
      category: 'clinical',
      titleKh: 'ហៅលេខជួរជាសំឡេងខ្មែរ Khmer Voice Queue',
      titleEn: 'Khmer Audio Queue & Custom Voice Upload',
      descKh: 'ប្រព័ន្ធហៅលេខតាមសំឡេងខ្មែរស្វ័យប្រវត្តិ គាំទ្រការ Upload សំឡេងផ្ទាល់ខ្លួន និង Real-Time Audio Preview',
      descEn: 'Automated Khmer voice synthesizer with token board, multi-room callouts, and custom voice upload.',
      minTier: 'STARTER_5',
      icon: Monitor,
    },
    {
      id: 'dental',
      category: 'clinical',
      titleKh: 'ពេទ្យធ្មេញ FDI Odontogram ៣២ ធ្មេញ & WHO DMFT',
      titleEn: 'FDI 32-Tooth Odontogram & WHO DMFT Score',
      descKh: 'ប្លង់ធ្មេញកាយវិភាគវិទ្យា ៣២ ធ្មេញ Interactive ចុចកត់ត្រាការប៉ះ ដកធ្មេញ និងគណនាពិន្ទុ DMFT ស្វ័យប្រវត្តិ',
      descEn: 'Interactive 32-tooth anatomical chart, restorative dental logs, and automated WHO DMFT calculation.',
      minTier: 'PRO_8',
      icon: Sparkles,
      isSpecial: true,
    },
    {
      id: 'pacs',
      category: 'clinical',
      titleKh: 'រូបភាពវេជ្ជសាស្ត្រ WebGL PACS DICOM',
      titleEn: 'WebGL PACS DICOM Viewer (X-Ray, CT, Ultrasound)',
      descKh: 'មើលរូបភាពឆ្លុះ X-Ray, CT Scan, MRI និងអេកូ Ultrasound កម្រិតច្បាស់ HU Windowing និង Caliper Measurement',
      descEn: 'High-performance WebGL DICOM radiology viewer with Hounsfield leveling, zoom, pan, and calipers.',
      minTier: 'PRO_8',
      icon: Film,
      isSpecial: true,
    },
    {
      id: 'lab',
      category: 'clinical',
      titleKh: 'មន្ទីរពិសោធន៍ & វិភាគឈាម LIS',
      titleEn: 'Laboratory Information System (LIS) & Analyzers',
      descKh: 'គ្រប់គ្រងលទ្ធផលតេស្តឈាម CBC, ជីវគីមីវិទ្យា, ទឹកនោម, ភ្ជាប់ម៉ាស៊ីន ASTM/HL7 និង Alert តម្លៃអាសន្ន Panic Values',
      descEn: 'Automated laboratory analyzer interfacing (ASTM/HL7), hematology CBC panels, and critical panic alerts.',
      minTier: 'PRO_8',
      icon: FlaskConical,
      isSpecial: true,
    },
    {
      id: 'certificates',
      category: 'clinical',
      titleKh: 'លិខិតវេជ្ជសាស្ត្រផ្លូវការ A4 Medical Certificates',
      titleEn: 'Official A4 Medical Sick Leave Certificates',
      descKh: 'ចេញលិខិតសម្រាកព្យាបាលជំងឺ និងលិខិតបញ្ជាក់កាយសម្បទាផ្លូវការ បោះពុម្ពទំហំ A4 វាយត្រាគ្លីនិក',
      descEn: 'Official bilingual sick leave certificates and fitness-for-work documents with clinic stamps.',
      minTier: 'STARTER_5',
      icon: FileCheck,
    },

    // 2. Inpatient & Specialized Care
    {
      id: 'ipd',
      category: 'care',
      titleKh: 'គ្រប់គ្រងគ្រែសម្រាកពេទ្យ Inpatient Beds - IPD',
      titleEn: 'Inpatient Bed & Ward Management (IPD)',
      descKh: 'គ្រប់គ្រងប្លង់គ្រែសម្រាកពេទ្យតាម Ward, ទទួលអ្នកជំងឺ Admission, តាមដានស្ថានភាព និងចេញពីពេទ្យ Discharge',
      descEn: 'Ward bed visual occupancy matrix, admission logs, physician rounds notes, and discharge processing.',
      minTier: 'PRO_8',
      icon: BedDouble,
      isSpecial: true,
    },
    {
      id: 'emar',
      category: 'care',
      titleKh: 'តារាងផ្តល់ថ្នាំអេឡិចត្រូនិក e-MAR 5-Rights',
      titleEn: 'Bedside e-MAR Electronic Medication Administration',
      descKh: 'តារាងផ្តល់ថ្នាំអ្នកជំងឺសម្រាកពេទ្យតាមស្តង់ដារ 5-Rights ការពារច្រឡំកម្រិតថ្នាំ និងម៉ោងលេបថ្នាំ ១០០%',
      descEn: 'Bedside 5-Rights electronic medication administration record ensuring zero dosage confusion.',
      minTier: 'PRO_8',
      icon: Pill,
    },
    {
      id: 'teleconsult',
      category: 'care',
      titleKh: 'ពិគ្រោះជំងឺពីចម្ងាយ WebRTC Teleconsultation',
      titleEn: 'Encrypted WebRTC HD Video Teleconsultation',
      descKh: 'វីដេអូខល WebRTC កម្រិត HD ដាច់ដោយឡែក សុវត្ថិភាពខ្ពស់ ជជែកពិគ្រោះផ្ទាល់ និងចេញវេជ្ជបញ្ជាក្នុងពេលខល',
      descEn: 'Peer-to-peer encrypted WebRTC video calling with live clinical in-call chat and consultation notes.',
      minTier: 'ENTERPRISE_12',
      icon: Video,
      isSpecial: true,
    },
    {
      id: 'concierge',
      category: 'care',
      titleKh: 'ថែទាំតាមដានអ្នកជំងឺ Care Concierge & Adherence',
      titleEn: 'Care Concierge & Chronic Patient Adherence',
      descKh: 'តាមដានការលេបថ្នាំអ្នកជំងឺរ៉ាំរ៉ៃ ផ្ញើសាររំលឹកស្វ័យប្រវត្តិតាម Telegram/SMS និងស្វែងរកសញ្ញាអាសន្ន Red Flags',
      descEn: 'Automated Telegram/SMS medication reminders, adherence tracking, and clinical red-flag triage detection.',
      minTier: 'PRO_8',
      icon: HeartHandshake,
    },
    {
      id: 'followups',
      category: 'care',
      titleKh: 'ប្រតិទិនណាត់ជួប និងតាមដានជំងឺ Follow-up Scheduling',
      titleEn: 'Multi-Physician Appointment Scheduling Calendar',
      descKh: 'ប្រតិទិនណាត់ជួបគ្រូពេទ្យឯកទេសច្រើនរូប គ្រប់គ្រងម៉ោងពិនិត្យ និងផ្ញើសាររំលឹកការណាត់ជួបស្វ័យប្រវត្តិ',
      descEn: 'Centralized physician appointment calendar with automated patient reminder notifications.',
      minTier: 'STARTER_5',
      icon: CalendarDays,
    },

    // 3. Pharmacy & Logistics
    {
      id: 'pharmacy',
      category: 'pharmacy',
      titleKh: 'ឱសថស្ថាន & ចេញថ្នាំ Outpatient Dispensing',
      titleEn: 'Pharmacy Dispensing & Auto-Label Printing',
      descKh: 'ពិនិត្យបញ្ជីថ្នាំ ចេញវេជ្ជបញ្ជារហ័ស បោះពុម្ពស្លាកណែនាំរបៀបប្រើប្រាស់ថ្នាំ និងកាត់ស្តុកស្វ័យប្រវត្តិ',
      descEn: 'Outpatient pharmacy dispensing, auto-generated instruction dosage labels, and inventory deduction.',
      minTier: 'STARTER_5',
      icon: Pill,
    },
    {
      id: 'cdss',
      category: 'pharmacy',
      titleKh: 'CDSS ឆ្លាតវៃ ត្រួតពិនិត្យអន្តរកម្មថ្នាំ Drug-Drug Interaction',
      titleEn: 'CDSS Drug-Drug Interaction & Allergy Safety',
      descKh: 'ប្រព័ន្ធ CDSS ផ្ទៀងផ្ទាត់បញ្ជីថ្នាំជាមួយប្រវត្តិអាឡែហ្ស៊ី ត្រួតពិនិត្យ Drug-Drug Interaction និង Alert ហាមឃាត់ភ្លាមៗ',
      descEn: 'Intelligent decision support flagging severe drug-drug interactions, penicillin cross-reactions, and contraindications.',
      minTier: 'PRO_8',
      icon: Sparkles,
      isSpecial: true,
    },
    {
      id: 'fefo',
      category: 'pharmacy',
      titleKh: 'ឃ្លាំងឱសថ FEFO ច្រើនសាខា & តាមដាន Batch No',
      titleEn: 'Multi-Branch FEFO Warehouse & Expiry Engine',
      descKh: 'គ្រប់គ្រងស្តុកតាមដាន First-Expired First-Out, លេខកូដឡូតិ៍ Batch No, ជូនដំណឹងឱសថជិតផុតកំណត់ និងផ្ទេរស្តុក',
      descEn: 'Multi-branch warehouse with First-Expired First-Out dispensing logic, batch lots, and expiry warning alerts.',
      minTier: 'PRO_8',
      icon: Boxes,
      isSpecial: true,
    },

    // 4. Finance & POS Cashiering
    {
      id: 'khqr',
      category: 'finance',
      titleKh: 'Dynamic Bakong ABA KHQR POS ចាក់សោទឹកប្រាក់',
      titleEn: 'Dynamic Bakong ABA KHQR POS (Direct Settlement)',
      descKh: 'បង្កើត QR Code ចាក់សោទឹកប្រាក់ស្វ័យប្រវត្ត ស្កេនបង់លុយហូរចូលគណនីធនាគារគ្លីនិកផ្ទាល់ ១០០% គ្មានកាត់កម្រៃជើងសារ',
      descEn: 'Dynamic Bakong KHQR point-of-sale checkout settling 100% directly into clinic bank account with 0% platform fee.',
      minTier: 'STARTER_5',
      icon: CreditCard,
    },
    {
      id: 'ws_payment',
      category: 'finance',
      titleKh: 'ចាប់យកទិន្នន័យបង់ប្រាក់ Real-Time WebSocket & Deeplink',
      titleEn: 'Real-Time WebSocket Detection & ABA Deeplinks',
      descKh: 'ចាប់យកលទ្ធផលទូទាត់ប្រាក់ក្នុងពេល ៣ វិនាទី រួមទាំង Deeplink ABA Mobile App ផ្លូវការ Upgrade ស្វ័យប្រវត្ត',
      descEn: '3-second real-time websocket payment capture and seamless ABA Mobile deep link routing.',
      minTier: 'STARTER_5',
      icon: Zap,
    },
    {
      id: 'pos_print',
      category: 'finance',
      titleKh: 'បោះពុម្ពវិក្កយបត្រ Thermal 80mm & កេះទាញថតលុយ',
      titleEn: '80mm Thermal Printing & Cash Drawer Trigger',
      descKh: 'បោះពុម្ពវិក្កយបត្រតាមម៉ាស៊ីន POS Thermal 80mm មាន Logo គ្លីនិកពីរភាសា និងកេះទាញថតលុយស្វ័យប្រវត្តិ',
      descEn: 'Standard 80mm ESC/POS thermal printing with clinic header logos and automated cash drawer triggers.',
      minTier: 'STARTER_5',
      icon: FileSpreadsheet,
    },
    {
      id: 'finance_pnl',
      category: 'finance',
      titleKh: 'គណនេយ្យកម្រៃគ្រូពេទ្យ & របាយការណ៍ EBITDA P&L',
      titleEn: 'Doctor Commission Splits & EBITDA Profit/Loss Ledger',
      descKh: 'គណនាភាគរយប្រាក់កម្រៃវេជ្ជបណ្ឌិតតាម Visit, កត់ត្រាចំណាយប្រតិបត្តិការគ្លីនិក និងរបាយការណ៍ចំណេញខាត EBITDA',
      descEn: 'Automated doctor commission split calculations, clinic operational expenses, and EBITDA profitability reports.',
      minTier: 'PRO_8',
      icon: TrendingUp,
    },
    {
      id: 'insurance',
      category: 'finance',
      titleKh: 'បេឡាជាតិ ប.ស.ស NSSF & ធានារ៉ាប់រងសុខភាព',
      titleEn: 'NSSF Eligibility & Health Insurance Pre-Authorization',
      descKh: 'ផ្ទៀងផ្ទាត់សិទ្ធិកាត ប.ស.ស, កាត់កង Co-Payment និងគ្រប់គ្រងសំណងធានារ៉ាប់រងឯកជនដោយតម្លាភាព',
      descEn: 'National Social Security Fund (NSSF) member eligibility validation, co-pay deductions, and insurance claim tracking.',
      minTier: 'PRO_8',
      icon: ShieldPlus,
    },
    {
      id: 'invoice_designer',
      category: 'finance',
      titleKh: 'រចនាម៉ូតវិក្កយបត្រផ្លូវការ Custom Invoice Designer',
      titleEn: 'Custom Visual Invoice & Receipt Layout Designer',
      descKh: 'កែសម្រួលទម្រង់វិក្កយបត្រផ្លូវការ ផ្លាស់ប្តូររូបភាព Logo គ្លីនិក ពណ៌ក្បាលទំព័រ និងទម្រង់បោះពុម្ព A4 ឬ 80mm',
      descEn: 'Visual invoice layout customization engine with clinic logos, bilingual typography, and styling palettes.',
      minTier: 'ENTERPRISE_12',
      icon: LayoutTemplate,
    },

    // 5. Enterprise Scale & National Compliance
    {
      id: 'dhis2',
      category: 'enterprise',
      titleKh: 'បញ្ជូនរបាយការណ៍ក្រសួងសុខាភិបាល MoH DHIS2 & eClaim',
      titleEn: 'MoH DHIS2 National Surveillance & eClaim Engine',
      descKh: 'បញ្ជូនទិន្នន័យស្ថិតិជំងឺឆ្លង និងសូចនាករសុខាភិបាលថ្នាក់ជាតិ MoH DHIS2 ព្រមទាំងឯកសារសំណង eClaim XML/FHIR',
      descEn: 'Official Ministry of Health DHIS2 national communicable disease reporting and automated eClaim XML/FHIR exports.',
      minTier: 'ENTERPRISE_12',
      icon: FileSpreadsheet,
      isSpecial: true,
    },
    {
      id: 'eprescription',
      category: 'enterprise',
      titleKh: 'វេជ្ជបញ្ជាឌីជីថលមាន QR Code Cryptographic Signed',
      titleEn: 'Digitally Signed QR Cryptographic e-Prescription',
      descKh: 'ចេញវេជ្ជបញ្ជាឌីជីថលមាន QR Code ចុះហត្ថលេខាអេឡិចត្រូនិច Cryptographic Hash ការពារការក្លែងបន្លំ និងផ្ទៀងផ្ទាត់បានភ្លាមៗ',
      descEn: 'Digitally signed electronic prescriptions with tamper-evident cryptographic QR payloads and patient verification.',
      minTier: 'ENTERPRISE_12',
      icon: ShieldCheck,
      isSpecial: true,
    },
    {
      id: 'subdomain',
      category: 'enterprise',
      titleKh: 'Custom Clinic Subdomain ផ្ទាល់ខ្លួន - yourclinic',
      titleEn: 'Dedicated Workspace Subdomain - e.g. yourclinic',
      descKh: 'ទទួលបាន Subdomain ផ្លូវការផ្ទាល់ខ្លួន ឧទាហរណ៍ yourclinic.krupet.com បង្កើនទំនុកចិត្ត និងភាពថ្លៃថ្នូរដល់គ្លីនិក',
      descEn: 'Official dedicated subdomain (e.g. yourclinic.krupet.com) providing isolated white-label institutional identity.',
      minTier: 'ENTERPRISE_12',
      icon: Building2,
      isSpecial: true,
    },
    {
      id: 'signage',
      category: 'enterprise',
      titleKh: 'ស្លាកអេក្រង់ Smart TV Signage បន្ទប់រង់ចាំ',
      titleEn: 'Smart TV Waiting Room Queue & Health Signage',
      descKh: 'បង្ហាញជួររង់ចាំលើអេក្រង់ Smart TV កម្រិត Full HD អមដោយសារជូនដំណឹង និងវីដេអូអប់រំសុខភាពដល់អ្នកជំងឺ',
      descEn: 'Full-screen waiting room TV display showcasing real-time queue tokens and educational health media.',
      minTier: 'PRO_8',
      icon: Tv,
    },
    {
      id: 'telegram_topics',
      category: 'enterprise',
      titleKh: 'Telegram Supergroup ៤ បន្ទប់ Topic ដាច់ដោយឡែក',
      titleEn: '4 Dedicated Telegram Forum Supergroup Topics',
      descKh: 'ភ្ជាប់ជាមួយ Telegram Supergroup បំបែកជា ៤ Topic ដាច់ដោយឡែក រួមមាន Payments, Queue, Pharmacy និង Security',
      descEn: 'Instant automated alerts routed into 4 isolated Telegram Supergroup Forum topics (Payments, Queue, Pharmacy, Security).',
      minTier: 'PRO_8',
      icon: Settings,
    },
    {
      id: 'narcotics_register',
      category: 'enterprise',
      titleKh: 'សៀវភៅតាមដានឱសថញៀន MoH DDF Statutory Narcotic Register',
      titleEn: 'MoH DDF Statutory Controlled Substances & Narcotic Register',
      descKh: 'តាមដានឱសថញៀន និងសារធាតុគ្រោះថ្នាក់ ផ្ទៀងផ្ទាត់សាក្សីពីររូប Dual-Signoff Witness, Merkle Chain SHA-256 និងកត់ត្រាកម្ទេចសំណល់ឱសថ',
      descEn: 'Statutory narcotic tracking with mandatory dual-clinician witness verification, tamper-evident SHA-256 Merkle ledger, and residual destruction logs.',
      minTier: 'UNLIMITED_20',
      icon: ShieldCheck,
      isSpecial: true,
    },
    {
      id: 'pacs_caliper',
      category: 'clinical',
      titleKh: 'ប្រព័ន្ធវាស់វែង PACS Caliper & Densitometry',
      titleEn: 'PACS WebGL Linear Caliper & ROI Tissue Densitometry',
      descKh: 'វាស់ប្រវែង Caliper កម្រិតមីលីម៉ែត្រ Pixel Spacing Tensor និងវិភាគដង់ស៊ីតេជាលិកា Hounsfield Units ដោយស្វ័យប្រវត្ត',
      descEn: 'Calibrated millimeter distance measurement tensor and automated Hounsfield Unit ROI tissue densitometry classification.',
      minTier: 'UNLIMITED_20',
      icon: Film,
      isSpecial: true,
    },
    {
      id: 'fleet_sync',
      category: 'enterprise',
      titleKh: 'បណ្តាញសាខាច្រើន Multi-Branch Cloud Fleet Sync',
      titleEn: 'Multi-Branch Cloud Fleet Real-Time Sync & Data Lake',
      descKh: 'ធ្វើសមកាលកម្មទិន្នន័យរវាងសាខាមន្ទីរពេទ្យទាំងអស់ក្នុងពេល Real-Time ជាមួយ Central Audit Lake គ្មានការកកស្ទះ',
      descEn: 'Real-time multi-branch synchronization and central operational data lake for hospital group fleets.',
      minTier: 'UNLIMITED_20',
      icon: Building2,
      isSpecial: true,
    },
  ];

  // Filter tools by category and search
  const filteredTools = useMemo(() => {
    return systemTools.filter((t) => {
      if (activeToolCategory !== 'all' && t.category !== activeToolCategory) return false;
      if (toolSearchQuery.trim()) {
        const q = toolSearchQuery.toLowerCase().trim();
        const matchTitle = t.titleKh.toLowerCase().includes(q) || t.titleEn.toLowerCase().includes(q);
        const matchDesc = t.descKh.toLowerCase().includes(q) || t.descEn.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [systemTools, activeToolCategory, toolSearchQuery]);

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

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            Free Starter
          </span>
        );
      case 'STARTER_5':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            Starter $5
          </span>
        );
      case 'PRO_8':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Pro $8
          </span>
        );
      case 'ENTERPRISE_12':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Enterprise $12
          </span>
        );
      case 'SPECIALIST_15':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
            Specialist $15
          </span>
        );
      case 'UNLIMITED_20':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            Unlimited $20
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="pricing" className="py-12 md:py-20 space-y-16">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 px-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-teal-800" />
          <span>{isKm ? 'តារាងតម្លៃសមរម្យ និងតម្លាភាព ១០០%' : 'Transparent & Predictable Pricing 100%'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
          {isKm
            ? 'ជ្រើសរើសគម្រោងដែលសមស្របនឹងទំហំគ្លីនិករបស់អ្នក'
            : 'Find the Perfect Plan for Your Clinical Practice'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl mx-auto">
          {isKm
            ? 'គម្រោងតម្លៃសមរម្យបំផុតនៅកម្ពុជា រួមបញ្ចូល ២៦ ឧបករណ៍វេជ្ជសាស្ត្រ និងការទូទាត់ប្រាក់ Dynamic KHQR ផ្ទាល់ចូលគណនីគ្លីនិក គ្មានកាត់កម្រៃជើងសារ 0% ឡើយ'
            : 'Cambodia most cost-effective clinical SaaS with 26 specialized tools, instant Dynamic KHQR settlement, and 0% transaction commission.'}
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
                {isKm ? 'ចុះ ២០% សន្សំ ២ ខែ' : 'Save 20% (2 Mo Free)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Pricing Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-stretch">
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
              {/* Selected Pill on Top Right */}
              {isSelected && (
                <div className="absolute -top-3.5 right-4 px-2.5 py-0.5 bg-teal-900 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 border border-teal-700 z-10">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{isKm ? 'បានជ្រើសរើស' : 'Selected'}</span>
                </div>
              )}

              {/* Plan Badge Centered on Top */}
              {p.badgeKh && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm z-10 ${
                    p.id === 'PRO_8'
                      ? 'bg-teal-800 text-amber-300 border border-teal-600 ring-2 ring-amber-400/30'
                      : p.id === 'ENTERPRISE_12'
                      ? 'bg-amber-600 text-white border border-amber-500 ring-2 ring-amber-300/40'
                      : p.id === 'SPECIALIST_15'
                      ? 'bg-purple-700 text-white border border-purple-500'
                      : p.id === 'UNLIMITED_20'
                      ? 'bg-blue-800 text-white border border-blue-600'
                      : 'bg-teal-800 text-white border border-teal-700'
                  }`}
                >
                  {isKm ? p.badgeKh : p.badgeEn}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-base font-sans transition-colors ${isSelected ? 'font-black text-teal-950' : 'font-bold text-stone-900'}`}>
                      {isKm ? p.nameKh : p.nameEn}
                    </h3>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-stone-100 text-teal-900 border border-stone-200">
                      {isKm ? p.moduleCountKh : p.moduleCountEn}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 mt-2 min-h-[44px] leading-relaxed">
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
                  <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
                    <span>{isKm ? 'មុខងារសំខាន់ៗរួមមាន:' : 'Key Features Included:'}</span>
                    <span className="text-[10px] text-teal-800 font-mono">
                      {(isKm ? p.featuresKh : p.featuresEn).length} {isKm ? 'មុខងារ' : 'features'}
                    </span>
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
              <div className="pt-6 space-y-2">
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
                          ? isKm ? `បានជ្រើសរើស ចុះឈ្មោះ $${p.yearlyUsd}/ឆ្នាំ` : `Selected Register ($${p.yearlyUsd}/yr)`
                          : isKm ? `បានជ្រើសរើស ចុះឈ្មោះ $${p.monthlyUsd}/ខែ` : `Selected Register ($${p.monthlyUsd}/mo)`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold">
                        {p.id === 'FREE'
                          ? isKm ? 'ចាប់ផ្ដើម Free រហូត' : 'Start Free Forever'
                          : isAnnual
                          ? isKm ? `ជ្រើសរើស $${p.yearlyUsd}/ឆ្នាំ` : `Select Plan ($${p.yearlyUsd}/yr)`
                          : isKm ? `ជ្រើសរើស $${p.monthlyUsd}/ខែ` : `Select Plan ($${p.monthlyUsd}/mo)`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Link>

                <a
                  href="#system-tools"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="block text-center text-[10px] font-bold text-stone-500 hover:text-teal-800 transition-colors py-1"
                >
                  {isKm ? 'រុករកឧបករណ៍ និងមុខងារទាំងអស់' : 'Explore all included tools'}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive System Tools & Features Explorer */}
      <div id="system-tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-[#FDFBF7] rounded-3xl border border-[#E3DBCB] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE3D5] pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200">
                <Layers className="w-3 h-3 text-teal-800" />
                <span>{isKm ? 'ឃ្លាំងឧបករណ៍ប្រព័ន្ធជាក់ស្តែង' : 'Live System Capability Arsenal'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-2 font-sans tracking-tight">
                {isKm
                  ? 'រុករកឧបករណ៍ទំនើបទាំង ២៦ នៃប្រព័ន្ធ KruPet'
                  : 'Explore All 26 Advanced Medical & Clinical Modules'}
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                {isKm
                  ? 'ប្រព័ន្ធប្រតិបត្តិការវេជ្ជសាស្ត្រកម្រិតខ្ពស់ រួមបញ្ចូលគ្រប់ឧបករណ៍ដែលគ្លីនិកឯកទេស មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ និងមន្ទីរសម្រាកព្យាបាលត្រូវការ'
                  : 'Everything your clinic, polyclinic, or specialized hospital requires to operate with speed, safety, and regulatory compliance.'}
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={toolSearchQuery}
                onChange={(e) => setToolSearchQuery(e.target.value)}
                placeholder={isKm ? 'ស្វែងរកឧបករណ៍ ឧ. ធ្មេញ, PACS, ស្តុក...' : 'Search tools e.g. Dental, PACS, Lab...'}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#DDD5C5] rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-teal-700 transition"
              />
              {toolSearchQuery && (
                <button
                  type="button"
                  onClick={() => setToolSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', nameKh: 'ឧបករណ៍ទាំងអស់: ២៦', nameEn: 'All 26 Modules' },
              { id: 'clinical', nameKh: 'ពិគ្រោះ & វិនិច្ឆ័យ: ៧', nameEn: 'Clinical & Diagnostics (7)' },
              { id: 'care', nameKh: 'ថែទាំ & IPD: ៥', nameEn: 'Inpatient & Care (5)' },
              { id: 'pharmacy', nameKh: 'ឱសថស្ថាន & ឃ្លាំង: ៣', nameEn: 'Pharmacy & FEFO (3)' },
              { id: 'finance', nameKh: 'ហិរញ្ញវត្ថុ & KHQR: ៦', nameEn: 'Finance & KHQR POS (6)' },
              { id: 'enterprise', nameKh: 'សហគ្រាស & ស្តង់ដារជាតិ: ៥', nameEn: 'Enterprise & Compliance (5)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveToolCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeToolCategory === tab.id
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-white border border-[#E3DBCB] text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {isKm ? tab.nameKh : tab.nameEn}
              </button>
            ))}
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredTools.map((t) => {
              const IconComp = t.icon;
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    t.isSpecial
                      ? 'bg-white border-teal-700/40 shadow-xs ring-1 ring-teal-700/10'
                      : 'bg-white border-[#EAE3D5] hover:border-stone-400'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                        <IconComp className="w-4 h-4 text-teal-800" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {t.isSpecial && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                            Pro/Enterprise
                          </span>
                        )}
                        {getTierBadge(t.minTier)}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-stone-900 font-sans">
                        {isKm ? t.titleKh : t.titleEn}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                        {isKm ? t.descKh : t.descEn}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#F2ECE1] flex items-center justify-between text-[10px] text-stone-500 font-medium">
                    <span>{isKm ? 'កម្រិតគម្រោងចាប់ពី' : 'Included from'}:</span>
                    <strong className="font-bold text-teal-900">
                      {t.minTier === 'FREE'
                        ? 'Free Forever'
                        : t.minTier === 'STARTER_5'
                        ? 'Starter $5'
                        : t.minTier === 'PRO_8'
                        ? 'Pro $8'
                        : t.minTier === 'ENTERPRISE_12'
                        ? 'Enterprise $12'
                        : t.minTier === 'SPECIALIST_15'
                        ? 'Specialist $15'
                        : 'Unlimited $20'}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      {!compact && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-[#FDFBF7] rounded-3xl border border-[#E3DBCB] shadow-xs overflow-hidden">
            <div className="p-6 border-b border-[#EAE3D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {isKm ? 'តារាងប្រៀបធៀបសមត្ថភាព និងមុខងារលម្អិត' : 'Comprehensive Feature Comparison Matrix'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {isKm
                    ? 'ប្រៀបធៀបរាល់សមត្ថភាពបច្ចេកទេស និងកូតាប្រតិបត្តិការនៃគម្រោងនីមួយៗ'
                    : 'Detailed technical quota breakdown and operational tool availability across all tiers.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-teal-900 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                  {isKm ? 'សរុប ២៦ ឧបករណ៍ប្រព័ន្ធ' : '26 System Tools Total'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-[#FAF7F2] border-b border-[#EAE3D5] text-[11px] font-bold text-stone-600 uppercase">
                  <tr>
                    <th className="p-4 w-1/3">{isKm ? 'លក្ខណៈពិសេស & ឧបករណ៍' : 'Capability & Module'}</th>
                    <th className="p-4 text-center">Free Forever</th>
                    <th className="p-4 text-center">Clinic Starter $5</th>
                    <th className="p-4 text-center bg-teal-50/50 text-teal-900 font-extrabold">Polyclinic Pro $8</th>
                    <th className="p-4 text-center">Hospital Enterprise $12</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D5]">
                  {/* Category: Quotas */}
                  <tr className="bg-[#F5EFE3]/60">
                    <td colSpan={5} className="py-2.5 px-4 font-black text-stone-800 uppercase text-[10px] tracking-wider">
                      {isKm ? '១. កូតាប្រតិបត្តិការ & សមត្ថភាពប្រព័ន្ធ' : '1. Operational Quotas & Capacity'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'កូតាប្រតិបត្តិការ Dynamic KHQR' : 'Dynamic KHQR Limit / Day'}</td>
                    <td className="p-4 text-center font-mono">5 / ថ្ងៃ</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800">250 / ថ្ងៃ</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800 bg-teal-50/30">1,500 / ថ្ងៃ</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'កូតាអ្នកជំងឺក្នុងមួយគណនី' : 'Patient Records / Account'}</td>
                    <td className="p-4 text-center font-mono">50 នាក់ / គណនី</td>
                    <td className="p-4 text-center font-mono">1,000 នាក់ / គណនី</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800 bg-teal-50/30">៨,០០០ នាក់ / គណនី</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ចំនួនគណនីបុគ្គលិក RBAC' : 'Staff Accounts (RBAC)'}</td>
                    <td className="p-4 text-center font-mono">2</td>
                    <td className="p-4 text-center font-mono">5</td>
                    <td className="p-4 text-center font-mono bg-teal-50/30 font-bold text-teal-800">15</td>
                    <td className="p-4 text-center font-mono font-bold text-teal-800">Unlimited</td>
                  </tr>

                  {/* Category: Clinical & Diagnostics */}
                  <tr className="bg-[#F5EFE3]/60">
                    <td colSpan={5} className="py-2.5 px-4 font-black text-stone-800 uppercase text-[10px] tracking-wider">
                      {isKm ? '២. ឧបករណ៍ពិគ្រោះ & រោគវិនិច្ឆ័យ' : '2. Clinical Consultation & Diagnostics'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ប្រវត្តិអ្នកជំងឺ Master EMR & Vitals SOAP' : 'Master Patient EMR & SOAP Notes'}</td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ហៅអ្នកជំងឺជាសំឡេងខ្មែរស្វ័យប្រវត្តិ' : 'Khmer Audio Voice Queue Calling'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ពេទ្យធ្មេញ FDI Odontogram ៣២ ធ្មេញ & DMFT' : 'Dental FDI 32-Tooth Odontogram'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'រូបភាពវេជ្ជសាស្ត្រ WebGL PACS DICOM' : 'WebGL PACS DICOM Viewer'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'មន្ទីរពិសោធន៍ LIS & Panic Value Alerts' : 'Laboratory Information System (LIS)'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>

                  {/* Category: Inpatient & Care */}
                  <tr className="bg-[#F5EFE3]/60">
                    <td colSpan={5} className="py-2.5 px-4 font-black text-stone-800 uppercase text-[10px] tracking-wider">
                      {isKm ? '៣. ការថែទាំ & សម្រាកពេទ្យឯកទេស' : '3. Inpatient Wards & Specialized Care'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'គ្រែសម្រាកពេទ្យ IPD & e-MAR 5-Rights' : 'Inpatient Bed Management & e-MAR'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'វីដេអូខលពីចម្ងាយ WebRTC Teleconsultation' : 'WebRTC HD Video Teleconsultation'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300 bg-teal-50/30"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'Care Concierge & Adherence Tracking' : 'Care Concierge & Medication Reminders'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>

                  {/* Category: Pharmacy & Inventory */}
                  <tr className="bg-[#F5EFE3]/60">
                    <td colSpan={5} className="py-2.5 px-4 font-black text-stone-800 uppercase text-[10px] tracking-wider">
                      {isKm ? '៤. ឱសថស្ថាន & ឃ្លាំងស្តុក FEFO' : '4. Pharmacy & FEFO Warehouse'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ចេញថ្នាំ & បោះពុម្ពស្លាកណែនាំ' : 'Pharmacy Dispensing & Label Printing'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'CDSS ការពារអន្តរកម្មថ្នាំ Drug-Drug Interaction' : 'CDSS Drug Interaction Safety Engine'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ឃ្លាំងឱសថ FEFO ច្រើនសាខា & Batch No' : 'Multi-Branch FEFO Warehouse & Batch Lots'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>

                  {/* Category: Finance & Hardware */}
                  <tr className="bg-[#F5EFE3]/60">
                    <td colSpan={5} className="py-2.5 px-4 font-black text-stone-800 uppercase text-[10px] tracking-wider">
                      {isKm ? '៥. ហិរញ្ញវត្ថុ & ម៉ាស៊ីនព្រីន POS' : '5. Financial Settlement & POS Peripherals'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'ម៉ាស៊ីនព្រីន 80mm & កេះទាញថតលុយ' : '80mm POS Thermal Printing & Cash Drawer'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'គណនេយ្យកម្រៃគ្រូពេទ្យ & EBITDA P&L' : 'Doctor Split Commission & EBITDA Ledger'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'បេឡាជាតិ ប.ស.ស NSSF & ធានារ៉ាប់រង' : 'NSSF Integration & Co-Pay Processing'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'រចនាម៉ូតវិក្កយបត្រ Custom Invoice Designer' : 'Visual Custom Invoice Designer'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300 bg-teal-50/30"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>

                  {/* Category: Enterprise & Support */}
                  <tr className="bg-[#F5EFE3]/60">
                    <td colSpan={5} className="py-2.5 px-4 font-black text-stone-800 uppercase text-[10px] tracking-wider">
                      {isKm ? '៦. ស្តង់ដារជាតិ & ហេដ្ឋារចនាសម្ព័ន្ធ' : '6. Compliance & Enterprise Infrastructure'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'MoH DHIS2 របាយការណ៍ជំងឺឆ្លង & eClaim' : 'MoH DHIS2 National Surveillance & eClaim'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300 bg-teal-50/30"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'វេជ្ជបញ្ជា QR Cryptographic Signed' : 'Digitally Signed QR e-Prescription'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300 bg-teal-50/30"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'Custom Subdomain ផ្ទាល់ខ្លួន - yourclinic' : 'Dedicated Clinic Subdomain'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-300 bg-teal-50/30"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-teal-800 font-bold"><Check className="w-4 h-4 mx-auto font-bold" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'Telegram Forum Topics Bridge' : 'Telegram Forum Topics Bridge'}</td>
                    <td className="p-4 text-center text-stone-300"><X className="w-4 h-4 mx-auto" /></td>
                    <td className="p-4 text-center text-stone-600 font-medium">Standard Alert</td>
                    <td className="p-4 text-center text-teal-800 font-bold bg-teal-50/30">4 Topics (Full)</td>
                    <td className="p-4 text-center text-teal-800 font-bold">4 Topics (Full)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold">{isKm ? 'កម្រិតសេវាគាំទ្របច្ចេកទេស SLA' : 'Support SLA Level'}</td>
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
        <div id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {isKm ? 'សំណួរដែលសួរញឹកញាប់ - FAQ' : 'Frequently Asked Questions'}
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
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-stone-900 hover:text-teal-800 transition-colors cursor-pointer"
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
