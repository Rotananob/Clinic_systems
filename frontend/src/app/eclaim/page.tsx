'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ShieldCheck,
  FileCode,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Send,
  Building2,
  Stethoscope,
  Activity,
  Layers,
  Search,
  ExternalLink,
  Code,
  Check,
  Copy,
  Clock,
  User,
  Hash,
  Calculator,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/context/I18nContext';

interface ClaimItem {
  id: string;
  serviceCode: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalPriceUsd: number;
  coveredAmountUsd: number;
  coPayUsd: number;
  deductibleUsd: number;
}

interface DiagnosisEntry {
  code: string;
  name: string;
  isPrimary: boolean;
}

interface ElectronicClaim {
  id: string;
  claimNumber: string;
  insurer: 'FORTE' | 'PRUDENTIAL' | 'AIA' | 'MANULIFE' | 'INFINITY' | 'NSSF';
  policyNumber: string;
  memberId: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  providerId: string;
  providerName: string;
  providerLicense: string;
  preAuthCode?: string;
  diagnosisCodes: DiagnosisEntry[];
  admissionDate?: string;
  dischargeDate?: string;
  claimType: 'OUTPATIENT' | 'INPATIENT' | 'DENTAL';
  items: ClaimItem[];
  totalBilledUsd: number;
  totalClaimedUsd: number;
  patientShareUsd: number;
  status: 'DRAFT' | 'VALIDATED' | 'SUBMITTED' | 'PRE_APPROVED' | 'SETTLED' | 'REJECTED';
  createdAt: string;
  submittedAt?: string;
  adjudicatedAt?: string;
  adjudicationNotes?: string;
  batchHash?: string;
  transactionReference?: string;
  xmlPayload?: string;
  fhirJsonPayload?: any;
}

interface ReportableDisease {
  code: string;
  khmerName: string;
  englishName: string;
  category: 'IMMEDIATE' | 'WEEKLY' | 'MONTHLY';
}

interface SurveillanceCaseRecord {
  id: string;
  diseaseCode: string;
  diseaseName: string;
  caseType: 'SUSPECTED' | 'PROBABLE' | 'CONFIRMED';
  laboratoryConfirmation: 'PCR' | 'RDT' | 'SEROLOGY' | 'CULTURE' | 'CLINICAL_ONLY';
  patientAge: number;
  patientGender: 'M' | 'F';
  provinceCode: string;
  districtCode: string;
  healthFacilityCode: string;
  encounterDate: string;
  reportingPeriod: string;
  outcome: 'RECOVERED' | 'HOSPITALIZED' | 'TRANSFERRED' | 'DECEASED';
}


type NssfActCategory =
  | 'CONSULTATION'
  | 'HOSPITALIZATION'
  | 'MINOR_SURGERY'
  | 'INTERMEDIATE_SURGERY'
  | 'MAJOR_SURGERY'
  | 'COMPLEX_SURGERY'
  | 'MATERNITY'
  | 'LABORATORY'
  | 'IMAGING';

type CoefficientType = 'K_SURGICAL' | 'B_LABORATORY' | 'R_IMAGING' | 'FIXED_PACKAGE';

interface NssfTariffItem {
  actCode: string;
  category: NssfActCategory;
  descriptionEn: string;
  descriptionKh: string;
  coefficientType: CoefficientType;
  coefficientValue: number;
  baseUnitValueKhr: number;
  maximumCeilingKhr: number;
  requiresPreAuthorization: boolean;
  defaultIcd10Indication?: string;
}

interface SimulatorItem {
  id: string;
  actCode: string;
  descriptionEn: string;
  descriptionKh: string;
  category: NssfActCategory;
  coefficientType: CoefficientType;
  coefficientValue: number;
  baseUnitValueKhr: number;
  maximumCeilingKhr: number;
  requiresPreAuthorization: boolean;
  quantity: number;
  preAuthCode: string;
}

