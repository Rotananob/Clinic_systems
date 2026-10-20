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
