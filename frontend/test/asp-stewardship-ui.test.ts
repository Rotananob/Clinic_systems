// Phase 11: Antimicrobial Stewardship Program (ASP) Frontend UI Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { ROUTE_PERMISSIONS, ROUTE_MINIMUM_PLAN } from '../src/lib/rbac.ts';
import { ALL_SYSTEM_MODULE_ROUTES, CORE_9_ROUTES } from '../src/lib/sidebar-navigation.ts';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
const KHMER_PAREN_REGEX = /[\u1780-\u17FF].*[()]/;

describe('Phase 11: Antimicrobial Stewardship Program (ASP) Frontend UI Suite', () => {
  it('should verify 100% dictionary key parity for asp localization between English and Khmer', () => {
    assert.ok(en.asp, 'en.asp must exist');
    assert.ok(km.asp, 'km.asp must exist');

    const enKeys = Object.keys(en.asp).sort();
    const kmKeys = Object.keys(km.asp).sort();

    assert.deepStrictEqual(enKeys, kmKeys, 'Dictionary keys for en.asp and km.asp must be 100% identical');
  });

  it('should guarantee strictly ZERO emojis across the entire asp localization dictionaries', () => {
    for (const [key, val] of Object.entries(en.asp)) {
      assert.strictEqual(EMOJI_REGEX.test(val), false, `Emoji found in en.asp.${key}: ${val}`);
    }
    for (const [key, val] of Object.entries(km.asp)) {
      assert.strictEqual(EMOJI_REGEX.test(val), false, `Emoji found in km.asp.${key}: ${val}`);
    }
    assert.strictEqual(EMOJI_REGEX.test(en.nav.asp), false, 'Emoji found in en.nav.asp');
    assert.strictEqual(EMOJI_REGEX.test(km.nav.asp), false, 'Emoji found in km.nav.asp');
  });

  it('should guarantee strictly ZERO parentheses in any Khmer language asp localization strings', () => {
    for (const [key, val] of Object.entries(km.asp)) {
      assert.strictEqual(KHMER_PAREN_REGEX.test(val), false, `Parenthesis found in km.asp.${key}: ${val}`);
    }
    assert.strictEqual(KHMER_PAREN_REGEX.test(km.nav.asp), false, 'Parenthesis found in km.nav.asp');
  });

  it('should verify /asp route permission is registered in RBAC with ENTERPRISE_12 minimum plan tier', () => {
    const perm = ROUTE_PERMISSIONS.find((p) => p.path === '/asp');
    assert.ok(perm, '/asp must be registered in ROUTE_PERMISSIONS');
    assert.ok(perm.allowedRoles.includes('DOCTOR'));
    assert.ok(perm.allowedRoles.includes('PHARMACIST'));
    assert.strictEqual(EMOJI_REGEX.test(perm.labelKh), false);
    assert.strictEqual(KHMER_PAREN_REGEX.test(perm.labelKh), false);

    assert.strictEqual(ROUTE_MINIMUM_PLAN['/asp'], 'ENTERPRISE_12');
  });

  it('should verify /asp is registered in system routes while preserving 10-button primary sidebar', () => {
    assert.ok(ALL_SYSTEM_MODULE_ROUTES.includes('/asp' as any), '/asp must be in ALL_SYSTEM_MODULE_ROUTES');
    assert.strictEqual(CORE_9_ROUTES.length, 9, 'Core sidebar must preserve exactly 9 operational routes');
    assert.strictEqual(CORE_9_ROUTES.includes('/asp' as any), false, '/asp must be an explore module, not replacing core 9');
  });
});
