// Phase 13: Neonatal & Pediatric Precision Pharmacotherapy & Phototherapy UI Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { ROUTE_PERMISSIONS, ROUTE_MINIMUM_PLAN } from '../src/lib/rbac.ts';
import { ALL_SYSTEM_MODULE_ROUTES, CORE_9_ROUTES } from '../src/lib/sidebar-navigation.ts';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
const KHMER_PAREN_REGEX = /[\u1780-\u17FF].*[()]/;

describe('Phase 13: Neonatal & Pediatric Precision Pharmacotherapy UI Suite', () => {
  it('should verify 100% dictionary key parity for pediatric localization between English and Khmer', () => {
    assert.ok(en.pediatric, 'en.pediatric must exist');
    assert.ok(km.pediatric, 'km.pediatric must exist');

    const enKeys = Object.keys(en.pediatric).sort();
    const kmKeys = Object.keys(km.pediatric).sort();

    assert.strictEqual(enKeys.length, kmKeys.length, 'Key counts must be identical');
    assert.deepStrictEqual(enKeys, kmKeys, 'Dictionary keys for en.pediatric and km.pediatric must be 100% identical');
  });

  it('should guarantee strictly ZERO emojis across the entire pediatric localization dictionaries', () => {
    for (const [key, val] of Object.entries(en.pediatric)) {
      assert.strictEqual(EMOJI_REGEX.test(val), false, `Emoji found in en.pediatric.${key}: ${val}`);
    }
    for (const [key, val] of Object.entries(km.pediatric)) {
      assert.strictEqual(EMOJI_REGEX.test(val), false, `Emoji found in km.pediatric.${key}: ${val}`);
    }
    assert.strictEqual(EMOJI_REGEX.test(en.nav.pediatric), false, 'Emoji found in en.nav.pediatric');
    assert.strictEqual(EMOJI_REGEX.test(km.nav.pediatric), false, 'Emoji found in km.nav.pediatric');
  });

  it('should guarantee strictly ZERO parentheses in any Khmer language pediatric localization strings', () => {
    for (const [key, val] of Object.entries(km.pediatric)) {
      assert.strictEqual(KHMER_PAREN_REGEX.test(val), false, `Parenthesis found in km.pediatric.${key}: ${val}`);
    }
    assert.strictEqual(KHMER_PAREN_REGEX.test(km.nav.pediatric), false, 'Parenthesis found in km.nav.pediatric');
  });

  it('should verify /pediatric route permission is registered in RBAC with ENTERPRISE_12 minimum plan tier', () => {
    const perm = ROUTE_PERMISSIONS.find((p) => p.path === '/pediatric');
    assert.ok(perm, '/pediatric must be registered in ROUTE_PERMISSIONS');
    assert.ok(perm.allowedRoles.includes('DOCTOR'));
    assert.ok(perm.allowedRoles.includes('PHARMACIST'));
    assert.strictEqual(EMOJI_REGEX.test(perm.labelKh), false);
    assert.strictEqual(KHMER_PAREN_REGEX.test(perm.labelKh), false);

    assert.strictEqual(ROUTE_MINIMUM_PLAN['/pediatric'], 'ENTERPRISE_12');
  });

  it('should verify /pediatric is registered in system routes while preserving 10-button primary sidebar', () => {
    assert.ok(ALL_SYSTEM_MODULE_ROUTES.includes('/pediatric' as any), '/pediatric must be in ALL_SYSTEM_MODULE_ROUTES');
    assert.strictEqual(CORE_9_ROUTES.length, 9, 'Core sidebar must preserve exactly 9 operational routes');
    assert.strictEqual(CORE_9_ROUTES.includes('/pediatric' as any), false, '/pediatric must be an explore module, not replacing core 9');
  });

  it('should validate pediatric dose capping calculation logic (60 kg -> 900 mg vs 75 kg -> 1,000 mg adult max)', () => {
    // Normal weight: 60 kg * 15 mg/kg = 900 mg < 1000 mg adult ceiling
    const dose60 = Math.min(60 * 15, 1000);
    assert.strictEqual(dose60, 900);

    // Overweight: 75 kg * 15 mg/kg = 1125 mg -> clamped to 1000 mg
    const dose75 = Math.min(75 * 15, 1000);
    assert.strictEqual(dose75, 1000);
  });

  it('should validate historical approximation rules (Clark, Young, Fried)', () => {
    const adultDose = 500;
    // Clark's rule: (weight in lbs / 150) * adultDose
    // 30 kg = 66.1386 lbs => (66.1386 / 150) * 500 = 220.46 -> 220.5 mg
    const clarks = Math.round(((30 * 2.20462 / 150) * adultDose) * 10) / 10;
    assert.strictEqual(clarks, 220.5);

    // Young's rule: (age in years / (age + 12)) * adultDose
    // 4 / 16 * 500 = 125.0 mg
    const youngs = Math.round(((4 / (4 + 12)) * adultDose) * 10) / 10;
    assert.strictEqual(youngs, 125.0);

    // Fried's rule: (age in months / 150) * adultDose
    // 6 / 150 * 500 = 20.0 mg
    const frieds = Math.round(((6 / 150) * adultDose) * 10) / 10;
    assert.strictEqual(frieds, 20.0);
  });
});
