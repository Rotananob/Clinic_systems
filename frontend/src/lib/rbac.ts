export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DOCTOR'
  | 'RECEPTIONIST'
  | 'CASHIER'
  | 'PHARMACIST';

export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  labelEn: string;
  labelKh: string;
  descriptionEn: string;
  descriptionKh: string;
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: '/',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'PHARMACIST'],
    labelEn: 'Dashboard Overview',
    labelKh: 'ផ្ទាំងគ្រប់គ្រងទូទៅ',
    descriptionEn: 'Daily patient count and general overview',
    descriptionKh: 'ស្ថិតិអ្នកជំងឺប្រចាំថ្ងៃ និងទិដ្ឋភាពទូទៅ',
  },
  {
    path: '/patients',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'],
    labelEn: 'Patient Directory & Registration',
    labelKh: 'បញ្ជីអ្នកជំងឺ & ចុះឈ្មោះ',
    descriptionEn: 'Register new patients and manage clinical demographics',
    descriptionKh: 'ចុះឈ្មោះអ្នកជំងឺថ្មី និងប្រវត្តិអ្នកជំងឺ',
  },
  {
    path: '/visits',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'],
    labelEn: 'Consultations & Clinical Encounters',
    labelKh: 'ការពិគ្រោះ & ពិនិត្យរោគវិនិច្ឆ័យ',
    descriptionEn: 'Clinical examination, diagnosis, vitals recording',
    descriptionKh: 'ពិនិត្យរោគវិនិច្ឆ័យ សញ្ញាជីវិត និងកត់ត្រាការព្យាបាល',
  },
  {
    path: '/queue',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'PHARMACIST'],
    labelEn: 'Patient Queue Screen',
    labelKh: 'ក្ដារជួរ & ហៅលេខអ្នកជំងឺ',
    descriptionEn: 'Live queue board and patient calling station',
    descriptionKh: 'ក្ដារហៅលេខអ្នកជំងឺ និងជួររង់ចាំ',
  },
  {
    path: '/prescriptions',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'PHARMACIST'],
    labelEn: 'Prescriptions & Pharmacy Dispensing',
    labelKh: 'វេជ្ជបញ្ជា & បើកថ្នាំ',
    descriptionEn: 'Issue prescriptions and manage pharmacy drug dispensing',
    descriptionKh: 'ចេញវេជ្ជបញ្ជា និងបើកថ្នាំតាមវេជ្ជបញ្ជា',
  },
  {
    path: '/inventory',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'PHARMACIST'],
    labelEn: 'Warehouse & Multi-Branch Network',
    labelKh: 'ឃ្លាំង & បណ្តាញសាខា',
    descriptionEn: 'Central inventory depot, inter-branch transfers, and FEFO expiration tracking',
    descriptionKh: 'ឃ្លាំងស្តុកកណ្តាល ការផ្ទេរថ្នាំរវាងសាខា និងតាមដានការផុតកំណត់ FEFO',
  },
  {
    path: '/billing',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'],
    labelEn: 'Invoicing & KHQR POS Settlement',
    labelKh: 'វិក្កយបត្រ & ទូទាត់ KHQR',
    descriptionEn: 'Cashier checkout, dynamic KHQR code generation, receipts',
    descriptionKh: 'គិតលុយ បង្កើត Dynamic KHQR និងបោះពុម្ពវិក្កយបត្រ',
  },
  {
    path: '/reports',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    labelEn: 'Financial Reports & Analytics',
    labelKh: 'របាយការណ៍ & ស្ថិតិហិរញ្ញវត្ថុ',
    descriptionEn: 'Revenue reports, daily shift summaries, clinic trends',
    descriptionKh: 'របាយការណ៍ចំណូល វេនការងារ និងស្ថិតិព្យាបាល',
  },
  {
    path: '/certificates',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Medical Certificates',
    labelKh: 'លិខិតបញ្ជាក់សុខភាព',
    descriptionEn: 'Issue health certificates and medical leave slips',
    descriptionKh: 'ចេញលិខិតបញ្ជាក់សុខភាព និងសម្រាកព្យាបាល',
  },
  {
    path: '/follow-ups',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST'],
    labelEn: 'Follow-up Appointments',
    labelKh: 'ការណាត់ជួបបន្ត',
    descriptionEn: 'Schedule recall visits and manage appointment reminders',
    descriptionKh: 'កំណត់កាលវិភាគណាត់ជួប និងតាមដានអ្នកជំងឺ',
  },
  {
    path: '/documents',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'PHARMACIST'],
    labelEn: 'Medical Documents & Cloud Attachments',
    labelKh: 'ឯកសារវេជ្ជសាស្ត្រ & លទ្ធផលតេស្ត',
    descriptionEn: 'Blood test results, lab attachments, and Cloudinary scans',
    descriptionKh: 'លទ្ធផលពិនិត្យឈាម និងឯកសារស្កេន',
  },
  {
    path: '/pacs',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Medical Imaging & WebGL PACS',
    labelKh: 'រូបភាពវេជ្ជសាស្ត្រ & PACS',
    descriptionEn: 'DICOM studies, WebGL radiologist viewer, CTR & Cobb angle',
    descriptionKh: 'ការពិនិត្យរូបភាព DICOM និងវាស់ស្ទង់វេជ្ជសាស្ត្រ',
  },
  {
    path: '/insurance',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'CASHIER'],
    labelEn: 'NSSF & Commercial Insurance Direct Settlement',
    labelKh: 'ធានារ៉ាប់រង ប.ស.ស. & ទូទាត់វិក្កយបត្រ',
    descriptionEn: 'NSSF split invoices, real-time claim adjudication, MoH audit manifest',
    descriptionKh: 'វិក្កយបត្របំបែក ប.ស.ស. និងទូទាត់ប្រាក់ធានារ៉ាប់រង',
  },
  {
    path: '/concierge',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Clinical Care Concierge & Adherence',
    labelKh: 'ប្រព័ន្ធថែទាំអ្នកជំងឺ & តាមដានលេបថ្នាំ',
    descriptionEn: 'Automated post-visit follow-up and symptom red-flag escalation',
    descriptionKh: 'តាមដានការលេបថ្នាំស្វ័យប្រវត្តិតាម Telegram/WhatsApp និងរោគសញ្ញាអាសន្ន',
  },
  {
    path: '/signage',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'PHARMACIST'],
    labelEn: 'Smart Waiting Room TV Signage',
    labelKh: 'ក្ដារទូរទស្សន៍ហៅលេខឌីជីថល',
    descriptionEn: 'Full-screen waiting room TV calling board with chime and bilingual voice',
    descriptionKh: 'ក្ដារហៅលេខអ្នកជំងឺតាមទូរទស្សន៍ពេញអេក្រង់ ជាមួយសំឡេងខ្មែរ',
  },
  {
    path: '/lab',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Laboratory Information System (LIS)',
    labelKh: 'មន្ទីរពិសោធន៍ & តេស្តឈាម LIS',
    descriptionEn: 'ASTM/HL7 automated analyzer interfacing, delta checks, panic alerts',
    descriptionKh: 'ភ្ជាប់ម៉ាស៊ីនវិភាគឈាមស្វ័យប្រវត្តិតាម ASTM/HL7 និងតាមដានតម្លៃអាសន្ន',
  },
  {
    path: '/ipd',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Inpatient (IPD) Admission & e-MAR',
    labelKh: 'ប្រព័ន្ធសម្រាកពេទ្យ & ថែទាំ e-MAR',
    descriptionEn: 'Bed management, Five Rights e-MAR verification, and 24h fluid balance',
    descriptionKh: 'គ្រប់គ្រងគ្រែសម្រាក ការផ្តល់ថ្នាំ Five Rights និងតុល្យភាពជាតិទឹក',
  },
  {
    path: '/finance',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Finance & Doctor Commission P&L',
    labelKh: 'ហិរញ្ញវត្ថុ & កម្រៃជើងសារ P&L',
    descriptionEn: 'Doctor commissions, operational expense ledger, and real-time EBITDA analytics',
    descriptionKh: 'កម្រៃជើងសារវេជ្ជបណ្ឌិត សៀវភៅចំណាយប្រតិបត្តិការ និងការវិភាគប្រាក់ចំណេញ EBITDA',
  },
  {
    path: '/dental',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Dental Odontogram & Treatment Planner',
    labelKh: 'ដ្យាក្រាមធ្មេញ & ផែនការព្យាបាលទន្តសាស្ត្រ',
    descriptionEn: '32-tooth anatomical FDI charting, 5-surface lesion tracking, and WHO DMFT index',
    descriptionKh: 'ដ្យាក្រាមធ្មេញមនុស្សពេញវ័យ ៣២ ធ្មេញតាម FDI និងសន្ទស្សន៍ពុកធ្មេញ WHO DMFT',
  },
  {
    path: '/teleconsult',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Teleconsultation WebRTC & Digital e-Prescription',
    labelKh: 'ពិគ្រោះជំងឺពីចម្ងាយ WebRTC & វេជ្ជបញ្ជាឌីជីថល',
    descriptionEn: 'Peer-to-peer WebRTC video consultation and tamper-proof QR signed e-prescriptions',
    descriptionKh: 'ការពិគ្រោះជំងឺពីចម្ងាយតាមវីដេអូ WebRTC និងវេជ្ជបញ្ជាឌីជីថលចុះហត្ថលេខា QR Code',
  },
  {
    path: '/eclaim',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR'],
    labelEn: 'Electronic Insurance Claims & MoH Surveillance',
    labelKh: 'ការទាមទារធានារ៉ាប់រងអេឡិចត្រូនិក & ជំងឺឆ្លង MoH',
    descriptionEn: 'ANSI 837P XML/FHIR electronic claim generation and DHIS2 communicable disease surveillance',
    descriptionKh: 'បង្កើតឯកសារទាមទារធានារ៉ាប់រង XML/FHIR និងរាយការណ៍ជំងឺឆ្លងតាមប្រព័ន្ធ MoH DHIS2',
  },
  {
    path: '/staff',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    labelEn: 'Staff & Role Management',
    labelKh: 'គ្រប់គ្រងបុគ្គលិក & តួនាទី',
    descriptionEn: 'Create and manage clinic staff credentials and accounts',
    descriptionKh: 'បង្កើត និងគ្រប់គ្រងគណនីបុគ្គលិកក្នុងគ្លីនិក',
  },
  {
    path: '/owner',
    allowedRoles: ['SUPER_ADMIN'],
    labelEn: 'Owner Governance & Database',
    labelKh: 'ការគ្រប់គ្រងម្ចាស់ប្រព័ន្ធ & ទិន្នន័យ',
    descriptionEn: 'Super Admin governance, security audit logs, full export',
    descriptionKh: 'ការគ្រប់គ្រងជាន់ខ្ពស់ កំណត់ហេតុសុវត្ថិភាព និងបម្រុងទុកទិន្នន័យ',
  },
  {
    path: '/super-admin',
    allowedRoles: ['SUPER_ADMIN'],
    labelEn: 'Super Admin Platform Hub',
    labelKh: 'ផ្ទាំងគ្រប់គ្រងបណ្តាញគ្លីនិក (Fleet Hub)',
    descriptionEn: 'Multi-clinic fleet metrics, remote emergency lockout, and platform maintenance',
    descriptionKh: 'ស្ថិតិ SaaS រួម បណ្តាញគ្លីនិកទាំងអស់ ការបញ្ជាពីចម្ងាយ និងការថែទាំប្រព័ន្ធ',
  },
  {
    path: '/invoice-template',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    labelEn: 'Invoice Template Designer',
    labelKh: 'រចនាទម្រង់វិក្កយបត្រ',
    descriptionEn: 'Customize clinic logo, header, colors, and footer notes',
    descriptionKh: 'កែសម្រួលឡូហ្គោ ពណ៌ និងបាតកថាវិក្កយបត្រ',
  },
  {
    path: '/settings',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    labelEn: 'Clinic System Settings',
    labelKh: 'ការកំណត់ប្រព័ន្ធ',
    descriptionEn: 'Configure Telegram bot, Bakong merchant, and hardware direct print',
    descriptionKh: 'ការកំណត់ Telegram Bot គណនីបាគង និងម៉ាស៊ីនព្រីន',
  },
  {
    path: '/profile',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'CASHIER', 'PHARMACIST'],
    labelEn: 'My Profile & Preferences',
    labelKh: 'ព័ត៌មានផ្ទាល់ខ្លួន & ការកំណត់',
    descriptionEn: 'Update avatar via Cloudinary, personal info, and change password',
    descriptionKh: 'ប្តូររូបថត ព័ត៌មានផ្ទាល់ខ្លួន និងផ្លាស់ប្តូរលេខសម្ងាត់',
  },
];

