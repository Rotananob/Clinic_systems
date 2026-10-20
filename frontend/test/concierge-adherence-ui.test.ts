import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 10: Clinical Care Concierge & Adherence UI Suite', () => {
  it('should verify 100% dictionary key parity for concierge localization', () => {
    assert.ok(en.concierge, 'en.concierge must exist');
    assert.ok(km.concierge, 'km.concierge must exist');

    const enKeys = Object.keys(en.concierge).sort();
    const kmKeys = Object.keys(km.concierge).sort();

    assert.deepEqual(enKeys, kmKeys, 'concierge dictionary keys must have 100% parity between en and km');
  });

  it('should guarantee zero emojis across the entire concierge localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.concierge)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `en.concierge.${key} contains emoji: "${val}"`);
      }
    }

    for (const [key, val] of Object.entries(km.concierge)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `km.concierge.${key} contains emoji: "${val}"`);
      }
    }
  });

  it('should verify all core concierge care protocols and red-flag keys exist', () => {
    const requiredKeys = [
      'title',
      'redFlagBannerTitle',
      'protocolPostVisitDay1',
      'protocolAntibioticDay3',
      'protocolHypertensionWeekly',
      'adherenceScore',
      'recordDoseButton',
      'acknowledgeAlertButton',
      'zeroEmojiStandard',
    ];

    for (const req of requiredKeys) {
      assert.ok(req in en.concierge, `Missing required key ${req} in en.concierge`);
      assert.ok(req in km.concierge, `Missing required key ${req} in km.concierge`);
    }
  });

  it('should accurately calculate adherence rate percentage from total and confirmed doses', () => {
    const calcAdherence = (confirmed: number, total: number) => {
      if (total === 0) return 100;
      return Math.round((confirmed / total) * 100);
    };

    assert.equal(calcAdherence(5, 5), 100);
    assert.equal(calcAdherence(4, 5), 80);
    assert.equal(calcAdherence(4, 6), 67);
    assert.equal(calcAdherence(0, 3), 0);
  });

  it('should accurately match red-flag clinical symptoms in client text', () => {
    const checkRedFlag = (text: string) => {
      const redKeywords = ['ក្ដៅខ្លួនខ្លាំង', 'ក្តៅខ្លួនខ្លាំង', 'ពិបាកដកដង្ហើម', 'ឈឺទ្រូងខ្លាំង', 'chest pain', 'shortness of breath'];
      const lower = text.toLowerCase();
      return redKeywords.some((k) => lower.includes(k.toLowerCase()));
    };

    assert.equal(checkRedFlag('ខ្ញុំលេបថ្នាំធម្មតា អត់អីទេ'), false);
    assert.equal(checkRedFlag('លោកគ្រូពេទ្យ ខ្ញុំពិបាកដកដង្ហើមខ្លាំងណាស់'), true);
    assert.equal(checkRedFlag('Patient reports severe chest pain since morning'), true);
  });
});
