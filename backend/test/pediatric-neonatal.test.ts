// Phase 13: Neonatal & Pediatric Precision Pharmacotherapy & Phototherapy Engine Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PediatricMathEngine } from '../src/pediatric/pediatric-math.engine.ts';
import { PediatricService } from '../src/pediatric/pediatric.service.ts';
import { PediatricController } from '../src/pediatric/pediatric.controller.ts';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
const KHMER_PAREN_REGEX = /[\u1780-\u17FF].*[()]/;

describe('Phase 13: Neonatal & Pediatric Precision Pharmacotherapy & Phototherapy Engine Suite', () => {
  describe('1. Pediatric Weight-Based Dosing & Inviolable Adult Cap Clamping', () => {
    it('should calculate weight-based dose accurately for Paracetamol 15 mg/kg in normal-weight child (60 kg -> 900 mg)', () => {
      // 60 kg * 15 mg/kg = 900 mg < 1000 mg adult single cap
      const result = PediatricMathEngine.calculateWeightBasedDose(60, 15, 1000);
      assert.strictEqual(result.rawDoseMg, 900);
      assert.strictEqual(result.finalCappedDoseMg, 900);
      assert.strictEqual(result.isCapped, false);
    });

    it('should clamp calculated dose to adult maximum of 1,000 mg in overweight child (75 kg -> 1,000 mg)', () => {
      // 75 kg * 15 mg/kg = 1125 mg > 1000 mg adult single cap -> must clamp to 1000 mg
      const result = PediatricMathEngine.calculateWeightBasedDose(75, 15, 1000);
      assert.strictEqual(result.rawDoseMg, 1125);
      assert.strictEqual(result.finalCappedDoseMg, 1000);
      assert.strictEqual(result.isCapped, true);
    });

    it('should clamp pediatric Ibuprofen 10 mg/kg to adult single-dose ceiling of 400 mg', () => {
      // 30 kg * 10 mg/kg = 300 mg (uncapped)
      const child1 = PediatricMathEngine.calculateWeightBasedDose(30, 10, 400);
      assert.strictEqual(child1.finalCappedDoseMg, 300);
      assert.strictEqual(child1.isCapped, false);

      // 50 kg * 10 mg/kg = 500 mg -> clamped to 400 mg
      const child2 = PediatricMathEngine.calculateWeightBasedDose(50, 10, 400);
      assert.strictEqual(child2.rawDoseMg, 500);
      assert.strictEqual(child2.finalCappedDoseMg, 400);
      assert.strictEqual(child2.isCapped, true);
    });

    it('should clamp pediatric Amoxicillin to adult maximum of 1,000 mg', () => {
      // 30 kg * 45 mg/kg = 1350 mg -> clamped to 1000 mg
      const amox = PediatricMathEngine.calculateWeightBasedDose(30, 45, 1000);
      assert.strictEqual(amox.rawDoseMg, 1350);
      assert.strictEqual(amox.finalCappedDoseMg, 1000);
      assert.strictEqual(amox.isCapped, true);
    });
  });

  describe('2. Historical Approximation Rules (Clark, Young, Fried) Validation', () => {
    it('should compute Clark weight-based pediatric fraction matching formula benchmarks', () => {
      // Weight 30 kg (66.14 lbs) / 150 * 500 mg adult dose = 220.5 mg
      const dose = PediatricMathEngine.calculateClarksDose(30, 500);
      assert.strictEqual(dose, 220.5);
    });

    it('should compute Young age-based pediatric fraction for children 1 to 12 years', () => {
      // Age 4 / (4 + 12) * 500 mg adult dose = 125.0 mg
      const dose = PediatricMathEngine.calculateYoungsDose(4, 500);
      assert.strictEqual(dose, 125.0);
    });

    it('should compute Fried infant fraction for infants 1 to 24 months', () => {
      // Age 6 months / 150 * 500 mg adult dose = 20.0 mg
      const dose = PediatricMathEngine.calculateFriedsDose(6, 500);
      assert.strictEqual(dose, 20.0);
    });
  });

  describe('3. Neonatal Gentamicin Extended-Interval Dosing Matrix (PMA & PNA)', () => {
    it('should assign 5.0 mg/kg q48h for extreme preterm neonate (PMA < 30 weeks)', () => {
      // GA 28 weeks, PNA 3 days -> PMA = 28.4 weeks < 30 weeks
      const regimen = PediatricMathEngine.calculateNeonatalGentamicinRegimen(28, 3, 1.2);
      assert.strictEqual(regimen.nominalDoseMgPerKg, 5.0);
      assert.strictEqual(regimen.dosingIntervalHours, 48);
      assert.strictEqual(regimen.calculatedDoseMg, 6.0); // 1.2 * 5.0 = 6.0 mg
      assert.ok(regimen.renalMaturityStageEn.includes('48-hour'));
      assert.strictEqual(EMOJI_REGEX.test(regimen.renalMaturityStageKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(regimen.renalMaturityStageKm), false);
    });

    it('should assign 4.5 mg/kg q36h for moderate preterm neonate (PMA 30-34 weeks, PNA <= 7 days)', () => {
      // GA 32 weeks, PNA 4 days -> PMA = 32.6 weeks, PNA <= 7
      const regimen = PediatricMathEngine.calculateNeonatalGentamicinRegimen(32, 4, 1.8);
      assert.strictEqual(regimen.nominalDoseMgPerKg, 4.5);
      assert.strictEqual(regimen.dosingIntervalHours, 36);
      assert.strictEqual(regimen.calculatedDoseMg, 8.1); // 1.8 * 4.5 = 8.1 mg
    });

    it('should assign 4.0 mg/kg q24h for moderate preterm neonate with PNA > 7 days', () => {
      // GA 32 weeks, PNA 10 days -> PMA = 33.4 weeks, PNA > 7
      const regimen = PediatricMathEngine.calculateNeonatalGentamicinRegimen(32, 10, 2.0);
      assert.strictEqual(regimen.nominalDoseMgPerKg, 4.0);
      assert.strictEqual(regimen.dosingIntervalHours, 24);
      assert.strictEqual(regimen.calculatedDoseMg, 8.0);
    });

    it('should assign 4.0 mg/kg q24h for term neonate in first week of life (PNA <= 7 days)', () => {
      // GA 39 weeks, PNA 3 days
      const regimen = PediatricMathEngine.calculateNeonatalGentamicinRegimen(39, 3, 3.2);
      assert.strictEqual(regimen.nominalDoseMgPerKg, 4.0);
      assert.strictEqual(regimen.dosingIntervalHours, 24);
      assert.strictEqual(regimen.calculatedDoseMg, 12.8);
    });

    it('should assign 5.0 mg/kg q24h for term neonate older than 7 days (PNA > 7 days)', () => {
      // GA 40 weeks, PNA 12 days
      const regimen = PediatricMathEngine.calculateNeonatalGentamicinRegimen(40, 12, 3.5);
      assert.strictEqual(regimen.nominalDoseMgPerKg, 5.0);
      assert.strictEqual(regimen.dosingIntervalHours, 24);
      assert.strictEqual(regimen.calculatedDoseMg, 17.5);
    });
  });

  describe('4. AAP 2022 Bhutani & Kemper Phototherapy Nomogram & Action Thresholds', () => {
    it('should categorize Low Risk for infant >= 38 weeks without neurotoxicity risk factors', () => {
      const assessment = PediatricMathEngine.evaluatePhototherapyNomogram(24, 9.0, 39, false);
      assert.strictEqual(assessment.riskCategory, 'LOW_RISK');
      assert.strictEqual(assessment.phototherapyThresholdMgDl, 12.0);
      assert.strictEqual(assessment.action, 'LOW_RISK_CONTINUE_NORMAL_CARE');
    });

    it('should recommend MONITOR_REPEAT_TSB_12H when bilirubin is within 2.0 mg/dL below threshold', () => {
      // At 24h, Low Risk cutoff is 12.0 mg/dL. TSB 10.5 mg/dL is within 2.0 mg/dL of threshold
      const assessment = PediatricMathEngine.evaluatePhototherapyNomogram(24, 10.5, 39, false);
      assert.strictEqual(assessment.action, 'MONITOR_REPEAT_TSB_12H');
      assert.strictEqual(assessment.distanceToPhototherapyThresholdMgDl, 1.5);
    });

    it('should trigger STANDARD_PHOTOTHERAPY_RECOMMENDED when bilirubin reaches or exceeds threshold', () => {
      // At 48h, Low Risk cutoff is 15.0 mg/dL. TSB 15.5 mg/dL meets threshold
      const assessment = PediatricMathEngine.evaluatePhototherapyNomogram(48, 15.5, 39, false);
      assert.strictEqual(assessment.action, 'STANDARD_PHOTOTHERAPY_RECOMMENDED');
      assert.ok(assessment.actionEn.includes('Initiate phototherapy'));
    });

    it('should trigger INTENSIVE_PHOTOTHERAPY_RECOMMENDED when bilirubin exceeds threshold by >= 2.0 mg/dL', () => {
      // At 48h, Low Risk cutoff is 15.0 mg/dL. TSB 17.5 mg/dL exceeds threshold by 2.5 mg/dL
      const assessment = PediatricMathEngine.evaluatePhototherapyNomogram(48, 17.5, 39, false);
      assert.strictEqual(assessment.action, 'INTENSIVE_PHOTOTHERAPY_RECOMMENDED');
      assert.ok(assessment.irradianceRecommendation.includes('30-35'));
    });

    it('should trigger EXCHANGE_TRANSFUSION_THRESHOLD_EXCEEDED when bilirubin reaches exchange ceiling', () => {
      // At 24h, Low Risk photo threshold is 12.0 mg/dL, exchange is 17.0 mg/dL. TSB 17.5 mg/dL
      const assessment = PediatricMathEngine.evaluatePhototherapyNomogram(24, 17.5, 39, false);
      assert.strictEqual(assessment.action, 'EXCHANGE_TRANSFUSION_THRESHOLD_EXCEEDED');
      assert.ok(assessment.actionEn.includes('exchange transfusion'));
      assert.strictEqual(EMOJI_REGEX.test(assessment.actionKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(assessment.actionKm), false);
    });

    it('should apply High Risk curve for preterm neonate (36 weeks) with G6PD deficiency', () => {
      // At 24h, High Risk photo threshold is 8.0 mg/dL
      const assessment = PediatricMathEngine.evaluatePhototherapyNomogram(24, 8.5, 36, true);
      assert.strictEqual(assessment.riskCategory, 'HIGH_RISK');
      assert.strictEqual(assessment.phototherapyThresholdMgDl, 8.0);
      assert.strictEqual(assessment.action, 'STANDARD_PHOTOTHERAPY_RECOMMENDED');
    });
  });

  describe('5. Pediatric Service & Oral Liquid Concentration Calculations', () => {
    it('should calculate oral liquid volume accurately for Paracetamol 120 mg/5 mL (24 mg/mL)', () => {
      const service = PediatricService.getInstance();
      // 18 kg child on Paracetamol (15 mg/kg) = 270 mg. At 24 mg/mL -> 270 / 24 = 11.25 -> 11.3 mL
      const result = service.calculatePediatricDosing('PARACETAMOL', 18, 5, 60, 24);
      assert.strictEqual(result.recommendedDoseMg, 270);
      assert.strictEqual(result.liquidVolumeMl, 11.3);
      assert.strictEqual(result.isCappedAtAdultMax, false);
    });

    it('should clamp dose and calculate liquid volume for Forte concentration (50 mg/mL)', () => {
      const service = PediatricService.getInstance();
      // 75 kg overweight child on Paracetamol (15 mg/kg = 1125 mg) -> clamped to 1000 mg. At 50 mg/mL -> 20.0 mL
      const result = service.calculatePediatricDosing('PARACETAMOL', 75, 12, 144, 50);
      assert.strictEqual(result.recommendedDoseMg, 1000);
      assert.strictEqual(result.liquidVolumeMl, 20.0);
      assert.strictEqual(result.isCappedAtAdultMax, true);
    });
  });

  describe('6. Pediatric Controller Endpoints Handling', () => {
    it('should handle POST /api/pediatric/calculate-dosing', () => {
      const controller = new PediatricController();
      const res = controller.handleRequest('/api/pediatric/calculate-dosing', 'POST', {}, {
        medicationCode: 'IBUPROFEN',
        weightKg: 20,
        ageYears: 6,
        ageMonths: 72,
        concentrationMgPerMl: 20
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.recommendedDoseMg, 200);
      assert.strictEqual(res.data.liquidVolumeMl, 10.0);
    });

    it('should handle POST /api/pediatric/neonatal-gentamicin', () => {
      const controller = new PediatricController();
      const res = controller.handleRequest('/api/pediatric/neonatal-gentamicin', 'POST', {}, {
        gestationalAgeWeeks: 31,
        postnatalAgeDays: 4,
        weightKg: 1.5
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.dosingIntervalHours, 36);
      assert.strictEqual(res.data.calculatedDoseMg, 6.8);
    });

    it('should handle POST /api/pediatric/evaluate-phototherapy', () => {
      const controller = new PediatricController();
      const res = controller.handleRequest('/api/pediatric/evaluate-phototherapy', 'POST', {}, {
        postnatalHours: 48,
        totalSerumBilirubinMgDl: 16.0,
        gestationalAgeWeeks: 38,
        hasNeurotoxicityRiskFactors: false
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.action, 'STANDARD_PHOTOTHERAPY_RECOMMENDED');
    });
  });

  describe('7. Strict Compliance: Zero Emojis and Zero Parentheses in Khmer', () => {
    it('should guarantee strictly ZERO emojis across all generated texts', () => {
      const dosing = PediatricMathEngine.calculateWeightBasedDose(75, 15, 1000);
      const gent = PediatricMathEngine.calculateNeonatalGentamicinRegimen(28, 3, 1.2);
      const photo = PediatricMathEngine.evaluatePhototherapyNomogram(24, 18.0, 39, false);

      const texts = [
        gent.renalMaturityStageEn,
        gent.renalMaturityStageKm,
        gent.monitoringProtocolEn,
        gent.monitoringProtocolKm,
        photo.actionEn,
        photo.actionKm
      ];

      for (const text of texts) {
        assert.strictEqual(EMOJI_REGEX.test(text), false, `Emoji found in: ${text}`);
      }
    });

    it('should guarantee strictly ZERO parentheses in any Khmer language pediatric text', () => {
      const gent = PediatricMathEngine.calculateNeonatalGentamicinRegimen(28, 3, 1.2);
      const photo = PediatricMathEngine.evaluatePhototherapyNomogram(24, 18.0, 39, false);

      const khmerTexts = [
        gent.renalMaturityStageKm,
        gent.monitoringProtocolKm,
        photo.actionKm
      ];

      for (const text of khmerTexts) {
        assert.strictEqual(KHMER_PAREN_REGEX.test(text), false, `Parenthesis found in Khmer text: ${text}`);
      }
    });
  });
});
