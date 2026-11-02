// Type definitions for Automated Antimicrobial Stewardship Program (ASP) Engine
// Conforms to Node.js 24 type stripping with explicit runtime symbol exports

export interface AntimicrobialAgent {
  code: string;
  name: string;
  class: string;
  isRestricted: boolean;
  requiresSpecialistApproval: boolean;
  spectrum: 'BROAD' | 'EXTENDED' | 'NARROW';
  oralBioavailabilityPercent: number; // e.g. 70-100%
  oralEquivalent?: {
    drugName: string;
    standardOralDose: string;
    bioavailabilityBioequivalent: boolean;
  };
}

export interface AntimicrobialAdministrationDay {
  date: string; // YYYY-MM-DD
  agentCodes: string[];
}

export interface PatientAntimicrobialCourse {
  patientId: string;
  patientName: string;
  admissionDate: string;
  unit: 'ICU' | 'GENERAL_WARD' | 'SURGICAL';
  administrations: AntimicrobialAdministrationDay[];
  currentAntibiotics: {
    agentCode: string;
    agentName: string;
    route: 'IV' | 'PO';
    dose: string;
    frequency: string;
    startDate: string;
    indication: string;
    status: 'ACTIVE' | 'DISCONTINUED' | 'DE_ESCALATED' | 'STEPPED_DOWN';
  }[];
}

export interface DotLotSummary {
  patientDays: number;
  totalDaysOfTherapy: number; // DOT
  totalLengthOfTherapy: number; // LOT
  dotPer1000PatientDays: number;
  lotPer1000PatientDays: number;
  agentDotBreakdown: Record<string, number>;
}

export type SaarCategory = 'OPTIMAL' | 'BENCHMARK' | 'HIGH_CONSUMPTION' | 'CRITICAL_OVERUTILIZATION';

export interface SaarMetric {
  observedDot: number;
  predictedDot: number;
  saarRatio: number;
  category: SaarCategory;
  clinicalInterpretationEn: string;
  clinicalInterpretationKm: string;
}

export interface ProcalcitoninKinetics {
  baselinePct: number; // mcg/L
  currentPct: number; // mcg/L
  deltaPctPercent: number; // % drop from baseline
  afebrileHours: number;
  meanArterialPressure: number; // mmHg
  recommendation: 'STRONG_CESSATION_RECOMMENDED' | 'CONSIDER_CESSATION' | 'CONTINUE_ANTIBIOTICS' | 'TREATMENT_FAILURE_OR_RESISTANCE_RISK';
  rationaleEn: string;
  rationaleKm: string;
}

export interface IvToOralCandidate {
  agentCode: string;
  agentName: string;
  currentRoute: 'IV';
  recommendedOralDrug: string;
  recommendedOralDose: string;
  bioavailabilityPercent: number;
  isCandidate: boolean;
  criteriaMet: {
    afebrileAtLeast24h: boolean;
    hemodynamicallyStable: boolean;
    wbcImproving: boolean;
    functionalGiTract: boolean;
    daysOnIvAtLeast48h: boolean;
  };
  clinicalRecommendationEn: string;
  clinicalRecommendationKm: string;
}

export interface BugDrugMismatchAlert {
  isMismatch: boolean;
  pathogenCode: string;
  pathogenName: string;
  antibioticCode: string;
  antibioticName: string;
  mismatchType: 'INTRINSIC_RESISTANCE' | 'CLINICAL_INEFFECTIVENESS' | 'SUBOPTIMAL_SPECTRUM' | 'MATCH';
  warningEn: string;
  warningKm: string;
  recommendedAlternativeEn: string;
  recommendedAlternativeKm: string;
}

export interface AntibiogramOrganismRecord {
  pathogenCode: string;
  pathogenName: string;
  gramCategory: 'GRAM_POSITIVE' | 'GRAM_NEGATIVE' | 'ANAEROBE' | 'ATYPICAL';
  isolateCount: number;
  susceptibilities: Record<string, {
    testedCount: number;
    susceptibleCount: number;
    susceptibilityPercent: number;
    resistancePattern: 'SUSCEPTIBLE' | 'INTERMEDIATE' | 'RESISTANT' | 'INTRINSICALLY_RESISTANT';
  }>;
}

export interface RestrictedApprovalRequest {
  id: string;
  patientId: string;
  patientName: string;
  prescribingDoctor: string;
  agentCode: string;
  agentName: string;
  requestedDose: string;
  clinicalIndication: string;
  cultureSpecimenSent: boolean;
  requestTimestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  approverComments?: string;
  reviewedBy?: string;
}

// Runtime empty exports for Node.js 24 type stripping
export const AntimicrobialAgent = {};
export const AntimicrobialAdministrationDay = {};
export const PatientAntimicrobialCourse = {};
export const DotLotSummary = {};
export const SaarCategory = {};
export const SaarMetric = {};
export const ProcalcitoninKinetics = {};
export const IvToOralCandidate = {};
export const BugDrugMismatchAlert = {};
export const AntibiogramOrganismRecord = {};
export const RestrictedApprovalRequest = {};
