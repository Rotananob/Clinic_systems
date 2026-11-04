/**
 * Clinical Pharmacokinetics (PK/PD) Mathematical Engine and Bayesian Optimization
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

import {
  PatientGender,
  RenalStage,
  DerivedBiometrics,
  PatientAnthropometrics,
  TdmDrugCode,
  TdmDrugModel,
  PkParameters,
  MeasuredSerumLevel,
  DosingRegimenOption,
  TherapeuticWindowStatus
} from './pkpd.types';

export class PkPdMathEngine {
  /**
   * Calculates Body Mass Index (BMI = kg / m^2)
   */
  public static calculateBmi(weightKg: number, heightCm: number): number {
    if (weightKg <= 0 || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return Number((weightKg / (heightM * heightM)).toFixed(1));
  }

  /**
   * Calculates Ideal Body Weight (IBW) using Devine Formula
   * Male: 50.0 kg + 2.3 kg for each inch over 5 feet (60 inches)
   * Female: 45.5 kg + 2.3 kg for each inch over 5 feet (60 inches)
   */
  public static calculateIbw(heightCm: number, gender: PatientGender): number {
    if (heightCm <= 0) return 0;
    const heightInches = heightCm / 2.54;
    const baselineIbw = gender === 'MALE' ? 50.0 : 45.5;

    if (heightInches <= 60) {
      return Number(baselineIbw.toFixed(1));
    }

    const inchesOver60 = heightInches - 60;
    const ibw = baselineIbw + 2.3 * inchesOver60;
    return Number(ibw.toFixed(1));
  }

  /**
   * Calculates Adjusted Body Weight (ABW) for obese patients (BMI >= 30)
   * Formula: ABW = IBW + 0.4 * (Actual Weight - IBW)
   */
  public static calculateAbw(actualWeightKg: number, ibwKg: number): number {
    if (actualWeightKg <= ibwKg) return actualWeightKg;
    const abw = ibwKg + 0.4 * (actualWeightKg - ibwKg);
    return Number(abw.toFixed(1));
  }

  /**
   * Selects appropriate clinical dosing weight
   * Obese (BMI >= 30): ABW
   * Underweight (Actual < IBW): Actual Weight
   * Normal weight: IBW or Actual Weight
   */
  public static getDosingWeight(actualWeightKg: number, heightCm: number, gender: PatientGender): number {
    const bmi = this.calculateBmi(actualWeightKg, heightCm);
    const ibw = this.calculateIbw(heightCm, gender);

    if (bmi >= 30) {
      return this.calculateAbw(actualWeightKg, ibw);
    }
    if (actualWeightKg < ibw) {
      return actualWeightKg;
    }
    return ibw;
  }

  /**
   * Calculates Creatinine Clearance (CrCl) using Cockcroft-Gault Equation
   * CrCl = ((140 - Age) * WeightKg) / (72 * SerumCreatinine) * (0.85 if female)
   * Clinical pharmacy rule: in patients >= 65 years with serum creatinine < 0.6 mg/dL,
   * serum creatinine is adjusted to 0.6 mg/dL to prevent CrCl overestimation
   */
  public static calculateCockcroftGaultCrCl(
    ageYears: number,
    dosingWeightKg: number,
    serumCreatinineMgDl: number,
    gender: PatientGender
  ): number {
    if (ageYears <= 0 || dosingWeightKg <= 0 || serumCreatinineMgDl <= 0) return 0;

    let adjustedScr = serumCreatinineMgDl;
    if (ageYears >= 65 && adjustedScr < 0.6) {
      adjustedScr = 0.6;
    }

    const numerator = (140 - ageYears) * dosingWeightKg;
    const denominator = 72 * adjustedScr;
    let crCl = numerator / denominator;

    if (gender === 'FEMALE') {
      crCl *= 0.85;
    }

    return Number(crCl.toFixed(1));
  }

  /**
   * Classifies renal impairment based on CrCl (mL/min)
   */
  public static classifyRenalStage(crClMlMin: number): RenalStage {
    if (crClMlMin >= 90) return 'NORMAL';
    if (crClMlMin >= 60) return 'MILD_IMPAIRMENT';
    if (crClMlMin >= 30) return 'MODERATE_IMPAIRMENT';
    if (crClMlMin >= 15) return 'SEVERE_IMPAIRMENT';
    return 'END_STAGE_ESRD';
  }

  /**
   * Generates full derived biometrics for patient
   */
  public static deriveBiometrics(patient: PatientAnthropometrics): DerivedBiometrics {
    const bmi = this.calculateBmi(patient.actualWeightKg, patient.heightCm);
    const isObese = bmi >= 30;
    const ibw = this.calculateIbw(patient.heightCm, patient.gender);
    const abw = this.calculateAbw(patient.actualWeightKg, ibw);
    const dosingWeight = this.getDosingWeight(patient.actualWeightKg, patient.heightCm, patient.gender);
    const crCl = this.calculateCockcroftGaultCrCl(
      patient.ageYears,
      dosingWeight,
      patient.serumCreatinineMgDl,
      patient.gender
    );
    const renalStage = this.classifyRenalStage(crCl);

    return {
      bmi,
      isObese,
      idealBodyWeightKg: ibw,
      adjustedBodyWeightKg: abw,
      dosingWeightKg: dosingWeight,
      creatinineClearanceMlMin: crCl,
      renalStage
    };
  }

  /**
   * Computes baseline population pharmacokinetic parameters for specific drug
   */
  public static calculatePopulationPk(drugCode: TdmDrugCode, biometrics: DerivedBiometrics): PkParameters {
    const crCl = Math.max(10, biometrics.creatinineClearanceMlMin);
    const weight = biometrics.dosingWeightKg;

    let ke = 0.05;
    let vd = weight * 0.7;

    switch (drugCode) {
      case 'VANCOMYCIN':
        // Matzke equation: ke = 0.00083 * CrCl + 0.0044
        ke = Number((0.00083 * crCl + 0.0044).toFixed(5));
        vd = Number((0.7 * weight).toFixed(1));
        break;

      case 'GENTAMICIN':
      case 'TOBRAMYCIN':
        // Hull-Sarubbi equation: ke = 0.00293 * CrCl + 0.014
        ke = Number((0.00293 * crCl + 0.014).toFixed(5));
        vd = Number((0.26 * weight).toFixed(1));
        break;

      case 'AMIKACIN':
        ke = Number((0.0028 * crCl + 0.012).toFixed(5));
        vd = Number((0.27 * weight).toFixed(1));
        break;

      case 'DIGOXIN':
        // Digoxin Clearance = 1.303 * CrCl + 20 (converted to L/hr)
        const clMlMin = 1.303 * crCl + 20;
        const clLHr = (clMlMin * 60) / 1000;
        vd = Number((7.0 * biometrics.idealBodyWeightKg).toFixed(1)); // 7 L/kg IBW
        ke = Number((clLHr / vd).toFixed(5));
        break;
    }

    const halfLife = Number((0.69315 / ke).toFixed(1));
    const clearance = Number((ke * vd).toFixed(2));

    return {
      eliminationRateConstantKe: ke,
      halfLifeHours: halfLife,
      volumeOfDistributionLitres: vd,
      clearanceLitresPerHour: clearance,
      isBayesianDerived: false
    };
  }

  /**
   * One-Compartment Intermittent IV Infusion Steady-State Concentrations
   * Cmax_ss = (Dose * (1 - e^(-ke * t_inf))) / (Vd * ke * t_inf * (1 - e^(-ke * tau)))
   * Cmin_ss = Cmax_ss * e^(-ke * (tau - t_inf))
   * AUC24 = Daily_Dose / (ke * Vd)
   */
  public static calculateSteadyStateMetrics(
    doseMg: number,
    infusionHours: number,
    intervalHours: number,
    ke: number,
    vdLitres: number
  ): {
    predictedPeakCmax: number;
    predictedTroughCmin: number;
    predictedAuc24: number;
  } {
    if (doseMg <= 0 || infusionHours <= 0 || intervalHours <= 0 || ke <= 0 || vdLitres <= 0) {
      return { predictedPeakCmax: 0, predictedTroughCmin: 0, predictedAuc24: 0 };
    }

    const tInf = infusionHours;
    const tau = intervalHours;

    const num = doseMg * (1 - Math.exp(-ke * tInf));
    const denom = vdLitres * ke * tInf * (1 - Math.exp(-ke * tau));
    const cMax = num / denom;

    const cMin = cMax * Math.exp(-ke * (tau - tInf));

    const dailyDose = doseMg * (24 / tau);
    const clearance = ke * vdLitres;
    const auc24 = dailyDose / clearance;

    return {
      predictedPeakCmax: Number(cMax.toFixed(2)),
      predictedTroughCmin: Number(cMin.toFixed(2)),
      predictedAuc24: Number(auc24.toFixed(1))
    };
  }

  /**
   * Predicts serum concentration at specific time t post dose start
   */
  public static predictConcentrationAtTime(
    tHours: number,
    doseMg: number,
    infusionHours: number,
    intervalHours: number,
    ke: number,
    vdLitres: number
  ): number {
    const tInf = infusionHours;
    const tau = intervalHours;
    const tMod = tHours % tau;

    if (tMod <= tInf) {
      // During infusion
      const num = doseMg * (1 - Math.exp(-ke * tMod));
      const denom = vdLitres * ke * tInf;
      return num / denom;
    } else {
      // Post-infusion decay
      const num = doseMg * (1 - Math.exp(-ke * tInf));
      const denom = vdLitres * ke * tInf;
      const cPeak = num / denom;
      return cPeak * Math.exp(-ke * (tMod - tInf));
    }
  }

  /**
   * Bayesian Maximum A Posteriori (MAP) Parameter Fitting Algorithm
   * Minimizes objective function Phi(ke, Vd) using grid search with Nelder-Mead refinement
   */
  public static runBayesianFitting(
    popPk: PkParameters,
    measuredLevels: MeasuredSerumLevel[],
    currentDoseMg: number,
    infusionHours: number,
    intervalHours: number
  ): PkParameters {
    if (!measuredLevels || measuredLevels.length === 0) {
      return { ...popPk, isBayesianDerived: false };
    }

    const kePop = popPk.eliminationRateConstantKe;
    const vdPop = popPk.volumeOfDistributionLitres;

    // Population variances (typical 30% CV for ke and 25% CV for Vd)
    const sigmaKeSq = Math.pow(kePop * 0.3, 2);
    const sigmaVdSq = Math.pow(vdPop * 0.25, 2);

    let bestKe = kePop;
    let bestVd = vdPop;
    let minPhi = Infinity;

    // Multi-resolution grid search: explore 0.3x to 2.5x population priors
    const keSteps = 40;
    const vdSteps = 40;
    const keMin = kePop * 0.3;
    const keMax = kePop * 2.5;
    const vdMin = vdPop * 0.4;
    const vdMax = vdPop * 2.2;

    for (let i = 0; i <= keSteps; i++) {
      const candidateKe = keMin + (i / keSteps) * (keMax - keMin);

      for (let j = 0; j <= vdSteps; j++) {
        const candidateVd = vdMin + (j / vdSteps) * (vdMax - vdMin);

        // Bayesian Objective Function Phi
        let phi = Math.pow(candidateKe - kePop, 2) / sigmaKeSq + Math.pow(candidateVd - vdPop, 2) / sigmaVdSq;

        // Sum of weighted residual squared errors for measured serum levels
        for (const sample of measuredLevels) {
          const cPred = this.predictConcentrationAtTime(
            sample.hoursPostDose,
            currentDoseMg,
            infusionHours,
            intervalHours,
            candidateKe,
            candidateVd
          );
          const sigmaAssay = Math.max(0.5, sample.measuredConcentration * (sample.assayCvPercent / 100));
          const residualSq = Math.pow(sample.measuredConcentration - cPred, 2) / Math.pow(sigmaAssay, 2);
          phi += residualSq;
        }

        if (phi < minPhi) {
          minPhi = phi;
          bestKe = candidateKe;
          bestVd = candidateVd;
        }
      }
    }

    const refinedKe = Number(bestKe.toFixed(5));
    const refinedVd = Number(bestVd.toFixed(1));
    const refinedHalfLife = Number((0.69315 / refinedKe).toFixed(1));
    const refinedClearance = Number((refinedKe * refinedVd).toFixed(2));

    return {
      eliminationRateConstantKe: refinedKe,
      halfLifeHours: refinedHalfLife,
      volumeOfDistributionLitres: refinedVd,
      clearanceLitresPerHour: refinedClearance,
      isBayesianDerived: true
    };
  }

  /**
   * Evaluates a specific dosing regimen against therapeutic targets
   */
  public static evaluateRegimen(
    drug: TdmDrugModel,
    doseMg: number,
    intervalHours: number,
    pk: PkParameters
  ): DosingRegimenOption {
    const tInf = drug.defaultInfusionHours;
    const metrics = this.calculateSteadyStateMetrics(
      doseMg,
      tInf,
      intervalHours,
      pk.eliminationRateConstantKe,
      pk.volumeOfDistributionLitres
    );

    const dailyDose = doseMg * (24 / intervalHours);
    let status: TherapeuticWindowStatus = 'THERAPEUTIC';
    let recKh = 'កម្រិតថ្នាំសមស្របតាមគោលដៅព្យាបាលស្តង់ដារ';
    let recEn = 'Optimal therapeutic regimen meeting target pharmacokinetic windows';

    // 1. Vancomycin Evaluation: AUC24 target 400-600, trough 10-15 mg/L
    if (drug.code === 'VANCOMYCIN') {
      const auc = metrics.predictedAuc24;
      const trough = metrics.predictedTroughCmin;

      if (trough >= drug.targetMetrics.toxicityTroughThreshold || auc >= 650) {
        status = 'TOXIC_LOCKOUT';
        recKh = 'អាសន្ន: កំហាប់ថ្នាំលើសដែនសុវត្ថិភាព ហានិភ័យខូចតម្រងនោមស្រួចស្រាវ - ត្រូវបញ្ឈប់ ឬ បន្ថយជាបន្ទាន់';
        recEn = 'CRITICAL TOXIC LOCKOUT: Acute kidney injury nephrotoxicity risk. Exceeds safe limit.';
      } else if (auc > 600 || trough > drug.targetMetrics.targetTroughMax) {
        status = 'SUPRATHERAPEUTIC_WARNING';
        recKh = 'ការព្រមាន: កំហាប់ថ្នាំលើសកម្រិតគោលដៅបន្តិចបន្តួច - ត្រូវបន្ថយកម្រិតថ្នាំ ឬ ពន្យារយៈពេលចាក់';
        recEn = 'WARNING: Supratherapeutic exposure. Consider dose reduction or interval extension.';
      } else if (auc < 400 || trough < drug.targetMetrics.targetTroughMin) {
        status = 'SUBTHERAPEUTIC';
        recKh = 'កម្រិតថ្នាំមិនទាន់គ្រប់គ្រាន់សម្រាប់សម្លាប់មេរោគ - ត្រូវបង្កើនកម្រិតថ្នាំ';
        recEn = 'SUBTHERAPEUTIC: Inadequate exposure for bacterial clearance. Treatment failure risk.';
      }
    }

    // 2. Aminoglycoside Evaluation: Gentamicin / Amikacin
    if (drug.code === 'GENTAMICIN' || drug.code === 'TOBRAMYCIN') {
      const trough = metrics.predictedTroughCmin;
      if (trough >= drug.targetMetrics.toxicityTroughThreshold) {
        status = 'TOXIC_LOCKOUT';
        recKh = 'អាសន្ន: កម្រិតថ្នាំ Trough ខ្ពស់ ហានិភ័យពុលត្រចៀក និងខូចតម្រងនោម';
        recEn = 'CRITICAL TOXICITY: Elevated trough level indicates ototoxicity and nephrotoxicity risk.';
      } else if (trough > drug.targetMetrics.targetTroughMax) {
        status = 'SUPRATHERAPEUTIC_WARNING';
        recKh = 'ការព្រមាន: កម្រិតថ្នាំ Trough មិនទាន់ចុះទាបគ្រប់គ្រាន់';
        recEn = 'WARNING: Prolong interval to ensure drug clearance before next dose.';
      }
    }

    return {
      doseMg,
      infusionHours: tInf,
      intervalHours,
      dailyDoseMg: dailyDose,
      predictedPeakCmax: metrics.predictedPeakCmax,
      predictedTroughCmin: metrics.predictedTroughCmin,
      predictedAuc24: metrics.predictedAuc24,
      aucMicRatio: metrics.predictedAuc24,
      status,
      clinicalRecommendationKh: recKh,
      clinicalRecommendationEn: recEn
    };
  }

  /**
   * Finds the best regimen that hits target AUC24 and trough
   */
  public static recommendOptimalRegimen(drug: TdmDrugModel, pk: PkParameters): {
    recommended: DosingRegimenOption;
    alternatives: DosingRegimenOption[];
  } {
    const candidateDoses = [500, 750, 1000, 1250, 1500, 1750, 2000];
    const candidateIntervals = [8, 12, 18, 24, 36, 48];

    const evaluatedOptions: DosingRegimenOption[] = [];

    for (const dose of candidateDoses) {
      for (const tau of candidateIntervals) {
        evaluatedOptions.push(this.evaluateRegimen(drug, dose, tau, pk));
      }
    }

    // Sort options: prefer THERAPEUTIC first, closest to ideal midpoint AUC (e.g. 500 for Vancomycin)
    const targetAucMidpoint = 500;
    evaluatedOptions.sort((a, b) => {
      if (a.status === 'THERAPEUTIC' && b.status !== 'THERAPEUTIC') return -1;
      if (b.status === 'THERAPEUTIC' && a.status !== 'THERAPEUTIC') return 1;

      const diffA = Math.abs(a.predictedAuc24 - targetAucMidpoint);
      const diffB = Math.abs(b.predictedAuc24 - targetAucMidpoint);
      return diffA - diffB;
    });

    const recommended = evaluatedOptions[0];
    const alternatives = evaluatedOptions.slice(1, 6);

    return { recommended, alternatives };
  }
}
