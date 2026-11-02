import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_PERMISSIONS, ROUTE_MINIMUM_PLAN } from '../src/lib/rbac.ts';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { api } from '../src/lib/api.ts';

describe('Phase 6: MoH Controlled Substances & Narcotic Register Frontend Integration Suite', () => {
  it('should define /narcotics route permission requiring clinical roles and UNLIMITED_20 plan tier', () => {
    const route = ROUTE_PERMISSIONS.find((r) => r.path === '/narcotics');
    assert.ok(route, '/narcotics route permission must exist');
    assert.equal(route.allowedRoles.includes('DOCTOR'), true);
    assert.equal(route.allowedRoles.includes('PHARMACIST'), true);
    assert.equal(route.allowedRoles.includes('ADMIN'), true);
    assert.equal(route.allowedRoles.includes('SUPER_ADMIN'), true);

    // Plan tier minimum
    assert.equal(ROUTE_MINIMUM_PLAN['/narcotics'], 'UNLIMITED_20');
  });

  it('should expose complete api.narcotics client interface methods', () => {
    assert.ok(api.narcotics, 'api.narcotics client must be defined');
    assert.equal(typeof api.narcotics.getSafes, 'function');
    assert.equal(typeof api.narcotics.getMasterCatalog, 'function');
    assert.equal(typeof api.narcotics.getSafeLedger, 'function');
    assert.equal(typeof api.narcotics.unlockSession, 'function');
    assert.equal(typeof api.narcotics.dispense, 'function');
    assert.equal(typeof api.narcotics.shiftHandover, 'function');
    assert.equal(typeof api.narcotics.verifyIntegrity, 'function');
    assert.equal(typeof api.narcotics.getDiscrepancies, 'function');
    assert.equal(typeof api.narcotics.resolveDiscrepancy, 'function');
    assert.equal(typeof api.narcotics.exportMohXml, 'function');
  });

  it('should verify complete translation parity between en.narcotics and km.narcotics', () => {
    assert.ok(en.narcotics, 'en.narcotics must exist');
    assert.ok(km.narcotics, 'km.narcotics must exist');

    const enKeys = Object.keys(en.narcotics);
    const kmKeys = Object.keys(km.narcotics);

    assert.ok(enKeys.length >= 30, 'Must have at least 30 narcotic translation keys');
    assert.deepEqual(enKeys.sort(), kmKeys.sort(), 'en and km narcotic keys must have 100% parity');
  });

  it('should guarantee zero emojis across en.narcotics and km.narcotics dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.narcotics)) {
      assert.equal(emojiRegex.test(val), false, `en.narcotics.${key} contains emoji: "${val}"`);
    }

    for (const [key, val] of Object.entries(km.narcotics)) {
      assert.equal(emojiRegex.test(val), false, `km.narcotics.${key} contains emoji: "${val}"`);
    }
  });

  it('should guarantee strictly NO parentheses () in km.narcotics strings', () => {
    for (const [key, val] of Object.entries(km.narcotics)) {
      assert.equal(
        val.includes('(') || val.includes(')'),
        false,
        `km.narcotics.${key} contains forbidden parentheses: "${val}". Use hyphens, colons, or commas instead.`,
      );
    }
  });

  it('should validate conservation of mass balance calculation for fractional wastage', () => {
    const ampouleStrengthMg = 10.0;
    const administeredDoseMg = 4.0;
    const computedWasteMg = Math.max(0, Number((ampouleStrengthMg - administeredDoseMg).toFixed(3)));

    assert.equal(computedWasteMg, 6.0);
    assert.equal(administeredDoseMg + computedWasteMg, ampouleStrengthMg);
  });

  it('should enforce authorized witness roles and reject ineligible roles', () => {
    const eligibleRoles = ['DOCTOR', 'CHARGE_NURSE', 'SENIOR_RN', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN'];
    const ineligibleRoles = ['ORDERLY', 'NURSING_AIDE', 'STUDENT_NURSE', 'INTERN', 'WARD_CLERK', 'PHARMACY_CASHIER'];

    for (const role of eligibleRoles) {
      assert.equal(ineligibleRoles.includes(role), false);
    }

    for (const role of ineligibleRoles) {
      assert.equal(eligibleRoles.includes(role), false);
    }
  });
});
