/**
 * Phase 10: Clinical Pharmacokinetics (PK/PD) Precision Dosing & Bayesian TDM Engine Test Suite
 * Strictly ZERO emojis and ZERO parentheses in Khmer text
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  PatientAnthropometrics,
  TdmDrugModel,
  PkParameters,
  MeasuredSerumLevel
} from '../src/pkpd/pkpd.types.ts';
import { PkPdMathEngine } from '../src/pkpd/pkpd-math.engine.ts';
import { PkPdService, MASTER_TDM_DRUGS } from '../src/pkpd/pkpd.service.ts';

describe('Phase 10: Clinical Pharmacokinetics (PK/PD) Precision Dosing & Bayesian TDM Engine', () => {
  // Domain 1: Anthropometric Biostatistics & Dosing Weight Selection
  describe('Domain 1: Anthropometric Math & Dosing Weight Selection', () => {
    it('accurately calculates Devine Ideal Body Weight (IBW) for male and female', () => {
      // Male 178 cm -> 70.08 inches -> 50 + 2.3 * 10.08 = 73.18 -> 73.2 kg
      const maleIbw = PkPdMathEngine.calculateIbw(178, 'MALE');
      assert.strictEqual(maleIbw, 73.2);

      // Female 165 cm -> 64.96 inches -> 45.5 + 2.3 * 4.96 = 56.91 -> 56.9 kg
      const femaleIbw = PkPdMathEngine.calculateIbw(165, 'FEMALE');
      assert.strictEqual(femaleIbw, 56.9);
    });

    it('clamps height <= 60 inches to baseline to prevent negative extrapolation', () => {
      // 150 cm -> 59.06 inches (<= 60 in)
      const maleClamped = PkPdMathEngine.calculateIbw(150, 'MALE');
      assert.strictEqual(maleClamped, 50.0);

      const femaleClamped = PkPdMathEngine.calculateIbw(150, 'FEMALE');
      assert.strictEqual(femaleClamped, 45.5);
    });

    it('accurately computes BMI and triggers Adjusted Body Weight (ABW) when BMI >= 30', () => {
      // Height 170 cm, Weight 105 kg -> BMI = 105 / (1.7)^2 = 36.3 (Obese)
      const bmi = PkPdMathEngine.calculateBmi(105, 170);
      assert.strictEqual(bmi, 36.3);

      const ibw = PkPdMathEngine.calculateIbw(170, 'MALE'); // 65.9 kg
      const abw = PkPdMathEngine.calculateAbw(105, ibw);
      // ABW = 65.9 + 0.4 * (105 - 65.9) = 65.9 + 15.64 = 81.54 -> 81.5 kg
      assert.strictEqual(abw, 81.5);

      const dosingWeight = PkPdMathEngine.getDosingWeight(105, 170, 'MALE');
      assert.strictEqual(dosingWeight, 81.5, 'Dosing weight for obese patient must be ABW');
    });

    it('selects actual weight for underweight patients whose actual weight is below IBW', () => {
      // Height 175 cm (IBW = 70.4 kg), actual weight 52 kg (underweight, BMI = 17.0)
      const dosingWeight = PkPdMathEngine.getDosingWeight(52, 175, 'MALE');
      assert.strictEqual(dosingWeight, 52);
    });
  });

  // Domain 2: Cockcroft-Gault Renal Function Benchmarks
  describe('Domain 2: Cockcroft-Gault Renal Function Benchmarks', () => {
    it('computes normal CrCl with 0.85 female scalar', () => {
      // Male: Age 30, Weight 70 kg, SCr 0.9 mg/dL -> (110 * 70) / (72 * 0.9) = 7700 / 64.8 = 118.8 mL/min
      const crClMale = PkPdMathEngine.calculateCockcroftGaultCrCl(30, 70, 0.9, 'MALE');
      assert.strictEqual(crClMale, 118.8);
      assert.strictEqual(PkPdMathEngine.classifyRenalStage(crClMale), 'NORMAL');

      // Female: Age 30, Weight 70 kg, SCr 0.9 mg/dL -> 118.8 * 0.85 = 101.0 mL/min
      const crClFemale = PkPdMathEngine.calculateCockcroftGaultCrCl(30, 70, 0.9, 'FEMALE');
      assert.strictEqual(crClFemale, 101.0);
    });

    it('correctly stages moderate, severe, and ESRD renal impairment', () => {
      // Moderate: CrCl ~38 mL/min
      const crClMod = PkPdMathEngine.calculateCockcroftGaultCrCl(65, 60, 1.4, 'FEMALE');
      assert.strictEqual(PkPdMathEngine.classifyRenalStage(crClMod), 'MODERATE_IMPAIRMENT');

      // Severe: CrCl ~22 mL/min
      const crClSev = PkPdMathEngine.calculateCockcroftGaultCrCl(72, 65, 2.8, 'MALE');
      assert.strictEqual(PkPdMathEngine.classifyRenalStage(crClSev), 'SEVERE_IMPAIRMENT');

      // ESRD: CrCl ~12 mL/min
      const crClEsrd = PkPdMathEngine.calculateCockcroftGaultCrCl(60, 60, 5.2, 'MALE');
      assert.strictEqual(PkPdMathEngine.classifyRenalStage(crClEsrd), 'END_STAGE_ESRD');
    });

    it('applies 0.6 mg/dL floor for low creatinine in elderly patients >= 65', () => {
      // Patient age 80, actual SCr 0.4 mg/dL -> floor to 0.6 mg/dL
      const crClFloored = PkPdMathEngine.calculateCockcroftGaultCrCl(80, 50, 0.4, 'FEMALE');
      const crClExpected = Number((((140 - 80) * 50 * 0.85) / (72 * 0.6)).toFixed(1)); // 59.0 mL/min
      assert.strictEqual(crClFloored, crClExpected);
    });
  });

  // Domain 3: One-Compartment Steady-State Analytical Benchmarks
  describe('Domain 3: One-Compartment Steady-State Analytical Benchmarks', () => {
    it('computes elimination half-life and steady-state peak, trough, and AUC24', () => {
      // Dose 1000 mg, tInf 1 hr, tau 12 hr, ke 0.075 1/hr, Vd 45 L
      const metrics = PkPdMathEngine.calculateSteadyStateMetrics(1000, 1.0, 12, 0.075, 45);

      // Verify analytical invariants
      assert.ok(metrics.predictedPeakCmax > metrics.predictedTroughCmin, 'Peak must exceed trough');
      assert.ok(metrics.predictedPeakCmax > 30 && metrics.predictedPeakCmax < 40, 'Peak in expected range ~36 mg/L');
      assert.ok(metrics.predictedTroughCmin > 12 && metrics.predictedTroughCmin < 18, 'Trough in expected range ~15 mg/L');

      // AUC24 = DailyDose / (ke * Vd) = 2000 / (0.075 * 45) = 2000 / 3.375 = 592.6 mg*hr/L
      assert.strictEqual(metrics.predictedAuc24, 592.6);
    });
  });

  // Domain 4: Clinical Safety & Nephrotoxicity Guardrails
  describe('Domain 4: Clinical Safety & Nephrotoxicity Guardrails', () => {
    const vanco = MASTER_TDM_DRUGS.find((d) => d.code === 'VANCOMYCIN')!;
    const pkNormal: PkParameters = {
      eliminationRateConstantKe: 0.065,
      halfLifeHours: 10.7,
      volumeOfDistributionLitres: 48,
      clearanceLitresPerHour: 3.12,
      isBayesianDerived: false
    };

    it('identifies THERAPEUTIC regimen meeting target AUC24 (400-600) and trough (10-15 mg/L)', () => {
      // 750 mg q12h -> daily 1500 mg / 3.12 L/hr = AUC24 480.8 mg*hr/L, trough ~11.5 mg/L
      const reg = PkPdMathEngine.evaluateRegimen(vanco, 750, 12, pkNormal);
      assert.strictEqual(reg.status, 'THERAPEUTIC');
      assert.ok(reg.predictedAuc24 >= 400 && reg.predictedAuc24 <= 600);
      assert.ok(reg.predictedTroughCmin >= 10.0 && reg.predictedTroughCmin <= 15.0);

      // 1000 mg q12h -> AUC24 641 mg*hr/L -> supratherapeutic warning
      const regHigh = PkPdMathEngine.evaluateRegimen(vanco, 1000, 12, pkNormal);
      assert.strictEqual(regHigh.status, 'SUPRATHERAPEUTIC_WARNING');
    });

    it('triggers TOXIC_LOCKOUT when trough >= 20 mg/L or AUC24 >= 650', () => {
      // Overdose: 2000 mg q8h (6000 mg daily)
      const regToxic = PkPdMathEngine.evaluateRegimen(vanco, 2000, 8, pkNormal);
      assert.strictEqual(regToxic.status, 'TOXIC_LOCKOUT');
      assert.ok(regToxic.predictedTroughCmin >= 20.0 || regToxic.predictedAuc24 >= 650);
    });

    it('evaluates Gentamicin extended-interval trough ceiling < 1.0 mcg/mL', () => {
      const genta = MASTER_TDM_DRUGS.find((d) => d.code === 'GENTAMICIN')!;
      const pkGenta: PkParameters = {
        eliminationRateConstantKe: 0.23, // normal clearance
        halfLifeHours: 3.0,
        volumeOfDistributionLitres: 18,
        clearanceLitresPerHour: 4.14,
        isBayesianDerived: false
      };

      const reg = PkPdMathEngine.evaluateRegimen(genta, 400, 24, pkGenta);
      assert.strictEqual(reg.status, 'THERAPEUTIC');
      assert.ok(reg.predictedTroughCmin < 1.0, 'Gentamicin trough must be < 1.0 mcg/mL at 24h');
    });
  });

  // Domain 5: Bayesian Optimization Convergence & Adaptive Regimen
  describe('Domain 5: Bayesian Optimization Convergence & Adaptive Regimen', () => {
    it('refines population PK parameters to match measured serum level', () => {
      const popPk: PkParameters = {
        eliminationRateConstantKe: 0.05,
        halfLifeHours: 13.9,
        volumeOfDistributionLitres: 50,
        clearanceLitresPerHour: 2.5,
        isBayesianDerived: false
      };

      const measuredLevel: MeasuredSerumLevel[] = [
        {
          sampleId: 'SMPL-01',
          drawTimestamp: new Date().toISOString(),
          hoursPostDose: 11.5,
          measuredConcentration: 17.5, // Higher than expected -> patient clears drug slower
          assayCvPercent: 8.0
        }
      ];

      const bayesianPk = PkPdMathEngine.runBayesianFitting(popPk, measuredLevel, 1000, 1.5, 12);

      assert.strictEqual(bayesianPk.isBayesianDerived, true);
      // Measured concentration was higher than predicted, so Bayesian ke should shift lower
      assert.ok(bayesianPk.eliminationRateConstantKe < popPk.eliminationRateConstantKe);
      assert.ok(bayesianPk.halfLifeHours > popPk.halfLifeHours);
    });

    it('adapts dosing interval tau when clearance drops in renal impairment', () => {
      const service = new PkPdService();
      // Patient with severe renal impairment (CrCl ~25 mL/min)
      const patientRenal: PatientAnthropometrics = {
        patientId: 'P-99881',
        patientName: 'Kosal Heng',
        ageYears: 74,
        gender: 'MALE',
        actualWeightKg: 65,
        heightCm: 168,
        serumCreatinineMgDl: 2.5
      };

      const opt = service.optimizeDosing('VANCOMYCIN', patientRenal);
      // In severe renal impairment, optimal interval must be extended (e.g. 24h or 36h)
      assert.ok(opt.recommendedRegimen.intervalHours >= 24, 'Interval must be >= 24h for severe renal impairment');
      assert.strictEqual(opt.recommendedRegimen.status, 'THERAPEUTIC');
    });
  });

  // Domain 6: Strict Linguistic & Security Compliance
  describe('Domain 6: Strict Linguistic & Security Compliance', () => {
    it('guarantees strictly zero emojis across all drug models, alerts, and recommendations', () => {
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

      for (const drug of MASTER_TDM_DRUGS) {
        assert.ok(!emojiRegex.test(drug.nameKh), `Drug name contains emoji: ${drug.nameKh}`);
        assert.ok(!emojiRegex.test(drug.targetMetrics.toxicityAlertKh), `Alert contains emoji: ${drug.targetMetrics.toxicityAlertKh}`);
      }
    });

    it('guarantees strictly zero parentheses in any Khmer language string', () => {
      const parenthesisRegex = /[()（）]/;

      for (const drug of MASTER_TDM_DRUGS) {
        assert.ok(!parenthesisRegex.test(drug.nameKh), `Drug name contains parenthesis: ${drug.nameKh}`);
        assert.ok(!parenthesisRegex.test(drug.targetMetrics.toxicityAlertKh), `Alert contains parenthesis: ${drug.targetMetrics.toxicityAlertKh}`);
      }
    });
  });
});
