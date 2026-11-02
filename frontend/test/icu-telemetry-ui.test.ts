import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_PERMISSIONS, ROUTE_MINIMUM_PLAN } from '../src/lib/rbac.ts';
import { CORE_9_ROUTES, ALL_SYSTEM_MODULE_ROUTES, TOTAL_PRIMARY_BUTTONS } from '../src/lib/sidebar-navigation.ts';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { api } from '../src/lib/api.ts';

describe('Phase 9: ICU/OR Bedside Telemetry Monitor & Arrhythmia Waveform Engine UI Suite', () => {
  it('should define /telemetry route permission requiring clinical/admin roles and ENTERPRISE_12 plan tier', () => {
    const route = ROUTE_PERMISSIONS.find((r) => r.path === '/telemetry');
    assert.ok(route, '/telemetry route permission must exist');
    assert.equal(route.allowedRoles.includes('DOCTOR'), true);
    assert.equal(route.allowedRoles.includes('ADMIN'), true);
    assert.equal(route.allowedRoles.includes('SUPER_ADMIN'), true);

    // Plan tier minimum
    assert.equal(ROUTE_MINIMUM_PLAN['/telemetry'], 'ENTERPRISE_12');
  });

  it('should preserve exactly 9 daily operational tools in primary sidebar and 10 total primary buttons', () => {
    assert.equal(CORE_9_ROUTES.length, 9, 'Primary sidebar must have strictly 9 core routes');
    assert.equal(TOTAL_PRIMARY_BUTTONS, 10, 'Primary sidebar must have strictly 10 total buttons (9 core + Explore)');
    assert.equal(ALL_SYSTEM_MODULE_ROUTES.includes('/telemetry'), true, '/telemetry must be in ALL_SYSTEM_MODULE_ROUTES');
  });

  it('should expose complete api.telemetry client interface methods', () => {
    assert.ok(api.telemetry, 'api.telemetry client must be defined');
    assert.equal(typeof api.telemetry.getAllBeds, 'function');
    assert.equal(typeof api.telemetry.getBedById, 'function');
    assert.equal(typeof api.telemetry.updateVitals, 'function');
    assert.equal(typeof api.telemetry.silenceAlarm, 'function');
    assert.equal(typeof api.telemetry.acknowledgeAlarm, 'function');
    assert.equal(typeof api.telemetry.simulateArrhythmia, 'function');
    assert.equal(typeof api.telemetry.getWaveforms, 'function');
    assert.equal(typeof api.telemetry.getAuditLogs, 'function');
  });

  it('should verify complete translation parity between en.telemetry and km.telemetry', () => {
    assert.ok(en.telemetry, 'en.telemetry must exist');
    assert.ok(km.telemetry, 'km.telemetry must exist');

    const enKeys = Object.keys(en.telemetry);
    const kmKeys = Object.keys(km.telemetry);

    assert.ok(enKeys.length >= 25, 'Must have at least 25 telemetry translation keys');
    assert.deepEqual(enKeys.sort(), kmKeys.sort(), 'en and km telemetry keys must have 100% parity');
  });

  it('should guarantee zero emojis across en.telemetry and km.telemetry dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.telemetry)) {
      assert.equal(emojiRegex.test(val), false, `en.telemetry.${key} contains emoji: "${val}"`);
    }

    for (const [key, val] of Object.entries(km.telemetry)) {
      assert.equal(emojiRegex.test(val), false, `km.telemetry.${key} contains emoji: "${val}"`);
    }
  });

  it('should guarantee strictly NO parentheses in km.telemetry strings', () => {
    for (const [key, val] of Object.entries(km.telemetry)) {
      assert.equal(
        val.includes('(') || val.includes(')'),
        false,
        `km.telemetry.${key} must not contain parentheses: "${val}"`
      );
    }
  });
});
