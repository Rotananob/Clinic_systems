'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';
import { playHospitalChime, playPaymentSuccessChime } from '../../lib/chime';
import {
  Search,
  LayoutDashboard,
  Users,
  Calendar,
  Monitor,
  Pill,
  CreditCard,
  FileCheck,
  Settings,
  Globe,
  Volume2,
  ArrowRight,
  User,
  X,
  BarChart3,
  LayoutTemplate,
  Cpu,
  Boxes,
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
  ShieldPlus,
  HeartHandshake,
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shortcut?: string;
  keywords?: string[];
}

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const { t, locale, toggleLocale } = useTranslation();
  const isKm = locale === 'km';

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Ctrl+K, Cmd+K, or Custom Event)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounced patient search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setPatientResults([]);
      setSearchingPatients(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await api.patients.list({ search: query.trim(), limit: 4 });
        setPatientResults(res.data || []);
      } catch {
        setPatientResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Standard Navigation Actions across all 25 clinical suites
  const navigationItems: CommandItem[] = [
    {
      id: 'nav-dashboard',
      category: isKm ? 'ការរុករកស្នូល' : 'Core Navigation',
      title: t.nav.dashboard,
      subtitle: isKm ? 'ផ្ទាំងបញ្ជា និងស្ថិតិសរុប' : 'Main clinical overview & KPIs',
      icon: LayoutDashboard,
      action: () => {
        router.push('/');
        setIsOpen(false);
      },
      keywords: ['dashboard', 'home', 'kpi', 'ស្ថិតិ', 'ផ្ទាំងបញ្ជា'],
    },
    {
      id: 'nav-patients',
      category: isKm ? 'ការរុករកស្នូល' : 'Core Navigation',
      title: t.nav.patients,
      subtitle: isKm ? 'បញ្ជីឈ្មោះ និងប្រវត្តិអ្នកជំងឺ' : 'Search & manage patient records',
      icon: Users,
      action: () => {
        router.push('/patients');
        setIsOpen(false);
      },
      keywords: ['patient', 'patients', 'medical records', 'អ្នកជំងឺ', 'ឈ្មោះ', 'ប្រវត្តិ'],
    },
    {
      id: 'nav-queue',
      category: isKm ? 'ការរុករកស្នូល' : 'Core Navigation',
      title: t.nav.queue,
      subtitle: isKm ? 'ក្ដារជួរ និងប្រព័ន្ធហៅលេខ' : 'Live token display & calling screen',
      icon: Monitor,
      action: () => {
        router.push('/queue');
        setIsOpen(false);
      },
      keywords: ['queue', 'token', 'calling', 'sound', 'voice', 'ហៅលេខ', 'ជួរ', 'សំឡេង'],
    },
    {
      id: 'nav-visits',
      category: isKm ? 'ការរុករកស្នូល' : 'Core Navigation',
      title: t.nav.visits,
      subtitle: isKm ? 'ជួរពិនិត្យ វាស់ Vitals & ពិគ្រោះ' : 'Active encounters & vital triage',
      icon: Calendar,
      action: () => {
        router.push('/visits');
        setIsOpen(false);
      },
      keywords: ['visits', 'vitals', 'consultation', 'doctor', 'ពិនិត្យ', 'ពិគ្រោះ', 'សញ្ញាជីវិត'],
    },
    {
      id: 'nav-prescriptions',
      category: isKm ? 'ឱសថ & ឃ្លាំង' : 'Pharmacy & Stock',
      title: t.nav.prescriptions,
      subtitle: isKm ? 'ឱសថស្ថាន ចេញថ្នាំ & ស្តុក' : 'Pharmacy orders & dispensation',
      icon: Pill,
      action: () => {
        router.push('/prescriptions');
        setIsOpen(false);
      },
      keywords: ['prescriptions', 'pharmacy', 'medicine', 'drug', 'dispense', 'ថ្នាំ', 'ឱសថ'],
    },
    {
      id: 'nav-inventory',
      category: isKm ? 'ឱសថ & ឃ្លាំង' : 'Pharmacy & Stock',
      title: isKm ? 'ឃ្លាំងឱសថ FEFO ច្រើនសាខា' : 'Multi-Branch Inventory & FEFO',
      subtitle: isKm ? 'គ្រប់គ្រងស្តុកថ្នាំ កាលបរិច្ឆេទផុតកំណត់ និងការផ្ទេរសាខា' : 'Batch tracking, FEFO dispensing and stock replenishment',
      icon: Boxes,
      action: () => {
        router.push('/inventory');
        setIsOpen(false);
      },
      keywords: ['inventory', 'warehouse', 'fefo', 'stock', 'batch', 'expiry', 'ឃ្លាំង', 'ស្តុក'],
    },
    {
      id: 'nav-billing',
      category: isKm ? 'ហិរញ្ញវត្ថុ & ទូទាត់' : 'Finance & Billing',
      title: t.nav.billing,
      subtitle: isKm ? 'វិក្កយបត្រ ទូទាត់ KHQR & សាច់ប្រាក់' : 'Invoices & KHQR payments',
      icon: CreditCard,
      action: () => {
        router.push('/billing');
        setIsOpen(false);
      },
      keywords: ['billing', 'invoice', 'khqr', 'payment', 'cash', 'bakong', 'វិក្កយបត្រ', 'គិតលុយ', 'ទូទាត់'],
    },
    {
      id: 'nav-pacs',
      category: isKm ? 'រោគវិនិច្ឆ័យឯកទេស' : 'Specialized Diagnostics',
      title: isKm ? 'រូបភាពវេជ្ជសាស្ត្រ WebGL PACS' : 'Medical Imaging PACS (DICOM)',
      subtitle: isKm ? 'មើលរូបភាពឆ្លុះ X-Ray, CT Scan, MRI និង Ultrasound' : 'High-performance DICOM viewer with calipers & zoom',
      icon: Film,
      action: () => {
        router.push('/pacs');
        setIsOpen(false);
      },
      keywords: ['pacs', 'dicom', 'xray', 'ct', 'mri', 'ultrasound', 'ស្កេន', 'ឆ្លុះ', 'រូបភាព'],
    },
    {
      id: 'nav-lab',
      category: isKm ? 'រោគវិនិច្ឆ័យឯកទេស' : 'Specialized Diagnostics',
      title: isKm ? 'មន្ទីរពិសោធន៍ & វិភាគឈាម (LIS)' : 'Laboratory Information System (LIS)',
      subtitle: isKm ? 'គ្រប់គ្រងលទ្ធផលតេស្តឈាម ASTM/HL7 និង Panic Alerts' : 'Automated analyzer interfacing and panic value alerts',
      icon: FlaskConical,
      action: () => {
        router.push('/lab');
        setIsOpen(false);
      },
      keywords: ['lab', 'laboratory', 'lis', 'blood', 'analyzer', 'astm', 'hl7', 'ឈាម', 'ពិសោធន៍'],
    },
    {
      id: 'nav-dental',
      category: isKm ? 'រោគវិនិច្ឆ័យឯកទេស' : 'Specialized Diagnostics',
      title: isKm ? 'ពេទ្យធ្មេញ FDI Odontogram' : 'Dental Odontogram & WHO DMFT',
      subtitle: isKm ? 'ប្លង់ 32 ធ្មេញកាយវិភាគវិទ្យា និងប្រវត្តិព្យាបាលធ្មេញ' : '32-tooth odontogram chart, restorations and WHO DMFT index',
      icon: Sparkles,
      action: () => {
        router.push('/dental');
        setIsOpen(false);
      },
      keywords: ['dental', 'tooth', 'teeth', 'odontogram', 'dmft', 'ធ្មេញ', 'ពុកធ្មេញ', 'ដកធ្មេញ'],
    },
    {
      id: 'nav-ipd',
      category: isKm ? 'សម្រាកពេទ្យ & ថែទាំ' : 'Inpatient & Care',
      title: isKm ? 'សម្រាកពេទ្យ & e-MAR (IPD)' : 'Inpatient Beds & e-MAR (IPD)',
      subtitle: isKm ? 'គ្រប់គ្រងគ្រែសម្រាកពេទ្យ និងការផ្តល់ថ្នាំ 5-Rights' : 'Ward bed management and electronic MAR bedside delivery',
      icon: BedDouble,
      action: () => {
        router.push('/ipd');
        setIsOpen(false);
      },
      keywords: ['ipd', 'bed', 'ward', 'admission', 'emar', 'សម្រាកពេទ្យ', 'គ្រែ'],
    },
    {
      id: 'nav-teleconsult',
      category: isKm ? 'សម្រាកពេទ្យ & ថែទាំ' : 'Inpatient & Care',
      title: isKm ? 'ពិគ្រោះជំងឺពីចម្ងាយ (Teleconsult)' : 'Teleconsultation WebRTC',
      subtitle: isKm ? 'វីដេអូខល WebRTC និងចេញ QR e-Prescription' : 'Encrypted video encounters and signed QR e-prescriptions',
      icon: Video,
      action: () => {
        router.push('/teleconsult');
        setIsOpen(false);
      },
      keywords: ['teleconsult', 'video', 'webrtc', 'remote', 'call', 'វីដេអូ', 'ពិគ្រោះពីចម្ងាយ'],
    },
    {
      id: 'nav-concierge',
      category: isKm ? 'សម្រាកពេទ្យ & ថែទាំ' : 'Inpatient & Care',
      title: isKm ? 'ថែទាំតាមដានអ្នកជំងឺ (Concierge)' : 'Care Concierge & Adherence',
      subtitle: isKm ? 'ផ្ញើសាររំលឹកការលេបថ្នាំតាម Telegram & SMS' : 'Automated medication reminders and adherence tracking',
      icon: HeartHandshake,
      action: () => {
        router.push('/concierge');
        setIsOpen(false);
      },
      keywords: ['concierge', 'reminder', 'adherence', 'sms', 'telegram', 'ថែទាំ', 'តាមដាន'],
    },
    {
      id: 'nav-follow-ups',
      category: isKm ? 'សម្រាកពេទ្យ & ថែទាំ' : 'Inpatient & Care',
      title: isKm ? 'ការណាត់ជួបតាមដានជំងឺ' : 'Follow-up Appointments',
      subtitle: isKm ? 'ប្រតិទិនណាត់ជួប និងការតាមដានការវិវត្តរបស់អ្នកជំងឺ' : 'Physician calendar, appointments and SMS reminders',
      icon: CalendarDays,
      action: () => {
        router.push('/follow-ups');
        setIsOpen(false);
      },
      keywords: ['follow-up', 'appointment', 'calendar', 'schedule', 'ណាត់ជួប', 'ប្រតិទិន'],
    },
    {
      id: 'nav-reports',
      category: isKm ? 'ហិរញ្ញវត្ថុ & របាយការណ៍' : 'Finance & Reports',
      title: t.nav.reports,
      subtitle: isKm ? 'របាយការណ៍ហិរញ្ញវត្ថុ និងស្ថិតិព្យាបាល' : 'Financial revenue & clinical operations reports',
      icon: BarChart3,
      action: () => {
        router.push('/reports');
        setIsOpen(false);
      },
      keywords: ['reports', 'analytics', 'revenue', 'income', 'របាយការណ៍', 'ចំណូល', 'ស្ថិតិ'],
    },
    {
      id: 'nav-finance',
      category: isKm ? 'ហិរញ្ញវត្ថុ & របាយការណ៍' : 'Finance & Reports',
      title: isKm ? 'គណនេយ្យវេជ្ជបណ្ឌិត & P&L' : 'Doctor Commission & Finance P&L',
      subtitle: isKm ? 'គណនាប្រាក់កម្រៃគ្រូពេទ្យ និងរបាយការណ៍ EBITDA' : 'Doctor split commissions, clinic OPEX and EBITDA analysis',
      icon: TrendingUp,
      action: () => {
        router.push('/finance');
        setIsOpen(false);
      },
      keywords: ['finance', 'commission', 'profit', 'loss', 'ebitda', 'pnl', 'ហិរញ្ញវត្ថុ', 'កម្រៃ'],
    },
    {
      id: 'nav-insurance',
      category: isKm ? 'ហិរញ្ញវត្ថុ & របាយការណ៍' : 'Finance & Reports',
      title: isKm ? 'បេឡាជាតិ ប.ស.ស & ធានារ៉ាប់រង' : 'NSSF & Insurance Direct Adjudication',
      subtitle: isKm ? 'ផ្ទៀងផ្ទាត់កាត ប.ស.ស និងការទូទាត់សំណង' : 'NSSF eligibility verification and insurance claim settlement',
      icon: ShieldPlus,
      action: () => {
        router.push('/insurance');
        setIsOpen(false);
      },
      keywords: ['insurance', 'nssf', 'claims', 'bssc', 'ធានារ៉ាប់រង', 'បសស'],
    },
    {
      id: 'nav-eclaim',
      category: isKm ? 'ហិរញ្ញវត្ថុ & របាយការណ៍' : 'Finance & Reports',
      title: isKm ? 'សំណងអេឡិចត្រូនិក eClaim & MoH' : 'Electronic Claims & MoH DHIS2',
      subtitle: isKm ? 'បញ្ជូនទិន្នន័យក្រសួងសុខាភិបាល XML/FHIR' : 'National DHIS2 XML reporting and FHIR data exports',
      icon: FileSpreadsheet,
      action: () => {
        router.push('/eclaim');
        setIsOpen(false);
      },
      keywords: ['eclaim', 'dhis2', 'moh', 'fhir', 'xml', 'ក្រសួងសុខាភិបាល', 'សំណង'],
    },
    {
      id: 'nav-certificates',
      category: isKm ? 'លិខិត & ឯកសារ' : 'Documents & Certificates',
      title: t.nav.certificates,
      subtitle: isKm ? 'លិខិតឈប់សម្រាកព្យាបាល & កាយសម្បទា' : 'Printable medical certificates A4',
      icon: FileCheck,
      action: () => {
        router.push('/certificates');
        setIsOpen(false);
      },
      keywords: ['certificate', 'sick leave', 'fitness', 'print', 'លិខិត', 'វិញ្ញាបនបត្រ', 'សម្រាក'],
    },
    {
      id: 'nav-documents',
      category: isKm ? 'លិខិត & ឯកសារ' : 'Documents & Certificates',
      title: isKm ? 'កម្រងឯកសារវេជ្ជសាស្ត្រ (Documents)' : 'Medical Document Archives',
      subtitle: isKm ? 'ផ្ទុកឯកសារស្កេន លទ្ធផលពិនិត្យក្រៅ និងរូបភាពជំងឺ' : 'Digital clinical archives, PDF attachments and scans',
      icon: FolderOpen,
      action: () => {
        router.push('/documents');
        setIsOpen(false);
      },
      keywords: ['documents', 'archive', 'pdf', 'scan', 'ឯកសារ', 'កម្រង'],
    },
    {
      id: 'nav-signage',
      category: isKm ? 'រដ្ឋបាល & ហាតវែរ' : 'Admin & Hardware',
      title: isKm ? 'ស្លាកអេក្រង់ Smart TV Signage' : 'Waiting Room TV Signage',
      subtitle: isKm ? 'បង្ហាញជួរហៅលេខលើទូរទស្សន៍ និងវីដេអូអប់រំសុខភាព' : 'Full-screen waiting room token display and announcements',
      icon: Tv,
      action: () => {
        router.push('/signage');
        setIsOpen(false);
      },
      keywords: ['signage', 'tv', 'screen', 'display', 'ទូរទស្សន៍', 'អេក្រង់'],
    },
    {
      id: 'nav-staff',
      category: isKm ? 'រដ្ឋបាល & ហាតវែរ' : 'Admin & Hardware',
      title: isKm ? 'គ្រប់គ្រងបុគ្គលិកគ្លីនិក' : 'Staff & Team Management',
      subtitle: isKm ? 'គ្រប់គ្រងគណនីគ្រូពេទ្យ គិលានុបដ្ឋាយិកា និងបុគ្គលិកបេឡា' : 'Manage user credentials, medical licenses and roles',
      icon: ShieldCheck,
      action: () => {
        router.push('/staff');
        setIsOpen(false);
      },
      keywords: ['staff', 'team', 'doctor', 'nurse', 'cashier', 'users', 'បុគ្គលិក'],
    },
    {
      id: 'nav-invoice-template',
      category: isKm ? 'រដ្ឋបាល & ហាតវែរ' : 'Admin & Hardware',
      title: isKm ? 'រចនាម៉ូតវិក្កយបត្រ (Invoice Template)' : 'Invoice Template Designer',
      subtitle: isKm ? 'រចនារូបរាង Logo ពណ៌ និងទម្រង់បោះពុម្ព' : 'Customize invoice layouts, logo, colors & fonts',
      icon: LayoutTemplate,
      action: () => {
        router.push('/invoice-template');
        setIsOpen(false);
      },
      keywords: ['invoice template', 'designer', 'receipt', 'print', 'រចនា', 'ម៉ូតវិក្កយបត្រ'],
    },
    {
      id: 'nav-hardware',
      category: isKm ? 'រដ្ឋបាល & ហាតវែរ' : 'Admin & Hardware',
      title: isKm ? 'ហាតវែរ & ឧបករណ៍ (Hardware & Devices)' : 'Hardware & Peripherals',
      subtitle: isKm ? 'តភ្ជាប់ម៉ាស៊ីនព្រីន POS កេសលុយ និងម៉ាស៊ីនស្កេន' : 'Connect thermal printers, cash drawer & barcode scanner',
      icon: Cpu,
      action: () => {
        router.push('/settings');
        setIsOpen(false);
      },
      keywords: ['hardware', 'printer', 'thermal', 'cash drawer', 'scanner', 'ព្រីន', 'កេសលុយ', 'ហាតវែរ'],
    },
    {
      id: 'nav-sound-settings',
      category: isKm ? 'រដ្ឋបាល & ហាតវែរ' : 'Admin & Hardware',
      title: isKm ? 'កំណត់សំឡេង & ថតសំឡេងនិយាយ (Sound Studio)' : 'Sound & Voice Settings',
      subtitle: isKm ? 'បញ្ចូល MP3 ឬថតសំឡេងប្រកាសផ្ទាល់ខ្លួន' : 'Upload MP3 or record real voice announcements',
      icon: Volume2,
      action: () => {
        router.push('/settings?tab=sound');
        setIsOpen(false);
      },
      keywords: ['sound', 'voice', 'audio', 'tts', 'chime', 'សំឡេង', 'ហៅ'],
    },
    {
      id: 'nav-settings',
      category: isKm ? 'រដ្ឋបាល & ហាតវែរ' : 'Admin & Hardware',
      title: t.nav.settings,
      subtitle: isKm ? 'ការកំណត់គ្លីនិក KHQR & តារាងថ្លៃ' : 'System configuration & fees',
      icon: Settings,
      action: () => {
        router.push('/settings');
        setIsOpen(false);
      },
      keywords: ['settings', 'config', 'profile', 'clinic', 'កំណត់'],
    },
    {
      id: 'nav-pricing',
      category: isKm ? 'រដ្ឋបាល & ហាតវែរ' : 'Admin & Hardware',
      title: isKm ? 'គម្រោងប្រើប្រាស់ & Upgrade (SaaS Plans)' : 'SaaS Subscription Plans',
      subtitle: isKm ? 'ជ្រើសរើស ឬផ្លាស់ប្តូរគម្រោងប្រើប្រាស់គ្លីនិក' : 'Upgrade to Starter, Pro or Enterprise tiers',
      icon: Sparkles,
      action: () => {
        router.push('/pricing');
        setIsOpen(false);
      },
      keywords: ['pricing', 'plan', 'tier', 'upgrade', 'subscription', 'គម្រោង', 'តម្លៃ'],
    },
  ];

  // Quick Utility Actions
  const quickActions: CommandItem[] = [
    {
      id: 'act-toggle-lang',
      category: isKm ? 'សកម្មភាពរហ័ស' : 'Quick Actions',
      title: isKm ? 'ប្តូរភាសាទៅ English' : 'Switch Language to ភាសាខ្មែរ',
      subtitle: isKm ? 'ប្តូរភាសាចំណុចប្រទាក់' : 'Toggle application language',
      icon: Globe,
      action: () => {
        toggleLocale();
        setIsOpen(false);
      },
      shortcut: 'L',
    },
    {
      id: 'act-test-payment-sound',
      category: isKm ? 'សកម្មភាពរហ័ស' : 'Quick Actions',
      title: isKm ? 'សាកល្បងសំឡេងបង់ប្រាក់ KHQR' : 'Test KHQR Payment Chime',
      subtitle: isKm ? 'បន្លឺសំឡេងទូទាត់ជោគជ័យ' : 'Play procedural payment sound',
      icon: Volume2,
      action: () => {
        playPaymentSuccessChime();
      },
    },
    {
      id: 'act-test-queue-sound',
      category: isKm ? 'សកម្មភាពរហ័ស' : 'Quick Actions',
      title: isKm ? 'សាកល្បងសំឡេងហៅជួរ Queue' : 'Test Hospital Queue Chime',
      subtitle: isKm ? 'បន្លឺសំឡេងប្រព័ន្ធផ្សព្វផ្សាយមន្ទីរពេទ្យ' : 'Play hospital PA chime',
      icon: Volume2,
      action: () => {
        playHospitalChime();
      },
    },
  ];

  // Filter items matching query
  const queryLower = query.toLowerCase().trim();
  const filteredNav = queryLower
    ? navigationItems.filter(
        (item) =>
          item.title.toLowerCase().includes(queryLower) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(queryLower)) ||
          (item.keywords && item.keywords.some((k) => k.toLowerCase().includes(queryLower)))
      )
    : navigationItems;

  const filteredQuick = queryLower
    ? quickActions.filter(
        (item) =>
          item.title.toLowerCase().includes(queryLower) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(queryLower))
      )
    : quickActions;

  const allItems: CommandItem[] = [...filteredNav, ...filteredQuick];

  const handleSelect = (item: CommandItem) => {
    item.action();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={() => setIsOpen(false)} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <Search className="w-5 h-5 text-teal-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isKm
                ? 'ស្វែងរកមុខងារ អ្នកជំងឺ ឬពាក្យបញ្ជា (Ctrl+K)...'
                : 'Search commands, patients, or shortcuts (Ctrl+K)...'
            }
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Content List */}
        <div className="overflow-y-auto p-2 space-y-3 touch-scroll flex-1">
          {/* Patient Quick Match Results */}
          {patientResults.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-800 font-mono">
                {isKm ? 'អ្នកជំងឺដែលត្រូវគ្នា' : 'Matched Patients'}
              </div>
              <div className="space-y-1 mt-1">
                {patientResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      router.push(`/patients/${p.id}`);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-100/60 text-teal-800 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                          {p.nameEn} {p.nameKh && <span className="font-normal text-slate-500">({p.nameKh})</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.patientCode} • {p.phone}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Section */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {isKm ? 'ទំព័រ និងម៉ូឌុលគ្លីនិក (All Modules)' : 'Navigation & Modules'}
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100/80 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Section */}
          {filteredQuick.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {isKm ? 'សកម្មភាពរហ័ស & សំឡេង' : 'Quick Actions & Sounds'}
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredQuick.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100/80 flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-amber-50 group-hover:text-amber-800 flex items-center justify-center shrink-0 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                          )}
                        </div>
                      </div>
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-500 rounded border border-slate-200">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allItems.length === 0 && patientResults.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              {isKm ? 'រកមិនឃើញមុខងារ ឬអ្នកជំងឺដែលត្រូវគ្នានឹង' : 'No commands or patients found for'}{' '}
              <strong className="text-slate-700">"{query}"</strong>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Navigation Palette</span>
            <span>•</span>
            <span>Rotana Smart Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
