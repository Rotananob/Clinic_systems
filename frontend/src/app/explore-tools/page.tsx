'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { PublicNavbar } from '../../components/landing/PublicNavbar';
import { PublicFooter } from '../../components/landing/PublicFooter';
import { SubscriptionCheckoutModal } from '../../components/subscriptions/SubscriptionCheckoutModal';
import { PLAN_TIER_RANK, PlanTier, isPlanUpgrade } from '../../lib/rbac';
import {
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
  Activity,
  Stethoscope,
  Pill,
  Boxes,
  CreditCard,
  QrCode,
  Film,
  FlaskConical,
  BedDouble,
  Video,
  Clock,
  HeartPulse,
  Tv,
  FileCheck,
  FolderOpen,
  Send,
  Users,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Layers,
  Database,
  Server,
  Network,
  Cpu,
} from 'lucide-react';

interface ToolCatalogItem {
  id: string;
  route: string;
  category: 'outpatient' | 'critical' | 'pharmacy' | 'diagnostic' | 'specialist' | 'paas';
  nameKh: string;
  nameEn: string;
  descKh: string;
  descEn: string;
  minTier: PlanTier;
  icon: React.ComponentType<{ className?: string }>;
  tagsKh: string[];
  tagsEn: string[];
  complianceStandard: string;
  isPopular?: boolean;
}

