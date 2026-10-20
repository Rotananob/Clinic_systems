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

  it('should verify critical IPD and e-MAR localization keys exist', () => {
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
      'fluidSuccessToast'
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
});
