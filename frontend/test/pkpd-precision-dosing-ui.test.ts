import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_PERMISSIONS, ROUTE_MINIMUM_PLAN } from '../src/lib/rbac.ts';
import { CORE_9_ROUTES, ALL_SYSTEM_MODULE_ROUTES, TOTAL_PRIMARY_BUTTONS } from '../src/lib/sidebar-navigation.ts';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { api } from '../src/lib/api.ts';

describe('Phase 10: Clinical PK/PD Precision Dosing & Bayesian TDM Frontend UI Suite', () => {
  it('should define /pkpd route permission requiring clinical/pharmacist/admin roles and ENTERPRISE_12 plan tier', () => {
    const route = ROUTE_PERMISSIONS.find((r) => r.path === '/pkpd');
    assert.ok(route, '/pkpd route permission must exist');
    assert.equal(route.allowedRoles.includes('DOCTOR'), true);
    assert.equal(route.allowedRoles.includes('PHARMACIST'), true);
    assert.equal(route.allowedRoles.includes('ADMIN'), true);
    assert.equal(route.allowedRoles.includes('SUPER_ADMIN'), true);

    // Plan tier minimum
    assert.equal(ROUTE_MINIMUM_PLAN['/pkpd'], 'ENTERPRISE_12');
  });

  it('should preserve exactly 9 daily operational tools in primary sidebar and 10 total primary buttons', () => {
    assert.equal(CORE_9_ROUTES.length, 9, 'Primary sidebar must have strictly 9 core routes');
    assert.equal(TOTAL_PRIMARY_BUTTONS, 10, 'Primary sidebar must have strictly 10 total buttons');
    assert.equal(ALL_SYSTEM_MODULE_ROUTES.includes('/pkpd'), true, '/pkpd must be in ALL_SYSTEM_MODULE_ROUTES');
  });

  it('should expose complete api.pkpd client interface methods', () => {
    assert.ok(api.pkpd, 'api.pkpd client must be defined');
    assert.equal(typeof api.pkpd.getDrugs, 'function');
    assert.equal(typeof api.pkpd.getDrugByCode, 'function');
    assert.equal(typeof api.pkpd.calculateBiometrics, 'function');
    assert.equal(typeof api.pkpd.optimizeDosing, 'function');
    assert.equal(typeof api.pkpd.runBayesianFit, 'function');
    assert.equal(typeof api.pkpd.getConsultations, 'function');
    assert.equal(typeof api.pkpd.getConsultationById, 'function');
  });

  it('should verify complete translation parity between en.pkpd and km.pkpd', () => {
    assert.ok(en.pkpd, 'en.pkpd must exist');
    assert.ok(km.pkpd, 'km.pkpd must exist');

    const enKeys = Object.keys(en.pkpd);
    const kmKeys = Object.keys(km.pkpd);

    assert.ok(enKeys.length >= 30, 'Must have at least 30 PK/PD translation keys');
    assert.deepEqual(enKeys.sort(), kmKeys.sort(), 'en and km pkpd keys must have 100% parity');
  });

  it('should guarantee zero emojis across en.pkpd and km.pkpd dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.pkpd)) {
      assert.equal(emojiRegex.test(val), false, `en.pkpd.${key} contains emoji: "${val}"`);
    }

    for (const [key, val] of Object.entries(km.pkpd)) {
      assert.equal(emojiRegex.test(val), false, `km.pkpd.${key} contains emoji: "${val}"`);
    }
  });

  it('should guarantee strictly NO parentheses in km.pkpd strings', () => {
    for (const [key, val] of Object.entries(km.pkpd)) {
      assert.equal(
        val.includes('(') || val.includes(')'),
        false,
        `km.pkpd.${key} must not contain parentheses: "${val}"`
      );
    }
  });
});
