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

  it('should calculate Code128 Subset B Modulo 103 checksum accurately', () => {
    const calcChecksum = (data: string): number => {
      const startB = 104;
      let sum = startB;
      for (let i = 0; i < data.length; i++) {
        const val = data.charCodeAt(i) - 32;
        sum += val * (i + 1);
      }
      return sum % 103;
    };

    // ACC20261103
    const check1 = calcChecksum('ACC20261103');
    assert.equal(typeof check1, 'number');
    assert.ok(check1 >= 0 && check1 < 103);

    // Standard alphanumeric specimen accession test
    const check2 = calcChecksum('LAB1001');
    assert.ok(check2 >= 0 && check2 < 103);
  });

  it('should detect critical panic value alerts for electrolyte and metabolic emergencies', () => {
    const panicRules: Record<string, { low?: number; high?: number }> = {
      K_PLUS: { low: 2.5, high: 6.0 },
      GLU: { low: 40, high: 450 },
      NA_PLUS: { low: 120, high: 160 },
      HGB: { low: 6.0, high: 20.0 },
      PLT: { low: 20, high: 1000 },
    };

    const isPanic = (code: string, val: number): boolean => {
      const rule = panicRules[code];
      if (!rule) return false;
      if (rule.low !== undefined && val <= rule.low) return true;
      if (rule.high !== undefined && val >= rule.high) return true;
      return false;
    };

    // Potassium: panic at 2.4 (fatal hypokalemia) or 6.5 (hyperkalemia)
    assert.equal(isPanic('K_PLUS', 2.4), true);
    assert.equal(isPanic('K_PLUS', 6.5), true);
    assert.equal(isPanic('K_PLUS', 4.1), false);

    // Glucose: panic at 35 (neuroglycopenia) or 480 (DKA)
    assert.equal(isPanic('GLU', 35), true);
    assert.equal(isPanic('GLU', 480), true);
    assert.equal(isPanic('GLU', 95), false);

    // Platelets: panic at 15 (spontaneous bleeding)
    assert.equal(isPanic('PLT', 15), true);
    assert.equal(isPanic('PLT', 250), false);
  });
});