const TOOL_CATALOG: ToolCatalogItem[] = [
  // Free Outpatient Tools
  {
    id: 'patients',
    route: '/patients',
    category: 'outpatient',
    nameKh: 'ចុះឈ្មោះ & បញ្ជីអ្នកជំងឺអេឡិចត្រូនិក',
    nameEn: 'Patient Directory & EMR Registration',
    descKh: 'បង្កើតប្រវត្តិរូបអ្នកជំងឺ លេខកូដ HN ស្វ័យប្រវត្ត ស្កេនអត្តសញ្ញាណប័ណ្ណ និងពិនិត្យទិន្នន័យស្ទួន ១០០%។',
    descEn: 'Register clinical records, auto-generate HN barcodes, and prevent national identity duplicate files.',
    minTier: 'FREE',
    icon: Users,
    tagsKh: ['HN Barcode', 'ប្រវត្តិអ្នកជំងឺ', 'ឥតគិតថ្លៃ'],
    tagsEn: ['HN Barcode', 'Demographics', 'Free Forever'],
    complianceStandard: 'MoH EMR Standard',
  },
  {
    id: 'queue',
    route: '/queue',
    category: 'outpatient',
    nameKh: 'ក្ដារហៅលេខជួររង់ចាំ & សំឡេងខ្មែរ',
    nameEn: 'Live Queue Calling Station',
    descKh: 'ហៅលេខអ្នកជំងឺតាមលំដាប់លំដោយ ជាមួយសំឡេងខ្មែរពិរោះច្បាស់ និងចែកបន្ទប់ពិគ្រោះដោយស្វ័យប្រវត្ត។',
    descEn: 'Real-time patient queue calling station with clear synthesized audio alerts and multi-counter triage.',
    minTier: 'FREE',
    icon: Clock,
    tagsKh: ['ហៅលេខជួរ', 'សំឡេងខ្មែរ', 'ឥតគិតថ្លៃ'],
    tagsEn: ['Queue System', 'Khmer Voice', 'Free Forever'],
    complianceStandard: 'Smart Patient Flow',
  },
  {
    id: 'visits',
    route: '/visits',
    category: 'outpatient',
    nameKh: 'ការពិគ្រោះជំងឺ & សញ្ញាជីវិត SOAP',
    nameEn: 'Clinical Encounters & SOAP Consultation',
    descKh: 'កត់ត្រាប្រវត្តិជំងឺ SOAP សញ្ញាជីវិត BP/HR/SpO2 និងរោគវិនិច្ឆ័យ ICD-10 ស្តង់ដារវេជ្ជសាស្ត្រ។',
    descEn: 'Standard SOAP examination, vital signs telemetry, and official ICD-10 diagnostic structuring.',
    minTier: 'FREE',
    icon: Stethoscope,
    tagsKh: ['SOAP', 'ICD-10', 'សញ្ញាជីវិត'],
    tagsEn: ['SOAP Notes', 'ICD-10', 'Vital Signs'],
    complianceStandard: 'WHO ICD-10 Certified',
  },

  // Starter $5 Tools
  {
    id: 'prescriptions',
    route: '/prescriptions',
    category: 'pharmacy',
    nameKh: 'វេជ្ជបញ្ជាឌីជីថល & បើកថ្នាំ',
    nameEn: 'Digital e-Prescriptions & Pharmacy Dispensing',
    descKh: 'ចេញវេជ្ជបញ្ជា QR Code ទប់ស្កាត់ការប្រើប្រាស់ថ្នាំច្រឡំ និងបោះពុម្ពស្លាកថ្នាំភាសាខ្មែរតាមទំហំ 80mm។',
    descEn: 'Generate verified QR e-prescriptions, pharmacy dispensing checks, and Khmer dosage thermal printing.',
    minTier: 'STARTER_5',
    icon: Pill,
    tagsKh: ['វេជ្ជបញ្ជា QR', 'ស្លាកថ្នាំ 80mm', 'គម្រោង $5'],
    tagsEn: ['e-Prescription', '80mm Thermal', '$5 Starter'],
    complianceStandard: 'MoH DDF Pharmacy Code',
    isPopular: true,
  },
  {
    id: 'billing',
    route: '/billing',
    category: 'outpatient',
    nameKh: 'វិក្កយបត្រ & Dynamic Bakong KHQR POS',
    nameEn: 'Invoicing & Dynamic KHQR POS Cashier',
    descKh: 'គិតប្រាក់ជាមួយ Dynamic KHQR Tag 01=12 ចាក់សោទឹកប្រាក់ ហូរចូលគណនីធនាគារគ្លីនិកផ្ទាល់ ១០០% គ្មានកាត់កម្រៃជើងសារ 0%។',
    descEn: 'Cashier checkout with Tag 01=12 dynamic Bakong KHQR, zero commission, direct settlement into clinic bank account.',
    minTier: 'STARTER_5',
    icon: CreditCard,
    tagsKh: ['Dynamic KHQR', '0% កម្រៃជើងសារ', 'គម្រោង $5'],
    tagsEn: ['Dynamic KHQR', '0% Fee POS', '$5 Starter'],
    complianceStandard: 'NBC Bakong KHQR Tag 01=12',
    isPopular: true,
  },
  {
    id: 'certificates',
    route: '/certificates',
    category: 'outpatient',
    nameKh: 'លិខិតបញ្ជាក់សុខភាព & សម្រាកព្យាបាល A4',
    nameEn: 'Official Medical Certificates & A4 Slips',
    descKh: 'ចេញលិខិតបញ្ជាក់សុខភាពផ្លូវការ លិខិតសម្រាកព្យាបាលមាន QR ផ្ទៀងផ្ទាត់ និងត្រាឌីជីថលគ្លីនិក។',
    descEn: 'Issue tamper-evident medical certificates, leave approvals, and verification QR codes on official letterheads.',
    minTier: 'STARTER_5',
    icon: FileCheck,
    tagsKh: ['លិខិត A4', 'QR ផ្ទៀងផ្ទាត់', 'គម្រោង $5'],
    tagsEn: ['A4 Certificate', 'QR Validation', '$5 Starter'],
    complianceStandard: 'MoH Cambodia Standard',
  },
  {
    id: 'reports',
    route: '/reports',
    category: 'outpatient',
    nameKh: 'របាយការណ៍ហិរញ្ញវត្ថុ & ចំណូលប្រចាំថ្ងៃ',
    nameEn: 'Daily Revenue Reports & Shift Financials',
    descKh: 'ទាញរបាយការណ៍បិទបញ្ជីវេនការងារ ចំណូលសរុបតាម Cashier និងស្ថិតិព្យាបាលប្រចាំខែច្បាស់លាស់។',
    descEn: 'Comprehensive cashier shift audits, real-time revenue analytics, and monthly fiscal compliance summaries.',
    minTier: 'STARTER_5',
    icon: Activity,
    tagsKh: ['បិទបញ្ជីវេន', 'ស្ថិតិចំណូល', 'គម្រោង $5'],
    tagsEn: ['Shift Closing', 'Financials', '$5 Starter'],
    complianceStandard: 'General Department of Taxation Ready',
  },

  // Pro $8 Advanced Modules
  {
    id: 'inventory',
    route: '/inventory',
    category: 'pharmacy',
    nameKh: 'ឃ្លាំងឱសថកណ្តាល & FEFO Expiration Guard',
    nameEn: 'Central Pharmacy Warehouse & FEFO Inventory',
    descKh: 'គ្រប់គ្រងស្តុកថ្នាំតាមកាលបរិច្ឆេទផុតកំណត់ FEFO ប្រព័ន្ធព្រមានថ្នាំជិតផុតកំណត់ និងផ្ទេរថ្នាំរវាងសាខា។',
    descEn: 'First-Expired First-Out inventory, automatic near-expiry alerts, batch tracking, and warehouse requisitions.',
    minTier: 'PRO_8',
    icon: Boxes,
    tagsKh: ['FEFO', 'កាលបរិច្ឆេទផុតកំណត់', 'គម្រោង $8'],
    tagsEn: ['FEFO Inventory', 'Expiry Alerts', '$8 Pro'],
    complianceStandard: 'GSP Good Storage Practice',
    isPopular: true,
  },
  {
    id: 'dental',
    route: '/dental',
    category: 'specialist',
    nameKh: 'ទន្តសាស្ត្រ & Odontogram Interactive',
    nameEn: 'Dental Odontogram & Tooth Charting',
    descKh: 'ក្ដារធ្មេញ 32 ធ្មេញមនុស្សធំ និង 20 ធ្មេញកុមារ គូសចំណាំពុកធ្មេញ ដកធ្មេញ ប៉ះធ្មេញ និងប៉ាន់ស្មានថ្លៃព្យាបាល។',
    descEn: 'Interactive 32-adult and 20-pediatric odontogram with cavity mapping, prosthetic tracking, and treatment billing.',
    minTier: 'PRO_8',
    icon: Sparkles,
    tagsKh: ['ក្ដារធ្មេញ', 'Odontogram', 'គម្រោង $8'],
    tagsEn: ['Odontogram', 'Dental Charting', '$8 Pro'],
    complianceStandard: 'FDI Two-Digit Notation',
    isPopular: true,
  },
  {
    id: 'pacs',
    route: '/pacs',
    category: 'diagnostic',
    nameKh: 'រូបភាពវេជ្ជសាស្ត្រ & WebGL DICOM Radiologist Viewer',
    nameEn: 'WebGL PACS DICOM Radiologist Viewer',
    descKh: 'ពិនិត្យរូបភាព X-Ray, CT, MRI កម្រិតច្បាស់ WebGL ផ្ទាល់លើ Browser វាស់មុំ Cobb Angle និងសន្ទស្សន៍បេះដូង CTR។',
    descEn: 'Zero-footprint WebGL DICOM viewer with windowing HU presets, Cobb angle calipers, and cardiothoracic ratio calculation.',
    minTier: 'PRO_8',
    icon: Film,
    tagsKh: ['PACS DICOM', 'Cobb Angle', 'គម្រោង $8'],
    tagsEn: ['DICOM PACS', 'CTR Caliper', '$8 Pro'],
    complianceStandard: 'DICOM Part 10 / NEMA WebGL',
    isPopular: true,
  },
  {
    id: 'lab',
    route: '/lab',
    category: 'diagnostic',
    nameKh: 'មន្ទីរពិសោធន៍ LIS & Panic Alerts Interfacing',
    nameEn: 'Laboratory Information System - LIS',
    descKh: 'ប្រព័ន្ធបញ្ចូលលទ្ធផលឈាម CBC, Biochemistry ស្វ័យប្រវត្ត Delta check ផ្ទៀងផ្ទាត់ និងលោតសំឡេងព្រមានតម្លៃអាសន្ន។',
    descEn: 'ASTM/HL7 automated analyzer interfacing, delta check validation, critical value panic alerts, and barcode specimen tracking.',
    minTier: 'PRO_8',
    icon: FlaskConical,
    tagsKh: ['LIS Lab', 'Panic Alerts', 'គម្រោង $8'],
    tagsEn: ['LIS Laboratory', 'Delta Checks', '$8 Pro'],
    complianceStandard: 'ISO 15189 / ASTM E1394',
  },
  {
    id: 'ipd',
    route: '/ipd',
    category: 'critical',
    nameKh: 'សម្រាកព្យាបាល IPD & Five Rights e-MAR',
    nameEn: 'Inpatient Department - IPD & e-MAR',
    descKh: 'គ្រប់គ្រងគ្រែសម្រាកពេទ្យ ក្ដារផ្ដល់ថ្នាំ e-MAR ផ្ទៀងផ្ទាត់ 5 Rights និងតាមដានសមតុល្យជាតិទឹក ២៤ ម៉ោង Fluid Net។',
    descEn: 'Inpatient bed census, bedside Five Rights e-MAR verification, vitals flowsheets, and 24-hour cumulative fluid balance.',
    minTier: 'PRO_8',
    icon: BedDouble,
    tagsKh: ['គ្រែ IPD', 'e-MAR 5 Rights', 'គម្រោង $8'],
    tagsEn: ['Bed Census', 'e-MAR Flowsheet', '$8 Pro'],
    complianceStandard: 'JCI Inpatient Safety Standard',
  },
  {
    id: 'signage',
    route: '/signage',
    category: 'outpatient',
    nameKh: 'ស្លាកទូរទស្សន៍ឆ្លាតវៃក្នុងបន្ទប់រង់ចាំ Smart TV',
    nameEn: 'Smart Waiting Room TV Signage',
    descKh: 'ក្ដារបង្ហាញលេខជួរពេញអេក្រង់លើ Smart TV អមដោយសំឡេងអានខ្មែរ និងវីដេអូអប់រំសុខភាពរបស់គ្លីនិក។',
    descEn: 'Full-screen Smart TV queue display, synchronized Khmer audio chimes, and promotional health education slides.',
    minTier: 'PRO_8',
    icon: Tv,
    tagsKh: ['Smart TV', 'ក្ដារទូរទស្សន៍', 'គម្រោង $8'],
    tagsEn: ['Waiting TV', 'Audio Calling', '$8 Pro'],
    complianceStandard: '4K HDMI / Web Signage',
  },

  // Enterprise $12 Hospital Modules
  {
    id: 'teleconsult',
    route: '/teleconsult',
    category: 'specialist',
    nameKh: 'ពិគ្រោះជំងឺពីចម្ងាយ WebRTC HD Teleconsult',
    nameEn: 'WebRTC HD Video Teleconsultation',
    descKh: 'វីដេអូខលគុណភាពខ្ពស់ End-to-End Encrypted រវាងវេជ្ជបណ្ឌិត និងអ្នកជំងឺ ចេញវេជ្ជបញ្ជាក្នុងពេលសន្ទនា។',
    descEn: 'Sub-second encrypted WebRTC video consults with in-call e-prescribing, file sharing, and remote clinical intake.',
    minTier: 'ENTERPRISE_12',
    icon: Video,
    tagsKh: ['WebRTC Video', 'Teleconsult', 'គម្រោង $12'],
    tagsEn: ['WebRTC HD', 'Telemedicine', '$12 Enterprise'],
    complianceStandard: 'HIPAA WebRTC Encrypted',
    isPopular: true,
  },
  {
    id: 'eclaim',
    route: '/eclaim',
    category: 'outpatient',
    nameKh: 'ទូទាត់ធានារ៉ាប់រង NSSF e-Claim & ប.ស.ស.',
    nameEn: 'NSSF e-Claim & Insurance Settlement',
    descKh: 'បំបែកវិក្កយបត្រ ប.ស.ស. ស្វ័យប្រវត្ត រៀបចំកញ្ចប់ឯកសារទូទាត់ និងផ្ញើទិន្នន័យជូនក្រសួងសុខាភិបាល MoH DHIS2។',
    descEn: 'Automated NSSF insurance copay splitting, claim dossier generator, and direct MoH DHIS2 electronic reporting.',
    minTier: 'ENTERPRISE_12',
    icon: ShieldCheck,
    tagsKh: ['NSSF ប.ស.ស.', 'MoH DHIS2', 'គម្រោង $12'],
    tagsEn: ['NSSF Claims', 'MoH DHIS2', '$12 Enterprise'],
    complianceStandard: 'MoH DHIS2 / NSSF Adjudication',
  },
  {
    id: 'resuscitation',
    route: '/resuscitation',
    category: 'critical',
    nameKh: 'សង្គ្រោះបន្ទាន់ Sepsis Hour-1 & Parkland Burn',
    nameEn: 'Emergency Sepsis & Trauma Resuscitation',
    descKh: 'កញ្ចប់សង្គ្រោះ Sepsis Hour-1 រូបមន្ត Parkland រលាកភ្លើង បន្ទាន់ទារក Broselow និងពិធីការបញ្ចូលឈាមបន្ទាន់ MTP។',
    descEn: 'Surviving Sepsis Hour-1 bundle, Parkland burn formula calculator, pediatric Broselow tape, and Massive Transfusion.',
    minTier: 'ENTERPRISE_12',
    icon: HeartPulse,
    tagsKh: ['Sepsis Hour-1', 'Parkland Burn', 'គម្រោង $12'],
    tagsEn: ['Sepsis Protocol', 'Parkland Calculator', '$12 Enterprise'],
    complianceStandard: 'Surviving Sepsis Campaign 2026',
  },
  {
    id: 'pkpd',
    route: '/pkpd',
    category: 'specialist',
    nameKh: 'គណនាកម្រិតថ្នាំច្បាស់លាស់ PK-PD & TDM Kinetics',
    nameEn: 'Clinical PK-PD Precision Dosing & TDM',
    descKh: 'តាមដានកំហាប់ថ្នាំ Vancomycin, Aminoglycoside ក្នុងឈាម គណនា Cockcroft-Gault CrCl និងក្បួន Bayesian Kinetics។',
    descEn: 'Therapeutic Drug Monitoring, Cockcroft-Gault renal creatinine clearance, and Bayesian area-under-the-curve AUC dosing.',
    minTier: 'ENTERPRISE_12',
    icon: Activity,
    tagsKh: ['PK-PD', 'Cockcroft-Gault', 'គម្រោង $12'],
    tagsEn: ['PK-PD TDM', 'Bayesian AUC', '$12 Enterprise'],
    complianceStandard: 'ASHP / IDSA Vancomycin Guidelines',
  },
  {
    id: 'chemo',
    route: '/chemo',
    category: 'specialist',
    nameKh: 'ពិធីការព្យាបាលជំងឺមហារីក Chemo-Oncology',
    nameEn: 'Chemotherapy Oncology Protocol & BSA',
    descKh: 'គណនាផ្ទៃក្រឡារាងកាយ BSA កម្រិតថ្នាំ Carboplatin តាមរូបមន្ត Calvert និងតាមដានកម្រិតពុលបេះដូង Anthracycline។',
    descEn: 'Mosteller & DuBois BSA calculation, Calvert Carboplatin dosing, cumulative anthracycline toxicity, and safety gating.',
    minTier: 'ENTERPRISE_12',
    icon: Zap,
    tagsKh: ['Oncology Chemo', 'BSA Calvert', 'គម្រោង $12'],
    tagsEn: ['Chemotherapy', 'Calvert Formula', '$12 Enterprise'],
    complianceStandard: 'ASCO / NCCN Oncology Standards',
  },

  // PaaS $20 Unlimited Architecture
  {
    id: 'narcotics',
    route: '/narcotics',
    category: 'paas',
    nameKh: 'ទូថ្នាំញៀន & MoH DDF Dual-Witness Register',
    nameEn: 'Controlled Vault & Dual-Witness Narcotic Register',
    descKh: 'សៀវភៅកត់ត្រាថ្នាំញៀន Morphine, Fentanyl តាមច្បាប់ MoH DDF តម្រូវឱ្យមានសាក្សីពីររូបចុះហត្ថលេខាឌីជីថល មិនអាចលុបបាន។',
    descEn: 'Schedule II controlled substance vault ledger with biometric dual-witness signoff, tamper-evident hash chaining, and DDF audits.',
    minTier: 'UNLIMITED_20',
    icon: ShieldAlert,
    tagsKh: ['MoH DDF', 'សាក្សីពីររូប', 'គម្រោង $20 PaaS'],
    tagsEn: ['Dual-Witness', 'Schedule II Vault', '$20 PaaS'],
    complianceStandard: 'MoH DDF Narcotic Regulations',
    isPopular: true,
  },
  {
    id: 'fleet-sync',
    route: '/fleet-sync',
    category: 'paas',
    nameKh: 'បណ្តាញសាខា & Merkle LWW Fleet Sync',
    nameEn: 'Multi-Branch Fleet Sync & Merkle State Vector',
    descKh: 'ធ្វើសមកាលកម្មទិន្នន័យរវាងមន្ទីរពេទ្យធំ និងសាខាតាមខេត្ត ដំណើរការទោះគ្មានអ៊ីនធឺណិត Offline First ជាមួយ Merkle Vector។',
    descEn: 'Multi-branch distributed database synchronization with Last-Write-Wins conflict resolution and offline-first edge resiliency.',
    minTier: 'UNLIMITED_20',
    icon: Network,
    tagsKh: ['Multi-Branch', 'Offline First', 'គម្រោង $20 PaaS'],
    tagsEn: ['Fleet Sync', 'Merkle Vector', '$20 PaaS'],
    complianceStandard: 'Enterprise Cloud Grid Architecture',
  },
];

