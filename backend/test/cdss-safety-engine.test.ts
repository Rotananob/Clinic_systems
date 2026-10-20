import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ClinicalDecisionSupportService,
  DDI_KNOWLEDGE_BASE,
  ALLERGY_CROSS_REFERENCE,
  CONTRAINDICATION_RULES,
  ICD11_DATABASE,
} from '../src/prescriptions/cdss.service.ts';

describe('Phase 4: Intelligent Clinical Decision Support (CDSS) Test Suite', () => {
  const cdss = new ClinicalDecisionSupportService();

  it('should detect severe DDI: Warfarin + Ibuprofen and flag BLOCK', () => {
    const alerts = cdss.checkDrugDrugInteractions(['Warfarin 5mg', 'Ibuprofen 400mg']);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].severity, 'SEVERE');
    assert.equal(alerts[0].action, 'BLOCK');
    assert.equal(alerts[0].clinicalRisk.includes('ហូរឈាម'), true);
  });

  it('should detect severe DDI: Simvastatin + Clarithromycin with safe alternative suggestion', () => {
    const alerts = cdss.checkDrugDrugInteractions(['Simvastatin 20mg', 'Clarithromycin 500mg']);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].severity, 'SEVERE');
    assert.equal(alerts[0].action, 'BLOCK');
    assert.equal(alerts[0].safeAlternative.includes('Azithromycin'), true);
  });

  it('should detect absolute contraindication: Sildenafil + Nitroglycerin', () => {
    const alerts = cdss.checkDrugDrugInteractions(['Sildenafil 50mg', 'Nitroglycerin 0.5mg sublingual']);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].severity, 'SEVERE');
    assert.equal(alerts[0].action, 'BLOCK');
  });

  it('should detect moderate DDI: Ciprofloxacin + Antacids and recommend staggered administration', () => {
    const alerts = cdss.checkDrugDrugInteractions(['Ciprofloxacin 500mg', 'Antacid Aluminum/Magnesium']);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].severity, 'MODERATE');
    assert.equal(alerts[0].action, 'WARNING_REQUIRES_OVERRIDE');
  });

  it('should cross-check documented Penicillin allergy against direct and cross-reactive medications', () => {
    // Direct match: Amoxicillin
    const directResult = cdss.checkAllergiesAndContraindications(
      ['Amoxicillin 500mg'],
      'Penicillin (severe hives)'
    );
    assert.equal(directResult.allergyAlerts.length, 1);
    assert.equal(directResult.allergyAlerts[0].severity, 'SEVERE');
    assert.equal(directResult.allergyAlerts[0].isCrossReactivity, false);

    // Cross-reactive match: Cefixime
    const crossResult = cdss.checkAllergiesAndContraindications(
      ['Cefixime 200mg'],
      'Penicillin'
    );
    assert.equal(crossResult.allergyAlerts.length, 1);
    assert.equal(crossResult.allergyAlerts[0].severity, 'MODERATE');
    assert.equal(crossResult.allergyAlerts[0].isCrossReactivity, true);
  });

  it('should cross-check documented Sulfa allergy against Cotrimoxazole / Bactrim', () => {
    const result = cdss.checkAllergiesAndContraindications(
      ['Cotrimoxazole 480mg (Bactrim)'],
      'Sulfa'
    );
    assert.equal(result.allergyAlerts.length, 1);
    assert.equal(result.allergyAlerts[0].severity, 'SEVERE');
  });

  it('should detect pregnancy contraindications and flag BLOCK', () => {
    const result = cdss.checkAllergiesAndContraindications(
      ['Enalapril 10mg', 'Paracetamol 500mg'],
      null,
      ['Pregnancy trimester 1']
    );
    assert.equal(result.contraindicationAlerts.length, 1);
    assert.equal(result.contraindicationAlerts[0].action, 'BLOCK');
    assert.equal(result.contraindicationAlerts[0].severity, 'SEVERE');
  });

  it('should search ICD-11 database by Khmer keywords and English medical terms', () => {
    const dengueResults = cdss.searchIcd11('គ្រុនឈាម');
    assert.equal(dengueResults.length > 0, true);
    assert.equal(dengueResults[0].icd11Code, '1D20');

    const hypertensionResults = cdss.searchIcd11('hypertension');
    assert.equal(hypertensionResults.length > 0, true);
    assert.equal(hypertensionResults[0].icd11Code, 'BA00');
  });

  it('should accurately calculate NEWS2 triage scores and categorize clinical risk levels', () => {
    // 1. Normal vitals -> Score 0 (LOW, GREEN)
    const normal = cdss.calculateNews2({
      respiratoryRate: 16,
      spO2: 98,
      onSupplementalOxygen: false,
      systolicBp: 120,
      heartRate: 72,
      temperature: 36.8,
      consciousness: 'ALERT',
    });
    assert.equal(normal.totalScore, 0);
    assert.equal(normal.riskLevel, 'LOW');
    assert.equal(normal.colorCode, 'GREEN');

    // 2. Moderate risk -> Score 5 (MEDIUM, YELLOW)
    const moderate = cdss.calculateNews2({
      respiratoryRate: 22, // 2 pts
      spO2: 94, // 1 pt
      onSupplementalOxygen: false,
      systolicBp: 105, // 1 pt
      heartRate: 98, // 1 pt
      temperature: 37.0,
      consciousness: 'ALERT',
    });
    assert.equal(moderate.totalScore, 5);
    assert.equal(moderate.riskLevel, 'MEDIUM');
    assert.equal(moderate.colorCode, 'YELLOW');

    // 3. High risk emergency -> Score >= 7 (HIGH, RED)
    const emergency = cdss.calculateNews2({
      respiratoryRate: 28, // 3 pts
      spO2: 89, // 3 pts
      onSupplementalOxygen: true, // 2 pts
      systolicBp: 85, // 3 pts
      heartRate: 135, // 3 pts
      temperature: 39.5, // 2 pts
      consciousness: 'CONFUSED', // 3 pts
    });
    assert.equal(emergency.totalScore >= 7, true);
    assert.equal(emergency.riskLevel, 'HIGH');
    assert.equal(emergency.colorCode, 'RED');
  });

  it('should guarantee zero emojis across entire CDSS database and generated recommendations', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    for (const rule of DDI_KNOWLEDGE_BASE) {
      assert.equal(emojiRegex.test(rule.mechanismKh), false);
      assert.equal(emojiRegex.test(rule.mechanismEn), false);
      assert.equal(emojiRegex.test(rule.clinicalRiskKh), false);
      assert.equal(emojiRegex.test(rule.recommendationKh), false);
      assert.equal(emojiRegex.test(rule.safeAlternativeKh), false);
    }

    for (const ref of ALLERGY_CROSS_REFERENCE) {
      assert.equal(emojiRegex.test(ref.allergyNameKh), false);
      assert.equal(emojiRegex.test(ref.allergyNameEn), false);
      assert.equal(emojiRegex.test(ref.mechanismKh), false);
    }

    for (const icd of ICD11_DATABASE) {
      assert.equal(emojiRegex.test(icd.titleKh), false);
      assert.equal(emojiRegex.test(icd.titleEn), false);
    }

    const testTriage = cdss.calculateNews2({ respiratoryRate: 26, spO2: 88 });
    assert.equal(emojiRegex.test(testTriage.clinicalRecommendationKh), false);
    assert.equal(emojiRegex.test(testTriage.clinicalRecommendationEn), false);
  });
});
