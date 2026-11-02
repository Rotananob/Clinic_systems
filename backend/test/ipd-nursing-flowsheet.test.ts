import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { IpdService } from '../src/ipd/ipd.service.ts';

describe('Phase 4: IPD Inpatient Nursing Flowsheet, NEWS2 & Braden Scale Test Suite', () => {
  let ipdService: IpdService;
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

  beforeEach(() => {
    ipdService = new IpdService();
  });

  it('should accurately calculate Braden Scale score and map to correct clinical risk tier', () => {
    const admissionId = 'adm-20261020-01';

    // Test Very High Risk (<= 9)
    const veryHigh = ipdService.assessBradenScale(admissionId, {
      sensoryPerception: 1,
      moisture: 1,
      activity: 1,
      mobility: 1,
      nutrition: 1,
      frictionShear: 1,
      nurseName: 'Nurse Kolap',
    });
    assert.equal(veryHigh.totalScore, 6);
    assert.equal(veryHigh.riskLevel, 'VERY_HIGH_RISK');
    assert.equal(veryHigh.riskLevelKh, 'ហានិភ័យធ្ងន់ធ្ងរខ្លាំង');
    assert.ok(veryHigh.protocols.length >= 3);

    // Test High Risk (10 - 12)
    const high = ipdService.assessBradenScale(admissionId, {
      sensoryPerception: 2,
      moisture: 2,
      activity: 2,
      mobility: 2,
      nutrition: 2,
      frictionShear: 1,
      nurseName: 'Nurse Kolap',
    });
    assert.equal(high.totalScore, 11);
    assert.equal(high.riskLevel, 'HIGH_RISK');
    assert.equal(high.riskLevelKh, 'ហានិភ័យខ្ពស់');

    // Test Moderate Risk (13 - 14)
    const mod = ipdService.assessBradenScale(admissionId, {
      sensoryPerception: 2,
      moisture: 2,
      activity: 2,
      mobility: 3,
      nutrition: 3,
      frictionShear: 2,
      nurseName: 'Nurse Kolap',
    });
    assert.equal(mod.totalScore, 14);
    assert.equal(mod.riskLevel, 'MODERATE_RISK');
    assert.equal(mod.riskLevelKh, 'ហានិភ័យមធ្យម');

    // Test Mild Risk (15 - 18)
    const mild = ipdService.assessBradenScale(admissionId, {
      sensoryPerception: 3,
      moisture: 3,
      activity: 3,
      mobility: 3,
      nutrition: 3,
      frictionShear: 2,
      nurseName: 'Nurse Kolap',
    });
    assert.equal(mild.totalScore, 17);
    assert.equal(mild.riskLevel, 'MILD_RISK');
    assert.equal(mild.riskLevelKh, 'ហានិភ័យទាប');

    // Test No Risk (19 - 23)
    const noRisk = ipdService.assessBradenScale(admissionId, {
      sensoryPerception: 4,
      moisture: 4,
      activity: 4,
      mobility: 4,
      nutrition: 4,
      frictionShear: 3,
      nurseName: 'Nurse Kolap',
    });
    assert.equal(noRisk.totalScore, 23);
    assert.equal(noRisk.riskLevel, 'NO_RISK');
    assert.equal(noRisk.riskLevelKh, 'គ្មានហានិភ័យ');
  });

  it('should compute NEWS2 score accurately and trigger correct monitoring frequency and clinical risk', () => {
    const admissionId = 'adm-20261020-01';

    // Normal vitals -> Score 0 -> LOW
    const normal = ipdService.recordVitalFlowsheet(admissionId, {
      respiratoryRate: 16,
      spo2Percent: 98,
      onSupplementalOxygen: false,
      systolicBp: 120,
      diastolicBp: 80,
      pulseRate: 72,
      consciousnessAvpu: 'ALERT',
      temperatureCelsius: 36.8,
      nurseName: 'Nurse Sreymom',
    });
    assert.equal(normal.news2Score, 0);
    assert.equal(normal.clinicalRisk, 'LOW');
    assert.equal(normal.monitoringFrequencyEn, '12 hourly routine monitoring');
    assert.equal(normal.monitoringFrequencyKh, 'តាមដានរៀងរាល់ ១២ម៉ោងម្តង');

    // Single score 3 parameter (Tachycardia 135 bpm) -> MEDIUM
    const singleThree = ipdService.recordVitalFlowsheet(admissionId, {
      respiratoryRate: 18,
      spo2Percent: 97,
      onSupplementalOxygen: false,
      systolicBp: 122,
      diastolicBp: 78,
      pulseRate: 135, // score 3
      consciousnessAvpu: 'ALERT',
      temperatureCelsius: 37.0,
      nurseName: 'Nurse Sreymom',
    });
    assert.equal(singleThree.clinicalRisk, 'MEDIUM');
    assert.equal(singleThree.monitoringFrequencyEn, 'Minimum 1 hourly monitoring & urgent clinical review');

    // Severe Deterioration -> High Critical (Score >= 7)
    const critical = ipdService.recordVitalFlowsheet(admissionId, {
      respiratoryRate: 26, // 3
      spo2Percent: 90, // 3
      onSupplementalOxygen: true, // 2
      systolicBp: 88, // 3
      diastolicBp: 50,
      pulseRate: 132, // 3
      consciousnessAvpu: 'VOICE', // 3
      temperatureCelsius: 39.4, // 2
      nurseName: 'Nurse Sreymom',
    });
    assert.equal(critical.news2Score >= 7, true);
    assert.equal(critical.clinicalRisk, 'HIGH_CRITICAL');
    assert.equal(critical.monitoringFrequencyEn, 'Continuous monitoring & Emergency MET Call');
    assert.equal(critical.monitoringFrequencyKh, 'តាមដានបន្តជាប់មិនឈប់ និងហៅក្រុមសង្គ្រោះបន្ទាន់ MET');
  });

  it('should accurately calculate daily room charges and stay days', () => {
    const admissionId = 'adm-20261020-01';
    const charges = ipdService.calculateStayCharges(admissionId, '2026-10-23T08:00:00Z');

    assert.equal(charges.daysStayed, 3);
    assert.equal(charges.dailyRateUsd, 25.0);
    assert.equal(charges.totalRoomChargesUsd, 75.0);
    assert.equal(charges.totalRoomChargesKhr, 307500);
    assert.equal(charges.depositAmountUsd, 100.0);
    assert.equal(charges.netBalanceDueUsd, 0.0); // deposit 100 exceeds 75
  });

  it('should guarantee zero emojis across all generated clinical strings', () => {
    const admissionId = 'adm-20261020-01';

    const bradenList = ipdService.getBradenAssessments(admissionId);
    for (const b of bradenList) {
      assert.equal(emojiRegex.test(b.riskLevelKh), false);
      for (const p of b.protocols) {
        assert.equal(emojiRegex.test(p), false);
      }
    }

    const vitalList = ipdService.getVitalFlowsheet(admissionId);
    for (const v of vitalList) {
      assert.equal(emojiRegex.test(v.monitoringFrequencyEn), false);
      assert.equal(emojiRegex.test(v.monitoringFrequencyKh), false);
    }
  });

  it('should guarantee zero parentheses in Khmer text', () => {
    const admissionId = 'adm-20261020-01';

    const bradenList = ipdService.getBradenAssessments(admissionId);
    for (const b of bradenList) {
      assert.equal(b.riskLevelKh.includes('(') || b.riskLevelKh.includes(')'), false);
      for (const p of b.protocols) {
        assert.equal(p.includes('(') || p.includes(')'), false);
      }
    }

    const vitalList = ipdService.getVitalFlowsheet(admissionId);
    for (const v of vitalList) {
      assert.equal(v.monitoringFrequencyKh.includes('(') || v.monitoringFrequencyKh.includes(')'), false);
    }
  });
});
