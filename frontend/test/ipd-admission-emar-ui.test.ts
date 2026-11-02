import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 13: Inpatient Admission, Bed Management & Nurse e-MAR UI Test Suite', () => {
  it('should verify 100% dictionary key parity for ipd localization', () => {
    const enIpd = (en as any).ipd;
    const kmIpd = (km as any).ipd;

    assert.notEqual(enIpd, undefined, 'en.ipd must exist');
    assert.notEqual(kmIpd, undefined, 'km.ipd must exist');

    const enKeys = Object.keys(enIpd).sort();
    const kmKeys = Object.keys(kmIpd).sort();

    assert.equal(enKeys.length > 0, true, 'en.ipd must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km ipd must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire ipd localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enIpd = (en as any).ipd;
    const kmIpd = (km as any).ipd;

    for (const [key, value] of Object.entries(enIpd)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.ipd.${key}: "${value}"`
      );
    }

    for (const [key, value] of Object.entries(kmIpd)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.ipd.${key}: "${value}"`
      );
    }
  });

  it('should verify nav.ipd exists in both English and Khmer with zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enNav = (en as any).nav?.ipd;
    const kmNav = (km as any).nav?.ipd;

    assert.notEqual(enNav, undefined, 'en.nav.ipd must exist');
    assert.notEqual(kmNav, undefined, 'km.nav.ipd must exist');

    assert.equal(emojiRegex.test(enNav), false, `Emoji found in en.nav.ipd: ${enNav}`);
    assert.equal(emojiRegex.test(kmNav), false, `Emoji found in km.nav.ipd: ${kmNav}`);
  });

  it('should verify critical IPD, e-MAR, Braden, NEWS2, and Stay Charge localization keys exist', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'admitPatientButton',
      'transferBedButton',
      'dischargeButton',
      'markCleanedButton',
      'ivCalculatorButton',
      'emarTitle',
      'emarSubtitle',
      'scanWristbandPrompt',
      'scanMedicationPrompt',
      'confirmAdminister',
      'fluidBalanceTitle',
      'intakeOral',
      'intakeIv',
      'outputUrine',
      'outputDrain',
      'netBalance',
      'recordFluidButton',
      'ivDripTitle',
      'ivVolume',
      'ivDurationHours',
      'ivDropFactor',
      'ivFlowRate',
      'ivDripRate',
      'calculateButton',
      'admitSuccessToast',
      'transferSuccessToast',
      'dischargeSuccessToast',
      'cleanSuccessToast',
      'administerSuccessToast',
      'fluidSuccessToast',
      'bradenTitle',
      'bradenScore',
      'sensoryPerception',
      'moisture',
      'activity',
      'mobility',
      'nutrition',
      'frictionShear',
      'bradenProtocols',
      'assessBradenButton',
      'vitalFlowsheetTitle',
      'recordVitalsButton',
      'respiratoryRate',
      'spo2',
      'supplementalOxygen',
      'bloodPressure',
      'pulseRate',
      'consciousness',
      'temperature',
      'news2Score',
      'clinicalRiskLevel',
      'monitoringFrequency',
      'stayChargesTitle',
      'daysStayed',
      'roomCharges',
      'netBalanceDue'
    ];

    const enIpd = (en as any).ipd;
    for (const key of requiredKeys) {
      assert.notEqual(enIpd[key], undefined, `Missing key en.ipd.${key}`);
    }
  });

  it('should accurately calculate IV infusion drip rate and flow rate', () => {
    const calculateIvDrip = (volumeMl: number, hours: number, dropFactorGtt: number) => {
      const flowRateMlPerHour = Math.round((volumeMl / hours) * 10) / 10;
      const dripRateGttPerMin = Math.round((volumeMl * dropFactorGtt) / (hours * 60));
      return { flowRateMlPerHour, dripRateGttPerMin };
    };

    // Scenario A: 1000ml over 8 hours at 20 gtt/ml
    const calcA = calculateIvDrip(1000, 8, 20);
    assert.equal(calcA.flowRateMlPerHour, 125);
    assert.equal(calcA.dripRateGttPerMin, 42);

    // Scenario B: 500ml over 4 hours at 15 gtt/ml
    const calcB = calculateIvDrip(500, 4, 15);
    assert.equal(calcB.flowRateMlPerHour, 125);
    assert.equal(calcB.dripRateGttPerMin, 31);

    // Scenario C: Pediatric microdrip 250ml over 6 hours at 60 gtt/ml
    const calcC = calculateIvDrip(250, 6, 60);
    assert.equal(calcC.flowRateMlPerHour, 41.7);
    assert.equal(calcC.dripRateGttPerMin, 42);
  });

  it('should accurately calculate net fluid balance Intake vs Output', () => {
    const calculateBalance = (oralMl: number, ivMl: number, urineMl: number, drainMl: number) => {
      const totalIntake = oralMl + ivMl;
      const totalOutput = urineMl + drainMl;
      const netBalance = totalIntake - totalOutput;
      return {
        totalIntake,
        totalOutput,
        netBalance,
        isPositive: netBalance >= 0
      };
    };

    // Positive balance (retention)
    const result1 = calculateBalance(800, 1200, 1100, 150);
    assert.equal(result1.totalIntake, 2000);
    assert.equal(result1.totalOutput, 1250);
    assert.equal(result1.netBalance, 750);
    assert.equal(result1.isPositive, true);

    // Negative balance (diuresis / fluid deficit)
    const result2 = calculateBalance(400, 500, 1200, 200);
    assert.equal(result2.totalIntake, 900);
    assert.equal(result2.totalOutput, 1400);
    assert.equal(result2.netBalance, -500);
    assert.equal(result2.isPositive, false);
  });

  it('should validate five rights barcode verification logic', () => {
    const verifyFiveRights = (
      expectedWristband: string,
      scannedWristband: string,
      expectedMedication: string,
      scannedMedication: string
    ) => {
      const wristbandMatch = scannedWristband.trim().toUpperCase() === expectedWristband.trim().toUpperCase();
      const medMatch = scannedMedication.trim().toUpperCase() === expectedMedication.trim().toUpperCase();
      return wristbandMatch && medMatch;
    };

    const expectedWrist = 'WB-PT1002-20261020';
    const expectedMed = 'MED-CEFTRIAXONE';

    // Successful match
    assert.equal(
      verifyFiveRights(expectedWrist, 'wb-pt1002-20261020', expectedMed, 'med-ceftriaxone'),
      true
    );

    // Mismatched wristband (wrong patient)
    assert.equal(
      verifyFiveRights(expectedWrist, 'WB-PT9999-20261020', expectedMed, expectedMed),
      false
    );

    // Mismatched medication (wrong drug)
    assert.equal(
      verifyFiveRights(expectedWrist, expectedWrist, expectedMed, 'MED-PARACETAMOL'),
      false
    );
  });

  it('should accurately calculate Braden Scale risk level and preventative protocols', () => {
    const calculateBradenRisk = (
      sensory: number,
      moisture: number,
      activity: number,
      mobility: number,
      nutrition: number,
      friction: number
    ) => {
      const totalScore = sensory + moisture + activity + mobility + nutrition + friction;
      let riskLevel = 'NO_RISK';
      if (totalScore <= 9) riskLevel = 'VERY_HIGH_RISK';
      else if (totalScore <= 12) riskLevel = 'HIGH_RISK';
      else if (totalScore <= 14) riskLevel = 'MODERATE_RISK';
      else if (totalScore <= 18) riskLevel = 'MILD_RISK';
      return { totalScore, riskLevel };
    };

    // Scenario 1: Severe bedridden patient (Very High Risk)
    const p1 = calculateBradenRisk(1, 1, 1, 1, 1, 1);
    assert.equal(p1.totalScore, 6);
    assert.equal(p1.riskLevel, 'VERY_HIGH_RISK');

    // Scenario 2: Moderate risk patient
    const p2 = calculateBradenRisk(3, 2, 2, 2, 3, 2);
    assert.equal(p2.totalScore, 14);
    assert.equal(p2.riskLevel, 'MODERATE_RISK');

    // Scenario 3: Mild risk patient
    const p3 = calculateBradenRisk(3, 3, 3, 3, 3, 2);
    assert.equal(p3.totalScore, 17);
    assert.equal(p3.riskLevel, 'MILD_RISK');

    // Scenario 4: Fully mobile patient (No Risk)
    const p4 = calculateBradenRisk(4, 4, 4, 4, 4, 3);
    assert.equal(p4.totalScore, 23);
    assert.equal(p4.riskLevel, 'NO_RISK');
  });

  it('should accurately calculate deterministic NEWS2 score and emergency MET escalation', () => {
    const calculateNews2 = (
      rr: number,
      spo2: number,
      onO2: boolean,
      sbp: number,
      pulse: number,
      avpu: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE',
      temp: number
    ) => {
      let respScore = 0;
      if (rr <= 8 || rr >= 25) respScore = 3;
      else if (rr <= 11) respScore = 1;
      else if (rr >= 21) respScore = 2;

      let spo2Score = 0;
      if (spo2 <= 91) spo2Score = 3;
      else if (spo2 <= 93) spo2Score = 2;
      else if (spo2 <= 95) spo2Score = 1;

      const o2Score = onO2 ? 2 : 0;

      let sbpScore = 0;
      if (sbp <= 90 || sbp >= 220) sbpScore = 3;
      else if (sbp <= 100) sbpScore = 2;
      else if (sbp <= 110) sbpScore = 1;

      let pulseScore = 0;
      if (pulse <= 40 || pulse >= 131) pulseScore = 3;
      else if (pulse <= 50 || (pulse >= 111 && pulse <= 130)) pulseScore = 2;
      else if (pulse >= 91 && pulse <= 110) pulseScore = 1;

      const avpuScore = avpu === 'ALERT' ? 0 : 3;

      let tempScore = 0;
      if (temp <= 35.0) tempScore = 3;
      else if (temp <= 36.0 || (temp >= 38.1 && temp <= 39.0)) tempScore = 1;
      else if (temp >= 39.1) tempScore = 2;

      const news2Score = respScore + spo2Score + o2Score + sbpScore + pulseScore + avpuScore + tempScore;
      const hasSingle3 = [respScore, spo2Score, sbpScore, pulseScore, avpuScore, tempScore].some((s) => s === 3);

      let clinicalRisk = 'LOW';
      if (news2Score >= 7) clinicalRisk = 'HIGH_CRITICAL';
      else if (news2Score >= 5 || hasSingle3) clinicalRisk = 'MEDIUM';
      else if (news2Score >= 1) clinicalRisk = 'LOW_MEDIUM';

      return { news2Score, clinicalRisk };
    };

    // Normal patient
    const normal = calculateNews2(16, 98, false, 120, 72, 'ALERT', 36.8);
    assert.equal(normal.news2Score, 0);
    assert.equal(normal.clinicalRisk, 'LOW');

    // Single red parameter: SpO2 90% triggers score 3 and Medium Risk
    const singleRed = calculateNews2(18, 90, false, 125, 75, 'ALERT', 37.0);
    assert.equal(singleRed.news2Score, 3);
    assert.equal(singleRed.clinicalRisk, 'MEDIUM');

    // Septic patient with High Critical deterioration
    const critical = calculateNews2(28, 91, true, 85, 135, 'VOICE', 39.4);
    assert.equal(critical.news2Score >= 7, true);
    assert.equal(critical.clinicalRisk, 'HIGH_CRITICAL');
  });

  it('should accurately compute inpatient stay charges and net balance due', () => {
    const calculateStayCharges = (
      admissionDateIso: string,
      calculateToDateIso: string,
      dailyRateUsd: number,
      depositAmountUsd: number
    ) => {
      const msPerDay = 1000 * 60 * 60 * 24;
      const start = new Date(admissionDateIso).getTime();
      const end = new Date(calculateToDateIso).getTime();
      const diffDays = Math.max(1, Math.ceil((end - start) / msPerDay));
      const totalRoomChargesUsd = diffDays * dailyRateUsd;
      const totalRoomChargesKhr = totalRoomChargesUsd * 4000;
      const netBalanceDueUsd = Math.max(0, totalRoomChargesUsd - depositAmountUsd);
      const netBalanceDueKhr = netBalanceDueUsd * 4000;
      return { diffDays, totalRoomChargesUsd, totalRoomChargesKhr, netBalanceDueUsd, netBalanceDueKhr };
    };

    // 4 days stay at USD 60 per day with USD 100 deposit
    const bill = calculateStayCharges('2026-10-20T08:00:00Z', '2026-10-24T08:00:00Z', 60, 100);
    assert.equal(bill.diffDays, 4);
    assert.equal(bill.totalRoomChargesUsd, 240);
    assert.equal(bill.totalRoomChargesKhr, 960000);
    assert.equal(bill.netBalanceDueUsd, 140);
    assert.equal(bill.netBalanceDueKhr, 560000);
  });
});
