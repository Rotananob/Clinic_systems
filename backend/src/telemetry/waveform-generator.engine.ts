/**
 * Real-time Physiological Waveform Generator and Arrhythmia Detection Engine
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

import {
  BedsideMonitorVitals,
  VitalSignThresholds,
  DEFAULT_ADULT_THRESHOLDS,
  ArrhythmiaType,
  BedTelemetryAlarm,
  AlarmSeverity
} from './vital-signs.library.ts';

export interface WaveformPoint {
  timeMs: number;
  ecgMv: number;
  ppgValue: number;
  respCo2MmHg: number;
}
export const WaveformPoint = {};

export class WaveformGeneratorEngine {
  /**
   * Calculates Mean Arterial Pressure (MAP) from SBP and DBP
   * Formula: MAP = (2 * DBP + SBP) / 3
   */
  public static calculateMap(systolicBp: number, diastolicBp: number): number {
    if (systolicBp <= 0 || diastolicBp <= 0) return 0;
    return Math.round((2 * diastolicBp + systolicBp) / 3);
  }

  /**
   * Calculates Rate-Pressure Product (RPP)
   * Formula: RPP = HR * SBP
   * Clinical index of myocardial workload and oxygen consumption
   */
  public static calculateRatePressureProduct(heartRate: number, systolicBp: number): number {
    return Math.round(heartRate * systolicBp);
  }

  /**
   * Calculates Bazett corrected QT interval (QTc)
   * Formula: QTc = QT / sqrt(RR_in_seconds)
   */
  public static calculateQtc(qtIntervalMs: number, heartRate: number): number {
    if (heartRate <= 0 || qtIntervalMs <= 0) return 0;
    const rrSeconds = 60 / heartRate;
    return Math.round(qtIntervalMs / Math.sqrt(rrSeconds));
  }

  /**
   * Generates a single ECG Lead II voltage point (mV) at time t (ms)
   */
  public static generateEcgSample(
    tMs: number,
    heartRate: number,
    arrhythmia: ArrhythmiaType = 'NORMAL_SINUS',
    stDeviationMm = 0
  ): number {
    if (heartRate <= 0 || arrhythmia === 'ASYSTOLE') {
      // Asystole: flatline with slight physiological baseline drift
      return Math.sin(tMs * 0.001) * 0.015;
    }

    if (arrhythmia === 'VENTRICULAR_FIBRILLATION') {
      // Chaotic fibrillatory waves: multiple unsynchronized sinusoids
      const f1 = Math.sin(tMs * 0.035) * 0.6;
      const f2 = Math.sin(tMs * 0.052 + 1.2) * 0.4;
      const f3 = Math.sin(tMs * 0.018 + 2.4) * 0.3;
      return Number((f1 + f2 + f3).toFixed(3));
    }

    const rrIntervalMs = 60000 / heartRate;
    const cycleTime = tMs % rrIntervalMs;
    const phi = cycleTime / rrIntervalMs;

    // Ischemia ST deviation translation: 1 mm deviation = 0.1 mV
    const stOffsetMv = stDeviationMm * 0.1;

    // Normal or Ventricular Tachycardia morphology
    if (arrhythmia === 'VENTRICULAR_TACHYCARDIA') {
      // Wide QRS monomorphic tachycardia: broad positive deflection
      const vtCycle = Math.sin(phi * 2 * Math.PI);
      return Number((vtCycle * 1.3).toFixed(3));
    }

    // Standard P-Q-R-S-T synthetic Gaussian components
    // P wave: center 0.15, amplitude 0.15 mV
    const pWave = 0.15 * Math.exp(-Math.pow((phi - 0.15) / 0.03, 2));

    // Q wave: center 0.28, amplitude -0.15 mV
    const qWave = -0.15 * Math.exp(-Math.pow((phi - 0.28) / 0.012, 2));

    // R peak: center 0.32, amplitude 1.35 mV
    const rWave = 1.35 * Math.exp(-Math.pow((phi - 0.32) / 0.018, 2));

    // S wave: center 0.36, amplitude -0.28 mV
    const sWave = -0.28 * Math.exp(-Math.pow((phi - 0.36) / 0.015, 2));

    // ST segment elevation/depression baseline shift between 0.38 and 0.50
    const stShift = phi >= 0.38 && phi <= 0.65 ? stOffsetMv : 0;

    // T wave: center 0.55, amplitude 0.32 mV
    const tWave = 0.32 * Math.exp(-Math.pow((phi - 0.55) / 0.065, 2));

    const totalMv = pWave + qWave + rWave + sWave + stShift + tWave;
    return Number(totalMv.toFixed(3));
  }

  /**
   * Generates a single Photoplethysmogram (PPG) infrared absorption sample (0.0 to 1.0)
   */
  public static generatePpgSample(tMs: number, heartRate: number, perfusionIndex = 2.0): number {
    if (heartRate <= 0) return 0.05;
    const rrIntervalMs = 60000 / heartRate;
    const cycleTime = tMs % rrIntervalMs;
    const phi = cycleTime / rrIntervalMs;

    // Scaled by perfusion index
    const scale = Math.min(1.0, Math.max(0.2, perfusionIndex / 3.0));

    // Systolic rapid upstroke (phi 0.0 to 0.25)
    let ppg = 0;
    if (phi < 0.25) {
      ppg = Math.sin((phi / 0.25) * (Math.PI / 2));
    } else if (phi < 0.4) {
      // Post-systolic downslope
      ppg = 1.0 - 0.6 * ((phi - 0.25) / 0.15);
    } else if (phi < 0.55) {
      // Dicrotic notch reflection wave
      const notchPhi = (phi - 0.4) / 0.15;
      ppg = 0.4 + 0.18 * Math.sin(notchPhi * Math.PI);
    } else {
      // Diastolic exponential decay
      const decayPhi = (phi - 0.55) / 0.45;
      ppg = 0.4 * Math.exp(-decayPhi * 2.5);
    }

    return Number((ppg * scale).toFixed(3));
  }

  /**
   * Generates Respiration / Capnography (EtCO2) waveform in mmHg
   */
  public static generateCapnogramSample(tMs: number, respirationRate: number, etco2MmHg = 38): number {
    if (respirationRate <= 0) return 0;
    const respCycleMs = 60000 / respirationRate;
    const cycleTime = tMs % respCycleMs;
    const phi = cycleTime / respCycleMs;

    // Phase I: Baseline (phi 0.0 - 0.15) -> 0 mmHg
    if (phi < 0.15) {
      return 0;
    }
    // Phase II: Expiratory upstroke (phi 0.15 - 0.28)
    if (phi < 0.28) {
      const p2 = (phi - 0.15) / 0.13;
      return Number((p2 * etco2MmHg * 0.85).toFixed(1));
    }
    // Phase III: Alveolar plateau (phi 0.28 - 0.65) -> slopes up to peak EtCO2
    if (phi < 0.65) {
      const p3 = (phi - 0.28) / 0.37;
      const val = etco2MmHg * 0.85 + p3 * (etco2MmHg * 0.15);
      return Number(val.toFixed(1));
    }
    // Phase IV: Inspiratory rapid downstroke (phi 0.65 - 0.75) back to 0
    if (phi < 0.75) {
      const p4 = 1.0 - (phi - 0.65) / 0.1;
      return Number((p4 * etco2MmHg).toFixed(1));
    }
    // Inspiratory baseline (phi 0.75 - 1.0)
    return 0;
  }

  /**
   * Generates a synchronized batch of waveform points for continuous client visualizer
   */
  public static generateWaveformBatch(
    startMs: number,
    pointCount: number,
    sampleRateHz: number,
    vitals: BedsideMonitorVitals,
    arrhythmia: ArrhythmiaType = 'NORMAL_SINUS'
  ): WaveformPoint[] {
    const points: WaveformPoint[] = [];
    const intervalMs = 1000 / sampleRateHz;

    for (let i = 0; i < pointCount; i++) {
      const t = startMs + i * intervalMs;
      points.push({
        timeMs: Math.round(t),
        ecgMv: this.generateEcgSample(t, vitals.heartRate, arrhythmia, vitals.stDeviationMm),
        ppgValue: this.generatePpgSample(t, vitals.heartRate, vitals.perfusionIndex),
        respCo2MmHg: this.generateCapnogramSample(t, vitals.respirationRate, vitals.etco2)
      });
    }

    return points;
  }

  /**
   * Arrhythmia Detector and Alarm Classifier
   * Evaluates biophysical signals and returns list of active alarms
   */
  public static detectAlarmsAndArrhythmia(
    bedId: string,
    vitals: BedsideMonitorVitals,
    thresholds: VitalSignThresholds = DEFAULT_ADULT_THRESHOLDS
  ): { arrhythmia: ArrhythmiaType; alarms: BedTelemetryAlarm[] } {
    const alarms: BedTelemetryAlarm[] = [];
    let detectedArrhythmia: ArrhythmiaType = 'NORMAL_SINUS';
    const nowIso = new Date().toISOString();

    // 1. Asystole Check
    if (vitals.heartRate <= 0) {
      detectedArrhythmia = 'ASYSTOLE';
      alarms.push({
        id: `ALARM-ASYSTOLE-${bedId}`,
        bedId,
        severity: 'CRITICAL_RED',
        arrhythmiaType: 'ASYSTOLE',
        parameterName: 'ECG_HEART_RATE',
        currentValue: 0,
        thresholdValue: thresholds.heartRate.lowCritical,
        messageEn: 'CRITICAL: Asystole ventricular standstill detected - start CPR immediately',
        messageKh: 'អាសន្ន: ពិនិត្យឃើញបេះដូងលែងលោត Asystole - ត្រូវសង្គ្រោះ CPR ជាបន្ទាន់',
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
      return { arrhythmia: detectedArrhythmia, alarms };
    }

    // 2. Ventricular Tachycardia Check (HR > 140 bpm with wide QRS > 120 ms)
    if (vitals.heartRate >= 140 && vitals.qrsDurationMs > 120) {
      detectedArrhythmia = 'VENTRICULAR_TACHYCARDIA';
      alarms.push({
        id: `ALARM-VTACH-${bedId}`,
        bedId,
        severity: 'CRITICAL_RED',
        arrhythmiaType: 'VENTRICULAR_TACHYCARDIA',
        parameterName: 'ECG_ARRHYTHMIA',
        currentValue: `${vitals.heartRate} bpm - QRS ${vitals.qrsDurationMs}ms`,
        thresholdValue: '140 bpm - QRS 120ms',
        messageEn: 'CRITICAL: Ventricular Tachycardia (V-Tach) - verify pulse and prepare defibrillator',
        messageKh: 'អាសន្ន: ចង្វាក់បេះដូងថតក្រោមលោតខុសប្រក្រតី V-Tach - ពិនិត្យជីពចរនិងត្រៀមម៉ាស៊ីនឆក់បេះដូង',
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    }

    // 3. Extreme Bradycardia (< lowCritical, typically < 40 bpm)
    if (vitals.heartRate < thresholds.heartRate.lowCritical) {
      detectedArrhythmia = 'EXTREME_BRADYCARDIA';
      alarms.push({
        id: `ALARM-EXT-BRADY-${bedId}`,
        bedId,
        severity: 'CRITICAL_RED',
        arrhythmiaType: 'EXTREME_BRADYCARDIA',
        parameterName: 'HEART_RATE',
        currentValue: vitals.heartRate,
        thresholdValue: thresholds.heartRate.lowCritical,
        messageEn: `CRITICAL: Extreme Bradycardia - HR ${vitals.heartRate} bpm below ${thresholds.heartRate.lowCritical} bpm`,
        messageKh: `អាសន្ន: ជីពចរធ្លាក់ចុះទាបធ្ងន់ធ្ងរ - HR ${vitals.heartRate} bpm ក្រោម ${thresholds.heartRate.lowCritical} bpm`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    } else if (vitals.heartRate < thresholds.heartRate.lowWarning) {
      alarms.push({
        id: `ALARM-WARN-BRADY-${bedId}`,
        bedId,
        severity: 'WARNING_YELLOW',
        parameterName: 'HEART_RATE',
        currentValue: vitals.heartRate,
        thresholdValue: thresholds.heartRate.lowWarning,
        messageEn: `WARNING: Bradycardia - HR ${vitals.heartRate} bpm below ${thresholds.heartRate.lowWarning} bpm`,
        messageKh: `ការព្រមាន: ជីពចរធ្លាក់ចុះ - HR ${vitals.heartRate} bpm ក្រោម ${thresholds.heartRate.lowWarning} bpm`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    }

    // 4. Extreme Tachycardia (> highCritical, typically > 160 bpm)
    if (vitals.heartRate > thresholds.heartRate.highCritical) {
      detectedArrhythmia = 'EXTREME_TACHYCARDIA';
      alarms.push({
        id: `ALARM-EXT-TACHY-${bedId}`,
        bedId,
        severity: 'CRITICAL_RED',
        arrhythmiaType: 'EXTREME_TACHYCARDIA',
        parameterName: 'HEART_RATE',
        currentValue: vitals.heartRate,
        thresholdValue: thresholds.heartRate.highCritical,
        messageEn: `CRITICAL: Extreme Tachycardia - HR ${vitals.heartRate} bpm exceeds ${thresholds.heartRate.highCritical} bpm`,
        messageKh: `អាសន្ន: ជីពចរកើនឡើងលឿនធ្ងន់ធ្ងរ - HR ${vitals.heartRate} bpm លើស ${thresholds.heartRate.highCritical} bpm`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    } else if (vitals.heartRate > thresholds.heartRate.highWarning && detectedArrhythmia === 'NORMAL_SINUS') {
      alarms.push({
        id: `ALARM-WARN-TACHY-${bedId}`,
        bedId,
        severity: 'WARNING_YELLOW',
        parameterName: 'HEART_RATE',
        currentValue: vitals.heartRate,
        thresholdValue: thresholds.heartRate.highWarning,
        messageEn: `WARNING: Sinus Tachycardia - HR ${vitals.heartRate} bpm exceeds ${thresholds.heartRate.highWarning} bpm`,
        messageKh: `ការព្រមាន: ជីពចរកើនឡើងលឿន - HR ${vitals.heartRate} bpm លើស ${thresholds.heartRate.highWarning} bpm`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    }

    // 5. Oxygen Saturation (SpO2) Desaturation
    if (vitals.spo2 < thresholds.spo2.critical) {
      if (detectedArrhythmia === 'NORMAL_SINUS') detectedArrhythmia = 'DESATURATION';
      alarms.push({
        id: `ALARM-SPO2-CRIT-${bedId}`,
        bedId,
        severity: 'CRITICAL_RED',
        arrhythmiaType: 'DESATURATION',
        parameterName: 'SPO2',
        currentValue: `${vitals.spo2}%`,
        thresholdValue: `${thresholds.spo2.critical}%`,
        messageEn: `CRITICAL: Severe Hypoxemic Desaturation - SpO2 ${vitals.spo2}% below critical limit`,
        messageKh: `អាសន្ន: កំហាប់អុកស៊ីសែនធ្លាក់ចុះធ្ងន់ធ្ងរ - SpO2 ${vitals.spo2}% ក្រោមដែនកំណត់អាសន្ន`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    } else if (vitals.spo2 < thresholds.spo2.warning) {
      alarms.push({
        id: `ALARM-SPO2-WARN-${bedId}`,
        bedId,
        severity: 'WARNING_YELLOW',
        parameterName: 'SPO2',
        currentValue: `${vitals.spo2}%`,
        thresholdValue: `${thresholds.spo2.warning}%`,
        messageEn: `WARNING: Low Oxygen Saturation - SpO2 ${vitals.spo2}% below normal`,
        messageKh: `ការព្រមាន: កំហាប់អុកស៊ីសែនធ្លាក់ចុះ - SpO2 ${vitals.spo2}% ក្រោមដែនធម្មតា`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    }

    // 6. Blood Pressure and Mean Arterial Pressure (MAP)
    if (vitals.calculatedMap < thresholds.map.lowCritical && vitals.calculatedMap > 0) {
      alarms.push({
        id: `ALARM-MAP-CRIT-${bedId}`,
        bedId,
        severity: 'CRITICAL_RED',
        parameterName: 'MAP',
        currentValue: `${vitals.calculatedMap} mmHg`,
        thresholdValue: `${thresholds.map.lowCritical} mmHg`,
        messageEn: `CRITICAL: Severe Hypoperfusion - MAP ${vitals.calculatedMap} mmHg inadequate for vital organs`,
        messageKh: `អាសន្ន: សម្ពាធឈាមមធ្យមទាបធ្ងន់ធ្ងរ - MAP ${vitals.calculatedMap} mmHg មិនគ្រប់គ្រាន់សម្រាប់សរីរាង្គសំខាន់ៗ`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    } else if (vitals.calculatedMap < thresholds.map.lowWarning && vitals.calculatedMap > 0) {
      alarms.push({
        id: `ALARM-MAP-WARN-${bedId}`,
        bedId,
        severity: 'WARNING_YELLOW',
        parameterName: 'MAP',
        currentValue: `${vitals.calculatedMap} mmHg`,
        thresholdValue: `${thresholds.map.lowWarning} mmHg`,
        messageEn: `WARNING: Hypotension risk - MAP ${vitals.calculatedMap} mmHg below target`,
        messageKh: `ការព្រមាន: ហានិភ័យសម្ពាធឈាមទាប - MAP ${vitals.calculatedMap} mmHg ក្រោមគោលដៅ`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    }

    // 7. Respiration and Apnea
    if (vitals.respirationRate === 0) {
      detectedArrhythmia = 'APNEA';
      alarms.push({
        id: `ALARM-APNEA-${bedId}`,
        bedId,
        severity: 'CRITICAL_RED',
        arrhythmiaType: 'APNEA',
        parameterName: 'RESPIRATION',
        currentValue: '0 rpm',
        thresholdValue: `${thresholds.apneaPauseSeconds}s pause`,
        messageEn: 'CRITICAL: Apnea cessation of spontaneous breathing detected',
        messageKh: 'អាសន្ន: ពិនិត្យឃើញការឈប់ដកដង្ហើម Apnea លើសកម្រិតកំណត់',
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    }

    // 8. ST-Segment Deviation (Ischemia / STEMI)
    if (vitals.stDeviationMm >= thresholds.stSegmentDeviationMm.elevationThreshold) {
      detectedArrhythmia = 'ST_ELEVATION_ISCHEMIA';
      alarms.push({
        id: `ALARM-ST-ELEV-${bedId}`,
        bedId,
        severity: 'CRITICAL_RED',
        arrhythmiaType: 'ST_ELEVATION_ISCHEMIA',
        parameterName: 'ECG_ST_SEGMENT',
        currentValue: `+${vitals.stDeviationMm.toFixed(1)} mm`,
        thresholdValue: `+${thresholds.stSegmentDeviationMm.elevationThreshold} mm`,
        messageEn: `CRITICAL: Acute ST-Elevation Ischemia (+${vitals.stDeviationMm.toFixed(1)} mm) - rule out STEMI`,
        messageKh: `អាសន្ន: ការកើនឡើងផ្នែក ST ធ្ងន់ធ្ងរ +${vitals.stDeviationMm.toFixed(1)} mm - សង្ស័យជំងឺស្ទះសរសៃឈាមបេះដូងស្រួចស្រាវ STEMI`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    } else if (vitals.stDeviationMm <= thresholds.stSegmentDeviationMm.depressionThreshold) {
      detectedArrhythmia = 'ST_DEPRESSION_ISCHEMIA';
      alarms.push({
        id: `ALARM-ST-DEP-${bedId}`,
        bedId,
        severity: 'WARNING_YELLOW',
        arrhythmiaType: 'ST_DEPRESSION_ISCHEMIA',
        parameterName: 'ECG_ST_SEGMENT',
        currentValue: `${vitals.stDeviationMm.toFixed(1)} mm`,
        thresholdValue: `${thresholds.stSegmentDeviationMm.depressionThreshold} mm`,
        messageEn: `WARNING: ST-Segment Depression (${vitals.stDeviationMm.toFixed(1)} mm) - myocardial subendocardial ischemia`,
        messageKh: `ការព្រមាន: ផ្នែក ST ធ្លាក់ចុះ ${vitals.stDeviationMm.toFixed(1)} mm - សញ្ញាកង្វះឈាមចិញ្ចឹមសាច់ដុំបេះដូង`,
        triggeredAt: nowIso,
        isAcknowledged: false,
        isSilenced: false
      });
    }

    return { arrhythmia: detectedArrhythmia, alarms };
  }
}
