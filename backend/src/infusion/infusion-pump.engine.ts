/**
 * Smart Infusion Pump Dose Error Reduction System (DERS) & IV Drip Calculation Engine
 * Mathematical safety calculations, DERS guardrail enforcement, and IoT telemetry sensor processing
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

import {
  DERS_DRUG_LIBRARY,
  DersDrugProfile,
  DersConcentration,
  VascularRoute,
  GuardrailSeverity,
} from './ders-guardrails.library.ts';

export type DropFactor = 10 | 15 | 20 | 60; // gtt/ml tubing sets
export const DropFactor = {};

export interface DoseCalculationResult {
  substanceCode: string;
  genericNameEn: string;
  genericNameKh: string;
  prescribedDose: number;
  dosingUnit: string;
  patientWeightKg?: number;
  selectedConcentration: DersConcentration;
  calculatedRateMlPerHour: number;
  gravityDropsPerMinute: {
    macro10Gtt: number;
    macro15Gtt: number;
    macro20Gtt: number;
    micro60Gtt: number;
  };
  guardrailStatus: GuardrailSeverity;
  guardrailMessageKh: string;
  guardrailMessageEn: string;
  requiresPhysicianOverride: boolean;
  isFatalRejection: boolean;
}

export interface PcaBolusValidationResult {
  isAllowed: boolean;
  bolusDoseMcg: number;
  lockoutMinutesRemaining: number;
  fourHourCumulativeMcg: number;
  rejectionReasonKh?: string;
  rejectionReasonEn?: string;
}

export interface PumpTelemetrySensorInput {
  linePressureMmHg: number;
  airBubbleDetected: boolean;
  bubbleSizeMicroliters?: number;
  clampClosed: boolean;
  batteryPercentage: number;
  volumeInfusedMl: number;
  volumeToBeInfusedMl: number;
  currentRateMlPerHour: number;
}

export interface PumpTelemetryAnalysis {
  status: 'INFUSING' | 'PAUSED' | 'ALARM_OCCLUSION' | 'ALARM_AIR_IN_LINE' | 'ALARM_COMPLETE' | 'ALARM_BATTERY';
  isFlowBlocked: boolean;
  alarms: Array<{
    code: string;
    severity: 'WARNING' | 'CRITICAL';
    messageKh: string;
    messageEn: string;
  }>;
  estimatedMinutesRemaining: number;
}

export const DoseCalculationResult = {};
export const PcaBolusValidationResult = {};
export const PumpTelemetrySensorInput = {};
export const PumpTelemetryAnalysis = {};

export class InfusionPumpEngine {
  /**
   * Find drug profile in the DERS library
   */
  public static findDrugProfile(substanceCode: string): DersDrugProfile | undefined {
    return DERS_DRUG_LIBRARY.find((d) => d.substanceCode === substanceCode);
  }

  /**
   * Compute IV Pump rate in mL/hr from prescribed clinical dose
   */
  public static calculateMlPerHourRate(params: {
    profile: DersDrugProfile;
    prescribedDose: number;
    patientWeightKg?: number;
    concentration: DersConcentration;
  }): number {
    const { profile, prescribedDose, patientWeightKg, concentration } = params;

    if (prescribedDose <= 0) {
      throw new Error('Prescribed dose must be strictly greater than zero');
    }

    if (concentration.calculatedConcentrationPerMl <= 0) {
      throw new Error('Invalid drug concentration: Concentration per mL must be positive');
    }

    // Weight-based dosing: mcg/kg/min -> mL/hr
    if (profile.dosingUnit === 'mcg/kg/min') {
      if (!patientWeightKg || patientWeightKg <= 0) {
        throw new Error(`Patient weight in kg is strictly required for weight-based drug ${profile.genericNameEn}`);
      }
      // Dose (mcg/kg/min) * Weight (kg) * 60 min/hr / Concentration (mcg/mL)
      const mcgPerHour = prescribedDose * patientWeightKg * 60;
      const mlPerHour = mcgPerHour / concentration.calculatedConcentrationPerMl;
      return Number(mlPerHour.toFixed(2));
    }

    // Weight-based dosing: mg/kg/hr -> mL/hr
    if (profile.dosingUnit === 'mg/kg/hr') {
      if (!patientWeightKg || patientWeightKg <= 0) {
        throw new Error(`Patient weight in kg is strictly required for weight-based drug ${profile.genericNameEn}`);
      }
      const mgPerHour = prescribedDose * patientWeightKg;
      // concentration.calculatedConcentrationPerMl in base units (mcg/ml or mg/ml)
      const concMgPerMl = concentration.drugAmountUnit === 'mg'
        ? concentration.drugAmount / concentration.diluentVolumeMl
        : concentration.calculatedConcentrationPerMl / 1000;
      const mlPerHour = mgPerHour / concMgPerMl;
      return Number(mlPerHour.toFixed(2));
    }

    // Fixed hourly dosing: units/hr, mEq/hr, mcg/hr -> mL/hr
    // Dose / ConcentrationPerMl
    const mlPerHour = prescribedDose / concentration.calculatedConcentrationPerMl;
    return Number(mlPerHour.toFixed(2));
  }

  /**
   * Calculate gravity drip drops per minute: gtt/min = (mL/hr * dropFactor) / 60
   */
  public static calculateGravityDripsPerMinute(mlPerHour: number, dropFactor: DropFactor): number {
    if (mlPerHour <= 0) return 0;
    const gttPerMin = (mlPerHour * dropFactor) / 60;
    return Math.round(gttPerMin);
  }

  /**
   * Comprehensive DERS Guardrail Validation
   */
  public static validateGuardrails(params: {
    profile: DersDrugProfile;
    prescribedDose: number;
    route?: VascularRoute;
  }): {
    severity: GuardrailSeverity;
    messageKh: string;
    messageEn: string;
    requiresPhysicianOverride: boolean;
    isFatalRejection: boolean;
  } {
    const { profile, prescribedDose, route = 'CENTRAL_LINE' } = params;
    const { guardrails } = profile;

    // 1. Check Hard Limits (Fatal Block)
    if (prescribedDose > guardrails.hardMax) {
      return {
        severity: 'HARD_LIMIT_BREACH',
        messageKh: `កម្រិតថ្នាំ ${prescribedDose} ${profile.dosingUnit} លើសពីកម្រិតគ្រោះថ្នាក់ស្លាប់ Hard Max ${guardrails.hardMax} - ម៉ាស៊ីនបដិសេធការបញ្ជាដោយស្វ័យប្រវត្ត`,
        messageEn: `Prescribed dose ${prescribedDose} ${profile.dosingUnit} exceeds lethal Hard Maximum ${guardrails.hardMax}: Fatal pump lockout enforced`,
        requiresPhysicianOverride: false,
        isFatalRejection: true,
      };
    }

    if (prescribedDose < guardrails.hardMin) {
      return {
        severity: 'HARD_LIMIT_BREACH',
        messageKh: `កម្រិតថ្នាំ ${prescribedDose} ${profile.dosingUnit} ទាបជាងកម្រិតអប្បបរមា Hard Min ${guardrails.hardMin} - ម៉ាស៊ីនបដិសេធការបញ្ជា`,
        messageEn: `Prescribed dose ${prescribedDose} ${profile.dosingUnit} is below Hard Minimum ${guardrails.hardMin}: Pump lockout enforced`,
        requiresPhysicianOverride: false,
        isFatalRejection: true,
      };
    }

    // 2. Check Route-Specific Hard Limits (e.g. Peripheral KCl or Norepinephrine)
    if (guardrails.routeSpecificLimits && guardrails.routeSpecificLimits[route]) {
      const routeLimit = guardrails.routeSpecificLimits[route]!;
      if (prescribedDose > routeLimit.hardMax) {
        return {
          severity: 'HARD_LIMIT_BREACH',
          messageKh: routeLimit.alertReasonKh,
          messageEn: routeLimit.alertReasonEn,
          requiresPhysicianOverride: false,
          isFatalRejection: true,
        };
      }
    }

    // 3. Check Soft Limits (Advisory Warning requiring Physician Override Reason)
    if (prescribedDose > guardrails.softMax) {
      return {
        severity: 'SOFT_LIMIT_BREACH',
        messageKh: `កម្រិតថ្នាំ ${prescribedDose} ${profile.dosingUnit} លើសពីកម្រិតណែនាំ Soft Max ${guardrails.softMax} - តម្រូវឱ្យវេជ្ជបណ្ឌិតបញ្ជាក់មូលហេតុព្យាបាលច្បាស់លាស់`,
        messageEn: `Prescribed dose ${prescribedDose} ${profile.dosingUnit} exceeds advisory Soft Maximum ${guardrails.softMax}: Physician override justification required`,
        requiresPhysicianOverride: true,
        isFatalRejection: false,
      };
    }

    if (prescribedDose < guardrails.softMin) {
      return {
        severity: 'SOFT_LIMIT_BREACH',
        messageKh: `កម្រិតថ្នាំ ${prescribedDose} ${profile.dosingUnit} ទាបជាងកម្រិតណែនាំ Soft Min ${guardrails.softMin} - តម្រូវឱ្យវេជ្ជបណ្ឌិតបញ្ជាក់មូលហេតុ`,
        messageEn: `Prescribed dose ${prescribedDose} ${profile.dosingUnit} is below advisory Soft Minimum ${guardrails.softMin}: Physician override justification required`,
        requiresPhysicianOverride: true,
        isFatalRejection: false,
      };
    }

    return {
      severity: 'SAFE',
      messageKh: 'កម្រិតថ្នាំស្ថិតក្នុងដែនសុវត្ថិភាពស្តង់ដារ',
      messageEn: 'Prescribed dose is within standard clinical guardrails',
      requiresPhysicianOverride: false,
      isFatalRejection: false,
    };
  }

  /**
   * Full Execution Calculation & Safety Assessment
   */
  public static calculateDoseAndEnforceGuardrails(params: {
    substanceCode: string;
    prescribedDose: number;
    patientWeightKg?: number;
    concentrationId?: string;
    route?: VascularRoute;
  }): DoseCalculationResult {
    const profile = this.findDrugProfile(params.substanceCode);
    if (!profile) {
      throw new Error(`Substance code ${params.substanceCode} not recognized in DERS clinical drug library`);
    }

    const concentration = params.concentrationId
      ? profile.standardConcentrations.find((c) => c.id === params.concentrationId) || profile.standardConcentrations[0]
      : profile.standardConcentrations[0];

    const mlPerHour = this.calculateMlPerHourRate({
      profile,
      prescribedDose: params.prescribedDose,
      patientWeightKg: params.patientWeightKg,
      concentration,
    });

    const guardrail = this.validateGuardrails({
      profile,
      prescribedDose: params.prescribedDose,
      route: params.route,
    });

    return {
      substanceCode: profile.substanceCode,
      genericNameEn: profile.genericNameEn,
      genericNameKh: profile.genericNameKh,
      prescribedDose: params.prescribedDose,
      dosingUnit: profile.dosingUnit,
      patientWeightKg: params.patientWeightKg,
      selectedConcentration: concentration,
      calculatedRateMlPerHour: mlPerHour,
      gravityDropsPerMinute: {
        macro10Gtt: this.calculateGravityDripsPerMinute(mlPerHour, 10),
        macro15Gtt: this.calculateGravityDripsPerMinute(mlPerHour, 15),
        macro20Gtt: this.calculateGravityDripsPerMinute(mlPerHour, 20),
        micro60Gtt: this.calculateGravityDripsPerMinute(mlPerHour, 60),
      },
      guardrailStatus: guardrail.severity,
      guardrailMessageKh: guardrail.messageKh,
      guardrailMessageEn: guardrail.messageEn,
      requiresPhysicianOverride: guardrail.requiresPhysicianOverride,
      isFatalRejection: guardrail.isFatalRejection,
    };
  }

  /**
   * Validate Patient-Controlled Analgesia (PCA) Bolus Request
   */
  public static validatePcaBolus(params: {
    profile: DersDrugProfile;
    requestedBolusMcg: number;
    minutesSinceLastBolus: number;
    currentFourHourTotalMcg: number;
  }): PcaBolusValidationResult {
    const { profile, requestedBolusMcg, minutesSinceLastBolus, currentFourHourTotalMcg } = params;

    if (!profile.pcaConfig || !profile.pcaConfig.isPcaAllowed) {
      return {
        isAllowed: false,
        bolusDoseMcg: requestedBolusMcg,
        lockoutMinutesRemaining: 0,
        fourHourCumulativeMcg: currentFourHourTotalMcg,
        rejectionReasonKh: 'ថ្នាំនេះមិនត្រូវបានអនុញ្ញាតឱ្យប្រើប្រាស់ជាទម្រង់ប៊ូតុងចុចបំបាត់ការឈឺចាប់ PCA ឡើយ',
        rejectionReasonEn: 'PCA protocol is not authorized for this medication',
      };
    }

    const { hardMaxBolusDose, standardLockoutMinutes, hardMinLockoutMinutes, fourHourMaxLimit } = profile.pcaConfig;

    // 1. Bolus dose ceiling check
    if (requestedBolusMcg > hardMaxBolusDose) {
      return {
        isAllowed: false,
        bolusDoseMcg: requestedBolusMcg,
        lockoutMinutesRemaining: 0,
        fourHourCumulativeMcg: currentFourHourTotalMcg,
        rejectionReasonKh: `កម្រិតថ្នាំប៊ូតុងចុច ${requestedBolusMcg} mcg លើសពីកម្រិតអតិបរមាអនុញ្ញាត ${hardMaxBolusDose} mcg`,
        rejectionReasonEn: `Requested bolus ${requestedBolusMcg} mcg exceeds hard bolus ceiling of ${hardMaxBolusDose} mcg`,
      };
    }

    // 2. Lockout interval check
    if (minutesSinceLastBolus < hardMinLockoutMinutes) {
      const remaining = Number((standardLockoutMinutes - minutesSinceLastBolus).toFixed(1));
      return {
        isAllowed: false,
        bolusDoseMcg: requestedBolusMcg,
        lockoutMinutesRemaining: Math.max(0, remaining),
        fourHourCumulativeMcg: currentFourHourTotalMcg,
        rejectionReasonKh: `ស្ថិតក្នុងរយៈពេលចាក់សោសុវត្ថិភាព Lockout - នៅសល់ ${remaining} នាទីទៀតទើបអាចចុចបាន`,
        rejectionReasonEn: `PCA lockout active: Please wait ${remaining} minutes before subsequent bolus`,
      };
    }

    // 3. Four-hour cumulative limit check
    if (currentFourHourTotalMcg + requestedBolusMcg > fourHourMaxLimit) {
      return {
        isAllowed: false,
        bolusDoseMcg: requestedBolusMcg,
        lockoutMinutesRemaining: 0,
        fourHourCumulativeMcg: currentFourHourTotalMcg,
        rejectionReasonKh: `កម្រិតថ្នាំសរុបក្នុងរយៈពេល ៤ ម៉ោងលើសពីដែនកំណត់ ${fourHourMaxLimit} mcg`,
        rejectionReasonEn: `Cumulative 4-hour limit of ${fourHourMaxLimit} mcg reached: PCA locked until window advances`,
      };
    }

    return {
      isAllowed: true,
      bolusDoseMcg: requestedBolusMcg,
      lockoutMinutesRemaining: standardLockoutMinutes,
      fourHourCumulativeMcg: currentFourHourTotalMcg + requestedBolusMcg,
    };
  }

  /**
   * Process Bedside IoT Infusion Pump Sensor Telemetry
   */
  public static processSensorTelemetry(input: PumpTelemetrySensorInput): PumpTelemetryAnalysis {
    const alarms: Array<{ code: string; severity: 'WARNING' | 'CRITICAL'; messageKh: string; messageEn: string }> = [];
    let isFlowBlocked = false;
    let status: PumpTelemetryAnalysis['status'] = 'INFUSING';

    // 1. Air-in-line ultrasonic bubble detection
    if (input.airBubbleDetected) {
      isFlowBlocked = true;
      status = 'ALARM_AIR_IN_LINE';
      alarms.push({
        code: 'ALARM_AIR_IN_LINE',
        severity: 'CRITICAL',
        messageKh: 'រកឃើញពពុះខ្យល់ក្នុងទុយោសេរ៉ូម - ម៉ាស៊ីនបានផ្អាកការចាក់ជាបន្ទាន់ដើម្បីការពារខ្យល់ចូលសរសៃឈាម',
        messageEn: 'Ultrasonic air-in-line bubble detected: Pump automatically paused to prevent air embolism',
      });
    }

    // 2. Clamp or line occlusion pressure check (normal: 50-250 mmHg; occlusion: > 450 mmHg)
    if (input.clampClosed || input.linePressureMmHg > 450) {
      isFlowBlocked = true;
      status = 'ALARM_OCCLUSION';
      alarms.push({
        code: 'ALARM_OCCLUSION_DOWNSTREAM',
        severity: 'CRITICAL',
        messageKh: `សម្ពាធទុយោឡើងខ្ពស់ ${input.linePressureMmHg} mmHg - រកឃើញការកកស្ទះ ឬគៀបទុយោខាងក្រោម`,
        messageEn: `Downstream occlusion detected at ${input.linePressureMmHg} mmHg: Check for kinked tubing or closed roller clamp`,
      });
    }

    // 3. Infusion Completion check
    const remainingVolume = Math.max(0, input.volumeToBeInfusedMl - input.volumeInfusedMl);
    if (remainingVolume <= 0 && input.volumeToBeInfusedMl > 0) {
      status = 'ALARM_COMPLETE';
      alarms.push({
        code: 'INFUSION_COMPLETE_KVO',
        severity: 'WARNING',
        messageKh: 'ការចាក់សេរ៉ូមបានចប់សព្វគ្រប់ - ម៉ាស៊ីនប្តូរទៅល្បឿនថែរក្សាសរសៃ Keep Vein Open ល្បឿន ១ ml ក្នុងមួយម៉ោង',
        messageEn: 'Target volume infused: Switched to Keep Vein Open (KVO) mode at 1.0 mL/hr',
      });
    }

    // 4. Low battery alarm (< 15%)
    if (input.batteryPercentage <= 15) {
      alarms.push({
        code: 'BATTERY_LOW_PLUG_AC',
        severity: 'WARNING',
        messageKh: `ថ្មម៉ាស៊ីននៅសល់ត្រឹម ${input.batteryPercentage}% - សូមដោតខ្សែភ្លើងបន្ទាន់`,
        messageEn: `Battery critically low at ${input.batteryPercentage}%: Connect to AC mains power immediately`,
      });
    }

    // Estimated minutes remaining: (RemainingVolume / RateMlPerHour) * 60
    const estimatedMinutesRemaining = input.currentRateMlPerHour > 0
      ? Math.round((remainingVolume / input.currentRateMlPerHour) * 60)
      : 0;

    return {
      status,
      isFlowBlocked,
      alarms,
      estimatedMinutesRemaining,
    };
  }
}
