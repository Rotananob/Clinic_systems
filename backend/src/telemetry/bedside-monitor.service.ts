/**
 * Bedside Vital Signs Monitor Service
 * Multi-parameter bedside telemetry, alarm silence protocol, and waveform streaming
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

import {
  BedsideMonitorDevice,
  BedsideMonitorVitals,
  VitalSignThresholds,
  DEFAULT_ADULT_THRESHOLDS,
  DEFAULT_NEONATAL_THRESHOLDS,
  ArrhythmiaType,
  BedTelemetryAlarm
} from './vital-signs.library.ts';
import { WaveformGeneratorEngine, WaveformPoint } from './waveform-generator.engine.ts';

export class BedsideMonitorService {
  private beds: Map<string, BedsideMonitorDevice> = new Map();
  private auditLogs: Array<{
    timestamp: string;
    bedId: string;
    action: string;
    clinicianId: string;
    details: string;
  }> = [];

  constructor() {
    this.initializeDefaultBeds();
  }

  private initializeDefaultBeds(): void {
    const nowIso = new Date().toISOString();

    // Bed 1: ICU Adult Post-CABG
    const vitals1: BedsideMonitorVitals = {
      heartRate: 74,
      spo2: 98,
      perfusionIndex: 2.8,
      systolicBp: 122,
      diastolicBp: 78,
      calculatedMap: WaveformGeneratorEngine.calculateMap(122, 78),
      respirationRate: 14,
      etco2: 38,
      temperatureCore: 37.0,
      temperaturePeripheral: 35.8,
      deltaTemperature: 1.2,
      stDeviationMm: 0.1,
      prIntervalMs: 160,
      qrsDurationMs: 92,
      qtIntervalMs: 395,
      calculatedQtcMs: WaveformGeneratorEngine.calculateQtc(395, 74),
      ratePressureProduct: WaveformGeneratorEngine.calculateRatePressureProduct(74, 122)
    };

    // Bed 2: ICU Adult Septic Shock
    const vitals2: BedsideMonitorVitals = {
      heartRate: 118,
      spo2: 93,
      perfusionIndex: 1.1,
      systolicBp: 86,
      diastolicBp: 50,
      calculatedMap: WaveformGeneratorEngine.calculateMap(86, 50),
      respirationRate: 25,
      etco2: 31,
      temperatureCore: 38.9,
      temperaturePeripheral: 36.1,
      deltaTemperature: 2.8,
      stDeviationMm: 0.4,
      prIntervalMs: 145,
      qrsDurationMs: 96,
      qtIntervalMs: 340,
      calculatedQtcMs: WaveformGeneratorEngine.calculateQtc(340, 118),
      ratePressureProduct: WaveformGeneratorEngine.calculateRatePressureProduct(118, 86)
    };

    // Bed 3: ICU Adult Acute Coronary Syndrome
    const vitals3: BedsideMonitorVitals = {
      heartRate: 88,
      spo2: 91,
      perfusionIndex: 1.4,
      systolicBp: 152,
      diastolicBp: 96,
      calculatedMap: WaveformGeneratorEngine.calculateMap(152, 96),
      respirationRate: 22,
      etco2: 36,
      temperatureCore: 36.8,
      temperaturePeripheral: 35.5,
      deltaTemperature: 1.3,
      stDeviationMm: -2.3, // ST depression ischemia
      prIntervalMs: 180,
      qrsDurationMs: 104,
      qtIntervalMs: 420,
      calculatedQtcMs: WaveformGeneratorEngine.calculateQtc(420, 88),
      ratePressureProduct: WaveformGeneratorEngine.calculateRatePressureProduct(88, 152)
    };

    // Bed 4: Neonatal Intensive Care Unit (NICU)
    const vitals4: BedsideMonitorVitals = {
      heartRate: 142,
      spo2: 96,
      perfusionIndex: 1.9,
      systolicBp: 66,
      diastolicBp: 40,
      calculatedMap: WaveformGeneratorEngine.calculateMap(66, 40),
      respirationRate: 44,
      etco2: 37,
      temperatureCore: 36.9,
      temperaturePeripheral: 36.4,
      deltaTemperature: 0.5,
      stDeviationMm: 0.0,
      prIntervalMs: 110,
      qrsDurationMs: 70,
      qtIntervalMs: 275,
      calculatedQtcMs: WaveformGeneratorEngine.calculateQtc(275, 142),
      ratePressureProduct: WaveformGeneratorEngine.calculateRatePressureProduct(142, 66)
    };

    this.registerBed({
      bedId: 'BED-ICU-01',
      bedName: 'ICU Bed 01 - Cardiac Recovery',
      ward: 'ICU',
      patientId: 'P-10024',
      patientName: 'Sokha Chea',
      patientAge: 62,
      patientGender: 'MALE',
      diagnosisKh: 'ការវះកាត់តសរសៃឈាមបេះដូង CABG ដំណាក់កាលតាមដានដំបូង',
      diagnosisEn: 'Post-CABG surgery day 1 hemodynamic monitoring',
      isNeonatal: false,
      vitals: vitals1,
      activeAlarms: [],
      leadStatuses: {
        ecgLead: 'CONNECTED',
        spo2Probe: 'CONNECTED',
        nibpCuff: 'CONNECTED',
        respSensor: 'CONNECTED'
      },
      arrhythmiaState: 'NORMAL_SINUS',
      lastTelemetryTimestamp: nowIso,
      isAudioMuted: false,
      audioMutedRemainingSeconds: 0
    });

    const eval2 = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-ICU-02', vitals2, DEFAULT_ADULT_THRESHOLDS);
    this.registerBed({
      bedId: 'BED-ICU-02',
      bedName: 'ICU Bed 02 - Medical Shock Unit',
      ward: 'ICU',
      patientId: 'P-10088',
      patientName: 'Rathana Meng',
      patientAge: 45,
      patientGender: 'FEMALE',
      diagnosisKh: 'ការឆ្លងរោគធ្ងន់ធ្ងរ Septic Shock សម្ពាធឈាមធ្លាក់ចុះ',
      diagnosisEn: 'Septic shock secondary to severe pyelonephritis',
      isNeonatal: false,
      vitals: vitals2,
      activeAlarms: eval2.alarms,
      leadStatuses: {
        ecgLead: 'CONNECTED',
        spo2Probe: 'CONNECTED',
        nibpCuff: 'CONNECTED',
        respSensor: 'CONNECTED'
      },
      arrhythmiaState: eval2.arrhythmia,
      lastTelemetryTimestamp: nowIso,
      isAudioMuted: false,
      audioMutedRemainingSeconds: 0
    });

    const eval3 = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-ICU-03', vitals3, DEFAULT_ADULT_THRESHOLDS);
    this.registerBed({
      bedId: 'BED-ICU-03',
      bedName: 'ICU Bed 03 - Coronary Care',
      ward: 'CCU',
      patientId: 'P-10112',
      patientName: 'Bopha Chan',
      patientAge: 71,
      patientGender: 'FEMALE',
      diagnosisKh: 'ជំងឺខ្វះឈាមចិញ្ចឹមបេះដូងស្រួចស្រាវ NSTEMI',
      diagnosisEn: 'Acute non-ST elevation myocardial infarction',
      isNeonatal: false,
      vitals: vitals3,
      activeAlarms: eval3.alarms,
      leadStatuses: {
        ecgLead: 'CONNECTED',
        spo2Probe: 'CONNECTED',
        nibpCuff: 'CONNECTED',
        respSensor: 'CONNECTED'
      },
      arrhythmiaState: eval3.arrhythmia,
      lastTelemetryTimestamp: nowIso,
      isAudioMuted: false,
      audioMutedRemainingSeconds: 0
    });

    const eval4 = WaveformGeneratorEngine.detectAlarmsAndArrhythmia('BED-NICU-04', vitals4, DEFAULT_NEONATAL_THRESHOLDS);
    this.registerBed({
      bedId: 'BED-NICU-04',
      bedName: 'NICU Bed 04 - Neonatal Incubator',
      ward: 'NICU',
      patientId: 'P-10901',
      patientName: 'Infant Keo',
      patientAge: 0,
      patientGender: 'MALE',
      diagnosisKh: 'ទារកកើតមិនគ្រប់ខែ វិបត្តិពិបាកដកដង្ហើម RDS',
      diagnosisEn: 'Preterm infant respiratory distress syndrome',
      isNeonatal: true,
      vitals: vitals4,
      activeAlarms: eval4.alarms,
      leadStatuses: {
        ecgLead: 'CONNECTED',
        spo2Probe: 'CONNECTED',
        nibpCuff: 'CONNECTED',
        respSensor: 'CONNECTED'
      },
      arrhythmiaState: eval4.arrhythmia,
      lastTelemetryTimestamp: nowIso,
      isAudioMuted: false,
      audioMutedRemainingSeconds: 0
    });
  }

  private registerBed(device: BedsideMonitorDevice): void {
    this.beds.set(device.bedId, device);
  }

  /**
   * Retrieves all bedside monitors
   */
  public getAllBeds(): BedsideMonitorDevice[] {
    return Array.from(this.beds.values());
  }

  /**
   * Retrieves a specific bedside monitor
   */
  public getBedById(bedId: string): BedsideMonitorDevice {
    const bed = this.beds.get(bedId);
    if (!bed) {
      throw new Error(`Bed with ID ${bedId} not found`);
    }
    return bed;
  }

  /**
   * Updates vital signs telemetry from bedside monitor device or simulation
   */
  public updateBedVitals(bedId: string, partialVitals: Partial<BedsideMonitorVitals>): BedsideMonitorDevice {
    const bed = this.getBedById(bedId);
    const updatedVitals: BedsideMonitorVitals = {
      ...bed.vitals,
      ...partialVitals
    };

    // Recalculate derived clinical indices
    updatedVitals.calculatedMap = WaveformGeneratorEngine.calculateMap(
      updatedVitals.systolicBp,
      updatedVitals.diastolicBp
    );
    updatedVitals.ratePressureProduct = WaveformGeneratorEngine.calculateRatePressureProduct(
      updatedVitals.heartRate,
      updatedVitals.systolicBp
    );
    updatedVitals.calculatedQtcMs = WaveformGeneratorEngine.calculateQtc(
      updatedVitals.qtIntervalMs,
      updatedVitals.heartRate
    );
    updatedVitals.deltaTemperature = Number(
      (updatedVitals.temperatureCore - updatedVitals.temperaturePeripheral).toFixed(1)
    );

    const thresholds = bed.isNeonatal ? DEFAULT_NEONATAL_THRESHOLDS : DEFAULT_ADULT_THRESHOLDS;
    const { arrhythmia, alarms } = WaveformGeneratorEngine.detectAlarmsAndArrhythmia(bedId, updatedVitals, thresholds);

    bed.vitals = updatedVitals;
    bed.arrhythmiaState = arrhythmia;
    bed.activeAlarms = alarms;
    bed.lastTelemetryTimestamp = new Date().toISOString();

    return bed;
  }

  /**
   * Silences audible alarms for a bed device
   * Inviolable IEC 60601-1-8 constraint: maximum silence duration is 120 seconds
   */
  public silenceAlarm(
    bedId: string,
    clinicianId: string,
    requestedSeconds: number = 120
  ): { bedId: string; silencedSeconds: number; expiresAt: string } {
    const bed = this.getBedById(bedId);

    // IEC 60601-1-8 hard limit: cannot exceed 120 seconds
    const sanitizedSeconds = Math.min(120, Math.max(10, requestedSeconds));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sanitizedSeconds * 1000).toISOString();

    bed.isAudioMuted = true;
    bed.audioMutedRemainingSeconds = sanitizedSeconds;

    // Mark active alarms as silenced
    bed.activeAlarms.forEach((alarm) => {
      alarm.isSilenced = true;
      alarm.silencedBy = clinicianId;
      alarm.silencedAt = now.toISOString();
      alarm.silenceExpiresAt = expiresAt;
    });

    this.auditLogs.push({
      timestamp: now.toISOString(),
      bedId,
      action: 'SILENCE_ALARM_IEC_60601_1_8',
      clinicianId,
      details: `Silenced audible telemetry alarms for ${sanitizedSeconds}s. Expires at ${expiresAt}`
    });

    return {
      bedId,
      silencedSeconds: sanitizedSeconds,
      expiresAt
    };
  }

  /**
   * Acknowledges an active alarm
   */
  public acknowledgeAlarm(bedId: string, alarmId: string, clinicianId: string): BedTelemetryAlarm {
    const bed = this.getBedById(bedId);
    const alarm = bed.activeAlarms.find((a) => a.id === alarmId);
    if (!alarm) {
      throw new Error(`Alarm ${alarmId} not found on bed ${bedId}`);
    }

    alarm.isAcknowledged = true;
    alarm.acknowledgedBy = clinicianId;

    this.auditLogs.push({
      timestamp: new Date().toISOString(),
      bedId,
      action: 'ACKNOWLEDGE_ALARM',
      clinicianId,
      details: `Acknowledged alarm ${alarmId} (${alarm.parameterName})`
    });

    return alarm;
  }

  /**
   * Simulates specific arrhythmia event for clinical staff drill or test verification
   */
  public simulateArrhythmia(bedId: string, arrhythmiaType: ArrhythmiaType, clinicianId: string): BedsideMonitorDevice {
    const bed = this.getBedById(bedId);
    const updatedVitals = { ...bed.vitals };

    switch (arrhythmiaType) {
      case 'ASYSTOLE':
        updatedVitals.heartRate = 0;
        updatedVitals.systolicBp = 0;
        updatedVitals.diastolicBp = 0;
        break;
      case 'VENTRICULAR_TACHYCARDIA':
        updatedVitals.heartRate = 175;
        updatedVitals.qrsDurationMs = 150; // wide QRS
        updatedVitals.systolicBp = 72;
        updatedVitals.diastolicBp = 42;
        break;
      case 'EXTREME_BRADYCARDIA':
        updatedVitals.heartRate = 32;
        break;
      case 'EXTREME_TACHYCARDIA':
        updatedVitals.heartRate = 185;
        break;
      case 'ST_ELEVATION_ISCHEMIA':
        updatedVitals.stDeviationMm = 3.2; // acute STEMI
        break;
      case 'APNEA':
        updatedVitals.respirationRate = 0;
        break;
      case 'DESATURATION':
        updatedVitals.spo2 = 82;
        break;
      case 'NORMAL_SINUS':
      default:
        updatedVitals.heartRate = 72;
        updatedVitals.qrsDurationMs = 90;
        updatedVitals.stDeviationMm = 0.0;
        updatedVitals.respirationRate = 16;
        updatedVitals.spo2 = 99;
        updatedVitals.systolicBp = 120;
        updatedVitals.diastolicBp = 75;
        break;
    }

    this.auditLogs.push({
      timestamp: new Date().toISOString(),
      bedId,
      action: 'SIMULATE_ARRHYTHMIA',
      clinicianId,
      details: `Simulated arrhythmia ${arrhythmiaType}`
    });

    return this.updateBedVitals(bedId, updatedVitals);
  }

  /**
   * Streams a batch of real-time synchronized waveform points
   */
  public getWaveformBatch(
    bedId: string,
    pointCount: number = 60,
    sampleRateHz: number = 60
  ): { bedId: string; points: WaveformPoint[] } {
    const bed = this.getBedById(bedId);
    const nowMs = Date.now();
    const points = WaveformGeneratorEngine.generateWaveformBatch(
      nowMs,
      pointCount,
      sampleRateHz,
      bed.vitals,
      bed.arrhythmiaState
    );

    return {
      bedId,
      points
    };
  }

  /**
   * Returns audit logs
   */
  public getAuditLogs() {
    return [...this.auditLogs];
  }
}