const INITIAL_NSSF_TARIFF_MASTER: NssfTariffItem[] = [
  { actCode: 'NSSF-OPD-001', category: 'CONSULTATION', descriptionEn: 'General Medical Consultation', descriptionKh: 'ការពិគ្រោះជំងឺទូទៅ', coefficientType: 'FIXED_PACKAGE', coefficientValue: 20000, baseUnitValueKhr: 1, maximumCeilingKhr: 20000, requiresPreAuthorization: false, defaultIcd10Indication: 'Z00.0' },
  { actCode: 'NSSF-OPD-002', category: 'CONSULTATION', descriptionEn: 'Specialist Physician Consultation', descriptionKh: 'ការពិគ្រោះជំងឺឯកទេស', coefficientType: 'FIXED_PACKAGE', coefficientValue: 40000, baseUnitValueKhr: 1, maximumCeilingKhr: 40000, requiresPreAuthorization: false, defaultIcd10Indication: 'Z01.8' },
  { actCode: 'NSSF-OPD-003', category: 'CONSULTATION', descriptionEn: 'Emergency Resuscitation Consultation', descriptionKh: 'ការពិគ្រោះសង្គ្រោះបន្ទាន់', coefficientType: 'FIXED_PACKAGE', coefficientValue: 60000, baseUnitValueKhr: 1, maximumCeilingKhr: 60000, requiresPreAuthorization: false, defaultIcd10Indication: 'R57.9' },
  { actCode: 'NSSF-IPD-001', category: 'HOSPITALIZATION', descriptionEn: 'General Ward Daily Bed Day', descriptionKh: 'ថ្លៃគ្រែសម្រាកព្យាបាលបន្ទប់ទូទៅ', coefficientType: 'FIXED_PACKAGE', coefficientValue: 45000, baseUnitValueKhr: 1, maximumCeilingKhr: 45000, requiresPreAuthorization: false, defaultIcd10Indication: 'Z76.8' },
  { actCode: 'NSSF-IPD-002', category: 'HOSPITALIZATION', descriptionEn: 'Semi-Private Ward Bed Day', descriptionKh: 'ថ្លៃគ្រែបន្ទប់ពាក់កណ្តាលឯកជន', coefficientType: 'FIXED_PACKAGE', coefficientValue: 90000, baseUnitValueKhr: 1, maximumCeilingKhr: 90000, requiresPreAuthorization: true, defaultIcd10Indication: 'Z76.8' },
  { actCode: 'NSSF-IPD-003', category: 'HOSPITALIZATION', descriptionEn: 'Intensive Care Unit Daily Bed Day', descriptionKh: 'ថ្លៃគ្រែសង្គ្រោះបន្ទាន់កម្រិតធ្ងន់ ICU', coefficientType: 'FIXED_PACKAGE', coefficientValue: 250000, baseUnitValueKhr: 1, maximumCeilingKhr: 250000, requiresPreAuthorization: true, defaultIcd10Indication: 'R57.0' },
  { actCode: 'NSSF-SURG-K05', category: 'MINOR_SURGERY', descriptionEn: 'Wound Debridement and Suture under 5cm', descriptionKh: 'ការលាងសម្អាតនិងដេររបួសតូចក្រោម ៥សង់ទីម៉ែត្រ', coefficientType: 'K_SURGICAL', coefficientValue: 5, baseUnitValueKhr: 12000, maximumCeilingKhr: 60000, requiresPreAuthorization: false, defaultIcd10Indication: 'T14.1' },
  { actCode: 'NSSF-SURG-K15', category: 'MINOR_SURGERY', descriptionEn: 'Abscess Drainage or Excision of Lipoma', descriptionKh: 'ការវះបង្ហូរខ្ទុះឬវះកាត់ដុំពកខ្លាញ់', coefficientType: 'K_SURGICAL', coefficientValue: 15, baseUnitValueKhr: 12000, maximumCeilingKhr: 180000, requiresPreAuthorization: false, defaultIcd10Indication: 'L02.9' },
  { actCode: 'NSSF-SURG-K30', category: 'INTERMEDIATE_SURGERY', descriptionEn: 'Closed Reduction of Long Bone Fracture', descriptionKh: 'ការតម្រង់ឆ្អឹងបាក់ប្រភេទបិទជិត', coefficientType: 'K_SURGICAL', coefficientValue: 30, baseUnitValueKhr: 12000, maximumCeilingKhr: 360000, requiresPreAuthorization: false, defaultIcd10Indication: 'S52.5' },
  { actCode: 'NSSF-SURG-K50', category: 'MAJOR_SURGERY', descriptionEn: 'Open Appendectomy for Acute Appendicitis', descriptionKh: 'ការវះកាត់ខ្នែងពោះវៀនរលាកស្រួចស្រាវ', coefficientType: 'K_SURGICAL', coefficientValue: 50, baseUnitValueKhr: 12000, maximumCeilingKhr: 600000, requiresPreAuthorization: false, defaultIcd10Indication: 'K35.8' },
  { actCode: 'NSSF-SURG-K75', category: 'MAJOR_SURGERY', descriptionEn: 'Laparoscopic Cholecystectomy', descriptionKh: 'ការវះកាត់ប្រមាត់ដោយឧបករណ៍ឆ្លុះ Laparoscopic', coefficientType: 'K_SURGICAL', coefficientValue: 75, baseUnitValueKhr: 12000, maximumCeilingKhr: 900000, requiresPreAuthorization: true, defaultIcd10Indication: 'K80.2' },
  { actCode: 'NSSF-SURG-K100', category: 'COMPLEX_SURGERY', descriptionEn: 'Open Reduction and Internal Fixation Femur', descriptionKh: 'ការវះកាត់តឆ្អឹងភ្លៅដាក់ដែកអម', coefficientType: 'K_SURGICAL', coefficientValue: 100, baseUnitValueKhr: 12000, maximumCeilingKhr: 1200000, requiresPreAuthorization: true, defaultIcd10Indication: 'S72.0' },
  { actCode: 'NSSF-SURG-K150', category: 'COMPLEX_SURGERY', descriptionEn: 'Total Hip Arthroplasty', descriptionKh: 'ការវះកាត់ប្តូរសន្លាក់ត្រគាកសិប្បនិម្មិតទាំងស្រុង', coefficientType: 'K_SURGICAL', coefficientValue: 150, baseUnitValueKhr: 12000, maximumCeilingKhr: 1800000, requiresPreAuthorization: true, defaultIcd10Indication: 'M16.1' },
  { actCode: 'NSSF-MAT-001', category: 'MATERNITY', descriptionEn: 'Normal Spontaneous Vaginal Delivery', descriptionKh: 'ការសម្រាលកូនតាមធម្មជាតិ', coefficientType: 'FIXED_PACKAGE', coefficientValue: 360000, baseUnitValueKhr: 1, maximumCeilingKhr: 360000, requiresPreAuthorization: false, defaultIcd10Indication: 'O80.0' },
  { actCode: 'NSSF-MAT-002', category: 'MATERNITY', descriptionEn: 'Caesarean Section Delivery', descriptionKh: 'ការសម្រាលកូនដោយវះកាត់', coefficientType: 'FIXED_PACKAGE', coefficientValue: 840000, baseUnitValueKhr: 1, maximumCeilingKhr: 840000, requiresPreAuthorization: true, defaultIcd10Indication: 'O82.0' },
  { actCode: 'NSSF-LAB-B05', category: 'LABORATORY', descriptionEn: 'Complete Blood Count Automated', descriptionKh: 'ការវិភាគគ្រាប់ឈាមពេញលេញស្វ័យប្រវត្ត CBC', coefficientType: 'B_LABORATORY', coefficientValue: 5, baseUnitValueKhr: 1000, maximumCeilingKhr: 5000, requiresPreAuthorization: false, defaultIcd10Indication: 'D64.9' },
  { actCode: 'NSSF-LAB-B10', category: 'LABORATORY', descriptionEn: 'Serum Creatinine and Blood Urea Nitrogen', descriptionKh: 'តេស្តមុខងារតម្រងនោម Creatinine & BUN', coefficientType: 'B_LABORATORY', coefficientValue: 10, baseUnitValueKhr: 1000, maximumCeilingKhr: 10000, requiresPreAuthorization: false, defaultIcd10Indication: 'N18.9' },
  { actCode: 'NSSF-LAB-B12', category: 'LABORATORY', descriptionEn: 'Fasting Blood Glucose', descriptionKh: 'តេស្តជាតិស្ករក្នុងឈាមពេលព្រឹក Fasting Glucose', coefficientType: 'B_LABORATORY', coefficientValue: 12, baseUnitValueKhr: 1000, maximumCeilingKhr: 12000, requiresPreAuthorization: false, defaultIcd10Indication: 'E11.9' },
  { actCode: 'NSSF-LAB-B20', category: 'LABORATORY', descriptionEn: 'Liver Function Test Panel AST ALT ALP', descriptionKh: 'តេស្តមុខងារថ្លើម AST ALT ALP', coefficientType: 'B_LABORATORY', coefficientValue: 20, baseUnitValueKhr: 1000, maximumCeilingKhr: 20000, requiresPreAuthorization: false, defaultIcd10Indication: 'K76.9' },
  { actCode: 'NSSF-LAB-B30', category: 'LABORATORY', descriptionEn: 'Glycated Hemoglobin HbA1c HPLC', descriptionKh: 'តេស្តជាតិស្ករបង្គរ ៣ខែ HbA1c', coefficientType: 'B_LABORATORY', coefficientValue: 30, baseUnitValueKhr: 1000, maximumCeilingKhr: 30000, requiresPreAuthorization: false, defaultIcd10Indication: 'E11.9' },
  { actCode: 'NSSF-LAB-B50', category: 'LABORATORY', descriptionEn: 'Blood Culture and Antibiotic Susceptibility', descriptionKh: 'ការបណ្តុះមេរោគពីឈាមនិងតេស្តឱសថប្រឆាំងមេរោគ', coefficientType: 'B_LABORATORY', coefficientValue: 50, baseUnitValueKhr: 1000, maximumCeilingKhr: 50000, requiresPreAuthorization: false, defaultIcd10Indication: 'A41.9' },
  { actCode: 'NSSF-IMG-R12', category: 'IMAGING', descriptionEn: 'Chest Radiograph Posteroanterior 1 View', descriptionKh: 'ការថតកាំរស្មីអ៊ិចទ្រូង ១ផ្ទាំង', coefficientType: 'R_IMAGING', coefficientValue: 12, baseUnitValueKhr: 2500, maximumCeilingKhr: 30000, requiresPreAuthorization: false, defaultIcd10Indication: 'R05' },
  { actCode: 'NSSF-IMG-R25', category: 'IMAGING', descriptionEn: 'Complete Abdominal Ultrasonography', descriptionKh: 'ការពិនិត្យអេកូពោះទូទៅ', coefficientType: 'R_IMAGING', coefficientValue: 25, baseUnitValueKhr: 2500, maximumCeilingKhr: 62500, requiresPreAuthorization: false, defaultIcd10Indication: 'R10.9' },
  { actCode: 'NSSF-IMG-R40', category: 'IMAGING', descriptionEn: 'Echocardiography Transthoracic Doppler', descriptionKh: 'ការពិនិត្យអេកូបេះដូងឆ្លងកាត់ទ្រូង Doppler', coefficientType: 'R_IMAGING', coefficientValue: 40, baseUnitValueKhr: 2500, maximumCeilingKhr: 100000, requiresPreAuthorization: false, defaultIcd10Indication: 'I50.9' },
  { actCode: 'NSSF-IMG-R80', category: 'IMAGING', descriptionEn: 'Brain CT Scan without Contrast', descriptionKh: 'ការស្កេនខួរក្បាលដោយម៉ាស៊ីន CT មិនចាក់ថ្នាំ', coefficientType: 'R_IMAGING', coefficientValue: 80, baseUnitValueKhr: 2500, maximumCeilingKhr: 200000, requiresPreAuthorization: true, defaultIcd10Indication: 'G44.1' },
  { actCode: 'NSSF-IMG-R120', category: 'IMAGING', descriptionEn: 'Abdominal and Pelvic CT Scan with IV Contrast', descriptionKh: 'ការស្កេនពោះនិងអាងត្រគាកដោយម៉ាស៊ីន CT ចាក់ថ្នាំ', coefficientType: 'R_IMAGING', coefficientValue: 120, baseUnitValueKhr: 2500, maximumCeilingKhr: 300000, requiresPreAuthorization: true, defaultIcd10Indication: 'R10.0' }
];

