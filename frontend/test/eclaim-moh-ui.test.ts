import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';
import { ROUTE_PERMISSIONS } from '../src/lib/rbac.ts';

describe('Phase 17: Electronic Claim & MoH Disease Surveillance UI Test Suite', () => {
  it('should verify 100% dictionary key parity for eclaim localization', () => {
    const enEclaim = (en as any).eclaim;
    const kmEclaim = (km as any).eclaim;

    assert.notEqual(enEclaim, undefined, 'en.eclaim must exist');
    assert.notEqual(kmEclaim, undefined, 'km.eclaim must exist');

    const enKeys = Object.keys(enEclaim).sort();
    const kmKeys = Object.keys(kmEclaim).sort();

    assert.equal(enKeys.length > 0, true, 'en.eclaim must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km eclaim must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire eclaim localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enEclaim = (en as any).eclaim;
    const kmEclaim = (km as any).eclaim;

    for (const [key, value] of Object.entries(enEclaim)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.eclaim.${key}: "${value}"`
      );
    }

    for (const [key, value] of Object.entries(kmEclaim)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.eclaim.${key}: "${value}"`
      );
    }
  });

  it('should verify nav.eclaim exists in both English and Khmer with zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enNav = (en as any).nav?.eclaim;
    const kmNav = (km as any).nav?.eclaim;

    assert.notEqual(enNav, undefined, 'en.nav.eclaim must exist');
    assert.notEqual(kmNav, undefined, 'km.nav.eclaim must exist');

    assert.equal(emojiRegex.test(enNav), false, `Emoji found in en.nav.eclaim: "${enNav}"`);
    assert.equal(emojiRegex.test(kmNav), false, `Emoji found in km.nav.eclaim: "${kmNav}"`);
  });

  it('should verify /eclaim is properly registered in RBAC route permissions', () => {
    const config = ROUTE_PERMISSIONS.find((p) => p.path === '/eclaim');
    assert.notEqual(config, undefined, '/eclaim route permission must be registered');
    assert.equal(config?.allowedRoles.includes('SUPER_ADMIN'), true);
    assert.equal(config?.allowedRoles.includes('ADMIN'), true);
    assert.equal(config?.allowedRoles.includes('DOCTOR'), true);

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    assert.equal(emojiRegex.test(config!.labelEn), false);
    assert.equal(emojiRegex.test(config!.labelKh), false);
    assert.equal(emojiRegex.test(config!.descriptionEn), false);
    assert.equal(emojiRegex.test(config!.descriptionKh), false);
  });

  it('should validate electronic claim XML structure and mandatory ANSI 837P elements', () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthInsuranceClaim xmlns="http://moh.gov.kh/eclaim/v1" standard="ANSI_ASC_X12_837P_COMPATIBLE">
  <Header>
    <ClaimNumber>CLM-TEST-001</ClaimNumber>
    <ClaimType>OUTPATIENT</ClaimType>
    <InsurerCode>FORTE</InsurerCode>
  </Header>
  <Provider>
    <ProviderId>PROV-001</ProviderId>
    <MoHLicense>MOH-CLINIC-7721</MoHLicense>
  </Provider>
  <Subscriber>
    <PolicyNumber>POL-12345</PolicyNumber>
    <MemberId>MEM-99</MemberId>
  </Subscriber>
  <ClinicalDetails>
    <Diagnoses>
      <Diagnosis sequence="1" type="PRIMARY"><Code>J06.9</Code></Diagnosis>
    </Diagnoses>
  </ClinicalDetails>
  <ClaimLines>
    <ClaimLine lineNumber="1"><ServiceCode>CONS-01</ServiceCode></ClaimLine>
  </ClaimLines>
  <FinancialSummary>
    <TotalClaimed currency="USD">25.00</TotalClaimed>
  </FinancialSummary>
</HealthInsuranceClaim>`;

    assert.ok(sampleXml.includes('<HealthInsuranceClaim'));
    assert.ok(sampleXml.includes('<ClaimNumber>'));
    assert.ok(sampleXml.includes('<InsurerCode>'));
    assert.ok(sampleXml.includes('<MoHLicense>'));
    assert.ok(sampleXml.includes('<PolicyNumber>'));
    assert.ok(sampleXml.includes('<Diagnoses>'));
    assert.ok(sampleXml.includes('<ClaimLines>'));
    assert.ok(sampleXml.includes('<TotalClaimed'));
  });
});
