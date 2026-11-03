// Phase 11: Cambodia NSSF (ប.ស.ស.) Mobile Gateway & CamDX Integration Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { MobileSyncService } from '../src/mobile-sync/mobile-sync.service.ts';
import type {
  NssfEligibilityRequestDto,
  NssfClaimSubmissionDto,
} from '../src/mobile-sync/mobile-sync.types.ts';

describe('Phase 11: Cambodia NSSF Mobile Gateway & CamDX Integration Test Suite', () => {
  let service: MobileSyncService;

  beforeEach(() => {
    service = new MobileSyncService();
  });

  describe('1. Member Eligibility Verification via CamDX', () => {
    it('should verify active member with 10-digit ID and return entitlements with CamDX token', async () => {
      const dto: NssfEligibilityRequestDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        facilityCode: 'HF-MOH-1201',
        deviceId: 'DEV-TAB-01',
      };

      const res = await service.verifyNssfEligibility(dto);

      assert.equal(res.isEligible, true);
      assert.equal(res.memberId, '1029384756');
      assert.equal(res.memberBarcode, 'NSSF-1029384756');
      assert.equal(res.memberNameEn, 'Sophea Sok');
      assert.equal(res.memberNameKh, 'សុភា សុខ');
      assert.equal(res.enterpriseName, 'CANADIA GARMENT FACTORY');
      assert.equal(res.status, 'ACTIVE');
      assert.equal(res.activeContributionMonths, 24);
      assert.ok(res.entitlements.length >= 3);

      const health = res.entitlements.find((e) => e.package === 'HEALTH_CARE');
      assert.ok(health);
      assert.equal(health.isCovered, true);

      const occupational = res.entitlements.find((e) => e.package === 'OCCUPATIONAL_RISK');
      assert.ok(occupational);
      assert.equal(occupational.isCovered, true);

      const maternity = res.entitlements.find((e) => e.package === 'MATERNITY');
      assert.ok(maternity);
      assert.equal(maternity.isCovered, true);

      assert.ok(res.camdxVerificationToken.startsWith('CAMDX-NSSF-V1.'));
      assert.ok(res.tokenExpiresAt);
    });

    it('should normalize barcode format NSSF-1029384756 and extract 10-digit membership ID', async () => {
      const dto: NssfEligibilityRequestDto = {
        memberId: 'NSSF-1029384756',
      };

      const res = await service.verifyNssfEligibility(dto);

      assert.equal(res.isEligible, true);
      assert.equal(res.memberId, '1029384756');
      assert.equal(res.memberNameEn, 'Sophea Sok');
    });

    it('should reject eligibility when member ID is not an exact 10-digit number', async () => {
      await assert.rejects(
        async () => {
          await service.verifyNssfEligibility({ memberId: '12345' });
        },
        { name: 'BadRequestException' }
      );

      await assert.rejects(
        async () => {
          await service.verifyNssfEligibility({ memberId: '1029384756999' });
        },
        { name: 'BadRequestException' }
      );

      await assert.rejects(
        async () => {
          await service.verifyNssfEligibility({ memberId: 'ABCDEFGHIJ' });
        },
        { name: 'BadRequestException' }
      );
    });

    it('should reject eligibility for suspended member with insufficient contribution months', async () => {
      const dto: NssfEligibilityRequestDto = {
        memberId: '3049586772',
      };

      const res = await service.verifyNssfEligibility(dto);

      assert.equal(res.isEligible, false);
      assert.equal(res.status, 'SUSPENDED');
      assert.equal(res.activeContributionMonths, 3);
      assert.equal(res.rejectionReason, 'CONTRIBUTION_LAPSED_INSUFFICIENT_MONTHS');
      assert.equal(res.camdxVerificationToken, '');
    });

    it('should return non-eligible when member is not found in NSSF registry', async () => {
      const dto: NssfEligibilityRequestDto = {
        memberId: '9999999999',
      };

      const res = await service.verifyNssfEligibility(dto);

      assert.equal(res.isEligible, false);
      assert.equal(res.rejectionReason, 'MEMBER_NOT_FOUND_IN_NSSF_REGISTRY');
    });
  });

  describe('2. ICD-10 Syntax Validation', () => {
    let validToken: string;

    beforeEach(async () => {
      const elig = await service.verifyNssfEligibility({ memberId: '1029384756' });
      validToken = elig.camdxVerificationToken;
    });

    it('should accept valid ICD-10 codes matching standard syntax', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'OUTPATIENT',
        primaryIcd10: 'K29.7', // Valid ICD-10 gastritis
        secondaryIcd10: ['Z01.8'], // Valid ICD-10 other special examination
        items: [{ actCode: 'NSSF-OPD-001', quantity: 1 }],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.success, true);
      assert.equal(res.overallStatus, 'APPROVED');
    });

    it('should reject claim when primary ICD-10 syntax is malformed', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'OUTPATIENT',
        primaryIcd10: '12345', // Invalid: does not start with letter
        items: [{ actCode: 'NSSF-OPD-001', quantity: 1 }],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      await assert.rejects(
        async () => {
          await service.submitNssfClaim(claim);
        },
        { name: 'BadRequestException' }
      );
    });

    it('should reject claim when secondary ICD-10 syntax is malformed', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'OUTPATIENT',
        primaryIcd10: 'K29.7',
        secondaryIcd10: ['INVALID_CODE'],
        items: [{ actCode: 'NSSF-OPD-001', quantity: 1 }],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      await assert.rejects(
        async () => {
          await service.submitNssfClaim(claim);
        },
        { name: 'BadRequestException' }
      );
    });
  });

  describe('3. Occupational Risk Dual-Coding Enforcement', () => {
    let validToken: string;

    beforeEach(async () => {
      const elig = await service.verifyNssfEligibility({ memberId: '1029384756' });
      validToken = elig.camdxVerificationToken;
    });

    it('should reject occupational risk claim if primary diagnosis is not Chapter XIX injury trauma', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'OCCUPATIONAL_RISK',
        encounterType: 'EMERGENCY',
        occupationalCause: 'WORKPLACE_ACCIDENT',
        primaryIcd10: 'K29.7', // Gastritis is not an injury (S00-T88)
        secondaryIcd10: ['W31'],
        items: [{ actCode: 'NSSF-SURG-K05', quantity: 1 }],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      await assert.rejects(
        async () => {
          await service.submitNssfClaim(claim);
        },
        {
          name: 'BadRequestException',
          message: /OCCUPATIONAL_RISK_DUAL_CODING_REQUIRED.*Primary diagnosis/,
        }
      );
    });

    it('should reject occupational risk claim if secondary diagnosis lacks external cause code V01-Y98', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'OCCUPATIONAL_RISK',
        encounterType: 'EMERGENCY',
        occupationalCause: 'COMMUTING_ACCIDENT',
        primaryIcd10: 'S52.5', // Fracture of radius (Chapter XIX Injury)
        secondaryIcd10: ['Z00.0'], // General exam is not an external cause (V01-Y98)
        items: [{ actCode: 'NSSF-SURG-K05', quantity: 1 }],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      await assert.rejects(
        async () => {
          await service.submitNssfClaim(claim);
        },
        {
          name: 'BadRequestException',
          message: /OCCUPATIONAL_RISK_DUAL_CODING_REQUIRED.*External cause code/,
        }
      );
    });

    it('should approve occupational risk claim when both injury code and external cause code are provided', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'OCCUPATIONAL_RISK',
        encounterType: 'EMERGENCY',
        occupationalCause: 'COMMUTING_ACCIDENT',
        primaryIcd10: 'S52.5', // Chapter XIX Injury
        secondaryIcd10: ['V29.9'], // Chapter XX Motorcycle traffic accident
        items: [{ actCode: 'NSSF-SURG-K05', quantity: 1 }],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.success, true);
      assert.equal(res.overallStatus, 'APPROVED');
      assert.equal(res.totalNssfCoveredKhr, 60000);
      assert.equal(res.totalPatientCoPayKhr, 0);
    });
  });

  describe('4. Tariff Calculation & Co-Payment for K, B, and R Lines', () => {
    let validToken: string;

    beforeEach(async () => {
      const elig = await service.verifyNssfEligibility({ memberId: '1029384756' });
      validToken = elig.camdxVerificationToken;
    });

    it('should correctly calculate surgical K-factor tariffs at 12000 KHR baseline unit', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'INPATIENT',
        primaryIcd10: 'K35.8',
        items: [
          { actCode: 'NSSF-SURG-K05', quantity: 1 }, // K5 * 12,000 = 60,000 KHR
          { actCode: 'NSSF-SURG-K50', quantity: 1 }, // K50 * 12,000 = 600,000 KHR
        ],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.success, true);
      assert.equal(res.lines.length, 2);
      assert.equal(res.lines[0].calculatedTariffKhr, 60000);
      assert.equal(res.lines[1].calculatedTariffKhr, 600000);
      assert.equal(res.totalNssfCoveredKhr, 660000);
      assert.equal(res.totalPatientCoPayKhr, 0);
    });

    it('should correctly calculate laboratory B-factor and imaging R-factor tariffs', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'OUTPATIENT',
        primaryIcd10: 'R10.9',
        items: [
          { actCode: 'NSSF-LAB-B05', quantity: 1 }, // B5 * 1,000 = 5,000 KHR
          { actCode: 'NSSF-LAB-B12', quantity: 1 }, // B12 * 1,000 = 12,000 KHR
          { actCode: 'NSSF-IMG-R12', quantity: 1 }, // R12 * 2,500 = 30,000 KHR
          { actCode: 'NSSF-IMG-R30', quantity: 1 }, // R30 * 2,500 = 75,000 KHR
        ],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.success, true);
      assert.equal(res.lines.length, 4);
      assert.equal(res.lines[0].calculatedTariffKhr, 5000);
      assert.equal(res.lines[1].calculatedTariffKhr, 12000);
      assert.equal(res.lines[2].calculatedTariffKhr, 30000);
      assert.equal(res.lines[3].calculatedTariffKhr, 75000);
      assert.equal(res.totalNssfCoveredKhr, 122000);
    });

    it('should reject procedure requiring pre-authorization when preAuthCode is omitted', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'INPATIENT',
        primaryIcd10: 'S52.5',
        items: [
          { actCode: 'NSSF-OPD-001', quantity: 1 },
          { actCode: 'NSSF-SURG-K75', quantity: 1 }, // Requires preAuthCode!
        ],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.overallStatus, 'PARTIAL');
      assert.equal(res.lines[0].status, 'APPROVED');
      assert.equal(res.lines[1].status, 'REJECTED');
      assert.equal(res.lines[1].rejectionReason, 'PREAUTH_REQUIRED_MISSING_APPROVAL');
      assert.equal(res.lines[1].nssfCoveredKhr, 0);
      assert.equal(res.lines[1].patientCoPayKhr, 900000);
    });

    it('should approve procedure requiring pre-authorization when valid preAuthCode is supplied', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'INPATIENT',
        primaryIcd10: 'S52.5',
        items: [
          {
            actCode: 'NSSF-SURG-K75',
            quantity: 1,
            preAuthCode: 'NSSF-PREAUTH-2026-1234',
          },
        ],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.overallStatus, 'APPROVED');
      assert.equal(res.lines[0].status, 'APPROVED');
      assert.equal(res.lines[0].nssfCoveredKhr, 900000);
      assert.equal(res.lines[0].patientCoPayKhr, 0);
    });

    it('should cap reimbursable amount at ceiling and assign excess to patient co-payment', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'OUTPATIENT',
        primaryIcd10: 'Z00.0',
        items: [
          {
            actCode: 'NSSF-OPD-001', // Ceiling is 20,000 KHR
            quantity: 1,
            requestedPriceKhr: 35000, // Clinic requests 35,000 KHR
          },
        ],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.lines[0].status, 'PARTIALLY_APPROVED');
      assert.equal(res.lines[0].nssfCoveredKhr, 20000);
      assert.equal(res.lines[0].patientCoPayKhr, 15000); // 35,000 - 20,000
      assert.equal(res.totalBilledKhr, 35000);
      assert.equal(res.totalNssfCoveredKhr, 20000);
      assert.equal(res.totalPatientCoPayKhr, 15000);
      assert.equal(res.overallStatus, 'PARTIAL');
    });

    it('should accurately convert KHR totals to USD at 4100 standard exchange rate', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'MATERNITY',
        encounterType: 'INPATIENT',
        primaryIcd10: 'O80.0',
        items: [
          { actCode: 'NSSF-MAT-001', quantity: 1 }, // 400,000 KHR
        ],
        camdxVerificationToken: validToken,
        deviceId: 'DEV-TEST-01',
        clientTimestamp: '2026-11-04T01:30:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.totalNssfCoveredKhr, 400000);
      assert.equal(res.totalNssfCoveredUsd, 97.56); // 400,000 / 4100
      assert.equal(res.totalPatientCoPayUsd, 0.0);
    });
  });

  describe('5. StrongBox / TEE ECDSA secp256r1 Hardware Signature Verification', () => {
    let validToken: string;
    let deviceKey: { publicKey: string; privateKey: string };
    const deviceId = 'DEV-STRONGBOX-TABLET-01';

    beforeEach(async () => {
      const elig = await service.verifyNssfEligibility({ memberId: '1029384756' });
      validToken = elig.camdxVerificationToken;

      deviceKey = service.generateDeviceEcKeyPair();
      service.registerDevicePublicKey(deviceId, deviceKey.publicKey);
    });

    it('should accept claim with valid StrongBox ECDSA secp256r1 device signature', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'OUTPATIENT',
        primaryIcd10: 'K29.7',
        items: [{ actCode: 'NSSF-OPD-001', quantity: 1 }],
        camdxVerificationToken: validToken,
        deviceId,
        hardwareKeyAttestation: 'STRONGBOX-ECDSA-SECP256R1-SECURE-ELEMENT',
        clientTimestamp: '2026-11-04T01:45:00.000Z',
      };

      const canonicalString = service.buildClaimCanonicalString(claim);
      const sign = crypto.createSign('SHA256');
      sign.update(canonicalString);
      sign.end();
      const validSignature = sign.sign(deviceKey.privateKey, 'base64');

      claim.deviceSignature = validSignature;

      const res = await service.submitNssfClaim(claim);

      assert.equal(res.success, true);
      assert.equal(res.overallStatus, 'APPROVED');
      assert.ok(res.camdxReceiptReference.startsWith('CAMDX-NSSF-REC-'));
      assert.ok(res.camdxVerificationHash);
    });

    it('should reject claim when StrongBox ECDSA signature is tampered or invalid', async () => {
      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'OUTPATIENT',
        primaryIcd10: 'K29.7',
        items: [{ actCode: 'NSSF-OPD-001', quantity: 1 }],
        camdxVerificationToken: validToken,
        deviceId,
        hardwareKeyAttestation: 'STRONGBOX-ECDSA-SECP256R1-SECURE-ELEMENT',
        clientTimestamp: '2026-11-04T01:45:00.000Z',
      };

      // Generate signature from a different foreign key pair
      const foreignKey = service.generateDeviceEcKeyPair();
      const canonicalString = service.buildClaimCanonicalString(claim);
      const sign = crypto.createSign('SHA256');
      sign.update(canonicalString);
      sign.end();
      const forgedSignature = sign.sign(foreignKey.privateKey, 'base64');

      claim.deviceSignature = forgedSignature;

      await assert.rejects(
        async () => {
          await service.submitNssfClaim(claim);
        },
        {
          name: 'BadRequestException',
          message: /INVALID_HARDWARE_SIGNATURE/,
        }
      );
    });
  });

  describe('6. Strict Healthcare Platform Compliance', () => {
    it('should strictly guarantee zero emojis and zero parentheses in Khmer text across all NSSF responses and tariffs', async () => {
      const elig = await service.verifyNssfEligibility({ memberId: '1029384756' });

      const claim: NssfClaimSubmissionDto = {
        memberId: '1029384756',
        nationalId: '010294812',
        patientId: 'PAT-001',
        benefitPackage: 'HEALTH_CARE',
        encounterType: 'OUTPATIENT',
        primaryIcd10: 'K29.7',
        items: [
          { actCode: 'NSSF-OPD-001', quantity: 1 },
          { actCode: 'NSSF-LAB-B05', quantity: 1 },
          { actCode: 'NSSF-IMG-R12', quantity: 1 },
        ],
        camdxVerificationToken: elig.camdxVerificationToken,
        deviceId: 'DEV-COMPLIANCE-01',
        clientTimestamp: '2026-11-04T01:50:00.000Z',
      };

      const res = await service.submitNssfClaim(claim);

      const emojiRegex =
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      const khmerWithParensRegex = /[\u1780-\u17FF][^()]*[()]/;

      // 1. Check Eligibility Response
      const eligJson = JSON.stringify(elig);
      assert.equal(emojiRegex.test(eligJson), false, 'Eligibility response must not contain emojis');
      assert.equal(khmerWithParensRegex.test(eligJson), false, 'Eligibility response must not have Khmer parentheses');

      // 2. Check Claim Submission Response
      const claimJson = JSON.stringify(res);
      assert.equal(emojiRegex.test(claimJson), false, 'Claim response must not contain emojis');
      assert.equal(khmerWithParensRegex.test(claimJson), false, 'Claim response must not have Khmer parentheses');

      // 3. Check All Seeded Tariffs
      const tariffs = service.getNssfTariffs();
      for (const t of tariffs) {
        assert.equal(emojiRegex.test(t.descriptionKh), false, `Tariff ${t.actCode} has no emojis`);
        assert.equal(
          t.descriptionKh.includes('(') || t.descriptionKh.includes(')'),
          false,
          `Tariff ${t.actCode} has no Khmer parentheses: "${t.descriptionKh}"`
        );
      }
    });
  });
});
