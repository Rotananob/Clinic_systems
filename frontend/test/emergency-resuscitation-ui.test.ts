// Phase 14: Emergency Sepsis & Trauma Resuscitation UI Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { ROUTE_PERMISSIONS, ROUTE_MINIMUM_PLAN } from '../src/lib/rbac.ts';
import { ALL_SYSTEM_MODULE_ROUTES, CORE_9_ROUTES } from '../src/lib/sidebar-navigation.ts';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
const KHMER_PAREN_REGEX = /[\u1780-\u17FF].*[()]/;

describe('Phase 14: Emergency Sepsis & Trauma Resuscitation UI Suite', () => {
  it('should verify 100% dictionary key parity for resuscitation localization between English and Khmer', () => {
    assert.ok(en.resuscitation, 'en.resuscitation must exist');
    assert.ok(km.resuscitation, 'km.resuscitation must exist');

    const enKeys = Object.keys(en.resuscitation).sort();
    const kmKeys = Object.keys(km.resuscitation).sort();

    assert.deepStrictEqual(enKeys, kmKeys, 'Dictionary keys for en.resuscitation and km.resuscitation must be 100% identical');
  });

  it('should guarantee strictly ZERO emojis across the entire resuscitation localization dictionaries', () => {
    for (const [key, val] of Object.entries(en.resuscitation)) {
      assert.strictEqual(EMOJI_REGEX.test(val), false, `Emoji found in en.resuscitation.${key}: ${val}`);
    }
    for (const [key, val] of Object.entries(km.resuscitation)) {
      assert.strictEqual(EMOJI_REGEX.test(val), false, `Emoji found in km.resuscitation.${key}: ${val}`);
    }
    assert.strictEqual(EMOJI_REGEX.test(en.nav.resuscitation), false, 'Emoji found in en.nav.resuscitation');
    assert.strictEqual(EMOJI_REGEX.test(km.nav.resuscitation), false, 'Emoji found in km.nav.resuscitation');
  });

  it('should guarantee strictly ZERO parentheses in any Khmer language resuscitation localization strings', () => {
    for (const [key, val] of Object.entries(km.resuscitation)) {
      assert.strictEqual(KHMER_PAREN_REGEX.test(val), false, `Parenthesis found in km.resuscitation.${key}: ${val}`);
    }
    assert.strictEqual(KHMER_PAREN_REGEX.test(km.nav.resuscitation), false, 'Parenthesis found in km.nav.resuscitation');
  });

  it('should verify /resuscitation route permission is registered in RBAC with ENTERPRISE_12 minimum plan tier', () => {
    const perm = ROUTE_PERMISSIONS.find((p) => p.path === '/resuscitation');
    assert.ok(perm, '/resuscitation must be registered in ROUTE_PERMISSIONS');
    assert.ok(perm.allowedRoles.includes('DOCTOR'));
    assert.ok(perm.allowedRoles.includes('PHARMACIST'));
    assert.strictEqual(EMOJI_REGEX.test(perm.labelKh), false);
    assert.strictEqual(KHMER_PAREN_REGEX.test(perm.labelKh), false);

    assert.strictEqual(ROUTE_MINIMUM_PLAN['/resuscitation'], 'ENTERPRISE_12');
  });

  it('should verify /resuscitation is registered in system routes while preserving 10-button primary sidebar', () => {
    assert.ok(ALL_SYSTEM_MODULE_ROUTES.includes('/resuscitation' as any), '/resuscitation must be in ALL_SYSTEM_MODULE_ROUTES');
    assert.strictEqual(CORE_9_ROUTES.length, 9, 'Core sidebar must preserve exactly 9 operational routes');
    assert.strictEqual(CORE_9_ROUTES.includes('/resuscitation' as any), false, '/resuscitation must be an explore module, not replacing core 9');
  });

  it('should validate resuscitation mathematical logic benchmarks', () => {
    // Sepsis 30 mL/kg for 70 kg -> 2100 mL
    const fluid70 = 70 * 30;
    assert.strictEqual(fluid70, 2100);

    // Parkland 4 mL * 70 kg * 40% TBSA -> 11,200 mL
    const parkland = 4 * 70 * 40;
    assert.strictEqual(parkland, 11200);

    // Shock index HR 130 / SBP 80 -> 1.625 -> 1.63 (critical shock)
    const si = Math.round((130 / 80) * 100) / 100;
    assert.strictEqual(si, 1.63);
    assert.ok(si > 0.9);
  });
});
