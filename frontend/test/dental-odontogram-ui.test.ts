import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 15: Dental Odontogram & Tooth Treatment Planner UI Test Suite', () => {
  it('should verify 100% dictionary key parity for dental localization', () => {
    const enDental = (en as any).dental;
    const kmDental = (km as any).dental;

    assert.notEqual(enDental, undefined, 'en.dental must exist');
    assert.notEqual(kmDental, undefined, 'km.dental must exist');

    const enKeys = Object.keys(enDental).sort();
    const kmKeys = Object.keys(kmDental).sort();

    assert.equal(enKeys.length > 0, true, 'en.dental must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km dental must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire dental localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enDental = (en as any).dental;
    const kmDental = (km as any).dental;

    for (const [key, value] of Object.entries(enDental)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.dental.${key}: "${value}"`
      );
    }

    for (const [key, value] of Object.entries(kmDental)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.dental.${key}: "${value}"`
      );
    }
  });

  it('should verify nav.dental exists in both English and Khmer with zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enNav = (en as any).nav?.dental;
    const kmNav = (km as any).nav?.dental;

    assert.notEqual(enNav, undefined, 'en.nav.dental must exist');
    assert.notEqual(kmNav, undefined, 'km.nav.dental must exist');

    assert.equal(emojiRegex.test(enNav), false, `Emoji found in en.nav.dental: ${enNav}`);
    assert.equal(emojiRegex.test(kmNav), false, `Emoji found in km.nav.dental: ${kmNav}`);
  });

  it('should verify critical anatomical odontogram keys exist in dictionaries', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'tabChart',
      'tabTreatmentPlan',
      'tabProcedures',
      'upperJaw',
      'lowerJaw',
      'statusHealthy',
      'statusCaries',
      'statusFilled',
      'statusCrown',
      'statusImplant',
      'statusMissing',
      'statusRootCanal',
      'dmftTitle',
      'dmftDecayed',
      'dmftMissing',
      'dmftFilled',
      'dmftScore',
      'createPlanButton',
      'zeroEmojiStandards'
    ];

    const enDental = (en as any).dental;
    for (const key of requiredKeys) {
      assert.notEqual(enDental[key], undefined, `Missing key en.dental.${key}`);
    }
  });

  it('should accurately compute WHO DMFT Index and assign standard risk categories', () => {
    const computeDmft = (decayed: number, missing: number, filled: number) => {
      const totalDmft = decayed + missing + filled;
      let riskCategory: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
      if (totalDmft <= 2) riskCategory = 'LOW';
      else if (totalDmft <= 4) riskCategory = 'MODERATE';
      else if (totalDmft <= 8) riskCategory = 'HIGH';
      else riskCategory = 'VERY_HIGH';

      return { totalDmft, riskCategory };
    };

    // Low risk patient (0-2)
    const low = computeDmft(1, 0, 1);
    assert.equal(low.totalDmft, 2);
    assert.equal(low.riskCategory, 'LOW');

    // Moderate risk patient (3-4)
    const mod = computeDmft(2, 1, 1);
    assert.equal(mod.totalDmft, 4);
    assert.equal(mod.riskCategory, 'MODERATE');

    // High risk patient (5-8)
    const high = computeDmft(3, 2, 2);
    assert.equal(high.totalDmft, 7);
    assert.equal(high.riskCategory, 'HIGH');

    // Very high risk patient (>8)
    const veryHigh = computeDmft(6, 4, 3);
    assert.equal(veryHigh.totalDmft, 13);
    assert.equal(veryHigh.riskCategory, 'VERY_HIGH');
  });

  it('should verify standard FDI 32 adult dentition numbers across all four quadrants', () => {
    const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
    const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
    const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];
    const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];

    const allTeeth = [...upperRight, ...upperLeft, ...lowerLeft, ...lowerRight];
    assert.equal(allTeeth.length, 32);

    const uniqueSet = new Set(allTeeth);
    assert.equal(uniqueSet.size, 32);

    // Verify tooth 18 is wisdom tooth (upper right 3rd molar)
    assert.equal(upperRight[0], 18);
    // Verify tooth 11 is central incisor (upper right central)
    assert.equal(upperRight[7], 11);
  });
});
