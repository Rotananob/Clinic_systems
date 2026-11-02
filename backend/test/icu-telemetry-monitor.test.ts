/**
 * Phase 9 ICU/OR Bedside Telemetry Monitor & Arrhythmia Waveform Engine Test Suite
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_ADULT_THRESHOLDS,
  DEFAULT_NEONATAL_THRESHOLDS,
  VitalSignThresholds,
  BedsideMonitorVitals
} from '../src/telemetry/vital-signs.library.ts';
import { WaveformGeneratorEngine } from '../src/telemetry/waveform-generator.engine.ts';
import { BedsideMonitorService } from '../src/telemetry/bedside-monitor.service.ts';

describe('Phase 9 ICU/OR Multi-Parameter Telemetry Monitor & Arrhythmia Engine', () => {
  // Domain 1: Biophysical Hemodynamic Math
  describe('Domain 1: Biophysical Hemodynamic Math', () => {
    it('accurately computes Mean Arterial Pressure (MAP) using (2*DBP + SBP)/3', () => {
      // Normotensive: 120/80 -> (160 + 120) / 3 = 280/3 = 93.33 -> 93
      assert.strictEqual(WaveformGeneratorEngine.calculateMap(120, 80), 93);

      // Septic shock: 85/45 -> (90 + 85) / 3 = 175/3 = 58.33 -> 58
      assert.strictEqual(WaveformGeneratorEngine.calculateMap(85, 45), 58);

      // Hypertensive crisis: 210/120 -> (240 + 210) / 3 = 450/3 = 150
      assert.strictEqual(WaveformGeneratorEngine.calculateMap(210, 120), 150);

      // Edge case: zero or negative returns 0
      assert.strictEqual(WaveformGeneratorEngine.calculateMap(0, 0), 0);
    });

    it('accurately computes Rate-Pressure Product (RPP = HR * SBP)', () => {
      // HR 75, SBP 120 -> 9000
      assert.strictEqual(WaveformGeneratorEngine.calculateRatePressureProduct(75, 120), 9000);

      // ICU post-op tachycardia: HR 140, SBP 160 -> 22400 (high myocardial workload)
      assert.strictEqual(WaveformGeneratorEngine.calculateRatePressureProduct(140, 160), 22400);
    });

    it('accurately computes Bazett corrected QT interval (QTc = QT / sqrt(RR))', () => {
      // HR 60 -> RR = 1.0 s, QT = 400 ms -> QTc = 400
      assert.strictEqual(WaveformGeneratorEngine.calculateQtc(400, 60), 400);

      // HR 100 -> RR = 0.6 s, sqrt(0.6) = 0.7746, QT = 350 ms -> QTc = 350 / 0.7746 = 451.8 -> 452
      assert.strictEqual(WaveformGeneratorEngine.calculateQtc(350, 100), 452);

      // Invalid HR or QT returns 0
      assert.strictEqual(WaveformGeneratorEngine.calculateQtc(0, 80), 0);
      assert.strictEqual(WaveformGeneratorEngine.calculateQtc(400, 0), 0);
    });
  });

  // Domain 2: Arrhythmia and Critical Alarm Detection
  describe('Domain 2: Arrhythmia and Critical Alarm Detection', () => {
    const baseVitals: BedsideMonitorVitals = {
      heartRate: 75,
      spo2: 98,
      perfusionIndex: 2.5,
      systolicBp: 120,
      diastolicBp: 80,
      calculatedMap: 93,
      respirationRate: 16,
      etco2: 38,
      temperatureCore: 37.0,
      temperaturePeripheral: 35.8,
      deltaTemperature: 1.2,
      stDeviationMm: 0.0,
      prIntervalMs: 160,
      qrsDurationMs: 90,
      qtIntervalMs: 400,
      calculatedQtcMs: 447,
      ratePressureProduct: 9000
    };

    it('detects Normal Sinus Rhythm when parameters are within normal physiological bounds', () => {
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', baseVitals, DEFAULT_ADULT_THRESHOLDS);
      assert.strictEqual(result.arrhythmia, 'NORMAL_SINUS');
      assert.strictEqual(result.alarms.length, 0);
    });

    it('triggers CRITICAL_RED Asystole alarm immediately when heart rate is zero', () => {
      const asystoleVitals = { ...baseVitals, heartRate: 0, systolicBp: 0, diastolicBp: 0, calculatedMap: 0 };
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', asystoleVitals, DEFAULT_ADULT_THRESHOLDS);

      assert.strictEqual(result.arrhythmia, 'ASYSTOLE');
      assert.strictEqual(result.alarms.length, 1);
      assert.strictEqual(result.alarms[0].severity, 'CRITICAL_RED');
      assert.strictEqual(result.alarms[0].arrhythmiaType, 'ASYSTOLE');
    });

    it('triggers CRITICAL_RED Ventricular Tachycardia alarm when HR >= 140 bpm and QRS > 120 ms', () => {
      const vtachVitals = { ...baseVitals, heartRate: 155, qrsDurationMs: 145 };
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', vtachVitals, DEFAULT_ADULT_THRESHOLDS);

      assert.strictEqual(result.arrhythmia, 'VENTRICULAR_TACHYCARDIA');
      const vtAlarm = result.alarms.find((a) => a.arrhythmiaType === 'VENTRICULAR_TACHYCARDIA');
      assert.ok(vtAlarm);
      assert.strictEqual(vtAlarm.severity, 'CRITICAL_RED');
    });

    it('triggers CRITICAL_RED Extreme Bradycardia when heart rate falls below 40 bpm', () => {
      const bradyVitals = { ...baseVitals, heartRate: 34 };
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', bradyVitals, DEFAULT_ADULT_THRESHOLDS);

      assert.strictEqual(result.arrhythmia, 'EXTREME_BRADYCARDIA');
      const bradyAlarm = result.alarms.find((a) => a.arrhythmiaType === 'EXTREME_BRADYCARDIA');
      assert.ok(bradyAlarm);
      assert.strictEqual(bradyAlarm.severity, 'CRITICAL_RED');
    });

    it('triggers CRITICAL_RED Extreme Tachycardia when heart rate exceeds 160 bpm', () => {
      const tachyVitals = { ...baseVitals, heartRate: 172, qrsDurationMs: 95 }; // narrow QRS
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', tachyVitals, DEFAULT_ADULT_THRESHOLDS);

      assert.strictEqual(result.arrhythmia, 'EXTREME_TACHYCARDIA');
      const tachyAlarm = result.alarms.find((a) => a.arrhythmiaType === 'EXTREME_TACHYCARDIA');
      assert.ok(tachyAlarm);
      assert.strictEqual(tachyAlarm.severity, 'CRITICAL_RED');
    });

    it('triggers CRITICAL_RED Desaturation alarm when SpO2 drops below 88%', () => {
      const desatVitals = { ...baseVitals, spo2: 84 };
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', desatVitals, DEFAULT_ADULT_THRESHOLDS);

      const spo2Alarm = result.alarms.find((a) => a.parameterName === 'SPO2');
      assert.ok(spo2Alarm);
      assert.strictEqual(spo2Alarm.severity, 'CRITICAL_RED');
    });

    it('triggers CRITICAL_RED STEMI alert on ST-elevation >= +2.0 mm', () => {
      const stElevVitals = { ...baseVitals, stDeviationMm: 2.8 };
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', stElevVitals, DEFAULT_ADULT_THRESHOLDS);

      assert.strictEqual(result.arrhythmia, 'ST_ELEVATION_ISCHEMIA');
      const stAlarm = result.alarms.find((a) => a.parameterName === 'ECG_ST_SEGMENT');
      assert.ok(stAlarm);
      assert.strictEqual(stAlarm.severity, 'CRITICAL_RED');
    });

    it('triggers WARNING_YELLOW on ST-depression <= -2.0 mm (subendocardial ischemia)', () => {
      const stDepVitals = { ...baseVitals, stDeviationMm: -2.4 };
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', stDepVitals, DEFAULT_ADULT_THRESHOLDS);

      assert.strictEqual(result.arrhythmia, 'ST_DEPRESSION_ISCHEMIA');
      const stAlarm = result.alarms.find((a) => a.parameterName === 'ECG_ST_SEGMENT');
      assert.ok(stAlarm);
      assert.strictEqual(stAlarm.severity, 'WARNING_YELLOW');
    });

    it('triggers CRITICAL_RED Apnea alarm when respiration rate is zero', () => {
      const apneaVitals = { ...baseVitals, respirationRate: 0 };
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', apneaVitals, DEFAULT_ADULT_THRESHOLDS);

      assert.strictEqual(result.arrhythmia, 'APNEA');
      const apneaAlarm = result.alarms.find((a) => a.parameterName === 'RESPIRATION');
      assert.ok(apneaAlarm);
      assert.strictEqual(apneaAlarm.severity, 'CRITICAL_RED');
    });

    it('triggers CRITICAL_RED Hypoperfusion when MAP drops below 60 mmHg', () => {
      const shockVitals = {
        ...baseVitals,
        systolicBp: 78,
        diastolicBp: 46,
        calculatedMap: WaveformGeneratorEngine.calculateMap(78, 46) // 57 mmHg
      };
      const result = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-01', shockVitals, DEFAULT_ADULT_THRESHOLDS);

      const mapAlarm = result.alarms.find((a) => a.parameterName === 'MAP');
      assert.ok(mapAlarm);
      assert.strictEqual(mapAlarm.severity, 'CRITICAL_RED');
    });
  });

  // Domain 3: IEC 60601-1-8 Alarm Silence Protocol & Safety
  describe('Domain 3: IEC 60601-1-8 Alarm Silence Protocol & Safety', () => {
    it('strictly caps alarm silence duration to 120 seconds per IEC 60601-1-8 standard', () => {
      const service = new BedsideMonitorService();

      // Requesting 300 seconds must be clamped to 120 seconds maximum
      const silenceResult = service.silenceAlarm('BED-ICU-02', 'DOC-ICU-99', 300);
      assert.strictEqual(silenceResult.silencedSeconds, 120);

      const bed = service.getBedById('BED-ICU-02');
      assert.strictEqual(bed.isAudioMuted, true);
      assert.strictEqual(bed.audioMutedRemainingSeconds, 120);
    });

    it('records clinician audit logs for alarm silencing and acknowledgment', () => {
      const service = new BedsideMonitorService();
      service.silenceAlarm('BED-ICU-03', 'NURSE-ICU-42', 60);

      const bed = service.getBedById('BED-ICU-03');
      const activeAlarm = bed.activeAlarms[0];
      if (activeAlarm) {
        service.acknowledgeAlarm('BED-ICU-03', activeAlarm.id, 'DOC-ICU-10');
      }

      const logs = service.getAuditLogs();
      const silenceLog = logs.find((l) => l.action === 'SILENCE_ALARM_IEC_60601_1_8');
      assert.ok(silenceLog);
      assert.strictEqual(silenceLog.clinicianId, 'NURSE-ICU-42');
      assert.strictEqual(silenceLog.bedId, 'BED-ICU-03');
    });
  });

  // Domain 4: Bedside Device Fleet & Real-time Vitals Update
  describe('Domain 4: Bedside Device Fleet & Real-time Vitals Update', () => {
    it('manages adult ICU beds and neonatal NICU bed with specialized thresholds', () => {
      const service = new BedsideMonitorService();
      const beds = service.getAllBeds();

      assert.strictEqual(beds.length, 4);
      const nicuBed = beds.find((b) => b.isNeonatal);
      assert.ok(nicuBed);
      assert.strictEqual(nicuBed.bedId, 'BED-NICU-04');
      assert.strictEqual(nicuBed.ward, 'NICU');
    });

    it('dynamically updates vitals, recalculates indices and re-evaluates alarms', () => {
      const service = new BedsideMonitorService();
      const updated = service.updateBedVitals('BED-ICU-01', {
        heartRate: 165, // extreme tachy
        systolicBp: 170,
        diastolicBp: 95
      });

      assert.strictEqual(updated.vitals.heartRate, 165);
      assert.strictEqual(updated.vitals.calculatedMap, WaveformGeneratorEngine.calculateMap(170, 95)); // 120
      assert.strictEqual(updated.arrhythmiaState, 'EXTREME_TACHYCARDIA');
      assert.ok(updated.activeAlarms.length > 0);
    });

    it('simulates specific arrhythmias and logs the action', () => {
      const service = new BedsideMonitorService();
      const simulated = service.simulateArrhythmia('BED-ICU-01', 'ASYSTOLE', 'INTENSIVIST-01');

      assert.strictEqual(simulated.arrhythmiaState, 'ASYSTOLE');
      assert.strictEqual(simulated.vitals.heartRate, 0);

      const logs = service.getAuditLogs();
      const simLog = logs.find((l) => l.action === 'SIMULATE_ARRHYTHMIA');
      assert.ok(simLog);
      assert.strictEqual(simLog.clinicianId, 'INTENSIVIST-01');
    });
  });

  // Domain 5: Waveform Generation & Physiological Modeling
  describe('Domain 5: Waveform Generation & Physiological Modeling', () => {
    it('generates synchronized waveform batch with non-empty numeric samples', () => {
      const service = new BedsideMonitorService();
      const waveformData = service.getWaveformBatch('BED-ICU-01', 60, 60);

      assert.strictEqual(waveformData.bedId, 'BED-ICU-01');
      assert.strictEqual(waveformData.points.length, 60);

      for (const pt of waveformData.points) {
        assert.ok(!isNaN(pt.ecgMv), 'ECG must not be NaN');
        assert.ok(!isNaN(pt.ppgValue), 'PPG must not be NaN');
        assert.ok(!isNaN(pt.respCo2MmHg), 'Capnogram must not be NaN');
        assert.ok(pt.ppgValue >= 0, 'PPG value must be non-negative');
        assert.ok(pt.respCo2MmHg >= 0, 'Capnogram must be non-negative');
      }
    });

    it('produces near-zero flatline voltage for Asystole', () => {
      const asystoleSample = WaveformGeneratorEngine.generateEcgSample(500, 0, 'ASYSTOLE');
      assert.ok(Math.abs(asystoleSample) < 0.05, 'Asystole should be near-zero flatline');
    });
  });

  // Domain 6: Linguistic Compliance Audits
  describe('Domain 6: Strict Linguistic & Regulatory Audits', () => {
    it('verifies strictly zero emojis in bedside monitor diagnostic text and alarm messages', () => {
      const service = new BedsideMonitorService();
      const beds = service.getAllBeds();
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

      for (const bed of beds) {
        assert.ok(!emojiRegex.test(bed.diagnosisKh), `Diagnosis KH contains emoji: ${bed.diagnosisKh}`);
        assert.ok(!emojiRegex.test(bed.diagnosisEn), `Diagnosis EN contains emoji: ${bed.diagnosisEn}`);
        for (const alarm of bed.activeAlarms) {
          assert.ok(!emojiRegex.test(alarm.messageKh), `Alarm message KH contains emoji: ${alarm.messageKh}`);
          assert.ok(!emojiRegex.test(alarm.messageEn), `Alarm message EN contains emoji: ${alarm.messageEn}`);
        }
      }
    });

    it('verifies strictly zero parentheses in Khmer text strings', () => {
      const service = new BedsideMonitorService();
      const beds = service.getAllBeds();
      const parenthesisRegex = /[()（）]/;

      for (const bed of beds) {
        assert.ok(
          !parenthesisRegex.test(bed.diagnosisKh),
          `Diagnosis KH contains parenthesis: ${bed.diagnosisKh}`
        );
        for (const alarm of bed.activeAlarms) {
          assert.ok(
            !parenthesisRegex.test(alarm.messageKh),
            `Alarm message KH contains parenthesis: ${alarm.messageKh}`
          );
        }
      }
    });
  });
});
