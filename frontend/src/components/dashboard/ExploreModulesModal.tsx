'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import {
  isRouteAllowed,
  isModuleRelevantForClinic,
  isRouteAllowedForPlan,
  getRequiredPlanForRoute,
  PlanTier,
} from '../../lib/rbac';
import { isModuleHidden, setModuleHidden } from '../../lib/module-visibility';
import {
  Search,
  X,
  Compass,
  ArrowRight,
  LayoutDashboard,
  Users,
  Calendar,
  Monitor,
  Pill,
  Boxes,
  CreditCard,
  BarChart3,
  FileCheck,
  CalendarDays,
  FolderOpen,
  Film,
  Tv,
  FlaskConical,
  BedDouble,
  TrendingUp,
  Sparkles,
  Video,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  LayoutTemplate,
  ShieldPlus,
  HeartHandshake,
  Lock,
  Building2,
  Globe,
  UserCheck,
} from 'lucide-react';

interface ExploreModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModuleItem {
  id: string;
  category: 'clinical' | 'care' | 'pharmacy' | 'finance' | 'admin';
  titleKh: string;
  titleEn: string;
  descKh: string;
  descEn: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

export const ExploreModulesModal: React.FC<ExploreModulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { locale } = useTranslation();
  const isKm = locale === 'km';
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [moduleVersion, setModuleVersion] = useState(0);

  React.useEffect(() => {
    const handler = () => setModuleVersion((v) => v + 1);
    window.addEventListener('krupet-modules-changed', handler);
    return () => window.removeEventListener('krupet-modules-changed', handler);
  }, []);

  const role = user?.role;
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const tenantPlanTier: PlanTier = (user?.tenant?.planTier as PlanTier) || 'FREE';
  const clinicType = user?.tenant?.clinicType;

