// Phase 14: Emergency Sepsis & Trauma Resuscitation Protocol Engine Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ResuscitationMathEngine } from '../src/resuscitation/resuscitation-math.engine.ts';
import { ResuscitationService } from '../src/resuscitation/resuscitation.service.ts';
import { ResuscitationController } from '../src/resuscitation/resuscitation.controller.ts';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
const KHMER_PAREN_REGEX = /[\u1780-\u17FF].*[()]/;

describe('Phase 14: Emergency Sepsis & Trauma Resuscitation Protocol Engine Suite', () => {
  describe('1. qSOFA & SOFA Score Calculation & Sepsis Alert Triggers', () => {
    it('should calculate qSOFA = 0 and no alert for stable physiological parameters', () => {
      const qsofa = ResuscitationMathEngine.calculateQsofa(16, 15, 120);
      assert.strictEqual(qsofa.score, 0);
      assert.strictEqual(qsofa.isHighRisk, false);
      assert.ok(qsofa.clinicalActionEn.includes('Low to Intermediate Risk'));
    });

    it('should calculate qSOFA = 1 for tachypneic patient without triggering high-risk alert', () => {
      // RR 24 (>= 22) -> 1 pt; GCS 15 -> 0; SBP 110 -> 0
      const qsofa = ResuscitationMathEngine.calculateQsofa(24, 15, 110);
      assert.strictEqual(qsofa.score, 1);
      assert.strictEqual(qsofa.isHighRisk, false);
    });

    it('should calculate qSOFA = 3 and trigger High Risk Sepsis Alert when all criteria met', () => {
      // RR 26 (>= 22) -> 1 pt; GCS 13 (< 15) -> 1 pt; SBP 90 (<= 100) -> 1 pt
      const qsofa = ResuscitationMathEngine.calculateQsofa(26, 13, 90);
      assert.strictEqual(qsofa.score, 3);
      assert.strictEqual(qsofa.isHighRisk, true);
      assert.ok(qsofa.clinicalActionEn.includes('High Risk: qSOFA >= 2'));
    });

    it('should compute complete 6-organ SOFA scores accurately with high mortality prediction', () => {
      const sofa = ResuscitationMathEngine.calculateSofa({
        pao2Fio2Ratio: 150, // Respiration = 3 (< 200)
        plateletsPerUl: 40000, // Coagulation = 3 (< 50,000)
        bilirubinMgDl: 7.5, // Liver = 3 (6.0 - 11.9)
        meanArterialPressure: 60, // Vasopressor tier 4 overrides MAP
        vasopressorTier: 4, // Cardiovascular = 4
        glasgowComaScale: 8, // CNS = 3 (6 - 9)
        creatinineMgDl: 4.2, // Renal = 3 (3.5 - 4.9)
      });

      assert.strictEqual(sofa.respirationScore, 3);
      assert.strictEqual(sofa.coagulationScore, 3);
      assert.strictEqual(sofa.liverScore, 3);
      assert.strictEqual(sofa.cardiovascularScore, 4);
      assert.strictEqual(sofa.neurologicalScore, 3);
      assert.strictEqual(sofa.renalScore, 3);
      assert.strictEqual(sofa.totalScore, 19);
      assert.strictEqual(sofa.projectedMortalityRatePercent, 85.0);
      assert.strictEqual(sofa.sepsisAlertTriggered, true);
    });
  });

  describe('2. SSC Hour-1 Bundle 30 mL/kg Fluid Calculation & Lactate Kinetics', () => {
    it('should calculate exactly 30 mL/kg balanced crystalloids over 3 hours', () => {
      // 70 kg * 30 mL/kg = 2,100 mL -> 700 mL/h over 3 hours
      const bundle = ResuscitationMathEngine.calculateSepsisHourOneBundle(70, 4.2, 58);
      assert.strictEqual(bundle.crystalloidBolusVolumeMl, 2100);
      assert.strictEqual(bundle.hourlyInfusionRateMlH, 700);
      assert.strictEqual(bundle.preferredFluid, 'LACTATED_RINGERS');
      assert.strictEqual(bundle.vasopressorTargetMapMmHg, 65);
      assert.strictEqual(bundle.broadSpectrumAntimicrobialWindowMinutes, 60);
    });

    it('should calculate 30 mL/kg for 90 kg patient accurately', () => {
      // 90 kg * 30 mL/kg = 2,700 mL -> 900 mL/h
      const bundle = ResuscitationMathEngine.calculateSepsisHourOneBundle(90, 3.5, 62);
      assert.strictEqual(bundle.crystalloidBolusVolumeMl, 2700);
      assert.strictEqual(bundle.hourlyInfusionRateMlH, 900);
    });

    it('should confirm adequate lactate clearance when decline >= 20% over 2 hours', () => {
      // Baseline 5.0 mmol/L to 3.0 mmol/L -> ((5.0 - 3.0) / 5.0) * 100 = 40.0%
      const kinetics = ResuscitationMathEngine.calculateLactateClearance(5.0, 3.0, 2.0);
      assert.strictEqual(kinetics.relativeClearancePercent, 40.0);
      assert.strictEqual(kinetics.isAdequateClearance, true);
      assert.ok(kinetics.statusEn.includes('Adequate Lactate Clearance'));
    });

    it('should flag impaired lactate clearance and recommend escalation when decline < 20%', () => {
      // Baseline 4.0 mmol/L to 3.6 mmol/L -> ((4.0 - 3.6) / 4.0) * 100 = 10.0%
      const kinetics = ResuscitationMathEngine.calculateLactateClearance(4.0, 3.6, 2.0);
      assert.strictEqual(kinetics.relativeClearancePercent, 10.0);
      assert.strictEqual(kinetics.isAdequateClearance, false);
      assert.ok(kinetics.statusEn.includes('Impaired Lactate Clearance'));
      assert.ok(kinetics.actionEn.includes('Escalate resuscitation'));
    });
  });

  describe('3. Parkland Burn Resuscitation & Closed-Loop UOP Titration', () => {
    it('should calculate Parkland formula: 70 kg adult, 40% TBSA -> 11,200 mL (5,600 mL in 8h = 700 mL/h, 350 mL/h in next 16h)', () => {
      // 4 * 70 * 40 = 11,200 mL total
      // First 8h: 5,600 mL -> 700 mL/h (elapsed = 0)
      // Next 16h: 5,600 mL -> 350 mL/h
      const burn = ResuscitationMathEngine.calculateParklandBurnFluid(70, 40, 0);
      assert.strictEqual(burn.total24HourFluidMl, 11200);
      assert.strictEqual(burn.first8HourTotalMl, 5600);
      assert.strictEqual(burn.first8HourHourlyRateMlH, 700);
      assert.strictEqual(burn.next16HourTotalMl, 5600);
      assert.strictEqual(burn.next16HourHourlyRateMlH, 350);
    });

    it('should adjust first 8-hour rate when burn occurred 3 hours prior to presentation', () => {
      // Remaining hours in first phase = 8 - 3 = 5 hours
      // 5,600 / 5 = 1,120 mL/h
      const burn = ResuscitationMathEngine.calculateParklandBurnFluid(70, 40, 3);
      assert.strictEqual(burn.first8HourHourlyRateMlH, 1120);
      assert.strictEqual(burn.next16HourHourlyRateMlH, 350);
    });

    it('should increase rate by 20% on oliguria (UOP < 30 mL/h) to prevent renal failure', () => {
      // Current rate 700 mL/h, UOP 20 mL/h -> increase 20% to 840 mL/h
      const titration = ResuscitationMathEngine.titrateBurnFluidByUop(700, 20, false, 70);
      assert.strictEqual(titration.titrationAction, 'INCREASE_20_PERCENT');
      assert.strictEqual(titration.adjustedHourlyRateMlH, 840);
      assert.ok(titration.rationaleEn.includes('Oliguria detected'));
    });

    it('should decrease rate by 20% on over-resuscitation (UOP > 50 mL/h) to prevent fluid creep', () => {
      // Current rate 700 mL/h, UOP 65 mL/h -> decrease 20% to 560 mL/h
      const titration = ResuscitationMathEngine.titrateBurnFluidByUop(700, 65, false, 70);
      assert.strictEqual(titration.titrationAction, 'DECREASE_20_PERCENT');
      assert.strictEqual(titration.adjustedHourlyRateMlH, 560);
      assert.ok(titration.rationaleEn.includes('Polyuria detected'));
    });

    it('should maintain rate when UOP is within optimal 30-50 mL/h window', () => {
      const titration = ResuscitationMathEngine.titrateBurnFluidByUop(700, 40, false, 70);
      assert.strictEqual(titration.titrationAction, 'MAINTAIN');
      assert.strictEqual(titration.adjustedHourlyRateMlH, 700);
    });
  });

  describe('4. Pediatric Broselow Color-Band, ETT Sizing, Defibrillation & Resuscitation Drugs', () => {
    it('should map pediatric patient (4 years, 16 kg) to Broselow White band', () => {
      const card = ResuscitationMathEngine.calculatePediatricResuscitation(4, 16);
      assert.strictEqual(card.broselowColor, 'WHITE');
      assert.ok(card.colorNameEn.includes('White'));
      assert.strictEqual(card.ettUncuffedSizeMm, 5.0); // 4/4 + 4 = 5.0 mm
      assert.strictEqual(card.ettCuffedSizeMm, 4.5); // 4/4 + 3.5 = 4.5 mm
      assert.strictEqual(card.ettDepthCm, 14.0); // 4/2 + 12 = 14.0 cm
    });

    it('should calculate accurate defibrillation joules (2 J/kg first, 4 J/kg subsequent clamped to 200 J)', () => {
      const card = ResuscitationMathEngine.calculatePediatricResuscitation(4, 16);
      assert.strictEqual(card.defibrillationFirstJoules, 32); // 16 * 2 = 32 J
      assert.strictEqual(card.defibrillationSubsequentJoules, 64); // 16 * 4 = 64 J
      assert.strictEqual(card.cardioversionJoules, 16); // 16 * 1 = 16 J
    });

    it('should calculate accurate pediatric resuscitation drug doses with adult cap safety', () => {
      const card = ResuscitationMathEngine.calculatePediatricResuscitation(4, 16);
      // Epinephrine: 16 kg * 0.01 mg/kg = 0.16 mg (1.6 mL of 1:10,000)
      assert.strictEqual(card.epinephrineDoseMg, 0.16);
      assert.strictEqual(card.epinephrineVolumeMl1To10000, 1.6);
      // Amiodarone: 16 kg * 5 mg/kg = 80 mg
      assert.strictEqual(card.amiodaroneBolusMg, 80);
      // Atropine: 16 kg * 0.02 mg/kg = 0.32 mg
      assert.strictEqual(card.atropineDoseMg, 0.32);
      // Normal Saline bolus: 16 kg * 20 mL/kg = 320 mL
      assert.strictEqual(card.normalSalineBolusMl, 320);
    });

    it('should clamp pediatric Atropine to minimum 0.1 mg single dose for infant', () => {
      // 3 kg infant * 0.02 mg/kg = 0.06 mg -> clamped to min 0.10 mg
      const card = ResuscitationMathEngine.calculatePediatricResuscitation(0.2, 3);
      assert.strictEqual(card.atropineDoseMg, 0.10);
    });
  });

  describe('5. Shock Index, ABC Score MTP Activation & TXA CRASH-2 Window (< 3 Hours)', () => {
    it('should calculate Shock Index and categorize critical shock for SI > 0.9', () => {
      // HR 115, SBP 95 -> SI = 1.21 > 0.9 -> Critical
      const si = ResuscitationMathEngine.calculateShockIndex(115, 95);
      assert.strictEqual(si.shockIndex, 1.21);
      assert.strictEqual(si.status, 'CRITICAL_IMMINENT_ARREST');
    });

    it('should activate Massive Transfusion Protocol (1:1:1) when ABC Score >= 2', () => {
      // Penetrating trauma (1), SBP 85 <= 90 (1), HR 125 >= 120 (1), FAST positive (1) -> ABC = 4
      const mtp = ResuscitationMathEngine.evaluateMtpCriteria({
        heartRate: 125,
        systolicBp: 85,
        isPenetratingInjury: true,
        fastUltrasoundPositive: true,
        hoursSinceInjury: 1.5,
      });

      assert.strictEqual(mtp.abcScore, 4);
      assert.strictEqual(mtp.mtpActivated, true);
      assert.ok(mtp.balancedRatioDescription.includes('1:1:1'));
    });

    it('should APPROVE Tranexamic Acid (TXA) when injury elapsed time is < 3 hours (CRASH-2)', () => {
      const mtp = ResuscitationMathEngine.evaluateMtpCriteria({
        heartRate: 120,
        systolicBp: 88,
        isPenetratingInjury: true,
        fastUltrasoundPositive: false,
        hoursSinceInjury: 2.0, // < 3.0 hours
      });

      assert.strictEqual(mtp.txaIndicated, true);
      assert.strictEqual(mtp.txaAdministrationStatus, 'GIVE_IMMEDIATELY');
      assert.ok(mtp.txaProtocolEn.includes('1 g IV bolus over 10 minutes'));
    });

    it('should HARD BLOCK Tranexamic Acid (TXA) when elapsed time exceeds 3 hours', () => {
      const mtp = ResuscitationMathEngine.evaluateMtpCriteria({
        heartRate: 120,
        systolicBp: 88,
        isPenetratingInjury: true,
        fastUltrasoundPositive: false,
        hoursSinceInjury: 3.5, // > 3.0 hours -> contraindicated
      });

      assert.strictEqual(mtp.txaIndicated, false);
      assert.strictEqual(mtp.txaAdministrationStatus, 'CONTRAINDICATED_WINDOW_EXCEEDED');
      assert.ok(mtp.txaProtocolEn.includes('TXA Contraindicated'));
    });
  });

  describe('6. Emergency Service & Controller Endpoints', () => {
    it('should process comprehensive sepsis evaluation via service', () => {
      const service = new ResuscitationService();
      const result = service.evaluateSepsis({
        weightKg: 70,
        respiratoryRate: 24,
        glasgowComaScale: 14,
        systolicBp: 95,
        initialLactateMmolL: 4.5,
        measuredMapMmHg: 62,
        repeatLactateMmolL: 2.5,
        elapsedHours: 2.0,
      });

      assert.strictEqual(result.qsofa.score, 3);
      assert.strictEqual(result.hourOneBundle.crystalloidBolusVolumeMl, 2100);
      assert.strictEqual(result.lactateKinetics?.relativeClearancePercent, 44.4);
    });

    it('should handle controller dispatch for Parkland burn calculation', async () => {
      const controller = new ResuscitationController();
      const res = await controller.calculateParkland({
        body: { weightKg: 80, tbsaPercentage: 30, hoursSinceInjury: 1 },
      });

      // 4 * 80 * 30 = 9,600 mL total; first 8h = 4,800 mL / 7h = 686 mL/h
      assert.strictEqual(res.calculation.total24HourFluidMl, 9600);
      assert.strictEqual(res.calculation.first8HourHourlyRateMlH, 686);
    });
  });

  describe('7. Strict Compliance: Zero Emojis and Zero Parentheses in Khmer', () => {
    it('should guarantee strictly ZERO emojis across all emergency outputs', () => {
      const qsofa = ResuscitationMathEngine.calculateQsofa(26, 12, 85);
      const bundle = ResuscitationMathEngine.calculateSepsisHourOneBundle(70, 4.0, 60);
      const kinetics = ResuscitationMathEngine.calculateLactateClearance(4.0, 2.0, 2.0);
      const burn = ResuscitationMathEngine.calculateParklandBurnFluid(70, 40, 0);
      const card = ResuscitationMathEngine.calculatePediatricResuscitation(4, 16);
      const si = ResuscitationMathEngine.calculateShockIndex(120, 90);
      const mtp = ResuscitationMathEngine.evaluateMtpCriteria({
        heartRate: 120,
        systolicBp: 80,
        isPenetratingInjury: true,
        fastUltrasoundPositive: true,
        hoursSinceInjury: 1.0,
      });

      const textSamples = [
        qsofa.clinicalActionEn,
        qsofa.clinicalActionKm,
        bundle.bloodCulturesProtocolEn,
        bundle.bloodCulturesProtocolKm,
        kinetics.statusEn,
        kinetics.statusKm,
        burn.titrationProtocolEn,
        burn.titrationProtocolKm,
        card.colorNameEn,
        card.colorNameKm,
        si.clinicalInterpretationEn,
        si.clinicalInterpretationKm,
        mtp.txaProtocolEn,
        mtp.txaProtocolKm,
      ];

      for (const text of textSamples) {
        assert.strictEqual(EMOJI_REGEX.test(text), false, `Emoji found in: ${text}`);
      }
    });

    it('should guarantee strictly ZERO parentheses in any Khmer language emergency text', () => {
      const qsofa = ResuscitationMathEngine.calculateQsofa(26, 12, 85);
      const bundle = ResuscitationMathEngine.calculateSepsisHourOneBundle(70, 4.0, 60);
      const kinetics = ResuscitationMathEngine.calculateLactateClearance(4.0, 2.0, 2.0);
      const burn = ResuscitationMathEngine.calculateParklandBurnFluid(70, 40, 0);
      const card = ResuscitationMathEngine.calculatePediatricResuscitation(4, 16);
      const si = ResuscitationMathEngine.calculateShockIndex(120, 90);
      const mtp = ResuscitationMathEngine.evaluateMtpCriteria({
        heartRate: 120,
        systolicBp: 80,
        isPenetratingInjury: true,
        fastUltrasoundPositive: true,
        hoursSinceInjury: 1.0,
      });

      const khmerSamples = [
        qsofa.clinicalActionKm,
        bundle.bloodCulturesProtocolKm,
        kinetics.statusKm,
        burn.titrationProtocolKm,
        card.colorNameKm,
        si.clinicalInterpretationKm,
        mtp.txaProtocolKm,
      ];

      for (const text of khmerSamples) {
        assert.strictEqual(KHMER_PAREN_REGEX.test(text), false, `Khmer Parenthesis found in: ${text}`);
      }
    });
  });
});
