// Chemotherapy Regimen & Oncology Precision Dosing Types
// Conforms to Node.js 24 type stripping with explicit runtime symbol exports

export interface BsaCalculationResult {
  heightCm: number;
  weightKg: number;
  mostellerBsa: number; // m^2
  duboisBsa: number; // m^2
  haycockBsa: number; // m^2
  clinicalDosingBsa: number; // m^2 (capped if enabled)
  isCappedAt2_0: boolean;
}

export interface CalvertDosingResult {
  targetAuc: number;
  measuredGfr: number; // mL/min
  cappedGfr: number; // mL/min (max 125 mL/min per ASCO/FDA)
  calculatedCarboplatinDoseMg: number;
  isGfrCapped: boolean;
  maximumRecommendedDoseMg: number;
  clinicalRationaleEn: string;
  clinicalRationaleKm: string;
}

export interface AnthracyclineCumulativeExposure {
  currentLifetimeCumulativeDoseMgM2: number; // in Doxorubicin isotoxic equivalents
  lifetimeCeilingMgM2: number; // typically 450-550 mg/m^2
  percentOfLifetimeCeiling: number;
  proposedDoseMgM2: number;
  projectedCumulativeDoseMgM2: number;
  status: 'SAFE_RANGE' | 'CARDIOTOXICITY_WARNING' | 'HARD_CARDIOTOXICITY_BLOCK';
  actionEn: string;
  actionKm: string;
}

export interface LabSafetyCheckResult {
  absoluteNeutrophilCount: number; // /uL
  platelets: number; // /uL
  totalBilirubinMgDl: number;
  astAltUlnRatio: number;
  crCl: number; // mL/min
  overallStatus: 'PROCEED' | 'DOSE_REDUCTION_RECOMMENDED' | 'CHEMOTHERAPY_HOLD';
  violations: string[];
  recommendationEn: string;
  recommendationKm: string;
  doseAdjustmentFactor: number; // 1.0 = 100%, 0.75 = 75%, 0.50 = 50%, 0.0 = Hold
}

export interface ChemoDrugProtocolItem {
  drugCode: string;
  drugName: string;
  dosingBasis: 'BSA_M2' | 'CALVERT_AUC' | 'FLAT_DOSE' | 'WEIGHT_KG';
  standardDoseUnit: string;
  nominalDoseValue: number;
  route: 'IV_INFUSION' | 'IV_BOLUS' | 'ORAL';
  infusionDurationMinutes: number;
  dayOfCycle: number[];
  isAnthracycline: boolean;
  anthracyclineEquivalentFactor?: number;
}

export interface ChemoRegimen {
  code: string;
  name: string;
  tumorType: string;
  cycleLengthDays: number;
  totalCyclesRecommended: number;
  drugs: ChemoDrugProtocolItem[];
  premedications: string[];
  hydrationProtocolEn: string;
  hydrationProtocolKm: string;
}

export interface PatientOncologyProfile {
  patientId: string;
  patientName: string;
  tumorDiagnosis: string;
  regimenCode: string;
  currentCycle: number;
  heightCm: number;
  weightKg: number;
  serumCreatinine: number;
  totalBilirubin: number;
  wbc: number;
  neutrophilPercent: number;
  bandPercent: number;
  platelets: number;
  lifetimeAnthracyclineDoxorubicinEquivMgM2: number;
}

// Runtime empty exports for Node.js 24 type stripping
export const BsaCalculationResult = {};
export const CalvertDosingResult = {};
export const AnthracyclineCumulativeExposure = {};
export const LabSafetyCheckResult = {};
export const ChemoDrugProtocolItem = {};
export const ChemoRegimen = {};
export const PatientOncologyProfile = {};
