/**
 * Module Visibility & Dashboard Customization Utility
 * Allows Clinic Admins to hide specialized or unnecessary features
 * for a cleaner, decluttered standard Cambodian clinic experience.
 */

export interface OptionalModuleConfig {
  path: string;
  id: string;
  nameKh: string;
  nameEn: string;
  descKh: string;
  descEn: string;
  isAdvanced: boolean;
}

export const OPTIONAL_MODULES: OptionalModuleConfig[] = [
  {
    path: '/teleconsult',
    id: 'teleconsult',
    nameKh: 'ពិគ្រោះជំងឺពីចម្ងាយ WebRTC',
    nameEn: 'Teleconsultation WebRTC Video Call',
    descKh: 'ការពិគ្រោះជំងឺតាមវីដេអូ និងចេញវេជ្ជបញ្ជាឌីជីថល QR Code',
    descEn: 'Video consultations and QR signed e-prescriptions',
    isAdvanced: true,
  },
  {
    path: '/pacs',
    id: 'pacs',
    nameKh: 'រូបភាពវេជ្ជសាស្ត្រ & PACS',
    nameEn: 'Medical Imaging - PACS DICOM',
    descKh: 'ពិនិត្យរូបភាព X-Ray ឬ CT តាម WebGL និងវាស់ Cobb angle',
    descEn: 'DICOM radiologist viewer and anatomical angles',
    isAdvanced: true,
  },
  {
    path: '/lab',
    id: 'lab',
    nameKh: 'មន្ទីរពិសោធន៍ & តេស្តឈាម LIS',
    nameEn: 'Laboratory Information System - LIS',
    descKh: 'ភ្ជាប់ម៉ាស៊ីនវិភាគឈាមស្វ័យប្រវត្តិតាម ASTM ឬ HL7',
    descEn: 'Automated blood analyzer interfacing and delta checks',
    isAdvanced: true,
  },
  {
    path: '/ipd',
    id: 'ipd',
    nameKh: 'ប្រព័ន្ធសម្រាកពេទ្យ & ថែទាំ e-MAR',
    nameEn: 'Inpatient IPD Admission & e-MAR',
    descKh: 'គ្រប់គ្រងគ្រែសម្រាក និងការផ្តល់ថ្នាំ Five Rights',
    descEn: 'Bed management and e-MAR medication verification',
    isAdvanced: true,
  },
  {
    path: '/eclaim',
    id: 'eclaim',
    nameKh: 'ទាមទារធានារ៉ាប់រងអេឡិចត្រូនិក & MoH',
    nameEn: 'Electronic Insurance Claims & MoH Surveillance',
    descKh: 'ឯកសារទាមទារ XML ឬ FHIR និងរាយការណ៍ជំងឺឆ្លង DHIS2',
    descEn: 'ANSI 837P claims and DHIS2 surveillance reporting',
    isAdvanced: true,
  },
  {
    path: '/insurance',
    id: 'insurance',
    nameKh: 'ធានារ៉ាប់រង ប.ស.ស. & ទូទាត់វិក្កយបត្រ',
    nameEn: 'NSSF & Commercial Insurance Direct Settlement',
    descKh: 'វិក្កយបត្របំបែក ប.ស.ស. និងទូទាត់ប្រាក់ធានារ៉ាប់រង',
    descEn: 'NSSF split invoices and real-time claim settlement',
    isAdvanced: true,
  },
  {
    path: '/dental',
    id: 'dental',
    nameKh: 'ដ្យាក្រាមធ្មេញ Odontogram',
    nameEn: 'Dental Odontogram & Treatment Chart',
    descKh: 'ប្លង់ ៣២ ធ្មេញកាយវិភាគវិទ្យា និងរោគពុកធ្មេញ WHO DMFT',
    descEn: '32-tooth FDI anatomical charting and WHO DMFT index',
    isAdvanced: true,
  },
  {
    path: '/signage',
    id: 'signage',
    nameKh: 'ក្ដារទូរទស្សន៍ហៅលេខឌីជីថល TV Signage',
    nameEn: 'Smart Waiting Room TV Signage',
    descKh: 'ក្ដារហៅលេខតាមទូរទស្សន៍ពេញអេក្រង់ជាមួយសំឡេងខ្មែរ',
    descEn: 'Full-screen waiting room TV calling board with voice',
    isAdvanced: true,
  },
  {
    path: '/concierge',
    id: 'concierge',
    nameKh: 'ប្រព័ន្ធថែទាំ & តាមដានលេបថ្នាំ',
    nameEn: 'Clinical Care Concierge & Adherence',
    descKh: 'តាមដានការលេបថ្នាំស្វ័យប្រវត្តិតាម Telegram និងសញ្ញាអាសន្ន',
    descEn: 'Automated post-visit follow-up and red-flag alerts',
    isAdvanced: true,
  },
  {
    path: '/finance',
    id: 'finance',
    nameKh: 'ហិរញ្ញវត្ថុ & កម្រៃជើងសារ P&L',
    nameEn: 'Finance & Doctor Commission P&L',
    descKh: 'កម្រៃជើងសារវេជ្ជបណ្ឌិត និងការវិភាគប្រាក់ចំណេញ EBITDA',
    descEn: 'Doctor commissions, operational expense ledger and EBITDA',
    isAdvanced: true,
  },
  {
    path: '/inventory',
    id: 'inventory',
    nameKh: 'ឃ្លាំងស្តុកកណ្តាល & បណ្តាញសាខា',
    nameEn: 'Warehouse & Multi-Branch Network',
    descKh: 'ការផ្ទេរថ្នាំរវាងសាខា និងតាមដានការផុតកំណត់ FEFO',
    descEn: 'Inter-branch transfers and FEFO expiration tracking',
    isAdvanced: true,
  },
];

const STORAGE_KEY = 'krupet_hidden_modules';
const EVENT_NAME = 'krupet-modules-changed';

let memoryStorage: Record<string, string> = {};

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return memoryStorage[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { hidden: JSON.parse(value) } }));
    } catch {
      // Ignore in non-browser context
    }
  } else {
    memoryStorage[key] = value;
  }
}

function removeStorageItem(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { hidden: [] } }));
    } catch {
      // Ignore in non-browser context
    }
  } else {
    delete memoryStorage[key];
  }
}

export function getHiddenModules(): string[] {
  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isModuleHidden(path: string): boolean {
  const hidden = getHiddenModules();
  return hidden.includes(path);
}

export function setModuleHidden(path: string, shouldHide: boolean): void {
  const current = getHiddenModules();
  let updated: string[];
  if (shouldHide) {
    updated = Array.from(new Set([...current, path]));
  } else {
    updated = current.filter((p) => p !== path);
  }
  setStorageItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Standard Cambodian Clinic Preset:
 * Automatically hides heavy, specialized modules (Teleconsult, PACS, LIS, IPD, eClaim, Dental, Signage, Concierge, Finance)
 * Leaving core essentials visible: Patients, Queue, Consultations/Vitals, Prescriptions, Invoicing/KHQR POS, Reports, Staff, Settings.
 */
export function applyStandardKhmerClinicPreset(): string[] {
  const standardHidden = [
    '/teleconsult',
    '/pacs',
    '/lab',
    '/ipd',
    '/eclaim',
    '/insurance',
    '/dental',
    '/signage',
    '/concierge',
    '/finance',
  ];
  setStorageItem(STORAGE_KEY, JSON.stringify(standardHidden));
  return standardHidden;
}

export function resetAllModulesVisible(): void {
  removeStorageItem(STORAGE_KEY);
}
