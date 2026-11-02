// Service layer for Emergency Sepsis & Trauma Resuscitation Protocol Engine
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { ResuscitationMathEngine } from './resuscitation-math.engine.ts';
import {
  QsofaAssessment,
  SofaOrganScores,
  SepsisHourOneBundlePlan,
  LactateClearanceKinetics,
  ParklandBurnCalculation,
  BurnUopTitrationFeedback,
  PediatricResuscitationCard,
  ShockIndexAssessment,
  MassiveTransfusionProtocolAssessment,
} from './resuscitation.types.ts';

export class ResuscitationService {
  /**
   * Evaluates comprehensive sepsis risk and generates bundle execution plan.
   */
  public evaluateSepsis(params: {
    weightKg: number;
    respiratoryRate: number;
    glasgowComaScale: number;
    systolicBp: number;
    initialLactateMmolL: number;
    measuredMapMmHg: number;
    repeatLactateMmolL?: number;
    elapsedHours?: number;
    pao2Fio2Ratio?: number;
    plateletsPerUl?: number;
    bilirubinMgDl?: number;
    creatinineMgDl?: number;
    vasopressorTier?: 0 | 1 | 2 | 3 | 4;
  }): {
    qsofa: QsofaAssessment;
    sofa?: SofaOrganScores;
    hourOneBundle: SepsisHourOneBundlePlan;
    lactateKinetics?: LactateClearanceKinetics;
  } {
    const qsofa = ResuscitationMathEngine.calculateQsofa(
      params.respiratoryRate,
      params.glasgowComaScale,
      params.systolicBp
    );

    let sofa: SofaOrganScores | undefined = undefined;
    if (params.pao2Fio2Ratio !== undefined && params.plateletsPerUl !== undefined) {
      sofa = ResuscitationMathEngine.calculateSofa({
        pao2Fio2Ratio: params.pao2Fio2Ratio,
        plateletsPerUl: params.plateletsPerUl,
        bilirubinMgDl: params.bilirubinMgDl || 0.8,
        meanArterialPressure: params.measuredMapMmHg,
        vasopressorTier: params.vasopressorTier || 0,
        glasgowComaScale: params.glasgowComaScale,
        creatinineMgDl: params.creatinineMgDl || 1.0,
      });
    }

    const hourOneBundle = ResuscitationMathEngine.calculateSepsisHourOneBundle(
      params.weightKg,
      params.initialLactateMmolL,
      params.measuredMapMmHg
    );

    let lactateKinetics: LactateClearanceKinetics | undefined = undefined;
    if (params.repeatLactateMmolL !== undefined && params.elapsedHours !== undefined) {
      lactateKinetics = ResuscitationMathEngine.calculateLactateClearance(
        params.initialLactateMmolL,
        params.repeatLactateMmolL,
        params.elapsedHours
      );
    }

    return {
      qsofa,
      sofa,
      hourOneBundle,
      lactateKinetics,
    };
  }

  /**
   * Calculates Parkland Burn Resuscitation fluid schedule and UOP feedback.
   */
  public calculateParkland(params: {
    weightKg: number;
    tbsaPercentage: number;
    hoursSinceInjury: number;
    currentHourlyRateMlH?: number;
    measuredHourlyUopMlH?: number;
    isPediatric?: boolean;
  }): {
    calculation: ParklandBurnCalculation;
    uopFeedback?: BurnUopTitrationFeedback;
  } {
    const calculation = ResuscitationMathEngine.calculateParklandBurnFluid(
      params.weightKg,
      params.tbsaPercentage,
      params.hoursSinceInjury
    );

    let uopFeedback: BurnUopTitrationFeedback | undefined = undefined;
    if (
      params.currentHourlyRateMlH !== undefined &&
      params.measuredHourlyUopMlH !== undefined
    ) {
      uopFeedback = ResuscitationMathEngine.titrateBurnFluidByUop(
        params.currentHourlyRateMlH,
        params.measuredHourlyUopMlH,
        params.isPediatric || false,
        params.weightKg
      );
    }

    return {
      calculation,
      uopFeedback,
    };
  }

  /**
   * Calculates Pediatric Broselow resuscitation parameters.
   */
  public calculatePediatricBroselow(params: {
    ageYears: number;
    weightKg: number;
  }): PediatricResuscitationCard {
    return ResuscitationMathEngine.calculatePediatricResuscitation(
      params.ageYears,
      params.weightKg
    );
  }

  /**
   * Evaluates Shock Index and Massive Transfusion Protocol triggers.
   */
  public evaluateMtp(params: {
    heartRate: number;
    systolicBp: number;
    isPenetratingInjury: boolean;
    fastUltrasoundPositive: boolean;
    hoursSinceInjury: number;
  }): MassiveTransfusionProtocolAssessment {
    return ResuscitationMathEngine.evaluateMtpCriteria(params);
  }

  /**
   * Retrieves emergency protocol reference standards.
   */
  public getProtocols() {
    return {
      sepsisStandard: 'Surviving Sepsis Campaign International Guidelines 2021/2026',
      burnStandard: 'American Burn Association Parkland Baxter Formula',
      pediatricStandard: 'PALS / Broselow Pediatric Resuscitation System',
      traumaStandard: 'ATLS 10th Edition & CRASH-2 Trial Massive Transfusion Protocol',
    };
  }
}
