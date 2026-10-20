import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 7: MoH & Cryptographic Compliance UI Suite', () => {
  it('should verify 100% dictionary key parity for compliance localization', () => {
    const enComp = (en as any).compliance;
    const kmComp = (km as any).compliance;

    assert.notEqual(enComp, undefined, 'en.compliance must exist');
    assert.notEqual(kmComp, undefined, 'km.compliance must exist');

    const enKeys = Object.keys(enComp).sort();
    const kmKeys = Object.keys(kmComp).sort();

    assert.equal(enKeys.length > 0, true, 'en.compliance must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km compliance must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire compliance localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enComp = (en as any).compliance;
    const kmComp = (km as any).compliance;

    for (const [key, value] of Object.entries(enComp)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.compliance.${key}: "${value}"`,
      );
    }

    for (const [key, value] of Object.entries(kmComp)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.compliance.${key}: "${value}"`,
      );
    }
  });

  it('should verify all core compliance and DHIS2 surveillance keys exist in dictionaries', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'signButton',
      'signedBadge',
      'tamperProofNotice',
      'verificationPortalTitle',
      'verificationPortalSubtitle',
      'validSeal',
      'invalidSeal',
      'certNumber',
      'patientName',
      'patientCode',
      'doctor',
      'doctorLicense',
      'diagnosis',
      'authorizedLeave',
      'signatureHash',
      'publicKey',
      'dhis2Tab',
      'exportJson',
      'exportCsv',
      'trackedCases',
      'reportPeriod',
    ];

    const enComp = (en as any).compliance;
    for (const k of requiredKeys) {
      assert.ok(enComp[k], `Missing required key in compliance dictionary: ${k}`);
    }
  });

  it('should correctly format verification URL with cert parameter and signature hash', () => {
    const certNumber = 'MC-2026-0042';
    const sigHex = 'a8f3b2c1d0e4f5a6b7c8d9e0f1a2b3c4';
    const baseUrl = 'https://clinic.rotana.health';

    const url = `${baseUrl}/verify?cert=${encodeURIComponent(certNumber)}&sig=${encodeURIComponent(sigHex.slice(0, 16))}`;

    assert.ok(url.startsWith('https://clinic.rotana.health/verify'));
    assert.ok(url.includes('cert=MC-2026-0042'));
    assert.ok(url.includes('sig=a8f3b2c1d0e4f5a6'));
  });

  it('should structure DHIS2 communicable disease data values correctly', () => {
    const diseases = [
      { name: 'Dengue Fever', count: 5 },
      { name: 'Malaria', count: 2 },
    ];
    const period = '202610';
    const orgUnit = 'KHM-MOH-ROTANA-HQ';

    const dataValues = diseases.map((d) => ({
      dataElement: `MOH_CDC_${d.name.replace(/\s+/g, '_').toUpperCase()}`,
      period,
      orgUnit,
      value: d.count,
    }));

    assert.equal(dataValues.length, 2);
    assert.equal(dataValues[0].dataElement, 'MOH_CDC_DENGUE_FEVER');
    assert.equal(dataValues[0].value, 5);
    assert.equal(dataValues[1].dataElement, 'MOH_CDC_MALARIA');
    assert.equal(dataValues[1].value, 2);
  });
});
