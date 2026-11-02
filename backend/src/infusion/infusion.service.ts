/**
 * Smart Infusion Pump Bedside Service & IoT Telemetry Coordinator
 * Manages bedside pump state machines, active infusions, DERS guardrail enforcement, and PCA bolus tracking
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DERS_DRUG_LIBRARY,
  DersDrugProfile,
  VascularRoute,
} from './ders-guardrails.library.ts';
import {
  InfusionPumpEngine,
  DoseCalculationResult,
  PcaBolusValidationResult,
  PumpTelemetryAnalysis,
} from './infusion-pump.engine.ts';

export interface BedsidePumpSession {
  pumpId: string;
  pumpSerialNumber: string;
  bedIdentifier: string;
  wardDepartment: string;
  status: 'STANDBY' | 'INFUSING' | 'PAUSED' | 'ALARM_ACTIVE' | 'KVO_MODE';
  patientId?: string;
  patientNameKh?: string;
  patientNameEn?: string;
  patientWeightKg?: number;
  vascularRoute?: VascularRoute;
  substanceCode?: string;
  substanceNameEn?: string;
  substanceNameKh?: string;
  prescribedDose?: number;
  dosingUnit?: string;
  concentrationId?: string;
  rateMlPerHour: number;
  gravityDropsPerMinute: {
    macro15Gtt: number;
    micro60Gtt: number;
  };
  volumeToBeInfusedMl: number;
  volumeInfusedMl: number;
  remainingMinutes: number;
  linePressureMmHg: number;
  airBubbleDetected: boolean;
  batteryPercentage: number;
  startedAt?: string;
  lastTitratedAt?: string;
  assignedNurseStaffId?: string;
  activeAlarms: Array<{ code: string; severity: string; messageKh: string; messageEn: string }>;
  pcaBolusHistory: Array<{ timestamp: string; doseMcg: number; wasDelivered: boolean }>;
}

export const BedsidePumpSession = {};

export class BedsideInfusionService {
  private activePumps: Map<string, BedsidePumpSession> = new Map();

  constructor() {
    this.seedDefaultBedsidePumps();
  }

  private seedDefaultBedsidePumps(): void {
    const defaultPumps: BedsidePumpSession[] = [
      {
        pumpId: 'PUMP-ICU-01',
        pumpSerialNumber: 'SN-BBRAUN-2026-9901',
        bedIdentifier: 'ICU-BED-01',
        wardDepartment: 'Intensive Care Unit (ICU)',
        status: 'INFUSING',
        patientId: 'PT-KHM-00192',
        patientNameKh: 'កែវ សុខា',
        patientNameEn: 'Keo Sokha',
        patientWeightKg: 65,
        vascularRoute: 'CENTRAL_LINE',
        substanceCode: 'DRUG-NOREP-01',
        substanceNameEn: 'Norepinephrine Bitartrate',
        substanceNameKh: 'ណរអេពីណេហ្វ្រីន - Levophed',
        prescribedDose: 0.15,
        dosingUnit: 'mcg/kg/min',
        concentrationId: 'CONC-NOREP-STD',
        rateMlPerHour: 36.56,
        gravityDropsPerMinute: { macro15Gtt: 9, micro60Gtt: 37 },
        volumeToBeInfusedMl: 250,
        volumeInfusedMl: 142.5,
        remainingMinutes: 176,
        linePressureMmHg: 112,
        airBubbleDetected: false,
        batteryPercentage: 98,
        startedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        lastTitratedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        assignedNurseStaffId: 'STAFF-RN-01',
        activeAlarms: [],
        pcaBolusHistory: [],
      },
      {
        pumpId: 'PUMP-ICU-02',
        pumpSerialNumber: 'SN-BBRAUN-2026-9902',
        bedIdentifier: 'ICU-BED-02',
        wardDepartment: 'Intensive Care Unit (ICU)',
        status: 'INFUSING',
        patientId: 'PT-KHM-00204',
        patientNameKh: 'ស៊ុន ចាន់ដា',
        patientNameEn: 'Sun Chanda',
        patientWeightKg: 70,
        vascularRoute: 'CENTRAL_LINE',
        substanceCode: 'DRUG-PROP-05',
        substanceNameEn: 'Propofol 1% Emulsion',
        substanceNameKh: 'ប្រូប៉ូហ្វូល ១ ភាគរយ - សណ្តំសន្លប់',
        prescribedDose: 30.0,
        dosingUnit: 'mcg/kg/min',
        concentrationId: 'CONC-PROP-NEAT',
        rateMlPerHour: 12.6,
        gravityDropsPerMinute: { macro15Gtt: 3, micro60Gtt: 13 },
        volumeToBeInfusedMl: 100,
        volumeInfusedMl: 48.0,
        remainingMinutes: 248,
        linePressureMmHg: 95,
        airBubbleDetected: false,
        batteryPercentage: 92,
        startedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        assignedNurseStaffId: 'STAFF-RN-02',
        activeAlarms: [],
        pcaBolusHistory: [],
      },
      {
        pumpId: 'PUMP-POSTOP-03',
        pumpSerialNumber: 'SN-ALARIS-2026-8814',
        bedIdentifier: 'SURG-BED-04',
        wardDepartment: 'Surgical Post-Op Recovery',
        status: 'INFUSING',
        patientId: 'PT-KHM-00331',
        patientNameKh: 'ម៉ៅ វណ្ណារិទ្ធ',
        patientNameEn: 'Mao Vannarith',
        patientWeightKg: 60,
        vascularRoute: 'PERIPHERAL_IV',
        substanceCode: 'DRUG-FENT-07',
        substanceNameEn: 'Fentanyl Citrate',
        substanceNameKh: 'ហ្វេនតានីល - ថ្នាំបំបាត់ការឈឺចាប់ខ្លាំង',
        prescribedDose: 50.0,
        dosingUnit: 'mcg/hr',
        concentrationId: 'CONC-FENT-STD',
        rateMlPerHour: 5.0,
        gravityDropsPerMinute: { macro15Gtt: 1, micro60Gtt: 5 },
        volumeToBeInfusedMl: 100,
        volumeInfusedMl: 25.0,
        remainingMinutes: 900,
        linePressureMmHg: 130,
        airBubbleDetected: false,
        batteryPercentage: 88,
        startedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        assignedNurseStaffId: 'STAFF-RN-03',
        activeAlarms: [],
        pcaBolusHistory: [
          { timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), doseMcg: 20, wasDelivered: true },
        ],
      },
      {
        pumpId: 'PUMP-ER-04',
        pumpSerialNumber: 'SN-ALARIS-2026-7711',
        bedIdentifier: 'ER-BAY-02',
        wardDepartment: 'Emergency Department (ER)',
        status: 'STANDBY',
        rateMlPerHour: 0,
        gravityDropsPerMinute: { macro15Gtt: 0, micro60Gtt: 0 },
        volumeToBeInfusedMl: 0,
        volumeInfusedMl: 0,
        remainingMinutes: 0,
        linePressureMmHg: 45,
        airBubbleDetected: false,
        batteryPercentage: 100,
        activeAlarms: [],
        pcaBolusHistory: [],
      },
    ];

    for (const p of defaultPumps) {
      this.activePumps.set(p.pumpId, p);
    }
  }

  public getDrugLibrary(): DersDrugProfile[] {
    return DERS_DRUG_LIBRARY;
  }

  public getDrugByCode(code: string): DersDrugProfile {
    const drug = InfusionPumpEngine.findDrugProfile(code);
    if (!drug) {
      throw new NotFoundException(`DERS drug profile not found for code ${code}`);
    }
    return drug;
  }

  public calculateDose(params: {
    substanceCode: string;
    prescribedDose: number;
    patientWeightKg?: number;
    concentrationId?: string;
    route?: VascularRoute;
  }): DoseCalculationResult {
    return InfusionPumpEngine.calculateDoseAndEnforceGuardrails(params);
  }

  public getAllPumps(): BedsidePumpSession[] {
    return Array.from(this.activePumps.values());
  }

  public getPumpById(pumpId: string): BedsidePumpSession {
    const pump = this.activePumps.get(pumpId);
    if (!pump) {
      throw new NotFoundException(`Bedside infusion pump ${pumpId} not found`);
    }
    return pump;
  }

  /**
   * Program & Start Infusion with DERS Safety Enforcement
   */
  public startInfusion(params: {
    pumpId: string;
    patientId: string;
    patientNameKh: string;
    patientNameEn: string;
    patientWeightKg?: number;
    vascularRoute: VascularRoute;
    substanceCode: string;
    prescribedDose: number;
    concentrationId?: string;
    volumeToBeInfusedMl: number;
    nurseStaffId: string;
    physicianOverrideReason?: string;
  }): { success: boolean; pump: BedsidePumpSession; guardrailResult: DoseCalculationResult } {
    const pump = this.getPumpById(params.pumpId);

    // 1. Run DERS Guardrail Calculation
    const calc = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
      substanceCode: params.substanceCode,
      prescribedDose: params.prescribedDose,
      patientWeightKg: params.patientWeightKg,
      concentrationId: params.concentrationId,
      route: params.vascularRoute,
    });

    // 2. Enforce Hard Limits (Fatal pump lockout)
    if (calc.isFatalRejection) {
      throw new BadRequestException(`DERS Hard Limit Violation: ${calc.guardrailMessageEn}`);
    }

    // 3. Enforce Soft Limits (Requires physician override justification)
    if (calc.requiresPhysicianOverride && !params.physicianOverrideReason) {
      throw new BadRequestException(
        `DERS Soft Limit Advisory: Dose ${params.prescribedDose} requires a documented physician override reason`,
      );
    }

    // 4. Update Pump Session State
    pump.status = 'INFUSING';
    pump.patientId = params.patientId;
    pump.patientNameKh = params.patientNameKh;
    pump.patientNameEn = params.patientNameEn;
    pump.patientWeightKg = params.patientWeightKg;
    pump.vascularRoute = params.vascularRoute;
    pump.substanceCode = params.substanceCode;
    pump.substanceNameEn = calc.genericNameEn;
    pump.substanceNameKh = calc.genericNameKh;
    pump.prescribedDose = params.prescribedDose;
    pump.dosingUnit = calc.dosingUnit;
    pump.concentrationId = calc.selectedConcentration.id;
    pump.rateMlPerHour = calc.calculatedRateMlPerHour;
    pump.gravityDropsPerMinute = {
      macro15Gtt: calc.gravityDropsPerMinute.macro15Gtt,
      micro60Gtt: calc.gravityDropsPerMinute.micro60Gtt,
    };
    pump.volumeToBeInfusedMl = params.volumeToBeInfusedMl;
    pump.volumeInfusedMl = 0;
    pump.remainingMinutes = calc.calculatedRateMlPerHour > 0
      ? Math.round((params.volumeToBeInfusedMl / calc.calculatedRateMlPerHour) * 60)
      : 0;
    pump.startedAt = new Date().toISOString();
    pump.assignedNurseStaffId = params.nurseStaffId;
    pump.activeAlarms = [];

    return {
      success: true,
      pump,
      guardrailResult: calc,
    };
  }

  /**
   * Titrate Infusion Rate at Bedside
   */
  public titrateDose(params: {
    pumpId: string;
    newDose: number;
    nurseStaffId: string;
    physicianOverrideReason?: string;
  }): { success: boolean; pump: BedsidePumpSession; guardrailResult: DoseCalculationResult } {
    const pump = this.getPumpById(params.pumpId);

    if (!pump.substanceCode) {
      throw new BadRequestException(`Pump ${params.pumpId} has no active medication configured to titrate`);
    }

    const calc = InfusionPumpEngine.calculateDoseAndEnforceGuardrails({
      substanceCode: pump.substanceCode,
      prescribedDose: params.newDose,
      patientWeightKg: pump.patientWeightKg,
      concentrationId: pump.concentrationId,
      route: pump.vascularRoute,
    });

    if (calc.isFatalRejection) {
      throw new BadRequestException(`DERS Hard Limit Violation: ${calc.guardrailMessageEn}`);
    }

    if (calc.requiresPhysicianOverride && !params.physicianOverrideReason) {
      throw new BadRequestException(
        `DERS Soft Limit Advisory: Dose ${params.newDose} requires a documented physician override reason`,
      );
    }

    pump.prescribedDose = params.newDose;
    pump.rateMlPerHour = calc.calculatedRateMlPerHour;
    pump.gravityDropsPerMinute = {
      macro15Gtt: calc.gravityDropsPerMinute.macro15Gtt,
      micro60Gtt: calc.gravityDropsPerMinute.micro60Gtt,
    };
    pump.lastTitratedAt = new Date().toISOString();

    const remainingVolume = Math.max(0, pump.volumeToBeInfusedMl - pump.volumeInfusedMl);
    pump.remainingMinutes = calc.calculatedRateMlPerHour > 0
      ? Math.round((remainingVolume / calc.calculatedRateMlPerHour) * 60)
      : 0;

    return {
      success: true,
      pump,
      guardrailResult: calc,
    };
  }

  /**
   * Patient-Controlled Analgesia (PCA) Demand Bolus Request
   */
  public requestPcaDemand(params: {
    pumpId: string;
    requestedBolusMcg: number;
  }): PcaBolusValidationResult {
    const pump = this.getPumpById(params.pumpId);

    if (!pump.substanceCode) {
      throw new BadRequestException('Pump is not running a PCA protocol');
    }

    const drug = this.getDrugByCode(pump.substanceCode);

    // Calculate minutes since last bolus
    const lastSuccessfulBolus = [...pump.pcaBolusHistory]
      .reverse()
      .find((b) => b.wasDelivered);

    const minutesSinceLast = lastSuccessfulBolus
      ? (Date.now() - new Date(lastSuccessfulBolus.timestamp).getTime()) / 60000
      : 999;

    // Calculate 4-hour cumulative delivered mcg
    const fourHoursAgo = Date.now() - 4 * 3600 * 1000;
    const currentFourHourTotal = pump.pcaBolusHistory
      .filter((b) => b.wasDelivered && new Date(b.timestamp).getTime() >= fourHoursAgo)
      .reduce((sum, b) => sum + b.doseMcg, 0);

    const validation = InfusionPumpEngine.validatePcaBolus({
      profile: drug,
      requestedBolusMcg: params.requestedBolusMcg,
      minutesSinceLastBolus: minutesSinceLast,
      currentFourHourTotalMcg: currentFourHourTotal,
    });

    pump.pcaBolusHistory.push({
      timestamp: new Date().toISOString(),
      doseMcg: params.requestedBolusMcg,
      wasDelivered: validation.isAllowed,
    });

    return validation;
  }

  /**
   * Process Telemetry Sensor Update from Bedside IoT Hardware
   */
  public updateTelemetry(pumpId: string, telemetry: {
    linePressureMmHg: number;
    airBubbleDetected: boolean;
    clampClosed?: boolean;
    batteryPercentage: number;
    volumeInfusedIncrementMl?: number;
  }): PumpTelemetryAnalysis {
    const pump = this.getPumpById(pumpId);

    pump.linePressureMmHg = telemetry.linePressureMmHg;
    pump.airBubbleDetected = telemetry.airBubbleDetected;
    pump.batteryPercentage = telemetry.batteryPercentage;

    if (telemetry.volumeInfusedIncrementMl && telemetry.volumeInfusedIncrementMl > 0) {
      pump.volumeInfusedMl = Math.min(
        pump.volumeToBeInfusedMl,
        Number((pump.volumeInfusedMl + telemetry.volumeInfusedIncrementMl).toFixed(2)),
      );
    }

    const analysis = InfusionPumpEngine.processSensorTelemetry({
      linePressureMmHg: telemetry.linePressureMmHg,
      airBubbleDetected: telemetry.airBubbleDetected,
      clampClosed: telemetry.clampClosed ?? false,
      batteryPercentage: telemetry.batteryPercentage,
      volumeInfusedMl: pump.volumeInfusedMl,
      volumeToBeInfusedMl: pump.volumeToBeInfusedMl,
      currentRateMlPerHour: pump.rateMlPerHour,
    });

    pump.remainingMinutes = analysis.estimatedMinutesRemaining;
    pump.activeAlarms = analysis.alarms;

    if (analysis.status === 'ALARM_AIR_IN_LINE' || analysis.status === 'ALARM_OCCLUSION') {
      pump.status = 'ALARM_ACTIVE';
    } else if (analysis.status === 'ALARM_COMPLETE') {
      pump.status = 'KVO_MODE';
      pump.rateMlPerHour = 1.0; // KVO 1.0 mL/hr
    }

    return analysis;
  }

  /**
   * Pause / Resume Pump
   */
  public togglePause(pumpId: string): BedsidePumpSession {
    const pump = this.getPumpById(pumpId);
    if (pump.status === 'INFUSING') {
      pump.status = 'PAUSED';
    } else if (pump.status === 'PAUSED' || pump.status === 'ALARM_ACTIVE') {
      pump.status = 'INFUSING';
      pump.activeAlarms = [];
      pump.airBubbleDetected = false;
    }
    return pump;
  }

  /**
   * Stop Infusion & Clear Channel
   */
  public stopInfusion(pumpId: string): BedsidePumpSession {
    const pump = this.getPumpById(pumpId);
    pump.status = 'STANDBY';
    pump.rateMlPerHour = 0;
    pump.remainingMinutes = 0;
    pump.activeAlarms = [];
    return pump;
  }
}