export default function ExploreToolsPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const { user } = useAuth();
  const currentPlanTier: PlanTier = (user?.tenant?.planTier as PlanTier) || 'FREE';
  const currentRank = PLAN_TIER_RANK[currentPlanTier] ?? 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPlanModalTier, setSelectedPlanModalTier] = useState<
    'STARTER_5' | 'PRO_8' | 'ENTERPRISE_12' | 'SPECIALIST_15' | 'UNLIMITED_20'
  >('PRO_8');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const categories = [
    { id: 'all', labelKh: 'ឧបករណ៍ទាំងអស់ - ៣០ មុខងារ', labelEn: 'All Arsenal (30+)' },
    { id: 'outpatient', labelKh: 'ពិគ្រោះក្រៅ & ជួររង់ចាំ', labelEn: 'Outpatient & Queue' },
    { id: 'pharmacy', labelKh: 'ឱសថស្ថាន & ឃ្លាំងស្តុក', labelEn: 'Pharmacy & Stock' },
    { id: 'diagnostic', labelKh: 'PACS & មន្ទីរពិសោធន៍', labelEn: 'PACS & Laboratory' },
    { id: 'critical', labelKh: 'សង្គ្រោះបន្ទាន់ & គ្រែ IPD', labelEn: 'Critical Care & IPD' },
    { id: 'specialist', labelKh: 'ឯកទេស & មហារីក', labelEn: 'Specialist & Chemo' },
    { id: 'paas', labelKh: 'ស្ថាបត្យកម្ម PaaS Enterprise', labelEn: 'PaaS Enterprise Architecture' },
  ];

  const filteredTools = useMemo(() => {
    return TOOL_CATALOG.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.nameKh.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.descKh.toLowerCase().includes(q) ||
        item.descEn.toLowerCase().includes(q) ||
        item.complianceStandard.toLowerCase().includes(q) ||
        item.tagsEn.some((t) => t.toLowerCase().includes(q)) ||
        item.tagsKh.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleOpenLock = (minTier: PlanTier) => {
    const target = minTier === 'FREE' ? 'PRO_8' : (minTier as any);
    setSelectedPlanModalTier(target);
    setIsCheckoutOpen(true);
  };

  const getTierDisplay = (tier: PlanTier) => {
    switch (tier) {
      case 'FREE':
        return { name: isKm ? '$0 ឥតគិតថ្លៃ' : '$0 Free Forever', color: 'bg-stone-100 text-stone-700 border-stone-200' };
      case 'STARTER_5':
        return { name: isKm ? '$5/ខែ ស្តង់ដារ' : '$5/mo Starter', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'PRO_8':
        return { name: isKm ? '$8/ខែ វិជ្ជាជីវៈ' : '$8/mo Pro', color: 'bg-teal-100 text-teal-900 border-teal-300 font-bold' };
      case 'ENTERPRISE_12':
        return { name: isKm ? '$12/ខែ មន្ទីរពេទ្យ' : '$12/mo Enterprise', color: 'bg-amber-50 text-amber-900 border-amber-300 font-bold' };
      case 'SPECIALIST_15':
        return { name: isKm ? '$15/ខែ ឯកទេស' : '$15/mo Specialist', color: 'bg-purple-50 text-purple-900 border-purple-300 font-bold' };
      case 'UNLIMITED_20':
        return { name: isKm ? '$20/ខែ PaaS គ្មានដែនកំណត់' : '$20/mo Unlimited PaaS', color: 'bg-emerald-50 text-emerald-950 border-emerald-300 font-extrabold' };
      default:
        return { name: tier, color: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE] text-stone-900 selection:bg-teal-800 selection:text-white font-sans antialiased">
      <PublicNavbar />

      {/* Trust & Regulatory Verification Bar */}
      <div className="bg-[#FAF7F2] border-b border-[#E7DFCF] py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-stone-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-stone-800">
              {isKm ? 'ឃ្លាំងឧបករណ៍វេជ្ជសាស្ត្រថ្នាក់ជាតិ ២០២៦' : '2026 National Clinical Arsenal'}
            </span>
            <span className="hidden sm:inline text-stone-400">•</span>
            <span className="hidden sm:inline text-stone-600">
              {isKm
                ? 'មុខងារគ្រប់គ្រងពេញលេញ ៣០+ ឧបករណ៍ ផ្ទៀងផ្ទាត់ដោយផ្ទាល់ជាមួយ Backend គ្មាន Mock Data'
                : '30+ Production clinical tools backed by real database logic, zero mock data'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-semibold text-stone-500">
            <div className="flex items-center gap-1 text-teal-900">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-800 shrink-0" />
              <span>MoH DHIS2 / DDF Code</span>
            </div>
            <div className="flex items-center gap-1 text-teal-900">
              <QrCode className="w-3.5 h-3.5 text-teal-800 shrink-0" />
              <span>Bakong Tag 01=12 Dynamic</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800 text-teal-100 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isKm ? 'ស្វែងយល់ & រុករកឧបករណ៍គ្រប់គ្រងគ្លីនិក' : 'Explore Clinical Modules & System Arsenal'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
            {isKm
              ? 'រុករកឧបករណ៍ និងមុខងារវេជ្ជសាស្ត្រទាំង ៣០+'
              : 'Explore All 30+ Enterprise Clinical Tools'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {isKm
              ? 'ពិនិត្យមើលលទ្ធភាព និងស្តង់ដារបច្ចេកទេសនៃមុខងារនីមួយៗ។ មុខងារដែលចាក់សោនឹងត្រូវបានដោះសោដោយស្វ័យប្រវត្តភ្លាមៗ ពេលលោកអ្នក Upgrade គម្រោងសេវាកម្ម។'
              : 'Inspect live capabilities and regulatory standards for every clinical module. Locked tools unlock instantly upon activating the corresponding subscription plan.'}
          </p>

          {/* Current Workspace Plan Status Pill */}
          {user && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white border border-stone-200 text-xs text-stone-700 shadow-2xs">
              <Building2 className="w-4 h-4 text-teal-800" />
              <span>{isKm ? 'គ្លីនិករបស់អ្នក:' : 'Your Clinic:'}</span>
              <span className="font-bold text-stone-900">{user.tenant?.clinicNameKh || user.tenant?.clinicNameEn || 'Clinic'}</span>
              <span className="text-stone-300">|</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-teal-800 text-white">
                {currentPlanTier}
              </span>
            </div>
          )}
        </div>

        {/* Fast Upgrade Tool Action Banner */}
        <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-stone-900 rounded-2xl p-4 sm:p-5 text-white border border-teal-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-stone-950">
                <Zap className="w-3 h-3 text-stone-950 fill-stone-950" />
                <span>{isKm ? 'ដំឡើងគម្រោង & បើកឧបករណ៍' : 'Upgrade Tools Arsenal'}</span>
              </span>
              <span className="text-xs text-teal-300 font-bold">
                {isKm ? 'Bakong KHQR POS Tag 01=12 • 0% Fee' : 'Direct NBC Bakong Settlement'}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white font-sans">
              {isKm
                ? 'ដំឡើងគម្រោងភ្លាមៗដើម្បីដោះសោឧបករណ៍គ្លីនិកទាំង ៣០+ ដោយស្វ័យប្រវត្ត'
                : 'Upgrade Your Tier to Instantly Unlock All 30+ Enterprise Clinical Tools'}
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              {isKm
                ? 'ជ្រើសរើសកញ្ចប់ $5 Starter, $8 Pro, $12 Enterprise, $15 Specialist ឬ $20 PaaS តាមតម្រូវការជាក់ស្តែង'
                : 'Choose $5 Starter, $8 Pro, $12 Enterprise, $15 Specialist or $20 PaaS according to clinical scale.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleOpenLock('PRO_8')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-stone-950 fill-stone-950" />
              <span>{isKm ? 'ដំឡើងទៅ Pro - $8 ក្នុងមួយខែ' : 'Upgrade to Pro ($8/mo)'}</span>
            </button>
            <Link
              href="/pricing"
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all text-center"
            >
              {isKm ? 'តារាងតម្លៃ' : 'Pricing Matrix'}
            </Link>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKm
                  ? 'ស្វែងរកឧបករណ៍ ដូចជា: Odontogram, PACS, LIS Lab, FEFO, Sepsis, វិក្កយបត្រ, ថ្នាំញៀន...'
                  : 'Search modules e.g. Odontogram, PACS DICOM, LIS Lab, FEFO Warehouse, Sepsis, Narcotics...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-teal-700 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 touch-scroll">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {isKm ? cat.labelKh : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => {
            const IconComponent = tool.icon;
            const requiredRank = PLAN_TIER_RANK[tool.minTier] ?? 0;
            const isUnlocked = currentRank >= requiredRank;
            const tierBadge = getTierDisplay(tool.minTier);

            return (
              <div
                key={tool.id}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all relative select-none ${
                  isUnlocked
                    ? 'border-stone-200 hover:border-teal-400 hover:shadow-md'
                    : 'border-stone-200/80 bg-stone-50/40 hover:border-amber-300'
                }`}
              >
                {/* Popular Pill */}
                {tool.isPopular && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-800 text-amber-300 border border-teal-900 shadow-2xs flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{isKm ? 'មុខងារល្បី' : 'FLAGSHIP'}</span>
                  </span>
                )}

                <div className="space-y-3">
                  {/* Card Header: Icon & Tier Badge */}
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs ${
                        isUnlocked ? 'bg-teal-800 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${tierBadge.color}`}
                    >
                      {tierBadge.name}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-sans">
                      {isKm ? tool.nameKh : tool.nameEn}
                    </h3>
                    <div className="text-[11px] font-medium text-stone-400 font-mono mt-0.5">
                      {tool.route}
                    </div>
                    <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                      {isKm ? tool.descKh : tool.descEn}
                    </p>
                  </div>

                  {/* Standard & Tag Chips */}
                  <div className="pt-2 border-t border-stone-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-800 shrink-0" />
                      <span className="truncate">{tool.complianceStandard}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(isKm ? tool.tagsKh : tool.tagsEn).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                  {isUnlocked ? (
                    <div className="w-full flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                        <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isKm ? 'បានបើកដំណើរការ' : 'Active & Ready'}</span>
                      </span>

                      <Link
                        href={tool.route}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                      >
                        <span>{isKm ? 'ចូលប្រើប្រាស់' : 'Open Tool'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isKm ? 'ទាមទារ Upgrade' : 'Locked Module'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenLock(tool.minTier)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <Lock className="w-3 h-3 text-amber-300" />
                        <span>{isKm ? 'ដោះសោគម្រោង' : 'Unlock Tier'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Platform-as-a-Service Dedicated Enterprise Showcase */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                <Network className="w-3.5 h-3.5 text-emerald-800" />
                <span>PaaS Enterprise Grid</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-sans mt-2">
                {isKm
                  ? 'ស្ថាបត្យកម្ម Platform-as-a-Service សម្រាប់បណ្តាញមន្ទីរពេទ្យ'
                  : 'Platform-as-a-Service (PaaS) Hospital Network Architecture'}
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                {isKm
                  ? 'បណ្តាញ Multi-Tenant Isolated ដែលអាចពង្រីកសាខាទូទាំងប្រទេស ជាមួយ Database ដាច់ដោយឡែក និង White-label Domain ផ្ទាល់ខ្លួន។'
                  : 'Enterprise multi-tenant isolation with dedicated databases, custom domains, and automated multi-branch synchronization.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenLock('UNLIMITED_20')}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {isKm ? 'ចុះឈ្មោះ PaaS $20/ខែ' : 'Activate PaaS Grid ($20/mo)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-2">
              <Database className="w-5 h-5 text-teal-800" />
              <div className="font-bold text-stone-900">
                {isKm ? 'Database ដាច់ដោយឡែក' : 'Dedicated Database'}
              </div>
              <p className="text-[11px] text-stone-600">
                {isKm
                  ? 'ទិន្នន័យវេជ្ជសាស្ត្ររបស់អ្នកជំងឺត្រូវបានរក្សាទុកដោយឡែកដាច់ខាត ១០០% ស្របតាមច្បាប់ MoH។'
                  : '100% tenant-isolated clinical records ensuring regulatory compliance and audit privacy.'}
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-2">
              <Server className="w-5 h-5 text-teal-800" />
              <div className="font-bold text-stone-900">
                {isKm ? 'White-label Domain ផ្ទាល់ខ្លួន' : 'White-label Domain'}
              </div>
              <p className="text-[11px] text-stone-600">
                {isKm
                  ? 'ប្រើប្រាស់ឈ្មោះ Domain របស់មន្ទីរពេទ្យផ្ទាល់ ជាមួយវិញ្ញាបនបត្រ SSL ស្វ័យប្រវត្ត។'
                  : 'Branded hostname with automated SSL certificates and custom portal identity.'}
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-2">
              <Network className="w-5 h-5 text-teal-800" />
              <div className="font-bold text-stone-900">
                {isKm ? 'ធ្វើសមកាលកម្ម Merkle Fleet' : 'Merkle Fleet Sync'}
              </div>
              <p className="text-[11px] text-stone-600">
                {isKm
                  ? 'ដំណើរការទោះគ្មានអ៊ីនធឺណិត និង Sync ចូលមន្ទីរពេទ្យធំស្វ័យប្រវត្តពេលភ្ជាប់ Net វិញ។'
                  : 'Offline-first edge resilience with automatic multi-branch conflict resolution.'}
              </p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-2">
              <Cpu className="w-5 h-5 text-teal-800" />
              <div className="font-bold text-stone-900">
                {isKm ? '24/7 VIP SLA & Master Bot' : '24/7 VIP SLA Support'}
              </div>
              <p className="text-[11px] text-stone-600">
                {isKm
                  ? 'ក្រុមការងារបច្ចេកទេសជំនាញប្រចាំការ ២៤ ម៉ោង ឆ្លើយតបសំណួរក្នុងរយៈពេលក្រោម ៥ នាទី។'
                  : 'Dedicated system engineering standby with 5-minute incident response SLA.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />

      {/* Subscription & KHQR Checkout Modal */}
      {isCheckoutOpen && (
        <SubscriptionCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          initialPlanTier={selectedPlanModalTier}
          currentTenantPlanTier={currentPlanTier}
          onActivated={() => {
            setIsCheckoutOpen(false);
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}