export function isRouteAllowed(role: string | undefined | null, pathname: string): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;

  // Exact match or sub-route match (e.g. /patients/123 matches /patients)
  const normalizedPath = pathname === '/' ? '/' : `/${pathname.split('/')[1]}`;
  const config = ROUTE_PERMISSIONS.find((p) => p.path === normalizedPath);
  if (!config) return true; // Default allow if not in restricted list
  return config.allowedRoles.includes(role as UserRole);
}

export type ClinicCategory = 'DENTAL' | 'PHARMACY' | 'GENERAL' | 'POLYCLINIC';

export function resolveClinicCategory(clinicType?: string | null): ClinicCategory {
  if (!clinicType) return 'GENERAL';
  const upper = clinicType.toUpperCase();
  if (
    upper.includes('DENTAL') ||
    upper.includes('TOOTH') ||
    upper.includes('ធ្មេញ') ||
    upper.includes('ទន្ត')
  ) {
    return 'DENTAL';
  }
  if (
    upper.includes('PHARMACY') ||
    upper.includes('DRUG') ||
    upper.includes('ឱសថ')
  ) {
    return 'PHARMACY';
  }
  if (
    upper.includes('POLYCLINIC') ||
    upper.includes('ពហុព្យាបាល')
  ) {
    return 'POLYCLINIC';
  }
  return 'GENERAL';
}