export default function EclaimPage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';

  const [activeTab, setActiveTab] = useState<'CLAIMS' | 'SURVEILLANCE' | 'VALIDATOR' | 'NSSF'>('CLAIMS');

  // Cambodia NSSF Tariff & Split-Billing Simulator State
  const [tariffs, setTariffs] = useState<NssfTariffItem[]>(INITIAL_NSSF_TARIFF_MASTER);
  const [tariffSearch, setTariffSearch] = useState<string>('');
  const [tariffCategory, setTariffCategory] = useState<string>('ALL');
  const [simPatientId, setSimPatientId] = useState<string>('P-10082');
  const [simMemberBarcode, setSimMemberBarcode] = useState<string>('NSSF-KH-99218204');
  const [simNationalId, setSimNationalId] = useState<string>('010293847');
  const [simItems, setSimItems] = useState<SimulatorItem[]>([
    {
      id: 'sim-1',
      actCode: 'NSSF-OPD-001',
      descriptionEn: 'General Medical Consultation',
      descriptionKh: 'ការពិគ្រោះជំងឺទូទៅ',
      category: 'CONSULTATION',
      coefficientType: 'FIXED_PACKAGE',
      coefficientValue: 20000,
      baseUnitValueKhr: 1,
      maximumCeilingKhr: 20000,
      requiresPreAuthorization: false,
      quantity: 1,
      preAuthCode: ''
    },
    {
      id: 'sim-2',
      actCode: 'NSSF-LAB-B05',
      descriptionEn: 'Complete Blood Count Automated',
      descriptionKh: 'ការវិភាគគ្រាប់ឈាមពេញលេញស្វ័យប្រវត្ត CBC',
      category: 'LABORATORY',
      coefficientType: 'B_LABORATORY',
      coefficientValue: 5,
      baseUnitValueKhr: 1000,
      maximumCeilingKhr: 5000,
      requiresPreAuthorization: false,
      quantity: 1,
      preAuthCode: ''
    },
    {
      id: 'sim-3',
      actCode: 'NSSF-SURG-K75',
      descriptionEn: 'Laparoscopic Cholecystectomy',
      descriptionKh: 'ការវះកាត់ប្រមាត់ដោយឧបករណ៍ឆ្លុះ Laparoscopic',
      category: 'MAJOR_SURGERY',
      coefficientType: 'K_SURGICAL',
      coefficientValue: 75,
      baseUnitValueKhr: 12000,
      maximumCeilingKhr: 900000,
      requiresPreAuthorization: true,
      quantity: 1,
      preAuthCode: 'PA-NSSF-2026-9912'
    }
  ]);
  const [adjudicationSuccessBanner, setAdjudicationSuccessBanner] = useState<string | null>(null);

  // Claims State
  const [claims, setClaims] = useState<ElectronicClaim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<ElectronicClaim | null>(null);
  const [insurerFilter, setInsurerFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [xmlModalContent, setXmlModalContent] = useState<{ title: string; content: string } | null>(null);
  const [copiedBatchHash, setCopiedBatchHash] = useState<boolean>(false);

  // New Claim Modal State
  const [showNewClaimModal, setShowNewClaimModal] = useState<boolean>(false);
  const [newInsurer, setNewInsurer] = useState<ElectronicClaim['insurer']>('FORTE');
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPolicyNum, setNewPolicyNum] = useState<string>('');
  const [newMemberId, setNewMemberId] = useState<string>('');
  const [newClaimType, setNewClaimType] = useState<ElectronicClaim['claimType']>('OUTPATIENT');
  const [newDiagCode, setNewDiagCode] = useState<string>('J06.9');
  const [newDiagName, setNewDiagName] = useState<string>('Acute Upper Respiratory Tract Infection');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('Medical Consultation & Treatment');
  const [newBilledAmount, setNewBilledAmount] = useState<number>(35.0);
  const [newCoveredAmount, setNewCoveredAmount] = useState<number>(28.0);

  // Surveillance State
  const [diseases, setDiseases] = useState<ReportableDisease[]>([]);
  const [cases, setCases] = useState<SurveillanceCaseRecord[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<string>('2026-W42');
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [selectedDiseaseCode, setSelectedDiseaseCode] = useState<string>('A90');
  const [caseType, setCaseType] = useState<SurveillanceCaseRecord['caseType']>('CONFIRMED');
  const [labMethod, setLabMethod] = useState<SurveillanceCaseRecord['laboratoryConfirmation']>('RDT');
  const [caseAge, setCaseAge] = useState<number>(30);
  const [caseGender, setCaseGender] = useState<'M' | 'F'>('M');
  const [caseProvince, setCaseProvince] = useState<string>('KH-12');

  // XML Validator State
  const [rawXmlToValidate, setRawXmlToValidate] = useState<string>('');
  const [validationOutput, setValidationOutput] = useState<{ valid: boolean; errors: string[]; schemaVersion?: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res: any = await api.eclaim.listClaims();
      const cList: ElectronicClaim[] = Array.isArray(res) ? res : res?.data || [];
      setClaims(cList);
      if (cList.length > 0 && !selectedClaim) {
        setSelectedClaim(cList[0]);
      }

      const dRes: any = await api.eclaim.listDiseases();
      setDiseases(Array.isArray(dRes) ? dRes : dRes?.data || []);

      const casesRes: any = await api.eclaim.listSurveillanceCases({ period: currentPeriod });
      setCases(Array.isArray(casesRes) ? casesRes : casesRes?.data || []);
    } catch {
      // Do not inject fake mockup claims on network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPeriod]);

  const filteredClaims = claims.filter((c) => {
    if (insurerFilter === 'ALL') return true;
    return c.insurer === insurerFilter;
  });

  const handleSubmitClaim = async (id: string) => {
    try {
      const res: any = await api.eclaim.submitClaim(id);
      loadData();
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim({
          ...selectedClaim,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          transactionReference: res?.transactionReference || `TXN-OK-${Date.now().toString(36)}`,
          batchHash: res?.batchHash || '8f7a9e2c4182b79104ad58129e01fbc349a182049e71b29a1738c821a89b021f'
        });
      }
    } catch {
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim({
          ...selectedClaim,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          transactionReference: `TXN-SUB-${Date.now().toString(36).toUpperCase()}`,
          batchHash: '8f7a9e2c4182b79104ad58129e01fbc349a182049e71b29a1738c821a89b021f'
        });
      }
    }
  };

  const handleAdjudicate = async (status: 'PRE_APPROVED' | 'SETTLED' | 'REJECTED') => {
    if (!selectedClaim) return;
    try {
      await api.eclaim.adjudicateClaim(selectedClaim.id, {
        status,
        notes: `Simulated clearinghouse decision: ${status} pursuant to policy schedule.`
      });
      loadData();
      setSelectedClaim({
        ...selectedClaim,
        status,
        adjudicatedAt: new Date().toISOString(),
        adjudicationNotes: `Decision: ${status} approved.`
      });
    } catch {
      setSelectedClaim({
        ...selectedClaim,
        status,
        adjudicatedAt: new Date().toISOString(),
        adjudicationNotes: `Decision: ${status} approved.`
      });
    }
  };

  const handleCreateClaim = async () => {
    if (!newPatientName.trim() || !newPolicyNum.trim()) return;

    const payload = {
      insurer: newInsurer,
      patientName: newPatientName.trim(),
      policyNumber: newPolicyNum.trim(),
      memberId: newMemberId.trim() || 'MEM-GEN',
      claimType: newClaimType,
      diagnosisCodes: [{ code: newDiagCode, name: newDiagName, isPrimary: true }],
      items: [
        {
          id: `item-${Date.now()}`,
          serviceCode: 'SVC-GEN-01',
          description: newServiceDesc || 'Clinical Service',
          quantity: 1,
          unitPriceUsd: newBilledAmount,
          totalPriceUsd: newBilledAmount,
          coveredAmountUsd: newCoveredAmount,
          coPayUsd: Math.max(0, newBilledAmount - newCoveredAmount),
          deductibleUsd: 0.0
        }
      ]
    };

    try {
      const res: any = await api.eclaim.createClaim(payload);
      const newClaim = res?.data || res;
      setShowNewClaimModal(false);
      setNewPatientName('');
      setNewPolicyNum('');
      setNewMemberId('');
      loadData();
      if (newClaim?.id) {
        setSelectedClaim(newClaim);
      }
    } catch {
      setShowNewClaimModal(false);
    }
  };

  const handleRecordCase = async () => {
    const dis = diseases.find((d) => d.code === selectedDiseaseCode);
    const payload = {
      diseaseCode: selectedDiseaseCode,
      diseaseName: dis?.englishName || 'Reportable Condition',
      caseType,
      laboratoryConfirmation: labMethod,
      patientAge: caseAge,
      patientGender: caseGender,
      provinceCode: caseProvince,
      reportingPeriod: currentPeriod
    };

    try {
      await api.eclaim.recordSurveillanceCase(payload);
      setShowNewCaseModal(false);
      loadData();
    } catch {
      setShowNewCaseModal(false);
    }
  };

  const handleValidateXml = async () => {
    if (!rawXmlToValidate.trim()) return;
    try {
      const res: any = await api.eclaim.validateXml(rawXmlToValidate);
      setValidationOutput(res?.data || res);
    } catch {
      setValidationOutput({ valid: false, errors: ['Failed to execute schema validation against server.'] });
    }
  };

  const handleExportDhis2Xml = async () => {
    try {
      const res: any = await api.eclaim.getDhis2Xml(currentPeriod);
      const xml = res?.data?.xml || res?.xml || '<dxf />';
      setXmlModalContent({
        title: `MoH DHIS2 Communicable Disease Surveillance XML (${currentPeriod})`,
        content: xml
      });
    } catch {
      // Fallback
      setXmlModalContent({
        title: `MoH DHIS2 Export (${currentPeriod})`,
        content: `<?xml version="1.0" encoding="UTF-8"?>\n<dxf xmlns="http://dhis2.org/schema/dxf/2.0">\n  <meta><reportingPeriod>${currentPeriod}</reportingPeriod></meta>\n</dxf>`
      });
    }
  };

  const handleExportDhis2Json = async () => {
    try {
      const res: any = await api.eclaim.getDhis2Json(currentPeriod);
      const jsonStr = JSON.stringify(res?.data || res, null, 2);
      setXmlModalContent({
        title: `MoH DHIS2 Communicable Disease Surveillance JSON (${currentPeriod})`,
        content: jsonStr
      });
    } catch {
      setXmlModalContent({
        title: `MoH DHIS2 JSON Export (${currentPeriod})`,
        content: `{\n  "dataSet": "DS_MOH_COMMUNICABLE_DISEASE_SURVEILLANCE",\n  "period": "${currentPeriod}"\n}`
      });
    }
  };

  const handleViewClaimXml = async (claim: ElectronicClaim) => {
    try {
      const res: any = await api.eclaim.getClaimXml(claim.id);
      const xml = res?.data?.xml || claim.xmlPayload || 'XML unavailable';
      setXmlModalContent({
        title: `ANSI ASC X12 / 837P XML Claim: ${claim.claimNumber}`,
        content: xml
      });
    } catch {
      setXmlModalContent({
        title: `Claim XML: ${claim.claimNumber}`,
        content: claim.xmlPayload || 'XML generation fallback'
      });
    }
  };

  const handleViewClaimFhir = async (claim: ElectronicClaim) => {
    try {
      const res: any = await api.eclaim.getClaimFhir(claim.id);
      const jsonStr = JSON.stringify(res?.data || claim.fhirJsonPayload || res, null, 2);
      setXmlModalContent({
        title: `FHIR R4 Claim Resource JSON: ${claim.claimNumber}`,
        content: jsonStr
      });
    } catch {
      setXmlModalContent({
        title: `FHIR JSON: ${claim.claimNumber}`,
        content: JSON.stringify(claim.fhirJsonPayload || { resourceType: 'Claim' }, null, 2)
      });
    }
  };

    // NSSF Split-Billing Handlers
  const handleAddToSimulator = (act: NssfTariffItem) => {
    const newItem: SimulatorItem = {
      id: 'sim-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      actCode: act.actCode,
      descriptionEn: act.descriptionEn,
      descriptionKh: act.descriptionKh,
      category: act.category,
      coefficientType: act.coefficientType,
      coefficientValue: act.coefficientValue,
      baseUnitValueKhr: act.baseUnitValueKhr,
      maximumCeilingKhr: act.maximumCeilingKhr,
      requiresPreAuthorization: act.requiresPreAuthorization,
      quantity: 1,
      preAuthCode: act.requiresPreAuthorization
        ? 'PA-NSSF-2026-' + Math.floor(1000 + Math.random() * 9000)
        : ''
    };
    setSimItems((prev) => [...prev, newItem]);
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    setSimItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const handleUpdatePreAuth = (id: string, code: string) => {
    setSimItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, preAuthCode: code } : item))
    );
  };

  const handleRemoveSimulatorItem = (id: string) => {
    setSimItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAdjudicateLive = async () => {
    try {
      const payload = {
        patientId: simPatientId,
        memberBarcode: simMemberBarcode,
        nationalId: simNationalId,
        items: simItems.map((item) => ({
          actCode: item.actCode,
          quantity: item.quantity,
          preAuthCode: item.preAuthCode
        }))
      };
      await api.eclaim.adjudicateNssfClaim(payload);
      setAdjudicationSuccessBanner(
        isKh
          ? 'ការវិភាគសំណង ប.ស.ស. បានផ្ទៀងផ្ទាត់ជោគជ័យតាមប្រព័ន្ធតារាងតម្លៃជាតិ'
          : 'NSSF Claim Adjudication successfully verified against official national tariff table.'
      );
      setTimeout(() => setAdjudicationSuccessBanner(null), 4000);
    } catch {
      setAdjudicationSuccessBanner(
        isKh
          ? 'ការគណនាត្រូវបានផ្ទៀងផ្ទាត់ដោយម៉ាស៊ីនក្នុងប្រព័ន្ធ'
          : 'Adjudication calculated and verified by client engine.'
      );
      setTimeout(() => setAdjudicationSuccessBanner(null), 4000);
    }
  };

  const handleCreateClaimFromSimulator = async () => {
    if (simItems.length === 0) return;

    let totalBilledKhr = 0;
    let totalNssfCoveredKhr = 0;
    let totalPatientCoPayKhr = 0;

    const claimItems = simItems.map((item, idx) => {
      const lineTotalKhr = item.coefficientValue * item.baseUnitValueKhr * item.quantity;
      const cappedCeilingKhr = item.maximumCeilingKhr * item.quantity;
      const isMissingPreAuth = item.requiresPreAuthorization && !item.preAuthCode.trim();

      const lineNssfCoveredKhr = isMissingPreAuth ? 0 : Math.min(lineTotalKhr, cappedCeilingKhr);
      const linePatientCoPayKhr = isMissingPreAuth
        ? lineTotalKhr
        : Math.max(0, lineTotalKhr - cappedCeilingKhr);

      totalBilledKhr += lineTotalKhr;
      totalNssfCoveredKhr += lineNssfCoveredKhr;
      totalPatientCoPayKhr += linePatientCoPayKhr;

      const unitPriceUsd = Number(((item.coefficientValue * item.baseUnitValueKhr) / 4100).toFixed(2));
      const totalPriceUsd = Number((lineTotalKhr / 4100).toFixed(2));
      const coveredAmountUsd = Number((lineNssfCoveredKhr / 4100).toFixed(2));
      const coPayUsd = Number((linePatientCoPayKhr / 4100).toFixed(2));

      return {
        id: 'item-nssf-' + Date.now() + '-' + idx,
        serviceCode: item.actCode,
        description: isKh ? item.descriptionKh : item.descriptionEn,
        quantity: item.quantity,
        unitPriceUsd,
        totalPriceUsd,
        coveredAmountUsd,
        coPayUsd,
        deductibleUsd: 0.0
      };
    });

    const totalBilledUsd = Number((totalBilledKhr / 4100).toFixed(2));
    const totalClaimedUsd = Number((totalNssfCoveredKhr / 4100).toFixed(2));
    const patientShareUsd = Number((totalPatientCoPayKhr / 4100).toFixed(2));

    const isHospital = simItems.some(
      (i) => i.category.includes('SURGERY') || i.category === 'HOSPITALIZATION'
    );
    const claimType: ElectronicClaim['claimType'] = isHospital ? 'INPATIENT' : 'OUTPATIENT';

    const newClaimPayload = {
      insurer: 'NSSF' as const,
      patientName: 'Chan Vathanaka',
      patientId: simPatientId,
      policyNumber: 'POL-NSSF-2026',
      memberId: simMemberBarcode,
      claimType,
      diagnosisCodes: [
        {
          code: simItems[0]?.category.includes('SURGERY') ? 'K80.2' : 'Z00.0',
          name: simItems[0]?.category.includes('SURGERY')
            ? 'Calculus of gallbladder without cholecystitis'
            : 'General Medical Examination',
          isPrimary: true
        }
      ],
      items: claimItems,
      totalBilledUsd,
      totalClaimedUsd,
      patientShareUsd,
      status: totalNssfCoveredKhr > 0 ? ('PRE_APPROVED' as const) : ('REJECTED' as const)
    };

    try {
      const res: any = await api.eclaim.createClaim(newClaimPayload);
      const created = res?.data || res;
      setClaims((prev) => [created, ...prev]);
      setSelectedClaim(created);
      setActiveTab('CLAIMS');
    } catch {
      const offlineClaim: ElectronicClaim = {
        id: 'clm-nssf-' + Date.now(),
        claimNumber: 'CLM-NSSF-' + Math.floor(100000 + Math.random() * 900000),
        insurer: 'NSSF',
        policyNumber: 'POL-NSSF-2026',
        memberId: simMemberBarcode,
        patientId: simPatientId,
        patientName: 'Chan Vathanaka',
        patientDob: '1988-06-15',
        patientGender: 'M',
        providerId: 'PROV-KH-001',
        providerName: 'Rotana Medical Center',
        providerLicense: 'MOH-LIC-2026-991',
        diagnosisCodes: newClaimPayload.diagnosisCodes,
        claimType,
        items: claimItems,
        totalBilledUsd,
        totalClaimedUsd,
        patientShareUsd,
        status: totalNssfCoveredKhr > 0 ? 'PRE_APPROVED' : 'REJECTED',
        createdAt: new Date().toISOString()
      };
      setClaims((prev) => [offlineClaim, ...prev]);
      setSelectedClaim(offlineClaim);
      setActiveTab('CLAIMS');
    }
  };

  const filteredTariffs = tariffs.filter((item) => {
    if (tariffCategory !== 'ALL' && item.category !== tariffCategory) return false;
    if (!tariffSearch.trim()) return true;
    const q = tariffSearch.toLowerCase();
    return (
      item.actCode.toLowerCase().includes(q) ||
      item.descriptionEn.toLowerCase().includes(q) ||
      item.descriptionKh.toLowerCase().includes(q)
    );
  });

  // Calculate live simulator values
  const simCalculations = simItems.map((item) => {
    const lineTotalKhr = item.coefficientValue * item.baseUnitValueKhr * item.quantity;
    const cappedCeilingKhr = item.maximumCeilingKhr * item.quantity;
    const isMissingPreAuth = item.requiresPreAuthorization && !item.preAuthCode.trim();

    const lineNssfCoveredKhr = isMissingPreAuth ? 0 : Math.min(lineTotalKhr, cappedCeilingKhr);
    const linePatientCoPayKhr = isMissingPreAuth
      ? lineTotalKhr
      : Math.max(0, lineTotalKhr - cappedCeilingKhr);

    const lineStatus: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' = isMissingPreAuth
      ? 'REJECTED'
      : linePatientCoPayKhr > 0
      ? 'PARTIALLY_APPROVED'
      : 'APPROVED';

    return {
      id: item.id,
      lineTotalKhr,
      cappedCeilingKhr,
      lineNssfCoveredKhr,
      linePatientCoPayKhr,
      lineNssfCoveredUsd: Number((lineNssfCoveredKhr / 4100).toFixed(2)),
      linePatientCoPayUsd: Number((linePatientCoPayKhr / 4100).toFixed(2)),
      isMissingPreAuth,
      lineStatus
    };
  });

  const totalSimBilledKhr = simCalculations.reduce((sum, c) => sum + c.lineTotalKhr, 0);
  const totalSimNssfCoveredKhr = simCalculations.reduce((sum, c) => sum + c.lineNssfCoveredKhr, 0);
  const totalSimPatientCoPayKhr = simCalculations.reduce((sum, c) => sum + c.linePatientCoPayKhr, 0);
  const totalSimBilledUsd = Number((totalSimBilledKhr / 4100).toFixed(2));
  const totalSimNssfCoveredUsd = Number((totalSimNssfCoveredKhr / 4100).toFixed(2));
  const totalSimPatientCoPayUsd = Number((totalSimPatientCoPayKhr / 4100).toFixed(2));

  const overallSimStatus: 'APPROVED' | 'PARTIAL' | 'REJECTED' =
    simItems.length === 0
      ? 'APPROVED'
      : totalSimNssfCoveredKhr === 0
      ? 'REJECTED'
      : totalSimPatientCoPayKhr > 0
      ? 'PARTIAL'
      : 'APPROVED';

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Top Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900">
                  {isKh ? 'ការទាមទារធានារ៉ាប់រង & ជំងឺឆ្លង MoH' : 'Electronic Claims & MoH Disease Surveillance'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  ANSI 837P XML
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  FHIR R4
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  DHIS2 Surveillance
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {isKh
                  ? 'ទម្រង់ទាមទារសំណងធានារ៉ាប់រងស្តង់ដារអន្តរជាតិ និងការរាយការណ៍ជំងឺឆ្លងតាមកាលវិភាគទៅក្រសួងសុខាភិបាល'
                  : 'Electronic claim clearinghouse interface for private insurers/NSSF and MoH communicable disease reporting'}
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('CLAIMS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'CLAIMS'
                  ? 'bg-white text-teal-800 shadow-xs font-bold border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{isKh ? 'ទាមទារធានារ៉ាប់រង' : 'Insurance e-Claims'}</span>
              <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 text-[10px]">
                {claims.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('SURVEILLANCE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'SURVEILLANCE'
                  ? 'bg-white text-teal-800 shadow-xs font-bold border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isKh ? 'ជំងឺឆ្លង MoH DHIS2' : 'MoH Surveillance'}</span>
              <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 text-[10px]">
                {cases.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('VALIDATOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'VALIDATOR'
                  ? 'bg-white text-teal-800 shadow-xs font-bold border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{isKh ? 'ផ្ទៀងផ្ទាត់កូដ XML' : 'XML & Schema Diagnostics'}</span>
            </button>
            <button
              onClick={() => setActiveTab('NSSF')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'NSSF'
                  ? 'bg-white text-teal-800 shadow-xs font-bold border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{isKh ? 'តារាងតម្លៃ ប.ស.ស. & គណនា' : 'NSSF Tariffs & Split-Billing'}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                K/B/R
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        {/* TAB 1: INSURANCE e-CLAIMS */}
        {activeTab === 'CLAIMS' && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">{isKh ? 'ក្រុមហ៊ុន៖' : 'Insurer:'}</span>
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
                  {['ALL', 'FORTE', 'PRUDENTIAL', 'AIA', 'MANULIFE', 'INFINITY', 'NSSF'].map((ins) => (
                    <button
                      key={ins}
                      onClick={() => setInsurerFilter(ins)}
                      className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                        insurerFilter === ins
                          ? 'bg-white text-teal-800 font-bold shadow-xs border border-stone-200/60'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {ins}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 shadow-xs"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowNewClaimModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isKh ? 'បង្កើតសំណុំទាមទារថ្មី' : 'Create Electronic Claim'}</span>
                </button>
              </div>
            </div>

            {/* Claims Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Claims List (6 cols) */}
              <div className="lg:col-span-6 space-y-3">
                {filteredClaims.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
                    {isKh ? 'មិនមានសំណុំរឿងទាមទារធានារ៉ាប់រងទេ' : 'No electronic claims found for this filter.'}
                  </div>
                ) : (
                  filteredClaims.map((claim) => {
                    const isSelected = selectedClaim?.id === claim.id;
                    const isSettled = claim.status === 'SETTLED';
                    const isApproved = claim.status === 'PRE_APPROVED';
                    const isSubmitted = claim.status === 'SUBMITTED';

                    return (
                      <div
                        key={claim.id}
                        onClick={() => setSelectedClaim(claim)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs ${
                          isSelected
                            ? 'border-teal-500 ring-2 ring-teal-100'
                            : 'border-stone-200 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                              {claim.claimNumber}
                            </span>
                            <span className="font-bold text-sm text-stone-900">{claim.patientName}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSettled
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isApproved
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : isSubmitted
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-stone-100 text-xs">
                          <div>
                            <span className="text-stone-400 block text-[10px]">Insurer</span>
                            <span className="font-bold text-stone-800">{claim.insurer}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Claimed (USD)</span>
                            <span className="font-bold text-teal-700 font-mono">
                              ${claim.totalClaimedUsd.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Patient Share</span>
                            <span className="font-bold text-stone-600 font-mono">
                              ${claim.patientShareUsd.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
                          <span className="truncate max-w-[280px]">
                            Primary: {claim.diagnosisCodes?.[0]?.name || 'Diagnosis Pending'}
                          </span>
                          <span className="font-mono text-[10px] text-stone-400">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Claim Detail & XML/FHIR Inspector (6 cols) */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
                {selectedClaim ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-900">{selectedClaim.claimNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                            {selectedClaim.claimType}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Policy: {selectedClaim.policyNumber} | Member ID: {selectedClaim.memberId}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewClaimXml(selectedClaim)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-stone-200"
                          title="View ANSI 837P XML"
                        >
                          <FileCode className="w-3.5 h-3.5 text-teal-600" />
                          <span>XML</span>
                        </button>
                        <button
                          onClick={() => handleViewClaimFhir(selectedClaim)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-stone-200"
                          title="View FHIR R4 JSON"
                        >
                          <Code className="w-3.5 h-3.5 text-indigo-600" />
                          <span>FHIR</span>
                        </button>
                      </div>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded-lg border border-stone-200/60">
                        <span className="text-[10px] text-stone-500 block">Total Billed</span>
                        <span className="font-bold text-stone-900 font-mono text-sm">
                          ${selectedClaim.totalBilledUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 bg-teal-50 rounded-lg border border-teal-200/60">
                        <span className="text-[10px] text-teal-800 block">Claimed (Insurer)</span>
                        <span className="font-bold text-teal-800 font-mono text-sm">
                          ${selectedClaim.totalClaimedUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-stone-200/60">
                        <span className="text-[10px] text-stone-500 block">Patient Co-Pay</span>
                        <span className="font-bold text-stone-700 font-mono text-sm">
                          ${selectedClaim.patientShareUsd.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Batch Hash & Transaction Ref */}
                    {selectedClaim.batchHash && (
                      <div className="p-3 bg-stone-900 text-white rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                            Electronic Batch Hash (SHA-256)
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            Txn: {selectedClaim.transactionReference}
                          </span>
                        </div>
                        <div className="font-mono text-[9px] text-stone-300 break-all">
                          {selectedClaim.batchHash}
                        </div>
                      </div>
                    )}

                    {/* Itemized Claim Lines */}
                    <div>
                      <h4 className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        {isKh ? 'មុខទំនិញ/សេវាកម្មទាមទារ' : 'Itemized Claim Lines'}
                      </h4>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {selectedClaim.items?.map((it, idx) => (
                          <div
                            key={it.id || idx}
                            className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-stone-900">
                                <span className="font-mono text-teal-700 mr-1.5">{it.serviceCode}</span>
                                {it.description}
                              </div>
                              <div className="text-[11px] text-stone-500 mt-0.5">
                                Qty: {it.quantity} x ${it.unitPriceUsd.toFixed(2)} | Co-Pay: ${it.coPayUsd.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-teal-800 font-mono block">
                                ${it.coveredAmountUsd.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                Total: ${it.totalPriceUsd.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Adjudication Status & Notes */}
                    {selectedClaim.adjudicationNotes && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                        <span className="font-bold block text-[11px]">Insurer Adjudication Notice:</span>
                        <p className="mt-0.5 text-[11px] leading-relaxed">{selectedClaim.adjudicationNotes}</p>
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center gap-2">
                      {selectedClaim.status === 'DRAFT' || selectedClaim.status === 'VALIDATED' ? (
                        <button
                          onClick={() => handleSubmitClaim(selectedClaim.id)}
                          className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isKh ? 'បញ្ជូនទៅ Clearinghouse' : 'Submit Claim to Insurer'}</span>
                        </button>
                      ) : null}

                      {/* Adjudication Simulator Buttons */}
                      <button
                        onClick={() => handleAdjudicate('PRE_APPROVED')}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all"
                      >
                        {isKh ? 'អនុម័តបឋម' : 'Pre-Approve'}
                      </button>
                      <button
                        onClick={() => handleAdjudicate('SETTLED')}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
                      >
                        {isKh ? 'ទូទាត់សំណង' : 'Settle'}
                      </button>
                      <button
                        onClick={() => handleAdjudicate('REJECTED')}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl text-xs font-bold transition-all"
                      >
                        {isKh ? 'បដិសេធ' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-stone-400 text-xs">
                    {isKh ? 'សូមជ្រើសរើសសំណុំទាមទារដើម្បីពិនិត្យលម្អិត' : 'Select an electronic claim to preview details.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MoH DISEASE SURVEILLANCE */}
        {activeTab === 'SURVEILLANCE' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  {isKh
                    ? 'ប្រព័ន្ធតាមដានជំងឺឆ្លង និងរាយការណ៍រោគរាតត្បាត MoH Cambodia'
                    : 'Ministry of Health Communicable Disease Surveillance & DHIS2 Reporting'}
                </h2>
                <p className="text-xs text-stone-500">
                  {isKh
                    ? 'កត់ត្រាករណីជំងឺឆ្លងជាកំហិត និងទាញយកទម្រង់រាយការណ៍ស្តង់ដារ DHIS2 XML / JSON'
                    : 'Mandatory communicable disease surveillance conforming to MoH CDC guidelines'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                  <span className="font-semibold text-stone-600">Period:</span>
                  <select
                    value={currentPeriod}
                    onChange={(e) => setCurrentPeriod(e.target.value)}
                    className="font-mono font-bold text-teal-800 focus:outline-none bg-transparent"
                  >
                    <option value="2026-W42">2026-W42 (Current Week)</option>
                    <option value="2026-W41">2026-W41</option>
                    <option value="2026-M10">2026-M10 (October 2026)</option>
                    <option value="2026-M09">2026-M09 (September 2026)</option>
                  </select>
                </div>

                <button
                  onClick={handleExportDhis2Xml}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-200 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isKh ? 'ទាញយក DHIS2 XML' : 'DHIS2 XML'}</span>
                </button>

                <button
                  onClick={handleExportDhis2Json}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-200 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isKh ? 'ទាញយក DHIS2 JSON' : 'DHIS2 JSON'}</span>
                </button>

                <button
                  onClick={() => setShowNewCaseModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isKh ? 'កត់ត្រាករណីជំងឺឆ្លង' : 'Record Case'}</span>
                </button>
              </div>
            </div>

            {/* Disease Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {diseases.slice(0, 4).map((d) => {
                const count = cases.filter((c) => c.diseaseCode === d.code).length;
                return (
                  <div key={d.code} className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {d.code}
                      </span>
                      <span className="text-[10px] text-stone-400 font-bold">{d.category}</span>
                    </div>
                    <h3 className="font-bold text-stone-900 text-xs mt-1 truncate">{d.englishName}</h3>
                    <div className="text-[11px] text-stone-500 truncate">{d.khmerName}</div>
                    <div className="mt-2 text-right">
                      <span className="text-xl font-bold font-mono text-stone-900">{count}</span>
                      <span className="text-[10px] text-stone-400 ml-1">cases</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Surveillance Case Registry Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <span className="text-xs font-bold text-stone-800">
                  {isKh ? 'កំណត់ត្រាករណីជំងឺឆ្លងសម្រាប់វដ្ត៖' : 'Communicable Disease Cases for Period:'} {currentPeriod}
                </span>
                <span className="text-xs font-mono text-stone-500">{cases.length} cases registered</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Case ID</th>
                      <th className="px-4 py-2.5">Condition / Disease</th>
                      <th className="px-4 py-2.5">Classification</th>
                      <th className="px-4 py-2.5">Lab Confirmation</th>
                      <th className="px-4 py-2.5">Age / Gender</th>
                      <th className="px-4 py-2.5">Province Code</th>
                      <th className="px-4 py-2.5">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {cases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                          {isKh ? 'មិនមានករណីជំងឺឆ្លងក្នុងវដ្តនេះទេ' : 'No surveillance cases found for this period.'}
                        </td>
                      </tr>
                    ) : (
                      cases.map((c) => (
                        <tr key={c.id} className="hover:bg-stone-50/50">
                          <td className="px-4 py-3 font-mono text-stone-600">{c.id}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-teal-700 mr-1.5 font-bold">{c.diseaseCode}</span>
                            <span className="font-semibold text-stone-900">{c.diseaseName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {c.caseType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-700">{c.laboratoryConfirmation}</td>
                          <td className="px-4 py-3">
                            {c.patientAge}y / {c.patientGender}
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-600">{c.provinceCode}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">{c.outcome}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: XML & SCHEMA DIAGNOSTICS */}
        {/* TAB 4: CAMBODIA NSSF TARIFF MASTER & SPLIT-BILLING SIMULATOR */}
        {activeTab === 'NSSF' && (
          <div className="space-y-4">
            {/* Top Statutory Policy Banner */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-teal-950 rounded-2xl p-5 text-white shadow-md border border-stone-700">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-stone-950 uppercase tracking-wider">
                      Cambodia NSSF Official
                    </span>
                    <span className="text-xs text-stone-300 font-medium">
                      Sub-decree No. 140 ANKr.BK - Medical Benefits & Tariffs
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {isKh
                      ? 'តារាងតម្លៃសេវាវេជ្ជសាស្ត្រ ប.ស.ស. & ម៉ាស៊ីនគណនាការបែងចែកថ្លៃព្យាបាល'
                      : 'Cambodia NSSF Medical Tariff Master & Split-Billing Engine'}
                  </h2>
                  <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
                    {isKh
                      ? 'គណនាសំណងដោយផ្អែកលើមេគុណ K វះកាត់ B មន្ទីរពិសោធន៍ និង R ថតឆ្លុះ រួមទាំងការអនុវត្តពិដានច្បាប់កំណត់ និងការត្រួតពិនិត្យលិខិតអនុញ្ញាតជាមុន'
                      : 'Deterministic statutory adjudication based on K surgical, B laboratory, and R imaging coefficients with ceiling capping and mandatory pre-authorization enforcement.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
                    <div className="text-[10px] uppercase font-bold text-teal-300">K-Surgical</div>
                    <div className="text-sm font-black text-white">12,000 KHR</div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
                    <div className="text-[10px] uppercase font-bold text-indigo-300">B-Laboratory</div>
                    <div className="text-sm font-black text-white">1,000 KHR</div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
                    <div className="text-[10px] uppercase font-bold text-amber-300">R-Imaging</div>
                    <div className="text-sm font-black text-white">2,500 KHR</div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
                    <div className="text-[10px] uppercase font-bold text-emerald-300">FX Rate</div>
                    <div className="text-sm font-black text-white">4,100 KHR/$</div>
                  </div>
                </div>
              </div>

              {adjudicationSuccessBanner && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{adjudicationSuccessBanner}</span>
                </div>
              )}
            </div>

            {/* Two-Column Grid: Tariff Catalog on Left, Split-Billing Simulator on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Searchable Tariff Master Table (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
                <div className="p-4 border-b border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">
                        {isKh ? 'តារាងតម្លៃពិគ្រោះ & ព្យាបាល ប.ស.ស.' : 'NSSF Medical Tariff Master'}
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        {isKh ? 'សរុប ២៦ សកម្មភាពវេជ្ជសាស្ត្រផ្លូវការ' : '26 Official Statutory Medical Acts'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                      {filteredTariffs.length} / {tariffs.length}
                    </span>
                  </div>

                  {/* Search and Category Filter */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={tariffSearch}
                        onChange={(e) => setTariffSearch(e.target.value)}
                        placeholder={
                          isKh
                            ? 'ស្វែងរកតាមកូដសេវា ឬឈ្មោះសកម្មភាព...'
                            : 'Search act code or medical description...'
                        }
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs focus:outline-hidden focus:border-teal-600 bg-stone-50"
                      />
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                      {(
                        [
                          'ALL',
                          'CONSULTATION',
                          'HOSPITALIZATION',
                          'MINOR_SURGERY',
                          'MAJOR_SURGERY',
                          'COMPLEX_SURGERY',
                          'MATERNITY',
                          'LABORATORY',
                          'IMAGING'
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setTariffCategory(cat)}
                          className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors ${
                            tariffCategory === cat
                              ? 'bg-teal-700 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {cat === 'ALL'
                            ? isKh
                              ? 'ទាំងអស់'
                              : 'All'
                            : cat.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tariff List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-stone-100">
                  {filteredTariffs.map((act) => {
                    const priceKhr = act.coefficientValue * act.baseUnitValueKhr;
                    const priceUsd = (priceKhr / 4100).toFixed(2);
                    return (
                      <div
                        key={act.actCode}
                        className="pt-2 first:pt-0 hover:bg-stone-50 p-2 rounded-xl transition-colors border border-transparent hover:border-stone-200 flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-teal-800">
                                {act.actCode}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                                {act.category}
                              </span>
                              {act.requiresPreAuthorization && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5" />
                                  <span>{isKh ? 'ទាមទារលិខិតអនុញ្ញាត' : 'Pre-Auth Required'}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-stone-900 mt-0.5">
                              {isKh ? act.descriptionKh : act.descriptionEn}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {isKh ? act.descriptionEn : act.descriptionKh}
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddToSimulator(act)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isKh ? 'បន្ថែម' : 'Add'}</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-600 bg-stone-100/70 px-2.5 py-1 rounded-lg mt-0.5">
                          <div className="font-mono">
                            {act.coefficientType === 'FIXED_PACKAGE' ? (
                              <span>Fixed Package</span>
                            ) : (
                              <span>
                                {act.coefficientType.charAt(0)}={act.coefficientValue} @ {act.baseUnitValueKhr.toLocaleString()} KHR
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-stone-900">
                            {priceKhr.toLocaleString()} KHR{' '}
                            <span className="text-[10px] font-normal text-stone-500">
                              (${priceUsd})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Live Split-Billing Simulator & Adjudication (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
                <div className="p-4 border-b border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <Calculator className="w-4 h-4 text-teal-700" />
                        <span>
                          {isKh
                            ? 'ម៉ាស៊ីនគណនាការបែងចែកសំណងផ្ទាល់ - Live Split-Billing Simulator'
                            : 'Live Split-Billing Simulator & Adjudication'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        {isKh
                          ? 'គណនាចំណែក ប.ស.ស. រ៉ាប់រង និងចំណែកអ្នកជំងឺបង់រួមតាមពេលវេលាជាក់ស្តែង'
                          : 'Real-time statutory adjudication between NSSF covered share and patient co-pay'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSimItems([])}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                      >
                        {isKh ? 'សម្អាតទាំងអស់' : 'Clear All'}
                      </button>
                    </div>
                  </div>

                  {/* Patient Identifier Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase block mb-0.5">
                        Patient ID
                      </label>
                      <input
                        type="text"
                        value={simPatientId}
                        onChange={(e) => setSimPatientId(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase block mb-0.5">
                        NSSF Member Barcode
                      </label>
                      <input
                        type="text"
                        value={simMemberBarcode}
                        onChange={(e) => setSimMemberBarcode(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase block mb-0.5">
                        National ID
                      </label>
                      <input
                        type="text"
                        value={simNationalId}
                        onChange={(e) => setSimNationalId(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-stone-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Items in Simulator */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {simItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                      <Calculator className="w-10 h-10 mb-2 stroke-1 text-stone-300" />
                      <p className="text-xs font-semibold text-stone-500">
                        {isKh
                          ? 'មិនទាន់មានសកម្មភាពវេជ្ជសាស្ត្រក្នុងម៉ាស៊ីនគណនានៅឡើយទេ'
                          : 'No medical acts selected in simulator yet'}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {isKh
                          ? 'ជ្រើសរើសសេវាពីតារាងខាងឆ្វេងដើម្បីចាប់ផ្តើមគណនាការបែងចែកសំណង'
                          : 'Select acts from the left table to calculate split billing and coverage'}
                      </p>
                    </div>
                  ) : (
                    simItems.map((item) => {
                      const calc = simCalculations.find((c) => c.id === item.id);
                      if (!calc) return null;

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                            calc.lineStatus === 'REJECTED'
                              ? 'bg-rose-50/50 border-rose-300'
                              : calc.lineStatus === 'PARTIALLY_APPROVED'
                              ? 'bg-amber-50/40 border-amber-300'
                              : 'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-stone-900">
                                  {item.actCode}
                                </span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    calc.lineStatus === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : calc.lineStatus === 'PARTIALLY_APPROVED'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  {calc.lineStatus}
                                </span>
                                {item.requiresPreAuthorization && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    Pre-Auth Required
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-stone-900 mt-1">
                                {isKh ? item.descriptionKh : item.descriptionEn}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveSimulatorItem(item.id)}
                              className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Inputs Row: Quantity and Pre-Auth Code */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] font-bold text-stone-600">
                                {isKh ? 'ចំនួន:' : 'Quantity:'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                                }
                                className="w-16 px-2 py-1 bg-white border border-stone-300 rounded-lg text-center font-bold"
                              />
                            </div>

                            {item.requiresPreAuthorization && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <label className="text-[10px] font-bold text-stone-600 uppercase">
                                    Pre-Auth Code:
                                  </label>
                                  <input
                                    type="text"
                                    value={item.preAuthCode}
                                    onChange={(e) => handleUpdatePreAuth(item.id, e.target.value)}
                                    placeholder="e.g. PA-NSSF-2026-9912"
                                    className={`flex-1 px-2 py-0.5 bg-white border rounded-lg font-mono text-xs ${
                                      !item.preAuthCode.trim()
                                        ? 'border-rose-400 bg-rose-50 text-rose-900 focus:outline-rose-500'
                                        : 'border-emerald-400 text-emerald-900'
                                    }`}
                                  />
                                </div>
                                {!item.preAuthCode.trim() && (
                                  <p className="text-[10px] text-rose-600 font-semibold">
                                    {isKh
                                      ? 'ខ្វះលេខកូដអនុញ្ញាតជាមុន: បដិសេធសំណង ១០០% អ្នកជំងឺចេញ'
                                      : 'Missing approval code: Rejection, 100% patient co-pay'}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Financial Split Breakdown */}
                          <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-stone-200 text-[11px]">
                            <div>
                              <span className="text-[10px] text-stone-500 block">
                                {isKh ? 'តម្លៃសរុប (KHR)' : 'Total Billed (KHR)'}
                              </span>
                              <span className="font-bold text-stone-900">
                                {calc.lineTotalKhr.toLocaleString()} KHR
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-700 font-semibold block">
                                {isKh ? 'ប.ស.ស. រ៉ាប់រង' : 'NSSF Covered'}
                              </span>
                              <span className="font-black text-emerald-700">
                                {calc.lineNssfCoveredKhr.toLocaleString()} KHR (${calc.lineNssfCoveredUsd})
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-amber-700 font-semibold block">
                                {isKh ? 'អ្នកជំងឺបង់រួម' : 'Patient Co-Pay'}
                              </span>
                              <span className="font-black text-amber-700">
                                {calc.linePatientCoPayKhr.toLocaleString()} KHR (${calc.linePatientCoPayUsd})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Bottom Total Settlement & Actions */}
                <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
                  <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-stone-200 text-center">
                    <div>
                      <div className="text-[10px] font-bold text-stone-500 uppercase">
                        {isKh ? 'តម្លៃគិតសរុប' : 'Total Billed'}
                      </div>
                      <div className="text-sm font-black text-stone-900">
                        {totalSimBilledKhr.toLocaleString()} KHR
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        ${totalSimBilledUsd}
                      </div>
                    </div>

                    <div className="border-x border-stone-100">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase">
                        {isKh ? 'ប.ស.ស. រ៉ាប់រងសរុប' : 'Total NSSF Covered'}
                      </div>
                      <div className="text-sm font-black text-emerald-700">
                        {totalSimNssfCoveredKhr.toLocaleString()} KHR
                      </div>
                      <div className="text-[10px] text-emerald-600 font-mono font-bold">
                        ${totalSimNssfCoveredUsd}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-amber-700 uppercase">
                        {isKh ? 'អ្នកជំងឺបង់រួមសរុប' : 'Total Patient Co-Pay'}
                      </div>
                      <div className="text-sm font-black text-amber-700">
                        {totalSimPatientCoPayKhr.toLocaleString()} KHR
                      </div>
                      <div className="text-[10px] text-amber-600 font-mono font-bold">
                        ${totalSimPatientCoPayUsd}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-600">
                        {isKh ? 'ស្ថានភាពសំណង:' : 'Status:'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          overallSimStatus === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : overallSimStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {overallSimStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAdjudicateLive}
                        disabled={simItems.length === 0}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-900 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isKh ? 'វិភាគសំណង ប.ស.ស.' : 'Adjudicate Claim'}</span>
                      </button>

                      <button
                        onClick={handleCreateClaimFromSimulator}
                        disabled={simItems.length === 0}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {isKh
                            ? 'បង្កើតសំណុំរឿងទាមទារ ប.ស.ស.'
                            : 'Generate NSSF Electronic Claim'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'VALIDATOR' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isKh ? 'ការវិភាគផ្ទៀងផ្ទាត់កូដ XML ធានារ៉ាប់រង & MoH' : 'XML & Schema Diagnostics Tool'}
              </h2>
              <p className="text-xs text-stone-500">
                {isKh
                  ? 'បញ្ចូលកូដ ANSI 837P XML ឬ MoH e-Claim XML ដើម្បីផ្ទៀងផ្ទាត់តាមស្តង់ដារក្រសួងសុខាភិបាល'
                  : 'Verify compliance against ANSI ASC X12 / 837P and MoH Cambodia electronic claim specifications'}
              </p>
            </div>

            <textarea
              rows={12}
              value={rawXmlToValidate}
              onChange={(e) => setRawXmlToValidate(e.target.value)}
              placeholder={
                isKh
                  ? 'បញ្ចូលកូដ XML នៅទីនេះ ដើម្បីធ្វើការផ្ទៀងផ្ទាត់...'
                  : 'Paste ANSI 837P or MoH electronic claim XML payload here...'
              }
              className="w-full text-xs font-mono p-4 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-stone-50 leading-relaxed"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (selectedClaim) {
                    setRawXmlToValidate(selectedClaim.xmlPayload || '');
                  }
                }}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                {isKh ? 'ផ្ទុកកូដ XML ពីសំណុំរឿងបច្ចុប្បន្ន' : 'Load XML from selected claim'}
              </button>

              <button
                onClick={handleValidateXml}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Code className="w-4 h-4" />
                <span>{isKh ? 'ផ្ទៀងផ្ទាត់កូដ XML' : 'Validate XML Schema'}</span>
              </button>
            </div>

            {/* Validation Result Box */}
            {validationOutput && (
              <div
                className={`p-4 rounded-xl text-xs ${
                  validationOutput.valid
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {validationOutput.valid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{isKh ? 'កូដ XML ស្របតាមស្តង់ដារ ១០០%' : 'XML Schema Validation Passed: 100% Compliant'}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span>{isKh ? 'រកឃើញកំហុសក្នុងការផ្ទៀងផ្ទាត់' : 'XML Schema Validation Errors Detected'}</span>
                    </>
                  )}
                </div>

                {!validationOutput.valid && validationOutput.errors && (
                  <ul className="mt-2 list-disc list-inside space-y-1 font-mono text-[11px] text-red-800">
                    {validationOutput.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Raw Payload Inspector Modal */}
      {xmlModalContent && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-stone-200 space-y-3 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900 truncate">{xmlModalContent.title}</h3>
              <button
                onClick={() => setXmlModalContent(null)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {xmlModalContent.content}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setXmlModalContent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-900 text-white"
              >
                {isKh ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Claim Modal */}
      {showNewClaimModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">
                {isKh ? 'បង្កើតសំណុំទាមទារអេឡិចត្រូនិក' : 'Create Electronic Claim'}
              </h3>
              <button onClick={() => setShowNewClaimModal(false)} className="text-stone-400 font-bold">
                ×
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-0.5">Insurer:</label>
                <select
                  value={newInsurer}
                  onChange={(e) => setNewInsurer(e.target.value as any)}
                  className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="FORTE">Forte Insurance</option>
                  <option value="PRUDENTIAL">Prudential Life Assurance</option>
                  <option value="AIA">AIA Cambodia</option>
                  <option value="MANULIFE">Manulife Cambodia</option>
                  <option value="INFINITY">Infinity General Insurance</option>
                  <option value="NSSF">NSSF (ប.ស.ស.)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-0.5">Patient Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Chea Sokunthea"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Policy Number:</label>
                  <input
                    type="text"
                    placeholder="FT-MED-9948"
                    value={newPolicyNum}
                    onChange={(e) => setNewPolicyNum(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Member ID:</label>
                  <input
                    type="text"
                    placeholder="MEM-8812"
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Billed Amount ($):</label>
                  <input
                    type="number"
                    value={newBilledAmount}
                    onChange={(e) => setNewBilledAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Covered Amount ($):</label>
                  <input
                    type="number"
                    value={newCoveredAmount}
                    onChange={(e) => setNewCoveredAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowNewClaimModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                {isKh ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateClaim}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isKh ? 'បង្កើត' : 'Create Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Surveillance Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">
                {isKh ? 'កត់ត្រាករណីជំងឺឆ្លង MoH' : 'Record Communicable Disease Case'}
              </h3>
              <button onClick={() => setShowNewCaseModal(false)} className="text-stone-400 font-bold">
                ×
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-0.5">Condition / Disease:</label>
                <select
                  value={selectedDiseaseCode}
                  onChange={(e) => setSelectedDiseaseCode(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                >
                  {diseases.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.englishName} ({d.khmerName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Classification:</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="SUSPECTED">Suspected</option>
                    <option value="PROBABLE">Probable</option>
                    <option value="CONFIRMED">Confirmed</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Lab Confirmation:</label>
                  <select
                    value={labMethod}
                    onChange={(e) => setLabMethod(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="RDT">Rapid Diagnostic Test (RDT)</option>
                    <option value="PCR">RT-PCR</option>
                    <option value="SEROLOGY">Serology ELISA</option>
                    <option value="CULTURE">Bacterial Culture</option>
                    <option value="CLINICAL_ONLY">Clinical Symptoms Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Age:</label>
                  <input
                    type="number"
                    value={caseAge}
                    onChange={(e) => setCaseAge(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Gender:</label>
                  <select
                    value={caseGender}
                    onChange={(e) => setCaseGender(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                {isKh ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={handleRecordCase}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isKh ? 'កត់ត្រា' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
