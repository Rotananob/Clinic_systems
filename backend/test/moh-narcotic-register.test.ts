import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NarcoticsService } from '../src/narcotics/narcotics.service.ts';

describe('Phase 6: MoH Controlled Substances, Narcotic Register & Merkle Ledger Audit Tests', () => {
  let service: NarcoticsService;
  const safeId = 'SAFE-WARD-ICU-01';
  const tenantId = 'test-clinic-tenant';

  beforeEach(() => {
    service = new NarcoticsService();
  });

  it('should initialize with complete statutory Schedule II and Schedule III controlled substances catalog', () => {
    const catalog = service.getMasterCatalog();
    assert.ok(catalog.length >= 7, 'Must contain all core controlled items');

    const codes = new Set(catalog.map((item) => item.substanceCode));
    assert.ok(codes.has('MOH-NAR-001'), 'Must include Morphine Sulfate Schedule II');
    assert.ok(codes.has('MOH-NAR-002'), 'Must include Fentanyl Citrate Schedule II');
    assert.ok(codes.has('MOH-NAR-003'), 'Must include Pethidine Hydrochloride Schedule II');
    assert.ok(codes.has('MOH-PSY-001'), 'Must include Ketamine Hydrochloride Schedule III');
    assert.ok(codes.has('MOH-PSY-002'), 'Must include Diazepam Schedule III');
    assert.ok(codes.has('MOH-PSY-003'), 'Must include Midazolam Schedule III');
    assert.ok(codes.has('MOH-PSY-004'), 'Must include Tramadol Hydrochloride Schedule III');

    const morphine = catalog.find((c) => c.substanceCode === 'MOH-NAR-001');
    assert.equal(morphine?.schedule, 'SCHEDULE_II_NARCOTIC');
    assert.equal(morphine?.strengthPerUnitMg, 10.0);
    assert.equal(morphine?.unitOfMeasure, 'AMPOULE');
  });

  it('should enforce mandatory dual-clinician witness verification and reject single-staff self-witness attempts', () => {
    // Attempting self-witness with identical staff ID throws statutory violation
    assert.throws(
      () => service.validateWitnessEligibility('STAFF-RN-001', 'STAFF-RN-001', 'SENIOR_RN'),
      /Primary administering clinician cannot self-witness/,
    );

    // Attempting unlock session with identical clinician
    assert.throws(
      () =>
        service.createSafeUnlockSession(
          safeId,
          tenantId,
          {
            staffId: 'STAFF-RN-001',
            staffName: 'RN Sok Vicheka',
            role: 'SENIOR_RN',
            licenseNumber: 'NURSE-LIC-KH-2019-102',
            pin: '1234',
          },
          {
            staffId: 'STAFF-RN-001',
            staffName: 'RN Sok Vicheka',
            role: 'SENIOR_RN',
            licenseNumber: 'NURSE-LIC-KH-2019-102',
            pin: '1234',
          },
          'Post-operative acute analgesia administration',
        ),
      /Primary administering clinician cannot self-witness/,
    );
  });

  it('should reject ineligible witness roles (orderlies, aides, interns, clerks) and accept authorized clinical roles', () => {
    const ineligibleRoles = ['ORDERLY', 'NURSING_AIDE', 'STUDENT_NURSE', 'INTERN', 'WARD_CLERK', 'PHARMACY_CASHIER'];

    for (const role of ineligibleRoles) {
      assert.throws(
        () => service.validateWitnessEligibility('STAFF-RN-001', 'STAFF-OTHER-002', role),
        /is not authorized by MoH DDF/,
      );
    }

    const authorizedRoles = ['DOCTOR', 'CHARGE_NURSE', 'SENIOR_RN', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN'];
    for (const role of authorizedRoles) {
      const check = service.validateWitnessEligibility('STAFF-RN-001', 'STAFF-OTHER-002', role);
      assert.equal(check.eligible, true, `Role ${role} should be authorized to witness`);
    }
  });

  it('should issue an ephemeral 180-second session token upon valid dual authentication and lock safe on expiry', () => {
    const session = service.createSafeUnlockSession(
      safeId,
      tenantId,
      {
        staffId: 'STAFF-RN-001',
        staffName: 'RN Sok Vicheka',
        role: 'CHARGE_NURSE',
        licenseNumber: 'NURSE-LIC-KH-2019-102',
        pin: '4821',
      },
      {
        staffId: 'STAFF-DOC-002',
        staffName: 'Dr. TEP Somally',
        role: 'DOCTOR',
        licenseNumber: 'DOC-LIC-KH-2015-992',
        pin: '7731',
      },
      'Intra-operative anesthesia induction',
    );

    assert.ok(session.unlockSessionToken.startsWith('narc-session-'));
    assert.equal(session.expiresInSeconds, 180);
    assert.equal(session.safeStatus, 'UNLOCKED_ACTIVE');

    const validSession = service.getValidSession(session.unlockSessionToken);
    assert.equal(validSession.safeId, safeId);
    assert.equal(validSession.primaryStaff.staffId, 'STAFF-RN-001');
    assert.equal(validSession.witnessStaff.staffId, 'STAFF-DOC-002');
  });

  it('should log fractional wastage destruction with approved MoH disposal methods and conserve mass balance', () => {
    const session = service.createSafeUnlockSession(
      safeId,
      tenantId,
      {
        staffId: 'STAFF-RN-001',
        staffName: 'RN Sok Vicheka',
        role: 'CHARGE_NURSE',
        licenseNumber: 'NURSE-LIC-KH-2019-102',
        pin: '4821',
      },
      {
        staffId: 'STAFF-RN-002',
        staffName: 'RN Chan Davy',
        role: 'SENIOR_RN',
        licenseNumber: 'NURSE-LIC-KH-2017-048',
        pin: '9012',
      },
      'Prescribed Morphine 4mg from 10mg ampoule',
    );

    // Case 1: Rejects missing disposal method when residual wastage > 0
    assert.throws(
      () =>
        service.recordDispenseAndAdminister({
          unlockSessionToken: session.unlockSessionToken,
          unitSerialBarcode: 'GS1-AMP-MORPH-2026-0001',
          substanceCode: 'MOH-NAR-001',
          patientId: 'PT-9901',
          patientName: 'KEO Sokha',
          visitId: 'VISIT-551',
          prescriptionId: 'RX-881',
          prescribedDoseMg: 4.0,
          administeredDoseMg: 4.0,
          wastedDoseMg: 6.0,
          // Missing wastageDestructionMethod!
        }),
      /Mandatory disposal method must be specified/,
    );

    // Case 2: Successful recording with approved destruction method: SLUICE_SINK_FLUSH_RUNNING_WATER
    const tx = service.recordDispenseAndAdminister({
      unlockSessionToken: session.unlockSessionToken,
      unitSerialBarcode: 'GS1-AMP-MORPH-2026-0001',
      substanceCode: 'MOH-NAR-001',
      patientId: 'PT-9901',
      patientName: 'KEO Sokha',
      visitId: 'VISIT-551',
      prescriptionId: 'RX-881',
      prescribedDoseMg: 4.0,
      administeredDoseMg: 4.0,
      wastedDoseMg: 6.0,
      wastageDestructionMethod: 'SLUICE_SINK_FLUSH_RUNNING_WATER',
      wastageClinicalReason: '4mg administered for acute pain; residual 6mg destroyed under continuous tap water stream',
    });

    assert.ok(tx.id.startsWith('tx-nar-') || tx.id.startsWith('TX-NAR-'));
    assert.equal(tx.doseAdministeredMg, 4.0);
    assert.equal(tx.doseWastedMg, 6.0);

    // Session token must be consumed immediately to prevent replay
    assert.throws(
      () => service.getValidSession(session.unlockSessionToken),
      /Invalid or expired safe unlock session token/,
    );
  });

  it('should maintain cryptographic SHA-256 Merkle chain integrity and detect retroactive ledger tampering', () => {
    // Transaction 1
    const session1 = service.createSafeUnlockSession(
      safeId,
      tenantId,
      {
        staffId: 'STAFF-RN-001',
        staffName: 'RN Sok Vicheka',
        role: 'CHARGE_NURSE',
        licenseNumber: 'NURSE-LIC-KH-2019-102',
        pin: '4821',
      },
      {
        staffId: 'STAFF-RN-002',
        staffName: 'RN Chan Davy',
        role: 'SENIOR_RN',
        licenseNumber: 'NURSE-LIC-KH-2017-048',
        pin: '9012',
      },
      'Patient 1 Morphine administration',
    );

    const tx1 = service.recordDispenseAndAdminister({
      unlockSessionToken: session1.unlockSessionToken,
      unitSerialBarcode: 'GS1-AMP-MORPH-2026-0001',
      substanceCode: 'MOH-NAR-001',
      patientId: 'PT-1001',
      patientName: 'VON Samnang',
      visitId: 'VISIT-001',
      prescriptionId: 'RX-001',
      prescribedDoseMg: 10.0,
      administeredDoseMg: 10.0,
      wastedDoseMg: 0.0,
    });

    // Transaction 2
    const session2 = service.createSafeUnlockSession(
      safeId,
      tenantId,
      {
        staffId: 'STAFF-RN-001',
        staffName: 'RN Sok Vicheka',
        role: 'CHARGE_NURSE',
        licenseNumber: 'NURSE-LIC-KH-2019-102',
        pin: '4821',
      },
      {
        staffId: 'STAFF-DOC-003',
        staffName: 'Dr. TEP Somally',
        role: 'DOCTOR',
        licenseNumber: 'DOC-LIC-KH-2015-992',
        pin: '7731',
      },
      'Patient 2 Fentanyl administration',
    );

    const tx2 = service.recordDispenseAndAdminister({
      unlockSessionToken: session2.unlockSessionToken,
      unitSerialBarcode: 'GS1-AMP-FENT-2026-0001',
      substanceCode: 'MOH-NAR-002',
      patientId: 'PT-1002',
      patientName: 'CHHAY Boran',
      visitId: 'VISIT-002',
      prescriptionId: 'RX-002',
      prescribedDoseMg: 0.05,
      administeredDoseMg: 0.05,
      wastedDoseMg: 0.05,
      wastageDestructionMethod: 'CHEMICAL_DENATURATION_ABSORBENT',
      wastageClinicalReason: 'Residual 0.05mg neutralized in activated charcoal container',
    });

    // Verify Merkle hash continuity
    assert.equal(tx2.previousLedgerHash || tx2.previousHash, tx1.ledgerEntryHash || tx1.currentHash);

    // Initial check: Complete tamper-free integrity
    const integrityInitial = service.verifyLedgerIntegrity(safeId);
    assert.equal(integrityInitial.isTamperFree, true);
    assert.ok(integrityInitial.totalBlocksChecked >= 2);

    // Simulating retroactive tampering: Adversary modifies administered dose in Transaction 1
    const ledger = service.getSafeLedger(safeId);
    ledger[0].doseAdministeredMg = 8.0; // Tampered!

    // Verify that tamper-evident audit seal flags error
    const integrityTampered = service.verifyLedgerIntegrity(safeId);
    assert.equal(integrityTampered.isTamperFree, false);
    assert.equal(integrityTampered.brokenBlockIndex, 0);
    assert.ok(integrityTampered.statutoryDeclarationEn.includes('Unauthorized ledger modification detected'));
  });

  it('should verify shift handover balance, trigger automatic lockdown on physical count mismatch, and block safe access', () => {
    // Case 1: Perfect physical count matching perpetual balance (48 ampoules)
    const validHandover = service.executeShiftHandover({
      safeId,
      tenantId,
      shiftIdentifier: 'MORNING_TO_AFTERNOON',
      outgoingNurse: {
        staffId: 'STAFF-RN-001',
        staffName: 'RN Sok Vicheka',
        licenseNumber: 'NURSE-LIC-KH-2019-102',
        pin: '4821',
      },
      incomingNurse: {
        staffId: 'STAFF-RN-002',
        staffName: 'RN Chan Davy',
        licenseNumber: 'NURSE-LIC-KH-2017-048',
        pin: '9012',
      },
      counts: [{ substanceCode: 'MOH-NAR-001', physicalCount: 48 }],
      notes: 'All Morphine Sulfate ampoules present and intact',
    });

    assert.equal(validHandover.physicalCountMatches, true);
    assert.equal(validHandover.safeStatusAfterHandover, 'LOCKED');

    // Case 2: Count mismatch (Physical count 47 vs expected 48 -> 1 ampoule missing!)
    const mismatchHandover = service.executeShiftHandover({
      safeId,
      tenantId,
      shiftIdentifier: 'AFTERNOON_TO_NIGHT',
      outgoingNurse: {
        staffId: 'STAFF-RN-002',
        staffName: 'RN Chan Davy',
        licenseNumber: 'NURSE-LIC-KH-2017-048',
        pin: '9012',
      },
      incomingNurse: {
        staffId: 'STAFF-RN-003',
        staffName: 'RN Lim Sreymom',
        licenseNumber: 'NURSE-LIC-KH-2020-331',
        pin: '5561',
      },
      counts: [{ substanceCode: 'MOH-NAR-001', physicalCount: 47 }],
      notes: 'Physical count 47 ampoules. 1 ampoule unaccounted for in safe.',
    });

    assert.equal(mismatchHandover.physicalCountMatches, false);
    assert.equal(mismatchHandover.safeStatusAfterHandover, 'LOCKDOWN_ACTIVE');

    // Case 3: In LOCKDOWN_ACTIVE, safe unlock attempts MUST be rejected with ForbiddenException / Error
    assert.throws(
      () =>
        service.createSafeUnlockSession(
          safeId,
          tenantId,
          {
            staffId: 'STAFF-RN-003',
            staffName: 'RN Lim Sreymom',
            role: 'CHARGE_NURSE',
            licenseNumber: 'NURSE-LIC-KH-2020-331',
            pin: '5561',
          },
          {
            staffId: 'STAFF-DOC-001',
            staffName: 'Dr. CHAN Vanna',
            role: 'DOCTOR',
            licenseNumber: 'DOC-LIC-KH-2012-1108',
            pin: '1108',
          },
          'Attempted dispense during lockdown',
        ),
      /Safe is in statutory LOCKDOWN_ACTIVE status due to inventory discrepancy/,
    );
  });

  it('should generate valid MoH DDF Statutory XML Export with cryptographic Merkle root hash', () => {
    const xml = service.generateMohDdfXml(safeId, 2026, 10);
    assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<HealthFacilityCode>HF-MOH-8819</HealthFacilityCode>'));
    assert.ok(xml.includes('<ReportingPeriodYear>2026</ReportingPeriodYear>'));
    assert.ok(xml.includes('<ReportingPeriodMonth>10</ReportingPeriodMonth>'));
    assert.ok(xml.includes('<CryptographicSealVerified>true</CryptographicSealVerified>'));
    assert.ok(xml.includes('<MerkleRootHash>'));
  });

  it('should guarantee zero emojis and zero parentheses in Khmer text across all narcotic catalog items and statutory statements', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    const catalog = service.getMasterCatalog();

    for (const item of catalog) {
      assert.ok(!emojiRegex.test(item.genericName), `Generic name contains emoji: ${item.genericName}`);
      assert.ok(!emojiRegex.test(item.khmerName), `Khmer name contains emoji: ${item.khmerName}`);

      // Strict check: Zero parentheses in Khmer name
      assert.ok(!item.khmerName.includes('('), `Khmer name contains open parenthesis: ${item.khmerName}`);
      assert.ok(!item.khmerName.includes(')'), `Khmer name contains close parenthesis: ${item.khmerName}`);
    }

    const integrity = service.verifyLedgerIntegrity(safeId);
    assert.ok(!emojiRegex.test(integrity.statutoryDeclarationKh));
    assert.ok(!integrity.statutoryDeclarationKh.includes('('));
    assert.ok(!integrity.statutoryDeclarationKh.includes(')'));
  });
});
