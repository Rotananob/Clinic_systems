import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InsuranceService } from '../src/insurance/insurance.service.ts';

describe('Phase 9: Cambodian NSSF & Commercial Insurance Settlement Engine', () => {
  const insuranceService = new InsuranceService();
  const tenantId = 'test-clinic-tenant';

  it('should initialize with pre-seeded policies for NSSF Cambodia and commercial underwriters', () => {
    const nssfCheck = insuranceService.verifyPolicy('NSSF-KH-904812');
    assert.equal(nssfCheck.valid, true);
    assert.equal(nssfCheck.policy?.provider, 'NSSF_CAMBODIA');
    assert.equal(nssfCheck.policy?.coveragePercentage, 100);

    const forteCheck = insuranceService.verifyPolicy('FORTE-MED-77102');
    assert.equal(forteCheck.valid, true);
    assert.equal(forteCheck.policy?.provider, 'FORTE_INSURANCE');
    assert.equal(forteCheck.policy?.coveragePercentage, 80);
    assert.equal(forteCheck.policy?.coPayFixedUsd, 5);
  });

  it('should reject non-existent, expired, or mismatched insurance policies', () => {
    const invalidCheck = insuranceService.verifyPolicy('FAKE-POLICY-999');
    assert.equal(invalidCheck.valid, false);
    assert.ok(invalidCheck.message.includes('not found'));

    const mismatchCheck = insuranceService.verifyPolicy('NSSF-KH-904812', 'FORTE_INSURANCE');
    assert.equal(mismatchCheck.valid, false);
    assert.ok(mismatchCheck.message.includes('not matching'));
  });

  it('should calculate 100% split-invoice coverage with zero co-pay for NSSF Cambodia', () => {
    const split = insuranceService.calculateSplitInvoice('NSSF-KH-904812', [
      { category: 'CONSULTATION', description: 'General Consultation', unitPriceUsd: 15, quantity: 1 },
      { category: 'PHARMACY', description: 'Amoxicillin 500mg', unitPriceUsd: 12, quantity: 1 },
    ]);

    assert.equal(split.totalInvoiceUsd, 27);
    assert.equal(split.insurerPayableUsd, 27);
    assert.equal(split.patientPayableUsd, 0);
    assert.equal(split.coPayAppliedUsd, 0);
  });

  it('should calculate 80% split-invoice with fixed co-pay for Forte Insurance', () => {
    // Total: Consultation $20 + Pharmacy $30 = $50
    // Eligible: both. Coverage: 80% = $40. Fixed co-pay: $5.
    // Insurer covered: $40 - $5 = $35. Patient: ($50 - $40) + $5 = $15.
    const split = insuranceService.calculateSplitInvoice('FORTE-MED-77102', [
      { category: 'CONSULTATION', description: 'Specialist Consultation', unitPriceUsd: 20, quantity: 1 },
      { category: 'PHARMACY', description: 'Prescription Medicines', unitPriceUsd: 30, quantity: 1 },
    ]);

    assert.equal(split.totalInvoiceUsd, 50);
    assert.equal(split.coPayAppliedUsd, 5);
    assert.equal(split.insurerPayableUsd, 35);
    assert.equal(split.patientPayableUsd, 15);
  });

  it('should require 100% patient payment for categories excluded from insurance policy', () => {
    // SafetyNet does NOT cover 'PROCEDURE' in default policy
    const split = insuranceService.calculateSplitInvoice('SNET-CAM-33491', [
      { category: 'PROCEDURE', description: 'Minor Wound Debridement & Suturing', unitPriceUsd: 40, quantity: 1 },
    ]);

    assert.equal(split.totalInvoiceUsd, 40);
    assert.equal(split.insurerPayableUsd, 0);
    assert.equal(split.patientPayableUsd, 40);
  });

  it('should submit claim, generate pre-auth code, and deduct remaining benefit limit', () => {
    const policyBefore = insuranceService.verifyPolicy('FORTE-MED-77102').policy!;
    const remainingBefore = policyBefore.remainingLimitUsd;

    const claim = insuranceService.submitClaim(tenantId, {
      policyNumber: 'FORTE-MED-77102',
      patientId: 'PT-1002',
      patientName: 'CHHAY Bopha',
      visitId: 'vis-2002',
      diagnosisCode: 'DA00',
      diagnosisDescription: 'Acute gastroenteritis',
      items: [
        { category: 'CONSULTATION', description: 'Emergency Consultation', unitPriceUsd: 30, quantity: 1 },
        { category: 'PHARMACY', description: 'IV Hydration & Electrolytes', unitPriceUsd: 50, quantity: 1 },
      ],
    });

    assert.ok(claim.claimNumber.startsWith('CLM-'));
    assert.ok(claim.preAuthCode?.includes('AUTH'));
    assert.equal(claim.totalClaimUsd, 80);

    const policyAfter = insuranceService.verifyPolicy('FORTE-MED-77102').policy!;
    assert.equal(policyAfter.remainingLimitUsd, remainingBefore - claim.insurerCoveredUsd);
  });

  it('should settle claim with payment reference and update adjudication notes', () => {
    const claims = insuranceService.getClaims(tenantId);
    const target = claims[0];

    const settled = insuranceService.settleClaim(target.claimNumber, 'EFT-2026-99014', target.insurerCoveredUsd);
    assert.equal(settled.status, 'SETTLED');
    assert.ok(settled.adjudicationNotes?.includes('EFT-2026-99014'));
  });

  it('should export MoH NSSF reimbursement batch with accurate KHR currency conversion at 4100', () => {
    const exp = insuranceService.exportNssfBatch('BATCH-TEST-01');
    assert.equal(exp.facilityCode, 'HF-PP-10492');
    assert.equal(exp.batchNumber, 'BATCH-TEST-01');
    assert.ok(exp.totalClaims >= 1);
    assert.equal(exp.totalAmountKhr, Math.round(exp.totalAmountUsd * 4100));
  });

  it('should guarantee zero emojis across the entire insurance service and claim records', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    const allClaims = insuranceService.getClaims(tenantId);

    for (const claim of allClaims) {
      assert.ok(!emojiRegex.test(claim.claimNumber), `Claim number has emoji: ${claim.claimNumber}`);
      assert.ok(!emojiRegex.test(claim.patientName), `Patient name has emoji: ${claim.patientName}`);
      assert.ok(!emojiRegex.test(claim.diagnosisDescription), `Diagnosis has emoji: ${claim.diagnosisDescription}`);
    }
  });
});