  const modulesList: ModuleItem[] = useMemo(
    () => [
      // Clinical & Diagnostics
      {
        id: 'visits',
        category: 'clinical',
        titleKh: 'ការពិគ្រោះ & Vitals',
        titleEn: 'Consultations & Vitals',
        descKh: 'កត់ត្រាសញ្ញាជីវិត ពិនិត្យរោគសញ្ញា ICD-10 និងចេញវេជ្ជបញ្ជា',
        descEn: 'Record vital signs, outpatient SOAP notes and clinical triage',
        href: '/visits',
        icon: Calendar,
        tags: ['vitals', 'consultation', 'doctor', 'soap', 'icd10', 'ពិនិត្យ', 'ពិគ្រោះ'],
      },
      {
        id: 'queue',
        category: 'clinical',
        titleKh: 'ក្ដារហៅលេខជួរ - Queue',
        titleEn: 'Queue & Audio Calling',
        descKh: 'ប្រព័ន្ធហៅលេខតាមសំឡេង និងគ្រប់គ្រងបន្ទប់រង់ចាំ',
        descEn: 'Live token callouts, voice synthesizer and waiting room queue',
        href: '/queue',
        icon: Monitor,
        tags: ['queue', 'token', 'calling', 'sound', 'voice', 'ហៅលេខ', 'ជួរ'],
      },
      {
        id: 'patients',
        category: 'clinical',
        titleKh: 'បញ្ជីឈ្មោះអ្នកជំងឺ',
        titleEn: 'Patient Directory',
        descKh: 'ស្វែងរកប្រវត្តិជំងឺ ឯកសារចាស់ៗ និងគ្រប់គ្រងព័ត៌មានអ្នកជំងឺ',
        descEn: 'Search master patient index, medical history dossiers and biometric info',
        href: '/patients',
        icon: Users,
        tags: ['patient', 'records', 'medical record', 'history', 'អ្នកជំងឺ', 'ឈ្មោះ'],
      },
      {
        id: 'dental',
        category: 'clinical',
        titleKh: 'ពេទ្យធ្មេញ FDI Odontogram',
        titleEn: 'Dental Odontogram & WHO DMFT',
        descKh: 'ប្លង់ 32 ធ្មេញកាយវិភាគវិទ្យា តាមដានពុកធ្មេញ និងការដកធ្មេញ',
        descEn: 'Interactive 32-tooth odontogram chart, restoration history and WHO DMFT',
        href: '/dental',
        icon: Sparkles,
        tags: ['dental', 'tooth', 'teeth', 'odontogram', 'dmft', 'ធ្មេញ', 'ពុកធ្មេញ', 'ដកធ្មេញ'],
      },
      {
        id: 'pacs',
        category: 'clinical',
        titleKh: 'រូបភាពវេជ្ជសាស្ត្រ WebGL PACS',
        titleEn: 'Medical Imaging PACS (DICOM)',
        descKh: 'មើលរូបភាព X-Ray, CT Scan, MRI និង Ultrasound កម្រិតច្បាស់',
        descEn: 'High-performance DICOM viewer with window leveling, zoom, and caliper tools',
        href: '/pacs',
        icon: Film,
        tags: ['pacs', 'dicom', 'xray', 'ct', 'mri', 'ultrasound', 'ស្កេន', 'ឆ្លុះ', 'រូបភាព'],
      },
      {
        id: 'lab',
        category: 'clinical',
        titleKh: 'មន្ទីរពិសោធន៍ & វិភាគឈាម - LIS',
        titleEn: 'Laboratory Information System (LIS)',
        descKh: 'គ្រប់គ្រងលទ្ធផលតេស្តឈាម ASTM/HL7 និងការវិភាគវេជ្ជសាស្ត្រ',
        descEn: 'Automated analyzer interfacing, ASTM/HL7 orders, and panic value alerts',
        href: '/lab',
        icon: FlaskConical,
        tags: ['lab', 'laboratory', 'blood', 'test', 'lis', 'astm', 'hl7', 'ឈាម', 'ពិសោធន៍'],
      },

      // Inpatient & Care
      {
        id: 'ipd',
        category: 'care',
        titleKh: 'សម្រាកពេទ្យ & e-MAR - IPD',
        titleEn: 'Inpatient Beds & e-MAR (IPD)',
        descKh: 'គ្រប់គ្រងគ្រែសម្រាកពេទ្យ និងតារាងផ្តល់ថ្នាំ 5-Rights',
        descEn: 'Ward bed management, admission tracking, and electronic MAR bedside delivery',
        href: '/ipd',
        icon: BedDouble,
        tags: ['ipd', 'bed', 'ward', 'admission', 'emar', 'សម្រាកពេទ្យ', 'គ្រែ'],
      },
      {
        id: 'teleconsult',
        category: 'care',
        titleKh: 'ពិគ្រោះជំងឺពីចម្ងាយ (Teleconsult)',
        titleEn: 'Teleconsultation WebRTC',
        descKh: 'វីដេអូខល WebRTC ជាមួយអ្នកជំងឺ និងចេញ QR e-Prescription',
        descEn: 'HD peer-to-peer encrypted video consultations and digitally signed prescriptions',
        href: '/teleconsult',
        icon: Video,
        tags: ['teleconsult', 'video', 'webrtc', 'remote', 'call', 'វីដេអូ', 'ពិគ្រោះពីចម្ងាយ'],
      },
      {
        id: 'concierge',
        category: 'care',
        titleKh: 'ថែទាំតាមដានអ្នកជំងឺ (Concierge)',
        titleEn: 'Care Concierge & Adherence',
        descKh: 'ផ្ញើសាររំលឹកការលេបថ្នាំ និងតាមដានសុខភាពជាប្រចាំ',
        descEn: 'Automated SMS/Telegram medication reminders and chronic care adherence tracking',
        href: '/concierge',
        icon: HeartHandshake,
        tags: ['concierge', 'reminder', 'adherence', 'sms', 'telegram', 'ថែទាំ', 'តាមដាន'],
      },
      {
        id: 'follow-ups',
        category: 'care',
        titleKh: 'ការណាត់ជួបតាមដាន',
        titleEn: 'Follow-up Appointments',
        descKh: 'ប្រតិទិនណាត់ជួប និងការតាមដានការវិវត្តរបស់ជំងឺ',
        descEn: 'Appointment scheduling, physician calendar and auto SMS follow-up alerts',
        href: '/follow-ups',
        icon: CalendarDays,
        tags: ['follow-up', 'appointment', 'calendar', 'schedule', 'ណាត់ជួប', 'ប្រតិទិន'],
      },

      // Pharmacy & Logistics
      {
        id: 'prescriptions',
        category: 'pharmacy',
        titleKh: 'ឱសថស្ថាន & ចេញថ្នាំ',
        titleEn: 'Prescriptions & Dispensing',
        descKh: 'ពិនិត្យបញ្ជីថ្នាំ ចេញវេជ្ជបញ្ជា និងផ្ទៀងផ្ទាត់អន្តរកម្មថ្នាំ',
        descEn: 'Outpatient dispensing, CDSS drug interaction safety and printable labels',
        href: '/prescriptions',
        icon: Pill,
        tags: ['prescriptions', 'pharmacy', 'medicine', 'drug', 'dispense', 'ថ្នាំ', 'ឱសថ'],
      },
      {
        id: 'inventory',
        category: 'pharmacy',
        titleKh: 'ឃ្លាំងឱសថ FEFO ច្រើនសាខា',
        titleEn: 'Multi-Branch Inventory & FEFO',
        descKh: 'គ្រប់គ្រងស្តុកថ្នាំ តាមដានកាលបរិច្ឆេទផុតកំណត់ និងការផ្ទេរសាខា',
        descEn: 'Stock management with First-Expired First-Out dispensing and batch tracking',
        href: '/inventory',
        icon: Boxes,
        tags: ['inventory', 'warehouse', 'fefo', 'stock', 'batch', 'expiry', 'ឃ្លាំង', 'ស្តុក'],
      },

      // Finance & Analytics
      {
        id: 'billing',
        category: 'finance',
        titleKh: 'វិក្កយបត្រ & ទូទាត់ KHQR POS',
        titleEn: 'Invoicing & Dynamic KHQR POS',
        descKh: 'គិតលុយទូទាត់រហ័ស ស្កេន KHQR និងចេញវិក្កយបត្រផ្លូវការ',
        descEn: 'Point of sale checkout, dynamic Bakong KHQR QR generator and cash registers',
        href: '/billing',
        icon: CreditCard,
        tags: ['billing', 'invoice', 'khqr', 'payment', 'pos', 'cash', 'វិក្កយបត្រ', 'លុយ', 'គិតលុយ'],
      },
      {
        id: 'reports',
        category: 'finance',
        titleKh: 'របាយការណ៍ចំណូល & ស្ថិតិ',
        titleEn: 'Revenue & Operations Reports',
        descKh: 'របាយការណ៍ហិរញ្ញវត្ថុប្រចាំថ្ងៃ ប្រចាំខែ និងស្ថិតិព្យាបាល',
        descEn: 'Revenue breakdowns, daily reconciliation spreadsheets and clinical operations analytics',
        href: '/reports',
        icon: BarChart3,
        tags: ['reports', 'analytics', 'revenue', 'income', 'reconciliation', 'របាយការណ៍', 'ចំណូល'],
      },
      {
        id: 'finance',
        category: 'finance',
        titleKh: 'គណនេយ្យវេជ្ជបណ្ឌិត & P&L',
        titleEn: 'Doctor Commission & Finance P&L',
        descKh: 'គណនាប្រាក់កម្រៃគ្រូពេទ្យ និងរបាយការណ៍ចំណេញខាត EBITDA',
        descEn: 'Doctor split commissions, clinic operating expenses and EBITDA profitability analysis',
        href: '/finance',
        icon: TrendingUp,
        tags: ['finance', 'profit', 'loss', 'commission', 'ebitda', 'pnl', 'ហិរញ្ញវត្ថុ', 'កម្រៃ'],
      },
      {
        id: 'insurance',
        category: 'finance',
        titleKh: 'បេឡាជាតិ ប.ស.ស & ធានារ៉ាប់រង',
        titleEn: 'NSSF & Insurance Adjudication',
        descKh: 'ផ្ទៀងផ្ទាត់កាត ប.ស.ស និងការទូទាត់សំណងធានារ៉ាប់រង',
        descEn: 'NSSF eligibility verification, policy co-pays and insurance claims processing',
        href: '/insurance',
        icon: ShieldPlus,
        tags: ['insurance', 'nssf', 'claims', 'bssc', 'ធានារ៉ាប់រង', 'បសស'],
      },
      {
        id: 'eclaim',
        category: 'finance',
        titleKh: 'សំណងអេឡិចត្រូនិក eClaim & MoH',
        titleEn: 'Electronic Claims & MoH DHIS2',
        descKh: 'បញ្ជូនទិន្នន័យក្រសួងសុខាភិបាល XML/FHIR និងសំណង eClaim',
        descEn: 'Ministry of Health DHIS2 data transmission, FHIR exports and national reporting',
        href: '/eclaim',
        icon: FileSpreadsheet,
        tags: ['eclaim', 'dhis2', 'moh', 'fhir', 'xml', 'ក្រសួងសុខាភិបាល', 'សំណង'],
      },

      // Administration & Settings
      {
        id: 'certificates',
        category: 'admin',
        titleKh: 'លិខិតវេជ្ជសាស្ត្រផ្លូវការ',
        titleEn: 'Medical Certificates A4',
        descKh: 'ចេញលិខិតសម្រាកព្យាបាល និងលិខិតបញ្ជាក់កាយសម្បទាផ្លូវការ',
        descEn: 'Official sick leave certificates and fitness for work letters ready to print',
        href: '/certificates',
        icon: FileCheck,
        tags: ['certificate', 'sick leave', 'fitness', 'print', 'លិខិត', 'វិញ្ញាបនបត្រ', 'សម្រាក'],
      },
      {
        id: 'documents',
        category: 'admin',
        titleKh: 'កម្រងឯកសារវេជ្ជសាស្ត្រ',
        titleEn: 'Medical Document Archives',
        descKh: 'ផ្ទុកឯកសារស្កេន លទ្ធផលពិនិត្យក្រៅ និងរូបភាពជំងឺ',
        descEn: 'Digital clinical archives, PDF attachments and diagnostic scan files',
        href: '/documents',
        icon: FolderOpen,
        tags: ['documents', 'archive', 'pdf', 'files', 'scan', 'ឯកសារ', 'កម្រង'],
      },
      {
        id: 'signage',
        category: 'admin',
        titleKh: 'ស្លាកអេក្រង់ Smart TV Signage',
        titleEn: 'Waiting Room TV Signage',
        descKh: 'បង្ហាញជួរហៅលេខលើទូរទស្សន៍ និងវីដេអូអប់រំសុខភាព',
        descEn: 'Full screen waiting room signage with real-time token list and health education',
        href: '/signage',
        icon: Tv,
        tags: ['signage', 'tv', 'display', 'screen', 'monitor', 'ទូរទស្សន៍', 'អេក្រង់'],
      },
      {
        id: 'staff',
        category: 'admin',
        titleKh: 'គ្រប់គ្រងបុគ្គលិកគ្លីនិក',
        titleEn: 'Staff & Team Management',
        descKh: 'គ្រប់គ្រងគណនីគ្រូពេទ្យ គិលានុបដ្ឋាយិកា និងបុគ្គលិកបេឡា',
        descEn: 'Manage user credentials, medical licenses, and access permissions',
        href: '/staff',
        icon: ShieldCheck,
        tags: ['staff', 'team', 'doctor', 'nurse', 'cashier', 'users', 'បុគ្គលិក'],
      },
      {
        id: 'invoice-template',
        category: 'admin',
        titleKh: 'រចនាម៉ូតវិក្កយបត្រ - Custom Template',
        titleEn: 'Custom Invoice Designer',
        descKh: 'កែសម្រួលរូបរាង Logo ពណ៌ និងទម្រង់វិក្កយបត្របោះពុម្ព',
        descEn: 'Visual invoice layout builder with custom logo, bilingual headers, and styling',
        href: '/invoice-template',
        icon: LayoutTemplate,
        tags: ['invoice template', 'designer', 'receipt', 'print format', 'រចនា', 'ម៉ូតវិក្កយបត្រ'],
      },
      {
        id: 'settings',
        category: 'admin',
        titleKh: 'កំណត់ប្រព័ន្ធ & ហាតវែរ',
        titleEn: 'Clinic Settings & Hardware',
        descKh: 'កំណត់ KHQR ម៉ាស៊ីនព្រីន POS កេសលុយ និងស្ទូឌីយោសំឡេង',
        descEn: 'Configure clinic profile, thermal printers, cash drawer, and voice chimes',
        href: '/settings',
        icon: Settings,
        tags: ['settings', 'hardware', 'printer', 'cash drawer', 'sound', 'voice', 'កំណត់', 'ហាតវែរ'],
      },
    ],
    []
  );

