export interface InvoiceTemplateConfig {
  // Branding
  accentColor: string;
  logoUrl: string;
  showLogo: boolean;
  headerBg: 'white' | 'accent' | 'dark';

  // Header Fields
  showClinicName: boolean;
  showMohLicense: boolean;
  showClinicAddress: boolean;
  showClinicPhone: boolean;
  showClinicEmail: boolean;
  showSlogan: boolean;

  // Invoice Fields
  invoiceTitleEn: string;
  invoiceTitleKh: string;
  showInvoiceNumber: boolean;
  showPatientCode: boolean;
  showPatientPhone: boolean;
  showDoctorName: boolean;
  showVisitDate: boolean;
  showItemizedServices: boolean;
  showKhrEquivalent: boolean;

  // Footer
  footerNoteEn: string;
  footerNoteKh: string;
  showFooterSignatureLine: boolean;
  showKhqrOnReceipt: boolean;
  showAbaReference: boolean;

  // Layout
  paperSize: '80MM_THERMAL' | 'A4_STANDARD' | 'A5_HALF';
  fontFamily: 'system' | 'khmer' | 'mono';
  showBorder: boolean;
  showWatermark: boolean;
}

export const DEFAULT_TEMPLATE_CONFIG: InvoiceTemplateConfig = {
  accentColor: '#0f766e',
  logoUrl: '',
  showLogo: true,
  headerBg: 'white',

  showClinicName: true,
  showMohLicense: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: false,
  showSlogan: false,

  invoiceTitleEn: 'Official Payment Receipt',
  invoiceTitleKh: 'បង្កាន់ដៃទូទាត់ប្រាក់ផ្លូវការ',
  showInvoiceNumber: true,
  showPatientCode: true,
  showPatientPhone: true,
  showDoctorName: true,
  showVisitDate: true,
  showItemizedServices: true,
  showKhrEquivalent: true,

  footerNoteEn: 'Thank you for choosing Rotana Clinic. Wish you a speedy recovery!',
  footerNoteKh: 'សូមអរគុណចំពោះការជឿទុកចិត្ត! សូមជូនពរលោកអ្នកឆាប់ជាសះស្បើយ!',
  showFooterSignatureLine: false,
  showKhqrOnReceipt: false,
  showAbaReference: true,

  paperSize: '80MM_THERMAL',
  fontFamily: 'system',
  showBorder: true,
  showWatermark: false,
};

export const TEMPLATE_STORAGE_KEY = 'rotana_invoice_template_v1';

export function loadTemplateConfig(): InvoiceTemplateConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_TEMPLATE_CONFIG };
  try {
    const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TEMPLATE_CONFIG };
    const parsed = JSON.parse(raw) as Partial<InvoiceTemplateConfig>;
    return { ...DEFAULT_TEMPLATE_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_TEMPLATE_CONFIG };
  }
}

export function saveTemplateConfig(config: InvoiceTemplateConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(config));
}
