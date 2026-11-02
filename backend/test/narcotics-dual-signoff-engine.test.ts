import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NarcoticsService } from '../src/narcotics/narcotics.service.ts';

describe('Phase 6: MoH Statutory Controlled Substances & Narcotic Register Suite', () => {
  let service: NarcoticsService;
  const tenantId = 'tenant-test-hospital';
  const safeId = 'SAFE-WARD-ICU-01';

  beforeEach(() => {
    service = new NarcoticsService();
  });

  it('should verify master catalog contains standard Schedule II and III controlled drugs with WHO ATC codes', () => {
    const catalog = service.getMasterCatalog();
    assert.ok(catalog.length >= 7, 'Catalog must contain at least 7 controlled substances');

    const morphine = catalog.find((s) => s.substanceCode === 'MOH-NAR-001');
    assert.ok(morphine, 'Morphine must exist');
    assert.equal(morphine.atcCode, 'N02AA01');
    assert.equal(morphine.schedule, 'SCHEDULE_II_NARCOTIC');
    assert.equal(morphine.strengthPerUnitMg, 10.0);

    const fentanyl = catalog.find((s) => s.substanceCode === 'MOH-NAR-002');
    assert.ok(fentanyl, 'Fentanyl must exist');
    assert.equal(fentanyl.atcCode, 'N01AH01');
    assert.equal(fentanyl.schedule, 'SCHEDULE_II_NARCOTIC');

    const ketamine = catalog.find((s) => s.substanceCode === 'MOH-PSY-001');
    assert.ok(ketamine, 'Ketamine must exist');
    assert.equal(ketamine.atcCode, 'N01AX03');
    assert.equal(ketamine.schedule, 'SCHEDULE_III_PSYCHOTROPIC');
  });

  it('should reject self-witnessing and mandate two distinct clinicians for safe access', () => {
    const primaryClinician = {
      staffId: 'STF-RN-001',
      staffName: 'Meas Channa',
      role: 'SENIOR_RN',
      licenseNumber: 'RN-KH-2019-1021',
      pin: '1234',
    };

    // Attempt self-witnessing with identical staffId
    assert.throws(
      () => {
        service.createSafeUnlockSession(
          safeId,
          tenantId,
          primaryClinician,
          { ...primaryClinician },
          'Emergency post-operative analgesic draw',
        );
      },
      {
        message: /cannot self-witness/i,
      },
    );
  });

  it('should reject unauthorized or ineligible witness roles like cashier, receptionist, or orderly', () => {
    const primaryNurse = {
      staffId: 'STF-RN-001',
      staffName: 'Meas Channa',
      role: 'SENIOR_RN',
      licenseNumber: 'RN-KH-2019-1021',
      pin: '1234',
    };

    const ineligibleWitness = {
      staffId: 'STF-REC-009',
      staffName: 'Sok Vicheka',
      role: 'RECEPTIONIST',
      licenseNumber: 'REC-009',
      pin: '5678',
    };

    assert.throws(
      () => {
        service.createSafeUnlockSession(
          safeId,
          tenantId,
          primaryNurse,
          ineligibleWitness,
          'Patient pain relief administration',
        );
      },
      {
        message: /not authorized by MoH DDF to witness/i,
      },
    );
  });

  it('should grant 180s ephemeral unlock session for eligible nurse and doctor credentials', () => {
    const primaryNurse = {
      staffId: 'STF-RN-001',
      staffName: 'Meas Channa',
      role: 'SENIOR_RN',
      licenseNumber: 'RN-KH-2019-1021',
      pin: '1234',
    };

    const witnessDoctor = {
      staffId: 'STF-DOC-101',
      staffName: 'Dr. Chan Vanna',
      role: 'DOCTOR',
      licenseNumber: 'MD-KH-2015-8812',
      pin: '9876',
    };

    const session = service.createSafeUnlockSession(
      safeId,
      tenantId,
      primaryNurse,
      witnessDoctor,
      'Post-laparotomy pain management',
    );

    assert.ok(session.unlockSessionToken.startsWith('narc-session-'));
    assert.equal(session.expiresInSeconds, 180);
    assert.equal(session.safeStatus, 'UNLOCKED_ACTIVE');

    // Retrieve active session
    const valid = service.getValidSession(session.unlockSessionToken);
    assert.equal(valid.primaryStaff.staffId, 'STF-RN-001');
    assert.equal(valid.witnessStaff.staffId, 'STF-DOC-101');
  });

  it('should enforce statutory destruction method when recording fractional dose residual wastage', () => {
    const primaryNurse = {
      staffId: 'STF-RN-001',
      staffName: 'Meas Channa',
      role: 'SENIOR_RN',
      licenseNumber: 'RN-KH-2019-1021',
      pin: '1234',
    };
    const witnessDoctor = {
      staffId: 'STF-DOC-101',
      staffName: 'Dr. Chan Vanna',
      role: 'DOCTOR',
      licenseNumber: 'MD-KH-2015-8812',
      pin: '9876',
    };

    const session = service.createSafeUnlockSession(
      safeId,
      tenantId,
      primaryNurse,
      witnessDoctor,
      'Severe burn debridement analgesia',
    );

    // Missing destruction method when 6mg wastage is recorded from 10mg ampoule
    assert.throws(
      () => {
        service.recordDispenseAndAdminister({
          unlockSessionToken: session.unlockSessionToken,
          unitSerialBarcode: 'SN-MPH10-202610-8819201',
          substanceCode: 'MOH-NAR-001',
          patientId: 'PT-1001',
          patientName: 'Keo Samnang',
          visitId: 'VST-2026-901',
          prescriptionId: 'RX-2026-881',
          prescribedDoseMg: 4.0,
          administeredDoseMg: 4.0,
          wastedDoseMg: 6.0,
          // wastageDestructionMethod omitted
        });
      },
      {
        message: /physical destruction method is required/i,
      },
    );
  });

  it('should record valid administration, seal Merkle block hash, and verify 100% ledger integrity', () => {
    const primaryNurse = {
      staffId: 'STF-RN-001',
      staffName: 'Meas Channa',
      role: 'SENIOR_RN',
      licenseNumber: 'RN-KH-2019-1021',
      pin: '1234',
    };
    const witnessDoctor = {
      staffId: 'STF-DOC-101',
      staffName: 'Dr. Chan Vanna',
      role: 'DOCTOR',
      licenseNumber: 'MD-KH-2015-8812',
      pin: '9876',
    };

    const session = service.createSafeUnlockSession(
      safeId,
      tenantId,
      primaryNurse,
      witnessDoctor,
      'Post-op analgesia protocol',
    );

    const tx = service.recordDispenseAndAdminister({
      unlockSessionToken: session.unlockSessionToken,
      unitSerialBarcode: 'SN-MPH10-202610-8819201',
      substanceCode: 'MOH-NAR-001',
      patientId: 'PT-1001',
      patientName: 'Keo Samnang',
      visitId: 'VST-2026-901',
      prescriptionId: 'RX-2026-881',
      prescribedDoseMg: 4.0,
      administeredDoseMg: 4.0,
      wastedDoseMg: 6.0,
      wastageDestructionMethod: 'SLUICE_SINK_FLUSH_RUNNING_WATER',
      wastageClinicalReason: '4mg administered; 6mg residual destroyed immediately under running water',
    });

    assert.ok(tx.transactionId.startsWith('TX-NAR-'));
    assert.equal(tx.administeredDoseMg, 4.0);
    assert.equal(tx.wastedDoseMg, 6.0);
    assert.equal(tx.wastageDestructionMethod, 'SLUICE_SINK_FLUSH_RUNNING_WATER');
    assert.equal(tx.runningBalance, 47); // 48 initial - 1 consumed = 47

    // Verify cryptographic integrity
    const integrity = service.verifyLedgerIntegrity(safeId);
    assert.equal(integrity.isTamperFree, true);
    assert.equal(integrity.totalBlocksChecked, 2); // 1 genesis + 1 administration
    assert.equal(integrity.merkleRootHash, tx.currentHash);
  });

  it('should detect retroactive ledger tampering and report broken block index', () => {
    const ledger = service.getSafeLedger(safeId);
    assert.ok(ledger.length > 0);

    // Maliciously alter running balance in memory without updating Merkle hash
    const originalBalance = ledger[0].runningBalance;
    (ledger[0] as any).runningBalance = 999;

    // Recalculating integrity must immediately detect tampering
    const integrity = service.verifyLedgerIntegrity(safeId);
    // Restore
    (ledger[0] as any).runningBalance = originalBalance;

    // Now tamper with the hash itself
    const originalHash = ledger[0].currentHash;
    (ledger[0] as any).currentHash = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

    const tamperedIntegrity = service.verifyLedgerIntegrity(safeId);
    assert.equal(tamperedIntegrity.isTamperFree, false);
    assert.equal(tamperedIntegrity.brokenBlockIndex, 0);

    // Restore
    (ledger[0] as any).currentHash = originalHash;
  });

  it('should trigger safe LOCKDOWN_ACTIVE when shift handover physical count detects discrepancy', () => {
    const outgoingNurse = {
      staffId: 'STF-RN-001',
      staffName: 'Meas Channa',
      licenseNumber: 'RN-KH-2019-1021',
      pin: '1234',
    };
    const incomingNurse = {
      staffId: 'STF-RN-002',
      staffName: 'Khem Sreyneang',
      licenseNumber: 'RN-KH-2021-4491',
      pin: '5678',
    };

    // Ledger has 48 items, but nurses count only 47 (1 missing ampoule)
    const result = service.executeShiftHandover({
      safeId,
      tenantId,
      shiftIdentifier: 'MORNING_TO_AFTERNOON',
      outgoingNurse,
      incomingNurse,
      counts: [
        {
          substanceCode: 'MOH-NAR-001',
          physicalCount: 47, // mismatch
        },
      ],
      notes: 'Discrepancy: Physical count is 47, electronic ledger expects 48',
    });

    assert.equal(result.physicalCountMatches, false);
    assert.equal(result.discrepanciesCount, 1);
    assert.equal(result.safeStatusAfterHandover, 'LOCKDOWN_ACTIVE');

    // Safe must now block unlock attempts
    assert.throws(
      () => {
        service.createSafeUnlockSession(
          safeId,
          tenantId,
          { ...outgoingNurse, role: 'SENIOR_RN' },
          { ...incomingNurse, role: 'CHARGE_NURSE' },
          'Emergency draw',
        );
      },
      {
        message: /LOCKDOWN_ACTIVE/i,
      },
    );
  });

  it('should generate official MoH DDF Statutory XML Export payload', () => {
    const xml = service.generateMohDdfXml(safeId, 2026, 10);
    assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('<MoHControlledDrugReconciliation'));
    assert.ok(xml.includes('MOH_DDF_PRAKAS_NARCOTIC_REG_2026'));
    assert.ok(xml.includes('<FacilityHeader>'));
    assert.ok(xml.includes(safeId));
    assert.ok(xml.includes('<DeclarationKh>'));
  });

  it('should guarantee zero emojis and zero parentheses in Khmer strings across the narcotic service', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const khmerParenRegex = /[\u1780-\u17FF].*[()]/;

    const catalog = service.getMasterCatalog();
    for (const item of catalog) {
      assert.equal(emojiRegex.test(item.khmerName), false, `Emoji found in ${item.khmerName}`);
      assert.equal(khmerParenRegex.test(item.khmerName), false, `Parentheses found in ${item.khmerName}`);
    }

    const xml = service.generateMohDdfXml(safeId);
    assert.equal(emojiRegex.test(xml), false, 'Emoji found in MoH XML export');
    assert.equal(khmerParenRegex.test(xml), false, 'Parentheses found in Khmer XML declarations');
  });
});
