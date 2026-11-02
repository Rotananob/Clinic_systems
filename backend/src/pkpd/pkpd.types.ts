/**
 * Clinical Pharmacokinetics (PK/PD) Precision Dosing Types and Constants
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

export type PatientGender = 'MALE' | 'FEMALE';
export type RenalStage = 'NORMAL' | 'MILD_IMPAIRMENT' | 'MODERATE_IMPAIRMENT' | 'SEVERE_IMPAIRMENT' | 'END_STAGE_ESRD';
export type TdmDrugCode = 'VANCOMYCIN' | 'GENTAMICIN' | 'AMIKACIN' | 'DIGOXIN' | 'TOBRAMYCIN';
export type TherapeuticWindowStatus = 'SUBTHERAPEUTIC' | 'THERAPEUTIC' | 'SUPRATHERAPEUTIC_WARNING' | 'TOXIC_LOCKOUT';

export const PatientGender = {};
export const RenalStage = {};
export const TdmDrugCode = {};
export const TherapeuticWindowStatus = {};
export const PatientAnthropometrics = {};
export const DerivedBiometrics = {};
export const TdmDrugModel = {};
export const MeasuredSerumLevel = {};
export const PkParameters = {};
export const DosingRegimenOption = {};
export const TdmConsultationRecord = {};

export interface PatientAnthropometrics {
  patientId: string;
  patientName: string;
  ageYears: number;
  gender: PatientGender;
  actualWeightKg: number;
  heightCm: number;
  serumCreatinineMgDl: number;
}

export interface DerivedBiometrics {
  bmi: number;
  isObese: boolean; // BMI >= 30
  idealBodyWeightKg: number;
  adjustedBodyWeightKg: number;
  dosingWeightKg: number;
  creatinineClearanceMlMin: number;
  renalStage: RenalStage;
}

export interface TdmDrugModel {
  code: TdmDrugCode;
  nameEn: string;
  nameKh: string;
  therapeuticCategory: string;
  defaultInfusionHours: number;
  targetMetrics: {
    targetAuc24Min?: number; // e.g. 400 for Vancomycin
    targetAuc24Max?: number; // e.g. 600 for Vancomycin
    targetTroughMin: number; // e.g. 10 mg/L for Vancomycin, < 1.0 mcg/mL for Gentamicin
    targetTroughMax: number; // e.g. 15 mg/L for Vancomycin, 1.5 mcg/mL for Gentamicin
    targetPeakMin?: number; // e.g. 6-10 mcg/mL for Gentamicin
    targetPeakMax?: number;
    toxicityTroughThreshold: number; // e.g. 20 mg/L for Vancomycin
    toxicityAlertEn: string;
    toxicityAlertKh: string;
  };
  populationVdPerKg: number; // L/kg
}

export interface MeasuredSerumLevel {
  sampleId: string;
  drawTimestamp: string;
  hoursPostDose: number;
  measuredConcentration: number; // mg/L or mcg/mL or ng/mL
  assayCvPercent: number; // coefficient of variation (e.g. 8%)
}

export interface PkParameters {
  eliminationRateConstantKe: number; // 1/hr
  halfLifeHours: number; // hr
  volumeOfDistributionLitres: number; // L
  clearanceLitresPerHour: number; // L/hr
  isBayesianDerived: boolean;
}

export interface DosingRegimenOption {
  doseMg: number;
  infusionHours: number;
  intervalHours: number; // tau
  dailyDoseMg: number;
  predictedPeakCmax: number; // mg/L
  predictedTroughCmin: number; // mg/L
  predictedAuc24: number; // mg*hr/L
  aucMicRatio?: number; // assuming MIC = 1.0
  status: TherapeuticWindowStatus;
  clinicalRecommendationKh: string;
  clinicalRecommendationEn: string;
}

export interface TdmConsultationRecord {
  consultationId: string;
  bedId?: string;
  patient: PatientAnthropometrics;
  biometrics: DerivedBiometrics;
  drug: TdmDrugModel;
  baselinePk: PkParameters;
  measuredLevels: MeasuredSerumLevel[];
  bayesianAdjustedPk?: PkParameters;
  currentRegimen?: DosingRegimenOption;
  recommendedRegimen: DosingRegimenOption;
  alternativeRegimens: DosingRegimenOption[];
  consultantStaffId: string;
  createdAt: string;
  updatedAt: string;
}
