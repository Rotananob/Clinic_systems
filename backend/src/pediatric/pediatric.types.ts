// Type definitions for Neonatal & Pediatric Precision Pharmacotherapy & Phototherapy Engine
// Conforms to Node.js 24 type stripping with explicit runtime symbol exports

export interface PediatricDosingCalculation {
  weightKg: number;
  ageYears: number;
  ageMonths: number;
  adultDoseMg: number;
  clarksRuleDoseMg: number;
  youngsRuleDoseMg: number;
  friedsRuleDoseMg: number;
  weightBasedDoseMg: number;
  adultMaxSingleDoseMg: number;
  recommendedDoseMg: number;
  isCappedAtAdultMax: boolean;
  liquidVolumeMl?: number;
  liquidConcentrationMgPerMl?: number;
  clinicalRationaleEn: string;
  clinicalRationaleKm: string;
}

export interface NeonatalAminoglycosideDosing {
  gestationalAgeWeeks: number;
  postnatalAgeDays: number;
  postmenstrualAgeWeeks: number; // PMA = GA + (PNA / 7)
  weightKg: number;
  recommendedAgent: 'GENTAMICIN' | 'AMIKACIN';
  nominalDoseMgPerKg: number;
  calculatedDoseMg: number;
  dosingIntervalHours: 24 | 36 | 48;
  targetTroughUgMl: string;
  targetPeakUgMl: string;
  renalMaturityStageEn: string;
  renalMaturityStageKm: string;
  monitoringProtocolEn: string;
  monitoringProtocolKm: string;
}

export type PhototherapyRiskCategory = 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
export type PhototherapyAction =
  | 'LOW_RISK_CONTINUE_NORMAL_CARE'
  | 'MONITOR_REPEAT_TSB_12H'
  | 'STANDARD_PHOTOTHERAPY_RECOMMENDED'
  | 'INTENSIVE_PHOTOTHERAPY_RECOMMENDED'
  | 'EXCHANGE_TRANSFUSION_THRESHOLD_EXCEEDED';

export interface PhototherapyNomogramAssessment {
  postnatalHours: number;
  totalSerumBilirubinMgDl: number;
  gestationalAgeWeeks: number;
  hasNeurotoxicityRiskFactors: boolean;
  riskCategory: PhototherapyRiskCategory;
  phototherapyThresholdMgDl: number;
  exchangeTransfusionThresholdMgDl: number;
  distanceToPhototherapyThresholdMgDl: number;
  action: PhototherapyAction;
  actionEn: string;
  actionKm: string;
  irradianceRecommendation: string;
}

export interface PediatricMedicationItem {
  code: string;
  name: string;
  category: 'ANALGESIC_ANTIPYRETIC' | 'ANTIBIOTIC' | 'ANTIHISTAMINE' | 'RESPIRATORY';
  standardDoseMgPerKg: number;
  dosingIntervalHours: number;
  maxDoseMgPerKgPerDay: number;
  adultMaxSingleDoseMg: number;
  liquidFormulations: {
    concentrationName: string;
    mgPerMl: number;
  }[];
}

export interface PediatricPatientRecord {
  patientId: string;
  patientName: string;
  birthDate: string;
  gestationalAgeWeeks: number;
  currentAgeDays: number;
  weightKg: number;
  heightCm: number;
  isNeonatal: boolean; // age <= 28 days
  hasG6pdDeficiency: boolean;
  bloodGroup: string;
}

// Runtime empty exports for Node.js 24 type stripping
export const PediatricDosingCalculation = {};
export const NeonatalAminoglycosideDosing = {};
export const PhototherapyRiskCategory = {};
export const PhototherapyAction = {};
export const PhototherapyNomogramAssessment = {};
export const PediatricMedicationItem = {};
export const PediatricPatientRecord = {};
