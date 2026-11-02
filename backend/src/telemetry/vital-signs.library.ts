/**
 * Bedside Vital Signs and Multi-Parameter Telemetry Library
 * Clinical thresholds, arrhythmia definitions, and IEC 60601-1-8 alarm standards
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

export type AlarmSeverity = 'CRITICAL_RED' | 'WARNING_YELLOW' | 'ADVISORY_CYAN' | 'NORMAL_GREEN';
export type ArrhythmiaType =
  | 'NORMAL_SINUS'
  | 'ASYSTOLE'
  | 'VENTRICULAR_FIBRILLATION'
  | 'VENTRICULAR_TACHYCARDIA'
  | 'EXTREME_BRADYCARDIA'
  | 'EXTREME_TACHYCARDIA'
  | 'PVC_COUPLET'
  | 'PVC_BIGEMINY'
  | 'PVC_TRIGEMINY'
  | 'ST_ELEVATION_ISCHEMIA'
  | 'ST_DEPRESSION_ISCHEMIA'
  | 'DESATURATION'
  | 'APNEA';

export type LeadStatus = 'CONNECTED' | 'DISCONNECTED' | 'POOR_SIGNAL' | 'CALIBRATING';
export type WardType = 'ICU' | 'NICU' | 'CCU' | 'OR' | 'POSTOP';

export const AlarmSeverity = {};
export const ArrhythmiaType = {};
export const LeadStatus = {};
export const WardType = {};
export const BedTelemetryAlarm = {};
export const BedsideMonitorVitals = {};
export const BedsideMonitorDevice = {};
export const VitalSignThresholds = {};

export interface VitalSignThresholds {
  heartRate: { lowCritical: number; lowWarning: number; highWarning: number; highCritical: number };
  spo2: { critical: number; warning: number };
  systolicBp: { lowCritical: number; lowWarning: number; highWarning: number; highCritical: number };
  diastolicBp: { lowCritical: number; lowWarning: number; highWarning: number; highCritical: number };
  map: { lowCritical: number; lowWarning: number };
  respirationRate: { lowCritical: number; lowWarning: number; highWarning: number; highCritical: number };
  etco2: { lowWarning: number; highWarning: number };
  temperatureC: { lowWarning: number; highWarning: number };
  stSegmentDeviationMm: { elevationThreshold: number; depressionThreshold: number };
  apneaPauseSeconds: number;
}

export const DEFAULT_ADULT_THRESHOLDS: VitalSignThresholds = {
  heartRate: { lowCritical: 40, lowWarning: 50, highWarning: 120, highCritical: 160 },
  spo2: { critical: 88, warning: 92 },
  systolicBp: { lowCritical: 80, lowWarning: 90, highWarning: 140, highCritical: 180 },
  diastolicBp: { lowCritical: 50, lowWarning: 60, highWarning: 90, highCritical: 110 },
  map: { lowCritical: 60, lowWarning: 65 },
  respirationRate: { lowCritical: 8, lowWarning: 10, highWarning: 26, highCritical: 32 },
  etco2: { lowWarning: 30, highWarning: 50 },
  temperatureC: { lowWarning: 35.5, highWarning: 38.5 },
  stSegmentDeviationMm: { elevationThreshold: 2.0, depressionThreshold: -2.0 },
  apneaPauseSeconds: 20
};

export const DEFAULT_NEONATAL_THRESHOLDS: VitalSignThresholds = {
  heartRate: { lowCritical: 80, lowWarning: 100, highWarning: 180, highCritical: 200 },
  spo2: { critical: 85, warning: 90 },
  systolicBp: { lowCritical: 50, lowWarning: 60, highWarning: 90, highCritical: 100 },
  diastolicBp: { lowCritical: 30, lowWarning: 35, highWarning: 60, highCritical: 70 },
  map: { lowCritical: 40, lowWarning: 45 },
  respirationRate: { lowCritical: 20, lowWarning: 30, highWarning: 60, highCritical: 70 },
  etco2: { lowWarning: 30, highWarning: 50 },
  temperatureC: { lowWarning: 36.0, highWarning: 37.8 },
  stSegmentDeviationMm: { elevationThreshold: 2.0, depressionThreshold: -2.0 },
  apneaPauseSeconds: 15
};

export interface BedsideMonitorVitals {
  heartRate: number; // bpm
  spo2: number; // percentage
  perfusionIndex: number; // percentage
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  calculatedMap: number; // mmHg - derived via (2*DBP + SBP)/3
  respirationRate: number; // breaths per minute
  etco2: number; // mmHg
  temperatureCore: number; // Celsius (T1)
  temperaturePeripheral: number; // Celsius (T2)
  deltaTemperature: number; // T1 - T2 in Celsius
  stDeviationMm: number; // mm in Lead II
  prIntervalMs: number; // ms
  qrsDurationMs: number; // ms
  qtIntervalMs: number; // ms
  calculatedQtcMs: number; // Bazett corrected QT
  ratePressureProduct: number; // HR * SBP
}

export interface BedTelemetryAlarm {
  id: string;
  bedId: string;
  severity: AlarmSeverity;
  arrhythmiaType?: ArrhythmiaType;
  parameterName: string;
  currentValue: number | string;
  thresholdValue: number | string;
  messageEn: string;
  messageKh: string;
  triggeredAt: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  isSilenced: boolean;
  silencedBy?: string;
  silencedAt?: string;
  silenceExpiresAt?: string;
}

export interface BedsideMonitorDevice {
  bedId: string;
  bedName: string;
  ward: WardType;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE';
  diagnosisKh: string;
  diagnosisEn: string;
  isNeonatal: boolean;
  vitals: BedsideMonitorVitals;
  activeAlarms: BedTelemetryAlarm[];
  leadStatuses: {
    ecgLead: LeadStatus;
    spo2Probe: LeadStatus;
    nibpCuff: LeadStatus;
    respSensor: LeadStatus;
  };
  arrhythmiaState: ArrhythmiaType;
  lastTelemetryTimestamp: string;
  isAudioMuted: boolean;
  audioMutedRemainingSeconds: number;
}
