import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EclaimService, NSSF_TARIFF_MASTER } from '../src/eclaim/eclaim.service.ts';

describe('Cambodia NSSF Medical Tariff Master & Adjudication Engine Test Suite', () => {
  let service: EclaimService;

  beforeEach(() => {
    service = new EclaimService();
  });

  it('should initialize with all 26 official NSSF Medical Tariff acts across all categories', () => {
    const tariffs = service.getNssfTariffs();
    assert.equal(tariffs.length, 26);

    const categories = new Set(tariffs.map((t) => t.category));
    assert.ok(categories.has('CONSULTATION'));
    assert.ok(categories.has('HOSPITALIZATION'));
    assert.ok(categories.has('MINOR_SURGERY'));
    assert.ok(categories.has('INTERMEDIATE_SURGERY'));
    assert.ok(categories.has('MAJOR_SURGERY'));
    assert.ok(categories.has('COMPLEX_SURGERY'));
    assert.ok(categories.has('MATERNITY'));
    assert.ok(categories.has('LABORATORY'));
    assert.ok(categories.has('IMAGING'));
  });

  it('should guarantee zero emojis and zero parentheses in Khmer descriptions across NSSF master', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const item of NSSF_TARIFF_MASTER) {
      assert.equal(emojiRegex.test(item.descriptionEn), false, `Emoji found in EN: "${item.descriptionEn}"`);
      assert.equal(emojiRegex.test(item.descriptionKh), false, `Emoji found in KH: "${item.descriptionKh}"`);

      // Verify NO parentheses in Khmer text
      assert.equal(
        item.descriptionKh.includes('(') || item.descriptionKh.includes(')'),
        false,
        `Parentheses found in Khmer description: "${item.descriptionKh}"`
      );
    }
  });

  it('should correctly calculate K-factor surgical intervention tariffs using 12000 KHR unit baseline', () => {
    const k05 = service.getNssfTariff('NSSF-SURG-K05');
    assert.ok(k05);
    assert.equal(k05.coefficientValue * k05.baseUnitValueKhr, 60000); // K5 * 12,000 = 60,000 KHR

    const k50 = service.getNssfTariff('NSSF-SURG-K50');
    assert.ok(k50);
    assert.equal(k50.coefficientValue * k50.baseUnitValueKhr, 600000); // K50 * 12,000 = 600,000 KHR

    const k100 = service.getNssfTariff('NSSF-SURG-K100');
    assert.ok(k100);
    assert.equal(k100.coefficientValue * k100.baseUnitValueKhr, 1200000); // K100 * 12,000 = 1,200,000 KHR
  });

  it('should correctly calculate B-factor laboratory tariffs using 1000 KHR unit baseline', () => {
    const b05 = service.getNssfTariff('NSSF-LAB-B05');
    assert.ok(b05);
    assert.equal(b05.coefficientValue * b05.baseUnitValueKhr, 5000); // B5 * 1,000 = 5,000 KHR

    const b12 = service.getNssfTariff('NSSF-LAB-B12');
    assert.ok(b12);
    assert.equal(b12.coefficientValue * b12.baseUnitValueKhr, 12000); // B12 * 1,000 = 12,000 KHR

    const b50 = service.getNssfTariff('NSSF-LAB-B50');
    assert.ok(b50);
    assert.equal(b50.coefficientValue * b50.baseUnitValueKhr, 50000); // B50 * 1,000 = 50,000 KHR
  });

  it('should correctly calculate R-factor imaging tariffs using 2500 KHR unit baseline', () => {
    const r12 = service.getNssfTariff('NSSF-IMG-R12');
    assert.ok(r12);
    assert.equal(r12.coefficientValue * r12.baseUnitValueKhr, 30000); // R12 * 2,500 = 30,000 KHR

    const r30 = service.getNssfTariff('NSSF-IMG-R30');
    assert.ok(r30);
    assert.equal(r30.coefficientValue * r30.baseUnitValueKhr, 75000); // R30 * 2,500 = 75,000 KHR

    const r80 = service.getNssfTariff('NSSF-IMG-R80');
    assert.ok(r80);
    assert.equal(r80.coefficientValue * r80.baseUnitValueKhr, 200000); // R80 * 2,500 = 200,000 KHR
  });

  it('should reject procedures requiring pre-authorization when pre-auth code is missing', () => {
    const result = service.adjudicateNssfClaim({
      patientId: 'PT-1001',
      memberBarcode: 'NSSF-8849102',
      nationalId: '010294812',
      items: [
        { actCode: 'NSSF-OPD-001', quantity: 1 }, // No pre-auth required
        { actCode: 'NSSF-SURG-K75', quantity: 1 }, // Pre-auth required! No preAuthCode provided
      ],
    });

    assert.equal(result.lines.length, 2);
    assert.equal(result.lines[0].status, 'APPROVED');
    assert.equal(result.lines[0].nssfCoveredKhr, 20000);

    assert.equal(result.lines[1].status, 'REJECTED');
    assert.equal(result.lines[1].rejectionReason, 'PREAUTH_REQUIRED_MISSING_APPROVAL');
    assert.equal(result.lines[1].nssfCoveredKhr, 0);
    assert.equal(result.lines[1].patientCoPayKhr, 900000);

    assert.equal(result.overallStatus, 'PARTIAL');
  });

  it('should approve high-cost procedures when pre-authorization code is provided', () => {
    const result = service.adjudicateNssfClaim({
      patientId: 'PT-1001',
      memberBarcode: 'NSSF-8849102',
      nationalId: '010294812',
      items: [
        {
          actCode: 'NSSF-SURG-K75',
          quantity: 1,
          preAuthCode: 'NSSF-AUTH-2026-9921',
        },
        {
          actCode: 'NSSF-IMG-R80',
          quantity: 1,
          preAuthCode: 'NSSF-AUTH-2026-9922',
        },
      ],
    });

    assert.equal(result.lines.length, 2);
    assert.equal(result.lines[0].status, 'APPROVED');
    assert.equal(result.lines[0].nssfCoveredKhr, 900000);
    assert.equal(result.lines[0].patientCoPayKhr, 0);

    assert.equal(result.lines[1].status, 'APPROVED');
    assert.equal(result.lines[1].nssfCoveredKhr, 200000);
    assert.equal(result.lines[1].patientCoPayKhr, 0);

    assert.equal(result.overallStatus, 'APPROVED');
    assert.equal(result.totalNssfCoveredKhr, 1100000);
  });

  it('should cap reimbursable amount to maximum ceiling and assign excess fee to patient co-payment', () => {
    const result = service.adjudicateNssfClaim({
      patientId: 'PT-1002',
      memberBarcode: 'NSSF-771829',
      nationalId: '020491823',
      items: [
        {
          actCode: 'NSSF-OPD-001', // Ceiling is 20,000 KHR
          quantity: 1,
          requestedPriceKhr: 35000, // Clinic requests 35,000 KHR
        },
      ],
    });

    assert.equal(result.lines[0].status, 'PARTIALLY_APPROVED');
    assert.equal(result.lines[0].cappedCeilingKhr, 20000);
    assert.equal(result.lines[0].nssfCoveredKhr, 20000);
    assert.equal(result.lines[0].patientCoPayKhr, 15000); // 35,000 - 20,000 = 15,000 KHR

    assert.equal(result.totalBilledKhr, 35000);
    assert.equal(result.totalNssfCoveredKhr, 20000);
    assert.equal(result.totalPatientCoPayKhr, 15000);
    assert.equal(result.overallStatus, 'PARTIAL');
  });

  it('should accurately convert KHR amounts to USD at 4100 standard exchange rate', () => {
    const result = service.adjudicateNssfClaim({
      patientId: 'PT-1003',
      memberBarcode: 'NSSF-112938',
      nationalId: '030192834',
      items: [
        { actCode: 'NSSF-MAT-001', quantity: 1 }, // 400,000 KHR
      ],
    });

    // 400,000 / 4,100 = ~97.56 USD
    assert.equal(result.totalNssfCoveredKhr, 400000);
    assert.equal(result.totalNssfCoveredUsd, 97.56);
    assert.equal(result.totalPatientCoPayUsd, 0.0);
  });
});