export function getClinicTargetRoute(
  user?: {
    role?: string;
    targetRoute?: string;
    tenant?: { clinicType?: string };
  } | null,
): string {
  if (!user) return '/';
  if (user.role === 'SUPER_ADMIN') return '/';
  if (user.targetRoute) return user.targetRoute;

  const category = resolveClinicCategory(user.tenant?.clinicType);
  const role = user.role;

  if (category === 'DENTAL') {
    if (role === 'CASHIER') return '/billing';
    return '/dental';
  }

  if (category === 'PHARMACY') {
    if (role === 'CASHIER') return '/billing';
    return '/prescriptions';
  }

  // GENERAL or POLYCLINIC
  if (role === 'DOCTOR') return '/visits';
  if (role === 'PHARMACIST') return '/prescriptions';
  if (role === 'CASHIER') return '/billing';
  if (role === 'RECEPTIONIST') return '/queue';

  return '/queue';
}

export function isModuleRelevantForClinic(
  clinicType: string | undefined | null,
  pathname: string,
  role?: string | null,
): boolean {
  if (role === 'SUPER_ADMIN') return true;

  // Never show super-admin or owner platform portals to non-super-admins
  if (pathname === '/super-admin' || pathname === '/owner') {
    return false;
  }

  const category = resolveClinicCategory(clinicType);

  if (category === 'PHARMACY') {
    // Standalone Pharmacy focuses on prescriptions, inventory, POS billing, reports, etc.
    const pharmacyExcluded = [
      '/dental',
      '/ipd',
      '/pacs',
      '/teleconsult',
      '/lab',
      '/eclaim',
      '/certificates',
      '/visits',
    ];
    if (pharmacyExcluded.includes(pathname)) return false;
  } else if (category === 'DENTAL') {
    // Dental clinics do not use hospital IPD inpatient beds or LIS blood analyzers
    const dentalExcluded = ['/ipd', '/lab'];
    if (dentalExcluded.includes(pathname)) return false;
  } else if (category === 'GENERAL') {
    // General outpatient clinic without dental specialization hides /dental
    if (pathname === '/dental') return false;
  }

  return true;
}

export function getRoleDisplayName(role: string | undefined | null, isKh: boolean): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return isKh ? 'ម្ចាស់គ្លីនិក (Owner)' : 'SUPER ADMIN (OWNER)';
    case 'ADMIN':
      return isKh ? 'អ្នកគ្រប់គ្រងទូទៅ' : 'CLINIC ADMIN';
    case 'DOCTOR':
      return isKh ? 'វេជ្ជបណ្ឌិតពិគ្រោះ' : 'MEDICAL DOCTOR';
    case 'CASHIER':
      return isKh ? 'បេឡាករ (គិតលុយ)' : 'CASHIER';
    case 'PHARMACIST':
      return isKh ? 'ឱសថការី (បើកថ្នាំ)' : 'PHARMACIST';
    case 'RECEPTIONIST':
      return isKh ? 'ផ្នែកទទួលភ្ញៀវ' : 'RECEPTIONIST';
    default:
      return role || (isKh ? 'បុគ្គលិកទូទៅ' : 'STAFF');
  }
}
