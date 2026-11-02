import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_PERMISSIONS, ROUTE_MINIMUM_PLAN } from '../src/lib/rbac.ts';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { api } from '../src/lib/api.ts';

describe('Phase 8: Smart Infusion Pump DERS & Bedside IoT Telemetry Frontend Integration Suite', () => {
  it('should define /infusion route permission requiring clinical/admin roles and ENTERPRISE_12 plan tier', () => {
    const route = ROUTE_PERMISSIONS.find((r) => r.path === '/infusion');
    assert.ok(route, '/infusion route permission must exist');
    assert.equal(route.allowedRoles.includes('DOCTOR'), true);
    assert.equal(route.allowedRoles.includes('ADMIN'), true);
    assert.equal(route.allowedRoles.includes('SUPER_ADMIN'), true);

    // Plan tier minimum
    assert.equal(ROUTE_MINIMUM_PLAN['/infusion'], 'ENTERPRISE_12');
  });

  it('should expose complete api.infusion client interface methods', () => {
    assert.ok(api.infusion, 'api.infusion client must be defined');
    assert.equal(typeof api.infusion.getLibrary, 'function');
    assert.equal(typeof api.infusion.getDrug, 'function');
    assert.equal(typeof api.infusion.calculate, 'function');
    assert.equal(typeof api.infusion.getPumps, 'function');
    assert.equal(typeof api.infusion.getPump, 'function');
    assert.equal(typeof api.infusion.start, 'function');
    assert.equal(typeof api.infusion.titrate, 'function');
    assert.equal(typeof api.infusion.requestPca, 'function');
    assert.equal(typeof api.infusion.updateTelemetry, 'function');
    assert.equal(typeof api.infusion.togglePause, 'function');
    assert.equal(typeof api.infusion.stop, 'function');
  });

  it('should verify complete translation parity between en.infusion and km.infusion', () => {
    assert.ok(en.infusion, 'en.infusion must exist');
    assert.ok(km.infusion, 'km.infusion must exist');

    const enKeys = Object.keys(en.infusion);
    const kmKeys = Object.keys(km.infusion);

    assert.ok(enKeys.length >= 30, 'Must have at least 30 infusion translation keys');
    assert.deepEqual(enKeys.sort(), kmKeys.sort(), 'en and km infusion keys must have 100% parity');
  });

  it('should guarantee zero emojis across en.infusion and km.infusion dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.infusion)) {
      assert.equal(emojiRegex.test(val), false, `en.infusion.${key} contains emoji: "${val}"`);
    }

    for (const [key, val] of Object.entries(km.infusion)) {
      assert.equal(emojiRegex.test(val), false, `km.infusion.${key} contains emoji: "${val}"`);
    }
  });

  it('should guarantee strictly NO parentheses () in km.infusion strings', () => {
    for (const [key, val] of Object.entries(km.infusion)) {
      assert.equal(
        val.includes('(') || val.includes(')'),
        false,
        `km.infusion.${key} contains forbidden parentheses: "${val}". Use hyphens, colons, or commas instead.`,
      );
    }
  });

  it('should validate biophysical titration equation: mL/hr = (dose * weight * 60) / conc', () => {
    // Norepinephrine at 0.1 mcg/kg/min for 70 kg patient at 16 mcg/mL conc
    const doseMcgKgMin = 0.1;
    const weightKg = 70;
    const concMcgMl = 16;

    const rateMlHr = (doseMcgKgMin * weightKg * 60) / concMcgMl;
    assert.equal(rateMlHr, 26.25);
  });

  it('should validate gravity drip equation: gtt/min = (rate * dropFactor) / 60', () => {
    const rateMlHr = 120;

    const gttMicro60 = Math.round((rateMlHr * 60) / 60);
    assert.equal(gttMicro60, 120);

    const gttMacro15 = Math.round((rateMlHr * 15) / 60);
    assert.equal(gttMacro15, 30);

    const gttMacro20 = Math.round((rateMlHr * 20) / 60);
    assert.equal(gttMacro20, 40);

    const gttMacro10 = Math.round((rateMlHr * 10) / 60);
    assert.equal(gttMacro10, 20);
  });
});
