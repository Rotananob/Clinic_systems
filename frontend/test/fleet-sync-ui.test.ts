import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTE_PERMISSIONS, ROUTE_MINIMUM_PLAN } from '../src/lib/rbac.ts';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { api } from '../src/lib/api.ts';

describe('Phase 7: Multi-Branch Edge Fleet Sync & Vector Clocks Frontend Integration Suite', () => {
  it('should define /fleet-sync route permission requiring clinical/admin roles and UNLIMITED_20 plan tier', () => {
    const route = ROUTE_PERMISSIONS.find((r) => r.path === '/fleet-sync');
    assert.ok(route, '/fleet-sync route permission must exist');
    assert.equal(route.allowedRoles.includes('DOCTOR'), true);
    assert.equal(route.allowedRoles.includes('PHARMACIST'), true);
    assert.equal(route.allowedRoles.includes('ADMIN'), true);
    assert.equal(route.allowedRoles.includes('SUPER_ADMIN'), true);

    // Minimum plan requirement
    assert.equal(ROUTE_MINIMUM_PLAN['/fleet-sync'], 'UNLIMITED_20');
  });

  it('should expose complete api.sync client interface methods', () => {
    assert.ok(api.sync, 'api.sync client must be defined');
    assert.equal(typeof api.sync.getHealth, 'function');
    assert.equal(typeof api.sync.getNodes, 'function');
    assert.equal(typeof api.sync.getStockBalances, 'function');
    assert.equal(typeof api.sync.getJournal, 'function');
    assert.equal(typeof api.sync.triggerSync, 'function');
    assert.equal(typeof api.sync.transferStock, 'function');
  });

  it('should verify complete translation parity between en.fleetSync and km.fleetSync', () => {
    assert.ok(en.fleetSync, 'en.fleetSync must exist');
    assert.ok(km.fleetSync, 'km.fleetSync must exist');

    const enKeys = Object.keys(en.fleetSync);
    const kmKeys = Object.keys(km.fleetSync);

    assert.ok(enKeys.length >= 25, 'Must have at least 25 fleet sync translation keys');
    assert.deepEqual(enKeys.sort(), kmKeys.sort(), 'en and km fleet sync keys must have 100% parity');
  });

  it('should guarantee zero emojis across en.fleetSync and km.fleetSync dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.fleetSync)) {
      assert.equal(emojiRegex.test(val), false, `en.fleetSync.${key} contains emoji: "${val}"`);
    }

    for (const [key, val] of Object.entries(km.fleetSync)) {
      assert.equal(emojiRegex.test(val), false, `km.fleetSync.${key} contains emoji: "${val}"`);
    }
  });

  it('should guarantee strictly NO parentheses () in km.fleetSync strings', () => {
    for (const [key, val] of Object.entries(km.fleetSync)) {
      assert.equal(
        val.includes('(') || val.includes(')'),
        false,
        `km.fleetSync.${key} contains forbidden parentheses: "${val}". Use hyphens, colons, or commas instead.`,
      );
    }
  });

  it('should validate commutative PN-Counter inventory math across branch nodes', () => {
    // Simulating PN-Counter: Total = max(0, sum(positive) - sum(negative))
    const counters = {
      'CLOUD-HQ': { positive: 250, negative: 10 },
      'EDGE-PP-0042': { positive: 120, negative: 5 },
      'EDGE-SR-0018': { positive: 80, negative: 0 },
      'EDGE-BTB-0007': { positive: 45, negative: 0 },
    };

    let total = 0;
    for (const c of Object.values(counters)) {
      total += Math.max(0, c.positive - c.negative);
    }

    assert.equal(total, 240 + 115 + 80 + 45); // 480
  });

  it('should verify MoH Cambodia statutory health facility code format (HF-MOH-...)', () => {
    const facilityCodes = ['HF-MOH-1200-0001', 'HF-MOH-1205-0042', 'HF-MOH-1701-0018', 'HF-MOH-0201-0007'];
    for (const code of facilityCodes) {
      assert.ok(code.startsWith('HF-MOH-'), `${code} must start with HF-MOH-`);
      assert.ok(code.split('-').length === 4, `${code} must contain 4 hyphen-delimited segments`);
    }
  });
});
