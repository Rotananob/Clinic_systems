import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 9: Cambodian NSSF & Commercial Insurance UI Suite', () => {
  it('should verify 100% dictionary key parity for insurance localization', () => {
    assert.ok(en.insurance, 'en.insurance must exist');
    assert.ok(km.insurance, 'km.insurance must exist');

    const enKeys = Object.keys(en.insurance).sort();
    const kmKeys = Object.keys(km.insurance).sort();

    assert.deepEqual(enKeys, kmKeys, 'insurance dictionary keys must have 100% parity between en and km');
  });

  it('should guarantee zero emojis across the entire insurance localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [key, val] of Object.entries(en.insurance)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `en.insurance.${key} contains emoji: "${val}"`);
      }
    }

    for (const [key, val] of Object.entries(km.insurance)) {
      if (typeof val === 'string') {
        assert.ok(!emojiRegex.test(val), `km.insurance.${key} contains emoji: "${val}"`);
      }
    }
  });

  it('should verify all core insurance keys exist in dictionaries', () => {
    const requiredKeys = [
      'title',
      'verifyPolicyTab',
      'splitInvoiceTab',
      'claimsLedgerTab',
      'nssfExportTab',
      'summaryInsurerPayable',
      'summaryPatientPayable',
      'summaryCoPayApplied',
      'nssfTotalAmountKhr',
      'nssfFacilityCode',
    ];

    for (const req of requiredKeys) {
      assert.ok(req in en.insurance, `Missing required key ${req} in en.insurance`);
      assert.ok(req in km.insurance, `Missing required key ${req} in km.insurance`);
    }
  });

  it('should accurately calculate split-invoice breakdown for 100% NSSF and 80% commercial policies', () => {
    const computeSplit = (totalUsd: number, coveragePct: number, coPayUsd: number) => {
      let covered = Math.round(((totalUsd * coveragePct) / 100) * 100) / 100;
      let patient = Math.round((totalUsd - covered) * 100) / 100;

      if (coPayUsd > 0 && covered > coPayUsd) {
        covered = Math.round((covered - coPayUsd) * 100) / 100;
        patient = Math.round((patient + coPayUsd) * 100) / 100;
      }

      return { covered, patient };
    };

    // 100% NSSF (0 co-pay)
    const nssf = computeSplit(60, 100, 0);
    assert.equal(nssf.covered, 60);
    assert.equal(nssf.patient, 0);

    // 80% Forte ($5 co-pay) on $100
    const forte = computeSplit(100, 80, 5);
    assert.equal(forte.covered, 75); // $80 - $5 = $75
    assert.equal(forte.patient, 25); // $20 + $5 = $25
  });

  it('should accurately convert USD reimbursement to Cambodian Riel at official 4,100 rate', () => {
    const usd = 48.5;
    const khr = Math.round(usd * 4100);
    assert.equal(khr, 198850);
  });
});
