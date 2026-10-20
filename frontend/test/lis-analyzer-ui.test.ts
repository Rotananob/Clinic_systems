import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 12: Laboratory Information System (LIS) & Analyzer UI Suite', () => {
  it('should verify 100% dictionary key parity for lab localization', () => {
    assert.ok((en as any).lab, 'en.lab must exist');
    assert.ok((km as any).lab, 'km.lab must exist');

    const enKeys = Object.keys((en as any).lab).sort();
    const kmKeys = Object.keys((km as any).lab).sort();

    assert.deepEqual(enKeys, kmKeys, 'lab dictionary keys must have 100% parity between en and km');
  });

  it('should guarantee zero emojis across the entire lab localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries((en as any).lab)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `en.lab.${key} contains emoji: "${val}"`);
      }
    }

    for (const [key, val] of Object.entries((km as any).lab)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `km.lab.${key} contains emoji: "${val}"`);
      }
    }
  });

  it('should verify all core clinical lab workflow keys exist in dictionaries', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'newAccessionButton',
      'panicBadge',
      'deltaBadge',
      'verifyButton',
      'ingestButton',
      'accessionModalTitle',
      'submitIngest',
      'zeroEmojiStandards',
    ];

    for (const req of requiredKeys) {
      assert.ok(req in (en as any).lab, `Missing required key ${req} in en.lab`);
      assert.ok(req in (km as any).lab, `Missing required key ${req} in km.lab`);
    }
  });

  it('should verify nav.lab key exists with zero emoji in en and km', () => {
    assert.ok(en.nav.lab, 'en.nav.lab must exist');
    assert.ok(km.nav.lab, 'km.nav.lab must exist');

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    assert.ok(!emojiRegex.test(en.nav.lab));
    assert.ok(!emojiRegex.test(km.nav.lab));
  });

  it('should accurately calculate delta percentage shift between current and historical lab values', () => {
    const calcDelta = (current: number, previous: number): number => {
      if (previous === 0) return 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    assert.equal(calcDelta(90, 240), -62.5);
    assert.equal(calcDelta(105, 95), 10.5);
    assert.equal(calcDelta(13.5, 13.5), 0.0);
  });

  it('should evaluate panic value threshold accurately', () => {
    const isPanicValue = (val: number, panicLow?: number, panicHigh?: number): boolean => {
      if (panicLow !== undefined && val <= panicLow) return true;
      if (panicHigh !== undefined && val >= panicHigh) return true;
      return false;
    };

    // Potassium: panicLow = 2.8, panicHigh = 6.5
    assert.equal(isPanicValue(7.1, 2.8, 6.5), true);
    assert.equal(isPanicValue(2.5, 2.8, 6.5), true);
    assert.equal(isPanicValue(4.2, 2.8, 6.5), false);
  });
});
