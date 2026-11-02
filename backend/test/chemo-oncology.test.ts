// Phase 12: Chemotherapy Regimen Protocol Engine & Oncology Dosing Calculator Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ChemoMathEngine } from '../src/chemo/chemo-math.engine.ts';
import { ChemoService } from '../src/chemo/chemo.service.ts';
import { ChemoController } from '../src/chemo/chemo.controller.ts';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
const KHMER_PAREN_REGEX = /[\u1780-\u17FF].*[()]/;

describe('Phase 12: Chemotherapy Regimen Protocol Engine & Oncology Dosing Calculator Suite', () => {
  describe('1. Body Surface Area (BSA) Mathematical Calculations', () => {
    it('should calculate Mosteller and DuBois BSA accurately for standard adult (175 cm, 70 kg)', () => {
      const bsa = ChemoMathEngine.calculateBsa(175, 70);
      assert.strictEqual(bsa.mostellerBsa, 1.84);
      assert.strictEqual(bsa.duboisBsa, 1.85);
      assert.strictEqual(bsa.clinicalDosingBsa, 1.84);
      assert.strictEqual(bsa.isCappedAt2_0, false);
    });

    it('should calculate Mosteller BSA accurately for petite adult (155 cm, 50 kg)', () => {
      const bsa = ChemoMathEngine.calculateBsa(155, 50);
      assert.strictEqual(bsa.mostellerBsa, 1.47);
    });

    it('should calculate Mosteller BSA accurately for pediatric patient (100 cm, 16 kg)', () => {
      const bsa = ChemoMathEngine.calculateBsa(100, 16);
      assert.strictEqual(bsa.mostellerBsa, 0.67);
    });

    it('should enforce 2.0 m^2 safety capping for obese patients when enabled', () => {
      // Obese patient: 175 cm, 130 kg -> raw Mosteller ~ 2.51 m^2
      const uncapped = ChemoMathEngine.calculateBsa(175, 130, false);
      assert.strictEqual(uncapped.mostellerBsa, 2.51);
      assert.strictEqual(uncapped.clinicalDosingBsa, 2.51);
      assert.strictEqual(uncapped.isCappedAt2_0, false);

      const capped = ChemoMathEngine.calculateBsa(175, 130, true);
      assert.strictEqual(capped.mostellerBsa, 2.51);
      assert.strictEqual(capped.clinicalDosingBsa, 2.0);
      assert.strictEqual(capped.isCappedAt2_0, true);
    });
  });

  describe('2. Carboplatin Calvert Dosing & GFR Capping (125 mL/min)', () => {
    it('should calculate Calvert dose accurately for normal GFR below 125 mL/min', () => {
      // Target AUC 5, GFR 75 mL/min -> 5 * (75 + 25) = 500 mg
      const result = ChemoMathEngine.calculateCalvertCarboplatin(5.0, 75);
      assert.strictEqual(result.calculatedCarboplatinDoseMg, 500);
      assert.strictEqual(result.cappedGfr, 75);
      assert.strictEqual(result.isGfrCapped, false);
    });

    it('should strictly cap GFR at 125 mL/min when measured GFR is 140 mL/min (AUC 6 -> 900 mg)', () => {
      // Target AUC 6, GFR 140 mL/min -> capped at 125 -> 6 * (125 + 25) = 900 mg
      const result = ChemoMathEngine.calculateCalvertCarboplatin(6.0, 140);
      assert.strictEqual(result.calculatedCarboplatinDoseMg, 900);
      assert.strictEqual(result.cappedGfr, 125);
      assert.strictEqual(result.isGfrCapped, true);
      assert.ok(result.clinicalRationaleEn.includes('125 mL/min'));
      assert.strictEqual(EMOJI_REGEX.test(result.clinicalRationaleKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(result.clinicalRationaleKm), false);
    });

    it('should adjust Calvert dose accurately for moderate renal insufficiency (GFR 35 mL/min)', () => {
      // Target AUC 4, GFR 35 mL/min -> 4 * (35 + 25) = 240 mg
      const result = ChemoMathEngine.calculateCalvertCarboplatin(4.0, 35);
      assert.strictEqual(result.calculatedCarboplatinDoseMg, 240);
      assert.strictEqual(result.cappedGfr, 35);
      assert.strictEqual(result.isGfrCapped, false);
    });
  });

  describe('3. Cumulative Anthracycline Cardiotoxicity Lifetime Ceiling', () => {
    it('should trigger HARD_CARDIOTOXICITY_BLOCK when cumulative dose reaches or exceeds 450 mg/m^2', () => {
      // Prior 420 mg/m2, new proposed cycle dose 50 mg/m2 -> projected 470 mg/m2 > 450 limit
      const tracking = ChemoMathEngine.calculateAnthracyclineCumulativeExposure(420, 50, 'DOXORUBICIN', 450);
      assert.strictEqual(tracking.projectedCumulativeDoseMgM2, 470);
      assert.strictEqual(tracking.status, 'HARD_CARDIOTOXICITY_BLOCK');
      assert.ok(tracking.actionEn.includes('blocked'));
      assert.strictEqual(EMOJI_REGEX.test(tracking.actionKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(tracking.actionKm), false);
    });

    it('should trigger CARDIOTOXICITY_WARNING when cumulative dose reaches 80% of ceiling', () => {
      // Prior 320 mg/m2, new dose 50 mg/m2 -> projected 370 mg/m2 (82.2% of 450)
      const tracking = ChemoMathEngine.calculateAnthracyclineCumulativeExposure(320, 50, 'DOXORUBICIN', 450);
      assert.strictEqual(tracking.projectedCumulativeDoseMgM2, 370);
      assert.strictEqual(tracking.percentOfLifetimeCeiling, 82.2);
      assert.strictEqual(tracking.status, 'CARDIOTOXICITY_WARNING');
      assert.ok(tracking.actionEn.includes('dexrazoxane'));
    });

    it('should evaluate SAFE_RANGE when cumulative dose remains well below 80%', () => {
      // Prior 100 mg/m2, new dose 50 mg/m2 -> projected 150 mg/m2 (33.3% of 450)
      const tracking = ChemoMathEngine.calculateAnthracyclineCumulativeExposure(100, 50, 'DOXORUBICIN', 450);
      assert.strictEqual(tracking.status, 'SAFE_RANGE');
      assert.strictEqual(tracking.percentOfLifetimeCeiling, 33.3);
    });

    it('should convert Epirubicin to Doxorubicin isotoxic equivalents accurately (factor 0.6)', () => {
      // 100 mg/m2 Epirubicin = 60 mg/m2 Doxorubicin equivalent
      const tracking = ChemoMathEngine.calculateAnthracyclineCumulativeExposure(0, 100, 'EPIRUBICIN', 450);
      assert.strictEqual(tracking.projectedCumulativeDoseMgM2, 60);
    });
  });

  describe('4. Hematologic Myelosuppression Chemotherapy Hold Gates (ASCO/NCCN)', () => {
    it('should calculate Absolute Neutrophil Count (ANC) from WBC and differential fractions', () => {
      // WBC 3,000, Segs 30%, Bands 5% -> ANC = 3,000 * 0.35 = 1,050 /uL
      const anc = ChemoMathEngine.calculateAnc(3000, 30, 5);
      assert.strictEqual(anc, 1050);
    });

    it('should trigger CHEMOTHERAPY_HOLD when ANC is below 1,500 /uL', () => {
      const gate = ChemoMathEngine.evaluateLabSafetyGate(1050, 150000, 0.8, 1.0, 90);
      assert.strictEqual(gate.overallStatus, 'CHEMOTHERAPY_HOLD');
      assert.strictEqual(gate.doseAdjustmentFactor, 0.0);
      assert.ok(gate.violations.some((v) => v.includes('ANC 1050/uL')));
      assert.strictEqual(EMOJI_REGEX.test(gate.recommendationKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(gate.recommendationKm), false);
    });

    it('should trigger CHEMOTHERAPY_HOLD when Platelet count is below 100,000 /uL', () => {
      const gate = ChemoMathEngine.evaluateLabSafetyGate(2500, 85000, 0.8, 1.0, 90);
      assert.strictEqual(gate.overallStatus, 'CHEMOTHERAPY_HOLD');
      assert.strictEqual(gate.doseAdjustmentFactor, 0.0);
      assert.ok(gate.violations.some((v) => v.includes('85000/uL')));
    });

    it('should recommend 50% dose attenuation when Total Bilirubin is elevated (> 1.8 mg/dL)', () => {
      const gate = ChemoMathEngine.evaluateLabSafetyGate(3000, 180000, 2.4, 1.0, 90);
      assert.strictEqual(gate.overallStatus, 'DOSE_REDUCTION_RECOMMENDED');
      assert.strictEqual(gate.doseAdjustmentFactor, 0.50);
      assert.ok(gate.recommendationEn.includes('50%'));
    });

    it('should recommend 25% dose reduction when CrCl is under 50 mL/min', () => {
      const gate = ChemoMathEngine.evaluateLabSafetyGate(3000, 180000, 0.8, 1.0, 42);
      assert.strictEqual(gate.overallStatus, 'DOSE_REDUCTION_RECOMMENDED');
      assert.strictEqual(gate.doseAdjustmentFactor, 0.75);
      assert.ok(gate.recommendationEn.includes('75%'));
    });

    it('should permit full 100% protocol dose when all laboratory parameters are normal', () => {
      const gate = ChemoMathEngine.evaluateLabSafetyGate(4500, 210000, 0.7, 1.0, 95);
      assert.strictEqual(gate.overallStatus, 'PROCEED');
      assert.strictEqual(gate.doseAdjustmentFactor, 1.0);
      assert.strictEqual(gate.violations.length, 0);
    });
  });

  describe('5. Chemotherapy Service & Multi-Drug Protocol Cycle Calculation', () => {
    it('should retrieve master chemotherapy regimens (FOLFOX6, R_CHOP, CARBO_PACLI)', () => {
      const service = ChemoService.getInstance();
      const list = service.getRegimens();
      assert.ok(list.length >= 3);

      const rchop = service.getRegimenByCode('R_CHOP');
      assert.ok(rchop);
      assert.strictEqual(rchop.cycleLengthDays, 21);

      const doxo = rchop.drugs.find((d) => d.drugCode === 'DOXORUBICIN');
      assert.ok(doxo);
      assert.strictEqual(doxo.isAnthracycline, true);
    });

    it('should calculate complete cycle dosing with BSA, Calvert, and Vincristine capping', () => {
      const service = ChemoService.getInstance();
      // Patient ONCO-PT-002 on R-CHOP: height 172 cm, weight 78 kg -> BSA ~ 1.93 m^2
      const result = service.calculatePatientCycleDosing('ONCO-PT-002', 'R_CHOP');
      assert.ok(result);
      assert.strictEqual(result.bsa.mostellerBsa, 1.93);
      assert.strictEqual(result.labGate.overallStatus, 'PROCEED');

      // Vincristine nominal: 1.4 * 1.93 = 2.7 mg, but capped at 2.0 mg absolute maximum
      const vincristine = result.calculatedDrugs.find((d: any) => d.drugCode === 'VINCRISTINE');
      assert.ok(vincristine);
      assert.strictEqual(vincristine.nominalDose, 2.0);
      assert.strictEqual(vincristine.finalAdjustedDose, 2.0);

      // Doxorubicin: 50 * 1.93 = 96.5 mg, prior cumulative was 150 -> projected 200 (safe)
      const doxo = result.calculatedDrugs.find((d: any) => d.drugCode === 'DOXORUBICIN');
      assert.ok(doxo);
      assert.strictEqual(doxo.nominalDose, 96.5);
      assert.strictEqual(doxo.anthracyclineSafety.status, 'SAFE_RANGE');
    });
  });

  describe('6. Chemotherapy Controller REST Endpoints', () => {
    it('should handle POST /api/chemo/calculate-bsa', () => {
      const controller = new ChemoController();
      const res = controller.handleRequest('/api/chemo/calculate-bsa', 'POST', {}, { heightCm: 175, weightKg: 70 });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.mostellerBsa, 1.84);
    });

    it('should handle POST /api/chemo/calculate-calvert with GFR capping', () => {
      const controller = new ChemoController();
      const res = controller.handleRequest('/api/chemo/calculate-calvert', 'POST', {}, { targetAuc: 6.0, measuredGfr: 140 });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.calculatedCarboplatinDoseMg, 900);
      assert.strictEqual(res.data.isGfrCapped, true);
    });

    it('should handle POST /api/chemo/check-anthracycline', () => {
      const controller = new ChemoController();
      const res = controller.handleRequest('/api/chemo/check-anthracycline', 'POST', {}, {
        currentCumulative: 420,
        newDoseMgM2: 50,
        agentCode: 'DOXORUBICIN'
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, 'HARD_CARDIOTOXICITY_BLOCK');
    });

    it('should handle POST /api/chemo/check-lab-safety with ANC hold', () => {
      const controller = new ChemoController();
      const res = controller.handleRequest('/api/chemo/check-lab-safety', 'POST', {}, {
        wbc: 2500,
        neutrophilPercent: 30,
        bandPercent: 2,
        platelets: 180000,
        totalBilirubin: 0.8,
        astAltRatio: 1.0,
        crCl: 80
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.overallStatus, 'CHEMOTHERAPY_HOLD');
    });
  });

  describe('7. Strict Compliance: Zero Emojis and Zero Parentheses in Khmer', () => {
    it('should guarantee strictly ZERO emojis across all generated texts', () => {
      const calvert = ChemoMathEngine.calculateCalvertCarboplatin(6, 140);
      const anthra = ChemoMathEngine.calculateAnthracyclineCumulativeExposure(420, 50);
      const gate = ChemoMathEngine.evaluateLabSafetyGate(1000, 80000, 2.5, 3.5, 40);

      const texts = [
        calvert.clinicalRationaleEn,
        calvert.clinicalRationaleKm,
        anthra.actionEn,
        anthra.actionKm,
        gate.recommendationEn,
        gate.recommendationKm
      ];

      for (const text of texts) {
        assert.strictEqual(EMOJI_REGEX.test(text), false, `Emoji found in: ${text}`);
      }
    });

    it('should guarantee strictly ZERO parentheses in any Khmer language oncology text', () => {
      const calvert = ChemoMathEngine.calculateCalvertCarboplatin(6, 140);
      const anthra = ChemoMathEngine.calculateAnthracyclineCumulativeExposure(420, 50);
      const gate = ChemoMathEngine.evaluateLabSafetyGate(1000, 80000, 2.5, 3.5, 40);

      const khmerTexts = [
        calvert.clinicalRationaleKm,
        anthra.actionKm,
        gate.recommendationKm
      ];

      for (const text of khmerTexts) {
        assert.strictEqual(KHMER_PAREN_REGEX.test(text), false, `Parenthesis found in Khmer text: ${text}`);
      }
    });
  });
});
