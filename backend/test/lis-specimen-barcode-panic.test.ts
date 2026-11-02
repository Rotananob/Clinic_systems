import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  LisService,
  CRITICAL_PANIC_THRESHOLDS,
  DEMOGRAPHIC_REFERENCE_RANGES,
} from '../src/lis/lis.service.ts';

describe('LIS Specimen Barcode Code128, Demographic Ranges & Critical Panic Suite', () => {
  let lisService: LisService;

  beforeEach(() => {
    lisService = new LisService();
  });

  it('should generate valid Code128 specimen barcodes with Modulo 103 checksum calculation', () => {
    const accessionNumber = 'ACC-20261102-1234';
    const patientId = 'PT-5678';

    const barcodeResult = LisService.generateCode128Barcode(accessionNumber, patientId);

    assert.ok(barcodeResult.barcodeData.startsWith('ACC202611021234'));
    assert.equal(barcodeResult.symbology, 'CODE128_B');
    assert.ok(barcodeResult.checkDigit >= 0 && barcodeResult.checkDigit <= 102);

    // Full barcode string must end with 2-digit zero-padded check digit
    assert.equal(barcodeResult.fullCode128String.length, barcodeResult.barcodeData.length + 2);

    // Verify valid barcode check
    const isValid = LisService.verifyCode128Barcode(barcodeResult.fullCode128String);
    assert.equal(isValid, true, 'Generated Code128 barcode must pass checksum verification');

    // Tampered barcode must fail verification
    const tampered = barcodeResult.fullCode128String.slice(0, -2) + '99';
    if (barcodeResult.checkDigit !== 99) {
      assert.equal(LisService.verifyCode128Barcode(tampered), false, 'Tampered barcode must fail verification');
    }
  });

  it('should calculate exact Modulo 103 checksum values according to Code128 specifications', () => {
    // Test data: 'LAB1001'
    // Start Code B = 104
    // Position 1: 'L' (ASCII 76 - 32 = 44) * 1 = 44
    // Position 2: 'A' (ASCII 65 - 32 = 33) * 2 = 66
    // Position 3: 'B' (ASCII 66 - 32 = 34) * 3 = 102
    // Position 4: '1' (ASCII 49 - 32 = 17) * 4 = 68
    // Position 5: '0' (ASCII 48 - 32 = 16) * 5 = 80
    // Position 6: '0' (ASCII 48 - 32 = 16) * 6 = 96
    // Position 7: '1' (ASCII 49 - 32 = 17) * 7 = 119
    // Sum = 104 + 44 + 66 + 102 + 68 + 80 + 96 + 119 = 679
    // 679 % 103 = 61
    const checksum = LisService.calculateCode128Checksum('LAB1001');
    assert.equal(checksum, 61);
  });

  it('should apply gender-stratified reference ranges for adult Hemoglobin (HGB)', () => {
    // Adult Male (age 35, gender M): Normal range 13.5 - 17.5 g/dL
    const maleRange = lisService.getDemographicReferenceRange('HGB', { age: 35, gender: 'M' });
    assert.equal(maleRange.minNormal, 13.5);
    assert.equal(maleRange.maxNormal, 17.5);
    assert.equal(maleRange.source, 'ADULT_MALE');

    // Adult Female (age 28, gender F): Normal range 12.0 - 15.5 g/dL
    const femaleRange = lisService.getDemographicReferenceRange('HGB', { age: 28, gender: 'F' });
    assert.equal(femaleRange.minNormal, 12.0);
    assert.equal(femaleRange.maxNormal, 15.5);
    assert.equal(femaleRange.source, 'ADULT_FEMALE');

    // HGB of 13.0 g/dL is NORMAL for adult female, but LOW for adult male
    const femaleResult = lisService.evaluateAnalyteWithDemographics('HGB', 13.0, { age: 28, gender: 'F' });
    assert.equal(femaleResult.flag, 'NORMAL');

    const maleResult = lisService.evaluateAnalyteWithDemographics('HGB', 13.0, { age: 35, gender: 'M' });
    assert.equal(maleResult.flag, 'LOW');
  });

  it('should apply gender-stratified reference ranges for adult Creatinine (CREA)', () => {
    // Adult Male (age 45, gender M): Normal range 0.7 - 1.3 mg/dL
    const maleRange = lisService.getDemographicReferenceRange('CREA', { age: 45, gender: 'M' });
    assert.equal(maleRange.minNormal, 0.7);
    assert.equal(maleRange.maxNormal, 1.3);

    // Adult Female (age 40, gender F): Normal range 0.5 - 1.1 mg/dL
    const femaleRange = lisService.getDemographicReferenceRange('CREA', { age: 40, gender: 'F' });
    assert.equal(femaleRange.minNormal, 0.5);
    assert.equal(femaleRange.maxNormal, 1.1);

    // Creatinine 1.25 mg/dL is NORMAL for adult male, but HIGH for adult female
    const maleEval = lisService.evaluateAnalyteWithDemographics('CREA', 1.25, { age: 45, gender: 'M' });
    assert.equal(maleEval.flag, 'NORMAL');

    const femaleEval = lisService.evaluateAnalyteWithDemographics('CREA', 1.25, { age: 40, gender: 'F' });
    assert.equal(femaleEval.flag, 'HIGH');
  });

  it('should apply pediatric reference ranges for children under 18 years of age', () => {
    // Pediatric Creatinine (Child age 7): Normal range 0.3 - 0.7 mg/dL
    const childCreaRange = lisService.getDemographicReferenceRange('CREA', { age: 7, gender: 'M' });
    assert.equal(childCreaRange.minNormal, 0.3);
    assert.equal(childCreaRange.maxNormal, 0.7);
    assert.equal(childCreaRange.source, 'PEDIATRIC');

    // Creatinine 0.9 mg/dL is NORMAL for an adult, but HIGH for a 7-year-old child
    const childEval = lisService.evaluateAnalyteWithDemographics('CREA', 0.9, { age: 7, gender: 'M' });
    assert.equal(childEval.flag, 'HIGH');

    // Pediatric Hemoglobin (Child age 5): Normal range 11.0 - 14.5 g/dL
    const childHgbRange = lisService.getDemographicReferenceRange('HGB', { age: 5, gender: 'F' });
    assert.equal(childHgbRange.minNormal, 11.0);
    assert.equal(childHgbRange.maxNormal, 14.5);
  });

  it('should trigger Critical Panic Alert when Serum Potassium is under 2.5 mmol/L (Severe Hypokalemia)', () => {
    // Potassium = 2.1 mmol/L (Critical threshold < 2.5)
    const result = lisService.evaluateAnalyteWithDemographics('K_PLUS', 2.1, { age: 50, gender: 'M' });

    assert.equal(result.flag, 'PANIC_CRITICAL');
    assert.equal(result.isCriticalPanic, true);
    assert.equal(result.panicAlert, true);
    assert.ok(result.criticalAlertMessageEn?.includes('Cardiac Arrest Risk'));
    assert.ok(result.criticalAlertMessageKh?.includes('កម្រិតប៉ូតាស្យូមគ្រោះថ្នាក់ខ្លាំង'));
  });

  it('should trigger Critical Panic Alert when Serum Potassium is over 6.0 mmol/L (Severe Hyperkalemia)', () => {
    // Potassium = 6.4 mmol/L (Critical threshold > 6.0)
    const result = lisService.evaluateAnalyteWithDemographics('K_PLUS', 6.4, { age: 62, gender: 'F' });

    assert.equal(result.flag, 'PANIC_CRITICAL');
    assert.equal(result.isCriticalPanic, true);
    assert.equal(result.panicAlert, true);
    assert.ok(result.criticalAlertMessageEn?.includes('Arrhythmia'));
  });

  it('should trigger Critical Panic Alert when Blood Glucose is under 40 mg/dL (Neuroglycopenia)', () => {
    // Glucose = 34 mg/dL (Critical threshold < 40)
    const result = lisService.evaluateAnalyteWithDemographics('GLU', 34, { age: 45, gender: 'M' });

    assert.equal(result.flag, 'PANIC_CRITICAL');
    assert.equal(result.isCriticalPanic, true);
    assert.equal(result.panicAlert, true);
    assert.ok(result.criticalAlertMessageEn?.includes('Neuroglycopenia'));
    assert.ok(result.criticalAlertMessageKh?.includes('កម្រិតជាតិស្ករគ្រោះថ្នាក់ខ្លាំង'));
  });

  it('should trigger Critical Panic Alert when Blood Glucose is over 450 mg/dL (Diabetic Ketoacidosis)', () => {
    // Glucose = 485 mg/dL (Critical threshold > 450)
    const result = lisService.evaluateAnalyteWithDemographics('GLU', 485, { age: 58, gender: 'F' });

    assert.equal(result.flag, 'PANIC_CRITICAL');
    assert.equal(result.isCriticalPanic, true);
    assert.equal(result.panicAlert, true);
    assert.ok(result.criticalAlertMessageEn?.includes('DKA Risk'));
  });

  it('should trigger Critical Panic Alert for severe Sodium, Platelets, and Hemoglobin abnormalities', () => {
    // Sodium < 120 mmol/L (Severe Hyponatremia)
    const naLow = lisService.evaluateAnalyteWithDemographics('NA_PLUS', 114);
    assert.equal(naLow.isCriticalPanic, true);

    // Sodium > 160 mmol/L (Severe Hypernatremia)
    const naHigh = lisService.evaluateAnalyteWithDemographics('NA_PLUS', 165);
    assert.equal(naHigh.isCriticalPanic, true);

    // Platelets < 20 10^9/L (Severe Thrombocytopenia)
    const pltLow = lisService.evaluateAnalyteWithDemographics('PLT', 14);
    assert.equal(pltLow.isCriticalPanic, true);

    // Hemoglobin < 6.0 g/dL (Life-threatening severe anemia)
    const hgbLow = lisService.evaluateAnalyteWithDemographics('HGB', 4.8);
    assert.equal(hgbLow.isCriticalPanic, true);

    // Hemoglobin > 20.0 g/dL (Severe Polycythemia)
    const hgbHigh = lisService.evaluateAnalyteWithDemographics('HGB', 21.5);
    assert.equal(hgbHigh.isCriticalPanic, true);
  });

  it('should guarantee zero emojis and zero parentheses in Khmer text throughout LIS panic alert messages', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    const khmerWithParensRegex = /[\u1780-\u17FF]+[()（）]+|[()（）]+[\u1780-\u17FF]+/;

    for (const [code, item] of Object.entries(CRITICAL_PANIC_THRESHOLDS)) {
      assert.equal(emojiRegex.test(item.clinicalRiskEn), false, `Emoji found in ${code} English risk message`);
      assert.equal(emojiRegex.test(item.clinicalRiskKh), false, `Emoji found in ${code} Khmer risk message`);
      assert.equal(khmerWithParensRegex.test(item.clinicalRiskKh), false, `Parenthesis found in ${code} Khmer risk message`);
    }
  });
});