  // Filter modules based on role, clinic relevance, category, and search query
  const filteredModules = useMemo(() => {
    return modulesList.filter((item) => {
      // 1. Role permission
      if (!isRouteAllowed(role, item.href)) return false;

      // 2. Clinic specialization relevance
      if (!isModuleRelevantForClinic(clinicType, item.href, role)) return false;

      // 3. Category tab
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle =
          item.titleKh.toLowerCase().includes(query) ||
          item.titleEn.toLowerCase().includes(query);
        const matchesDesc =
          item.descKh.toLowerCase().includes(query) ||
          item.descEn.toLowerCase().includes(query);
        const matchesTags = item.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });
  }, [modulesList, role, clinicType, activeCategory, searchQuery]);

  if (!isOpen) return null;

  const handleModuleClick = (item: ModuleItem) => {
    const isPlanAllowed =
      isSuperAdmin || isRouteAllowedForPlan(tenantPlanTier, item.href, clinicType);

    if (isPlanAllowed) {
      router.push(item.href);
      onClose();
    } else {
      // Direct user to pricing upgrade page with target note
      router.push('/pricing');
      onClose();
    }
  };

  const categories = [
    { id: 'all', labelKh: 'ទាំងអស់', labelEn: 'All Tools' },
    { id: 'clinical', labelKh: 'ពិគ្រោះ & វិនិច្ឆ័យ', labelEn: 'Clinical & Diagnostics' },
    { id: 'care', labelKh: 'សម្រាក & ថែទាំ', labelEn: 'Inpatient & Care' },
    { id: 'pharmacy', labelKh: 'ឱសថ & ឃ្លាំង', labelEn: 'Pharmacy & Stock' },
    { id: 'finance', labelKh: 'ហិរញ្ញវត្ថុ & របាយការណ៍', labelEn: 'Finance & Analytics' },
    { id: 'admin', labelKh: 'រដ្ឋបាល & ហាតវែរ', labelEn: 'Admin & Hardware' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#FDFBF7] rounded-3xl shadow-2xl border border-[#E7E1D4] z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E7E1D4] bg-[#F7F3EA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                {isKm ? 'រុករកម៉ូឌុល & ឧបករណ៍គ្លីនិកទាំងអស់' : 'Explore All Clinical Modules & Tools'}
              </h2>
              <p className="text-xs text-stone-500">
                {isKm
                  ? 'ស្វែងរក និងបើកមុខងារឯកទេសទាំងអស់តាមផ្នែកដោយងាយស្រួល'
                  : 'Discover and navigate to any clinical, diagnostic, or administrative tool'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-[#ECE4D4] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Categories Filter */}
        <div className="p-4 border-b border-[#E7E1D4] bg-white space-y-3">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKm
                  ? 'វាយឈ្មោះមុខងារ ឧបករណ៍ ឬពាក្យគន្លឹះ (PACS, Lab, ធ្មេញ, ឃ្លាំង, វិក្កយបត្រ...)'
                  : 'Search tools by name or keyword (PACS, Lab, Dental, Inventory, Billing...)'
              }
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#F9F7F2] border border-[#E2DAD0] rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-teal-700 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all shadow-2xs ${
                    isActive
                      ? 'bg-teal-800 text-white font-semibold'
                      : 'bg-[#F4EFE6] text-stone-700 hover:bg-[#EBE3D6] border border-[#DFD6C6]'
                  }`}
                >
                  {isKm ? cat.labelKh : cat.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modules Grid */}
        <div className="p-5 overflow-y-auto space-y-3 touch-scroll flex-1">
          {filteredModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredModules.map((item) => {
                const Icon = item.icon;
                const isPlanAllowed =
                  isSuperAdmin ||
                  isRouteAllowedForPlan(tenantPlanTier, item.href, clinicType);
                const requiredPlan = getRequiredPlanForRoute(item.href);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleModuleClick(item)}
                    className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-xs card-3d ${
                      isPlanAllowed
                        ? 'bg-white border-[#E7E1D4] hover:border-teal-700 hover:shadow-md'
                        : 'bg-[#FAF7F2] border-[#E8E2D6] hover:border-amber-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
                            isPlanAllowed
                              ? 'bg-teal-50 text-teal-800 border border-teal-200/60 group-hover:bg-teal-800 group-hover:text-white'
                              : 'bg-stone-100 text-stone-500 border border-stone-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {!isPlanAllowed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>{requiredPlan.nameEn} (${requiredPlan.priceUsd}/mo)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider font-mono">
                            Active
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-stone-900 text-sm group-hover:text-teal-900 transition-colors">
                        {isKm ? item.titleKh : item.titleEn}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                        {isKm ? item.descKh : item.descEn}
                      </p>
                    </div>

                    
                    {/* Admin Module Hide/Show Switch */}
                    {(isSuperAdmin || role === 'ADMIN') && item.href !== '/' && item.href !== '/settings' && item.href !== '/profile' && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setModuleHidden(item.href, !isModuleHidden(item.href));
                        }}
                        className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]"
                      >
                        <span className="text-stone-500">
                          {isKm ? 'ការបង្ហាញក្នុង Menu៖' : 'Menu Visibility:'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer ${
                            isModuleHidden(item.href)
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isModuleHidden(item.href)
                            ? (isKm ? 'បានលាក់ពី Menu' : 'Hidden from Menu')
                            : (isKm ? 'បង្ហាញក្នុង Menu' : 'Visible in Menu')}
                        </span>
                      </div>
                    )}
<div className="mt-4 pt-3 border-t border-[#F0EAE0] flex items-center justify-between text-xs font-semibold">
                      {isPlanAllowed ? (
                        <div className="flex items-center gap-1 text-teal-800 group-hover:translate-x-1 transition-transform">
                          <span>{isKm ? 'បើកមុខងារ' : 'Open Tool'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-800 group-hover:underline">
                          <span>{isKm ? 'Upgrade ដើម្បីប្រើ' : 'Upgrade Plan'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">
              <Compass className="w-8 h-8 mx-auto mb-2 text-stone-300" />
              <p className="text-sm">
                {isKm
                  ? 'រកមិនឃើញមុខងារដែលត្រូវគ្នានឹងការស្វែងរករបស់អ្នកឡើយ'
                  : 'No clinical modules found matching your search.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-3 border-t border-[#E7E1D4] bg-[#F7F3EA] flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">
              {isKm ? 'ផ្លូវកាត់រហ័ស:' : 'Quick Shortcut:'}
            </span>
            <kbd className="px-2 py-0.5 text-[11px] font-mono bg-white rounded border border-[#DFD6C6] text-stone-800 shadow-2xs">
              Ctrl + K
            </kbd>
            <span className="text-[11px] text-stone-400">
              {isKm ? 'ដើម្បីស្វែងរកពាក្យបញ្ជាពីគ្រប់ទីកន្លែង' : 'to search anything from anywhere'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#EAE2D2] hover:bg-[#DFD6C4] text-stone-800 font-semibold rounded-xl text-xs transition-colors shadow-2xs"
          >
            {isKm ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
