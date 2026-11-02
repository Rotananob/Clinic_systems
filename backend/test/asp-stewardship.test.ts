// Phase 11: Automated Antimicrobial Stewardship Program (ASP) Engine Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AspMathEngine } from '../src/asp/asp-math.engine.ts';
import { AspService } from '../src/asp/asp.service.ts';
import { AspController } from '../src/asp/asp.controller.ts';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
const KHMER_PAREN_REGEX = /[\u1780-\u17FF].*[()]/;

describe('Phase 11: Automated Antimicrobial Stewardship Program (ASP) Engine Suite', () => {
  describe('1. Days of Therapy (DOT) and Length of Therapy (LOT) Mathematical Logic', () => {
    it('should compute exact DOT = 10 and LOT = 5 for concurrent 5-day Meropenem and Vancomycin', () => {
      const administrations = [
        { date: '2026-10-01', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-02', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-03', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-04', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-05', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] }
      ];

      const result = AspMathEngine.calculateDotAndLot(administrations, 5);
      assert.strictEqual(result.totalDaysOfTherapy, 10);
      assert.strictEqual(result.totalLengthOfTherapy, 5);
      assert.strictEqual(result.agentDotBreakdown['MEROPENEM'], 5);
      assert.strictEqual(result.agentDotBreakdown['VANCOMYCIN'], 5);
      assert.strictEqual(result.dotPer1000PatientDays, 2000);
      assert.strictEqual(result.lotPer1000PatientDays, 1000);
    });

    it('should compute exact DOT and LOT for staggered overlapping antimicrobial regimens', () => {
      // Meropenem: Days 1-5 (5 days)
      // Vancomycin: Days 3-7 (5 days)
      const administrations = [
        { date: '2026-10-01', agentCodes: ['MEROPENEM'] },
        { date: '2026-10-02', agentCodes: ['MEROPENEM'] },
        { date: '2026-10-03', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-04', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-05', agentCodes: ['MEROPENEM', 'VANCOMYCIN'] },
        { date: '2026-10-06', agentCodes: ['VANCOMYCIN'] },
        { date: '2026-10-07', agentCodes: ['VANCOMYCIN'] }
      ];

      const result = AspMathEngine.calculateDotAndLot(administrations, 10);
      assert.strictEqual(result.totalDaysOfTherapy, 10);
      assert.strictEqual(result.totalLengthOfTherapy, 7);
      assert.strictEqual(result.dotPer1000PatientDays, 1000);
      assert.strictEqual(result.lotPer1000PatientDays, 700);
    });

    it('should normalize consumption per 1,000 Patient-Days accurately', () => {
      const administrations = [
        { date: '2026-10-01', agentCodes: ['CEFTRIAXONE'] },
        { date: '2026-10-02', agentCodes: ['CEFTRIAXONE'] }
      ];
      const result = AspMathEngine.calculateDotAndLot(administrations, 20);
      // 2 DOT / 20 patient-days * 1000 = 100 DOT/1000
      assert.strictEqual(result.dotPer1000PatientDays, 100);
      assert.strictEqual(result.lotPer1000PatientDays, 100);
    });
  });

  describe('2. Standardized Antimicrobial Administration Ratio (SAAR) Categorization', () => {
    it('should calculate SAAR and categorize CRITICAL_OVERUTILIZATION for ratio > 1.30', () => {
      const saar = AspMathEngine.calculateSaar(360, 240);
      assert.strictEqual(saar.saarRatio, 1.50);
      assert.strictEqual(saar.category, 'CRITICAL_OVERUTILIZATION');
      assert.ok(saar.clinicalInterpretationEn.includes('Critical antimicrobial overutilization'));
      assert.strictEqual(EMOJI_REGEX.test(saar.clinicalInterpretationKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(saar.clinicalInterpretationKm), false);
    });

    it('should categorize HIGH_CONSUMPTION for ratio between 1.01 and 1.30', () => {
      const saar = AspMathEngine.calculateSaar(120, 100);
      assert.strictEqual(saar.saarRatio, 1.20);
      assert.strictEqual(saar.category, 'HIGH_CONSUMPTION');
    });

    it('should categorize BENCHMARK for ratio between 0.70 and 1.00', () => {
      const saar = AspMathEngine.calculateSaar(85, 100);
      assert.strictEqual(saar.saarRatio, 0.85);
      assert.strictEqual(saar.category, 'BENCHMARK');
    });

    it('should categorize OPTIMAL for ratio below 0.70', () => {
      const saar = AspMathEngine.calculateSaar(50, 100);
      assert.strictEqual(saar.saarRatio, 0.50);
      assert.strictEqual(saar.category, 'OPTIMAL');
    });
  });

  describe('3. Procalcitonin (PCT) Kinetics Cessation Algorithm', () => {
    it('should recommend strong cessation when delta PCT >= 80% with clinical stability', () => {
      // Baseline 5.0 mcg/L, Day 3: 0.8 mcg/L -> 84% decline
      const kinetics = AspMathEngine.evaluateProcalcitoninKinetics(5.0, 0.8, 36, 75);
      assert.strictEqual(kinetics.deltaPctPercent, 84);
      assert.strictEqual(kinetics.recommendation, 'STRONG_CESSATION_RECOMMENDED');
      assert.ok(kinetics.rationaleEn.includes('at least 80%'));
      assert.strictEqual(EMOJI_REGEX.test(kinetics.rationaleKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(kinetics.rationaleKm), false);
    });

    it('should recommend strong cessation when absolute PCT < 0.25 mcg/L with clinical stability', () => {
      // Baseline 0.6 mcg/L, Day 2: 0.15 mcg/L
      const kinetics = AspMathEngine.evaluateProcalcitoninKinetics(0.6, 0.15, 28, 80);
      assert.strictEqual(kinetics.recommendation, 'STRONG_CESSATION_RECOMMENDED');
    });

    it('should recommend CONSIDER_CESSATION when PCT drops 80% but fever or instability persists', () => {
      // Baseline 4.0 mcg/L, Day 2: 0.5 mcg/L -> 87.5% decline, but only 12 hours afebrile
      const kinetics = AspMathEngine.evaluateProcalcitoninKinetics(4.0, 0.5, 12, 70);
      assert.strictEqual(kinetics.recommendation, 'CONSIDER_CESSATION');
    });

    it('should flag TREATMENT_FAILURE_OR_RESISTANCE_RISK when PCT increases or remains severely high', () => {
      // Baseline 2.0 mcg/L, Day 2: 3.5 mcg/L -> rising PCT
      const kinetics = AspMathEngine.evaluateProcalcitoninKinetics(2.0, 3.5, 0, 60);
      assert.strictEqual(kinetics.recommendation, 'TREATMENT_FAILURE_OR_RESISTANCE_RISK');
    });

    it('should advise CONTINUE_ANTIBIOTICS when drop is partial under 80%', () => {
      // Baseline 4.0 mcg/L, Day 2: 2.2 mcg/L -> 45% decline
      const kinetics = AspMathEngine.evaluateProcalcitoninKinetics(4.0, 2.2, 24, 75);
      assert.strictEqual(kinetics.recommendation, 'CONTINUE_ANTIBIOTICS');
    });
  });

  describe('4. IV-to-Oral (PO) Step-down Algorithmic Validator', () => {
    it('should qualify patient for oral switch when all clinical criteria and bioavailability met', () => {
      const result = AspMathEngine.evaluateIvToOralStepDown(
        'CIPROFLOXACIN_IV',
        'Ciprofloxacin IV',
        3, // 3 days on IV
        36, // afebrile 36h
        75, // MAP 75
        7200, // WBC normal
        true // functional GI tract
      );

      assert.strictEqual(result.isCandidate, true);
      assert.strictEqual(result.recommendedOralDrug, 'Ciprofloxacin Tablets');
      assert.strictEqual(result.recommendedOralDose, '750 mg PO q12h');
      assert.strictEqual(result.bioavailabilityPercent, 80);
      assert.strictEqual(EMOJI_REGEX.test(result.clinicalRecommendationKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(result.clinicalRecommendationKm), false);
    });

    it('should block oral switch if patient has received IV for less than 48 hours', () => {
      const result = AspMathEngine.evaluateIvToOralStepDown(
        'LEVOFLOXACIN_IV',
        'Levofloxacin IV',
        1, // only 1 day on IV
        30,
        80,
        6500,
        true
      );

      assert.strictEqual(result.isCandidate, false);
      assert.strictEqual(result.criteriaMet.daysOnIvAtLeast48h, false);
    });

    it('should block oral switch if gastrointestinal tract is non-functional', () => {
      const result = AspMathEngine.evaluateIvToOralStepDown(
        'LINEZOLID_IV',
        'Linezolid IV',
        4,
        48,
        85,
        5500,
        false // ileus or vomiting
      );

      assert.strictEqual(result.isCandidate, false);
      assert.strictEqual(result.criteriaMet.functionalGiTract, false);
    });
  });

  describe('5. Bug-Drug Intrinsic Resistance Detection (EUCAST & CLSI)', () => {
    it('should detect intrinsic resistance of Pseudomonas aeruginosa to Ceftriaxone', () => {
      const alert = AspMathEngine.detectBugDrugMismatches('PSEUDOMONAS_AERUGINOSA', 'CEFTRIAXONE');
      assert.strictEqual(alert.isMismatch, true);
      assert.strictEqual(alert.mismatchType, 'INTRINSIC_RESISTANCE');
      assert.ok(alert.warningEn.includes('AmpC beta-lactamase'));
      assert.ok(alert.recommendedAlternativeEn.includes('Meropenem'));
      assert.strictEqual(EMOJI_REGEX.test(alert.warningKm), false);
      assert.strictEqual(KHMER_PAREN_REGEX.test(alert.warningKm), false);
    });

    it('should detect intrinsic resistance of Escherichia coli to Vancomycin', () => {
      const alert = AspMathEngine.detectBugDrugMismatches('ESCHERICHIA_COLI', 'VANCOMYCIN');
      assert.strictEqual(alert.isMismatch, true);
      assert.strictEqual(alert.mismatchType, 'INTRINSIC_RESISTANCE');
      assert.ok(alert.warningEn.includes('outer membrane impermeable'));
    });

    it('should detect intrinsic resistance of Klebsiella pneumoniae to Ampicillin', () => {
      const alert = AspMathEngine.detectBugDrugMismatches('KLEBSIELLA_PNEUMONIAE', 'AMPICILLIN');
      assert.strictEqual(alert.isMismatch, true);
      assert.strictEqual(alert.mismatchType, 'INTRINSIC_RESISTANCE');
      assert.ok(alert.warningEn.includes('SHV-1'));
    });

    it('should detect intrinsic resistance of Enterococcus faecalis to Cephalosporins', () => {
      const alert = AspMathEngine.detectBugDrugMismatches('ENTEROCOCCUS_FAECALIS', 'CEFAZOLIN');
      assert.strictEqual(alert.isMismatch, true);
      assert.strictEqual(alert.mismatchType, 'INTRINSIC_RESISTANCE');
    });

    it('should confirm match when antibiotic is active and has no intrinsic resistance', () => {
      const alert = AspMathEngine.detectBugDrugMismatches('PSEUDOMONAS_AERUGINOSA', 'MEROPENEM');
      assert.strictEqual(alert.isMismatch, false);
      assert.strictEqual(alert.mismatchType, 'MATCH');
    });
  });

  describe('6. Antibiogram Susceptibility Percentage Calculation', () => {
    it('should compute exact susceptibility percentage from isolate counts', () => {
      const percent = AspMathEngine.calculateAntibiogramSusceptibility(122, 142);
      assert.strictEqual(percent, 85.9);
    });

    it('should handle zero tested isolates gracefully', () => {
      const percent = AspMathEngine.calculateAntibiogramSusceptibility(0, 0);
      assert.strictEqual(percent, 0);
    });
  });

  describe('7. ASP Service & Restricted Formulary Workflows', () => {
    it('should retrieve master antimicrobial formulary with restricted flags', () => {
      const service = AspService.getInstance();
      const agents = service.getAntimicrobialAgents();
      assert.ok(agents.length >= 8);

      const mero = agents.find((a) => a.code === 'MEROPENEM');
      assert.ok(mero);
      assert.strictEqual(mero.isRestricted, true);
      assert.strictEqual(mero.requiresSpecialistApproval, true);

      const linezolid = agents.find((a) => a.code === 'LINEZOLID');
      assert.ok(linezolid);
      assert.strictEqual(linezolid.oralBioavailabilityPercent, 100);
      assert.ok(linezolid.oralEquivalent);
    });

    it('should retrieve cumulative antibiogram data for local pathogen surveillance', () => {
      const service = AspService.getInstance();
      const antibiogram = service.getAntibiogram();
      assert.ok(antibiogram.length >= 4);

      const pa = antibiogram.find((p) => p.pathogenCode === 'PSEUDOMONAS_AERUGINOSA');
      assert.ok(pa);
      assert.strictEqual(pa.isolateCount, 142);
      assert.strictEqual(pa.susceptibilities['MEROPENEM'].susceptibilityPercent, 85.9);
      assert.strictEqual(pa.susceptibilities['CEFTRIAXONE'].resistancePattern, 'INTRINSICALLY_RESISTANT');
    });

    it('should submit and approve restricted antimicrobial request', () => {
      const service = AspService.getInstance();
      const req = service.submitApprovalRequest({
        patientId: 'P-ICU-9901',
        patientName: 'Kosal Hang',
        prescribingDoctor: 'Dr. Vireak Chhun',
        agentCode: 'COLISTIN',
        agentName: 'Colistin IV',
        requestedDose: '3 million IU IV q8h',
        clinicalIndication: 'Extensively drug-resistant Acinetobacter baumannii sepsis',
        cultureSpecimenSent: true
      });

      assert.ok(req.id.startsWith('REQ-ASP-'));
      assert.strictEqual(req.status, 'PENDING');

      const approved = service.reviewApprovalRequest(
        req.id,
        'APPROVED',
        'Susceptibility confirms Colistin sensitivity only. Approved for 7 days.',
        'Dr. Sophea Neth - ASP Specialist'
      );

      assert.strictEqual(approved.status, 'APPROVED');
      assert.strictEqual(approved.reviewedBy, 'Dr. Sophea Neth - ASP Specialist');
    });
  });

  describe('8. ASP Controller Endpoints Handling', () => {
    it('should handle GET /api/asp/metrics with DOT, LOT, and SAAR', () => {
      const controller = new AspController();
      const res = controller.handleRequest('/api/asp/metrics', 'GET', { unit: 'ICU', patientDays: '100', predictedDot: '50' }, {});
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.unit, 'ICU');
      assert.ok(res.data.summary.totalDaysOfTherapy > 0);
      assert.ok(res.data.saar.saarRatio !== undefined);
    });

    it('should handle POST /api/asp/evaluate-pct', () => {
      const controller = new AspController();
      const res = controller.handleRequest('/api/asp/evaluate-pct', 'POST', {}, {
        baselinePct: 4.5,
        currentPct: 0.5,
        afebrileHours: 36,
        meanArterialPressure: 78
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.recommendation, 'STRONG_CESSATION_RECOMMENDED');
    });

    it('should handle POST /api/asp/check-mismatch', () => {
      const controller = new AspController();
      const res = controller.handleRequest('/api/asp/check-mismatch', 'POST', {}, {
        pathogenCode: 'PSEUDOMONAS_AERUGINOSA',
        antibioticCode: 'CEFTRIAXONE'
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.isMismatch, true);
    });
  });

  describe('9. Strict Compliance Verification: Zero Emojis and Zero Parentheses in Khmer', () => {
    it('should guarantee strictly ZERO emojis across all generated texts', () => {
      const saar = AspMathEngine.calculateSaar(150, 100);
      const pct = AspMathEngine.evaluateProcalcitoninKinetics(3.0, 0.2, 48, 80);
      const ivToPo = AspMathEngine.evaluateIvToOralStepDown('CIPROFLOXACIN_IV', 'Ciprofloxacin IV', 3, 24, 70, 8000, true);
      const mismatch = AspMathEngine.detectBugDrugMismatches('PSEUDOMONAS_AERUGINOSA', 'CEFTRIAXONE');

      const texts = [
        saar.clinicalInterpretationEn,
        saar.clinicalInterpretationKm,
        pct.rationaleEn,
        pct.rationaleKm,
        ivToPo.clinicalRecommendationEn,
        ivToPo.clinicalRecommendationKm,
        mismatch.warningEn,
        mismatch.warningKm,
        mismatch.recommendedAlternativeEn,
        mismatch.recommendedAlternativeKm
      ];

      for (const text of texts) {
        assert.strictEqual(EMOJI_REGEX.test(text), false, `Emoji found in: ${text}`);
      }
    });

    it('should guarantee strictly ZERO parentheses in any Khmer language ASP text', () => {
      const saar = AspMathEngine.calculateSaar(150, 100);
      const pct = AspMathEngine.evaluateProcalcitoninKinetics(3.0, 0.2, 48, 80);
      const ivToPo = AspMathEngine.evaluateIvToOralStepDown('CIPROFLOXACIN_IV', 'Ciprofloxacin IV', 3, 24, 70, 8000, true);
      const mismatch = AspMathEngine.detectBugDrugMismatches('PSEUDOMONAS_AERUGINOSA', 'CEFTRIAXONE');

      const khmerTexts = [
        saar.clinicalInterpretationKm,
        pct.rationaleKm,
        ivToPo.clinicalRecommendationKm,
        mismatch.warningKm,
        mismatch.recommendedAlternativeKm
      ];

      for (const text of khmerTexts) {
        assert.strictEqual(KHMER_PAREN_REGEX.test(text), false, `Parenthesis found in Khmer text: ${text}`);
      }
    });
  });
});
