import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EclaimService } from '../src/eclaim/eclaim.service.ts';

describe('Phase 17: Electronic Claim XML/JSON Format for Insurance & MoH Disease Surveillance', () => {
  let service: EclaimService;

  beforeEach(() => {
    service = new EclaimService();
  });

  it('should list seeded electronic claims and support filtering by insurer and status', () => {
    const allClaims = service.listClaims();
    assert.ok(allClaims.length >= 2);

    const forteClaims = service.listClaims({ insurer: 'FORTE' });
    assert.equal(forteClaims.length, 1);
    assert.equal(forteClaims[0].insurer, 'FORTE');

    const nssfClaims = service.listClaims({ insurer: 'NSSF' });
    assert.equal(nssfClaims.length, 1);
    assert.equal(nssfClaims[0].insurer, 'NSSF');
  });

  it('should create an electronic claim and accurately calculate financial shares', () => {
    const claim = service.createClaim({
      insurer: 'PRUDENTIAL',
      policyNumber: 'PRU-MED-8819',
      memberId: 'MEM-7712',
      patientName: 'Sokha Dara',
      claimType: 'OUTPATIENT',
      items: [
        {
          id: 'itm-01',
          serviceCode: 'CONS-GEN',
          description: 'General OPD Consultation',
          quantity: 1,
          unitPriceUsd: 20.0,
          totalPriceUsd: 20.0,
          coveredAmountUsd: 16.0,
          coPayUsd: 4.0,
          deductibleUsd: 0.0
        },
        {
          id: 'itm-02',
          serviceCode: 'LAB-LIPID',
          description: 'Lipid Panel Profile',
          quantity: 1,
          unitPriceUsd: 30.0,
          totalPriceUsd: 30.0,
          coveredAmountUsd: 24.0,
          coPayUsd: 6.0,
          deductibleUsd: 0.0
        }
      ]
    });

    assert.ok(claim.id);
    assert.match(claim.claimNumber, /^CLM-PRUDENTIAL-\d{4}-\d{4}$/);
    assert.equal(claim.totalBilledUsd, 50.0);
    assert.equal(claim.totalClaimedUsd, 40.0);
    assert.equal(claim.patientShareUsd, 10.0);
    assert.equal(claim.status, 'DRAFT');
  });

  it('should generate valid ANSI ASC X12 / 837P compatible XML with all mandatory elements', () => {
    const claim = service.getClaim('clm-2026-001');
    assert.ok(claim);

    const xml = service.generateClaimXml(claim);
    assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<HealthInsuranceClaim'));
    assert.ok(xml.includes('<ClaimNumber>CLM-FORTE-2026-8819</ClaimNumber>'));
    assert.ok(xml.includes('<InsurerCode>FORTE</InsurerCode>'));
    assert.ok(xml.includes('<MoHLicense>MOH-CLINIC-7721</MoHLicense>'));
    assert.ok(xml.includes('<Diagnoses>'));
    assert.ok(xml.includes('<ClaimLines>'));
    assert.ok(xml.includes('<TotalClaimed currency="USD">31.60</TotalClaimed>'));
  });

  it('should generate FHIR R4 standard Claim JSON object', () => {
    const claim = service.getClaim('clm-2026-001');
    assert.ok(claim);

    const fhir = service.generateFhirClaimJson(claim);
    assert.equal(fhir.resourceType, 'Claim');
    assert.equal(fhir.status, 'active');
    assert.equal(fhir.patient.display, 'Chea Sokunthea');
    assert.equal(fhir.insurer.display, 'FORTE');
    assert.ok(Array.isArray(fhir.diagnosis));
    assert.ok(Array.isArray(fhir.item));
    assert.equal(fhir.total.value, 39.5);
  });

  it('should validate claim XML and detect missing schema elements', () => {
    const validClaim = service.getClaim('clm-2026-001');
    assert.ok(validClaim);

    const validCheck = service.validateClaimXml(validClaim.xmlPayload || service.generateClaimXml(validClaim));
    assert.equal(validCheck.valid, true);
    assert.equal(validCheck.errors.length, 0);

    // Invalid XML missing critical tags
    const brokenXml = '<HealthInsuranceClaim><ClaimNumber>123</ClaimNumber></HealthInsuranceClaim>';
    const invalidCheck = service.validateClaimXml(brokenXml);
    assert.equal(invalidCheck.valid, false);
    assert.ok(invalidCheck.errors.length >= 3);
    assert.ok(invalidCheck.errors.some(e => e.includes('InsurerCode')));
    assert.ok(invalidCheck.errors.some(e => e.includes('Diagnoses')));
  });

  it('should submit electronic claim and generate SHA-256 batch hash', () => {
    const subRes = service.submitClaim('clm-2026-002');
    assert.equal(subRes.success, true);
    assert.equal(subRes.claim.status, 'SUBMITTED');
    assert.ok(subRes.transactionReference.startsWith('TXN-NSSF-'));
    assert.equal(subRes.batchHash.length, 64); // 256-bit SHA256 hex string
  });

  it('should record insurer adjudication decisions (PRE_APPROVED, SETTLED, REJECTED)', () => {
    const adjudicated = service.adjudicateClaim('clm-2026-002', {
      status: 'SETTLED',
      notes: 'Full NSSF inpatient benefit settlement paid via direct clearinghouse.'
    });

    assert.equal(adjudicated.status, 'SETTLED');
    assert.ok(adjudicated.adjudicatedAt);
    assert.ok(adjudicated.adjudicationNotes?.includes('NSSF inpatient benefit'));
  });

  it('should list official MoH reportable communicable diseases with zero emojis', () => {
    const diseases = service.listReportableDiseases();
    assert.ok(diseases.length >= 6);

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    for (const d of diseases) {
      assert.equal(emojiRegex.test(d.khmerName), false, `Emoji found in disease khmerName: "${d.khmerName}"`);
      assert.equal(emojiRegex.test(d.englishName), false, `Emoji found in disease englishName: "${d.englishName}"`);
    }

    assert.ok(diseases.some(d => d.code === 'A90')); // Dengue
    assert.ok(diseases.some(d => d.code === 'B54')); // Malaria
    assert.ok(diseases.some(d => d.code === 'A00.9')); // Cholera
  });

  it('should record communicable disease surveillance cases and export DHIS2 XML and JSON payloads', () => {
    const newCase = service.recordSurveillanceCase({
      diseaseCode: 'B54',
      diseaseName: 'Malaria Unspecified',
      caseType: 'CONFIRMED',
      laboratoryConfirmation: 'RDT',
      patientAge: 28,
      patientGender: 'M',
      provinceCode: 'KH-17', // Siem Reap
      reportingPeriod: '2026-W42'
    });

    assert.ok(newCase.id);
    assert.equal(newCase.diseaseCode, 'B54');

    const cases = service.listSurveillanceCases('2026-W42');
    assert.ok(cases.length >= 2);

    // DHIS2 XML export
    const xml = service.generateMohDhis2Xml('2026-W42');
    assert.ok(xml.includes('<dxf xmlns="http://dhis2.org/schema/dxf/2.0">'));
    assert.ok(xml.includes('<reportingPeriod>2026-W42</reportingPeriod>'));
    assert.ok(xml.includes('<dataValue dataElement="DE_MOH_'));

    // DHIS2 JSON export
    const json = service.generateMohDhis2Json('2026-W42');
    assert.equal(json.dataSet, 'DS_MOH_COMMUNICABLE_DISEASE_SURVEILLANCE');
    assert.equal(json.period, '2026-W42');
    assert.ok(Array.isArray(json.dataValues));
    assert.ok(json.dataValues.length >= 1);
  });
});
