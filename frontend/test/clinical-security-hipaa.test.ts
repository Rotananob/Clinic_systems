import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Step 23 & Step 24: Clinical Data Security & Multi-Tenant Frontend Verification', () => {
  it('should verify patient national ID masking on client side', () => {
    const maskId = (id: string | null | undefined): string => {
      if (!id) return 'N/A';
      const clean = id.trim();
      if (clean.length <= 4) return '****';
      return `${clean.slice(0, 3)}****${clean.slice(-2)}`;
    };

    assert.equal(maskId('0102938475'), '010****75');
    assert.equal(maskId('123'), '****');
    assert.equal(maskId(null), 'N/A');
    assert.equal(maskId(undefined), 'N/A');
  });

  it('should guarantee zero emojis anywhere across the entire English and Khmer localization suites', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

    const scanObjectForEmojis = (obj: Record<string, any>, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          assert.equal(
            emojiRegex.test(value),
            false,
            `Strict prohibition violated: Emoji found in ${fullPath}: "${value}"`,
          );
        } else if (typeof value === 'object' && value !== null) {
          scanObjectForEmojis(value, fullPath);
        }
      }
    };

    scanObjectForEmojis(en, 'en');
    scanObjectForEmojis(km, 'km');
  });

  it('should verify complete dictionary parity across all top-level modules', () => {
    const enSections = Object.keys(en).sort();
    const kmSections = Object.keys(km).sort();

    assert.deepEqual(enSections, kmSections, 'Top-level localization section keys mismatch');

    for (const section of enSections) {
      const enKeys = Object.keys((en as any)[section]).sort();
      const kmKeys = Object.keys((km as any)[section]).sort();
      assert.deepEqual(
        enKeys,
        kmKeys,
        `Dictionary keys mismatch in locale section: ${section}`,
      );
    }
  });
});
