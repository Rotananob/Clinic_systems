// Type definitions for Emergency Sepsis & Trauma Resuscitation Protocol Engine
// Conforms to Node.js 24 type stripping with explicit runtime symbol exports
// Strictly ZERO emojis. Strictly NO parentheses in Khmer text.

export interface QsofaAssessment {
  respiratoryRate: number;
  glasgowComaScale: number;
  systolicBp: number;
  score: number; // 0 - 3
  isHighRisk: boolean; // score >= 2
  clinicalActionEn: string;
  clinicalActionKm: string;
}

export interface SofaOrganScores {
  respirationScore: number; // PaO2/FiO2 ratio
  coagulationScore: number; // Platelets
  liverScore: number; // Bilirubin
  cardiovascularScore: number; // MAP & Vasopressors
  neurologicalScore: number; // GCS
  renalScore: number; // Creatinine / UOP
  totalScore: number; // 0 - 24
  projectedMortalityRatePercent: number;
  sepsisAlertTriggered: boolean; // total >= 2 in setting of infection
}

export interface SepsisHourOneBundlePlan {
  weightKg: number;
  initialLactateMmolL: number;
  measuredMapMmHg: number;
  crystalloidBolusVolumeMl: number; // 30 mL/kg
  preferredFluid: 'LACTATED_RINGERS';
  infusionTargetMinutes: number; // 180 min max (3 hours)
  hourlyInfusionRateMlH: number;
  vasopressorFirstLine: string;
  vasopressorTargetMapMmHg: number;
  bloodCulturesProtocolEn: string;
  bloodCulturesProtocolKm: string;
  broadSpectrumAntimicrobialWindowMinutes: number;
}

export interface LactateClearanceKinetics {
  baselineLactateMmolL: number;
  repeatLactateMmolL: number;
  elapsedHours: number;
  relativeClearancePercent: number;
  isAdequateClearance: boolean; // relativeClearance >= 20%
  statusEn: string;
  statusKm: string;
  actionEn: string;
  actionKm: string;
}

export interface ParklandBurnCalculation {
  weightKg: number;
  tbsaPercentage: number;
  hoursSinceInjury: number;
  total24HourFluidMl: number; // 4 mL * kg * %TBSA
  first8HourTotalMl: number; // 50%
  remainingFirst8HourMl: number; // adjusted for elapsed time
  first8HourHourlyRateMlH: number;
  next16HourTotalMl: number; // 50%
  next16HourHourlyRateMlH: number;
  targetAdultUopMlH: string; // 30 - 50 mL/h (0.5 - 1.0 mL/kg/h)
  titrationProtocolEn: string;
  titrationProtocolKm: string;
}

export interface BurnUopTitrationFeedback {
  currentHourlyRateMlH: number;
  measuredHourlyUopMlH: number;
  adjustedHourlyRateMlH: number;
  titrationAction: 'MAINTAIN' | 'INCREASE_20_PERCENT' | 'DECREASE_20_PERCENT';
  rationaleEn: string;
  rationaleKm: string;
}

export type BroselowColorCode =
  | 'GREY'
  | 'PINK'
  | 'RED'
  | 'PURPLE'
  | 'YELLOW'
  | 'WHITE'
  | 'BLUE'
  | 'ORANGE'
  | 'GREEN';

export interface PediatricResuscitationCard {
  estimatedWeightKg: number;
  ageYears: number;
  broselowColor: BroselowColorCode;
  colorNameEn: string;
  colorNameKm: string;
  ettUncuffedSizeMm: number; // Age / 4 + 4
  ettCuffedSizeMm: number; // Age / 4 + 3.5
  ettDepthCm: number; // Age / 2 + 12
  defibrillationFirstJoules: number; // 2 J/kg
  defibrillationSubsequentJoules: number; // 4 J/kg (max 200 J)
  cardioversionJoules: number; // 1 J/kg
  epinephrineDoseMg: number; // 0.01 mg/kg
  epinephrineVolumeMl1To10000: number; // 0.1 mL/kg
  amiodaroneBolusMg: number; // 5 mg/kg
  atropineDoseMg: number; // 0.02 mg/kg (min 0.1 mg, max 0.5 mg)
  normalSalineBolusMl: number; // 20 mL/kg
}

export interface ShockIndexAssessment {
  heartRate: number;
  systolicBp: number;
  shockIndex: number; // HR / SBP
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL_IMMINENT_ARREST';
  clinicalInterpretationEn: string;
  clinicalInterpretationKm: string;
}

export interface MassiveTransfusionProtocolAssessment {
  shockIndex: number;
  isPenetratingInjury: boolean;
  systolicBpBelow90: boolean;
  heartRateAbove120: boolean;
  fastUltrasoundPositive: boolean;
  abcScore: number; // Assessment of Blood Consumption (0 - 4)
  mtpActivated: boolean; // abcScore >= 2 or clinical emergency
  balancedRatioDescription: string; // 1:1:1 PRBC:FFP:Platelets
  txaIndicated: boolean;
  txaAdministrationStatus: 'GIVE_IMMEDIATELY' | 'CONTRAINDICATED_WINDOW_EXCEEDED';
  txaProtocolEn: string;
  txaProtocolKm: string;
}

// Runtime empty exports for Node.js 24 type stripping
export const QsofaAssessment = {};
export const SofaOrganScores = {};
export const SepsisHourOneBundlePlan = {};
export const LactateClearanceKinetics = {};
export const ParklandBurnCalculation = {};
export const BurnUopTitrationFeedback = {};
export const BroselowColorCode = {};
export const PediatricResuscitationCard = {};
export const ShockIndexAssessment = {};
export const MassiveTransfusionProtocolAssessment = {};
