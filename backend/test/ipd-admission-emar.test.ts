import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IpdService } from '../src/ipd/ipd.service.ts';

describe('Phase 13: Inpatient (IPD) Admission, Bed Management & Nurse e-MAR Suite', () => {
  it('should initialize with pre-seeded wards, beds, and an active admission', () => {
    const service = new IpdService();
    const beds = service.getBeds();
    assert.ok(beds.length >= 7, 'Should have at least 7 pre-seeded beds');

    const metrics = service.getBedMetrics();
    assert.equal(metrics.totalBeds, beds.length);
    assert.ok(metrics.occupiedBeds >= 1);
    assert.ok(metrics.availableBeds >= 1);

    const admissions = service.listAdmissions('ADMITTED');
    assert.ok(admissions.length >= 1, 'Should have at least 1 active admission');
    assert.equal(admissions[0].patientId, 'PT-1001');
  });

  it('should admit a patient to an available bed and generate admission barcode', () => {
    const service = new IpdService();
    const admission = service.admitPatient({
      patientId: 'PT-1002',
      patientName: 'CHHAY Bopha',
      bedId: 'bed-102',
      attendingDoctor: 'Dr. RITH Sreynoch',
      admittingDiagnosis: 'Post-Cesarean Section Day 1 Care',
      depositAmountUsd: 150,
      emergencyContact: {
        name: 'CHHAY Dara (Spouse)',
        phone: '012345678',
        relation: 'Spouse',
      },
    });

    assert.ok(admission.admissionNumber.startsWith('IPD-'));
    assert.ok(admission.wristbandBarcode.startsWith('WB-PT1002-'));
    assert.equal(admission.status, 'ADMITTED');
    assert.equal(admission.bedId, 'bed-102');

    // Bed status should now be OCCUPIED
    const bed = service.getBeds().find((b) => b.id === 'bed-102');
    assert.ok(bed);
    assert.equal(bed.status, 'OCCUPIED');
    assert.equal(bed.currentPatientId, 'PT-1002');
  });

  it('should prevent admitting a patient to a bed that is already occupied', () => {
    const service = new IpdService();
    // bed-101 is already occupied by PT-1001
    assert.throws(
      () => {
        service.admitPatient({
          patientId: 'PT-1003',
          patientName: 'MENG Dara',
          bedId: 'bed-101',
          attendingDoctor: 'Dr. CHAN Vanna',
          admittingDiagnosis: 'Acute Gastroenteritis',
          emergencyContact: {
            name: 'MENG Sothy',
            phone: '011223344',
            relation: 'Mother',
          },
        });
      },
      {
        message: /cannot be assigned/,
      },
    );
  });

  it('should transfer patient to another bed and set old bed to CLEANING_REQUIRED', () => {
    const service = new IpdService();
    const admission = service.getAdmission('adm-20261020-01');
    assert.equal(admission.bedId, 'bed-101');

    const updated = service.transferBed(admission.id, 'bed-201', 'Transferred to surgical ward post-op');
    assert.equal(updated.bedId, 'bed-201');
    assert.equal(updated.bedNumber, 'SURG-B1');

    // Old bed (bed-101) must now be CLEANING_REQUIRED
    const oldBed = service.getBeds().find((b) => b.id === 'bed-101');
    assert.ok(oldBed);
    assert.equal(oldBed.status, 'CLEANING_REQUIRED');
    assert.equal(oldBed.currentPatientId, undefined);

    // New bed (bed-201) must now be OCCUPIED
    const newBed = service.getBeds().find((b) => b.id === 'bed-201');
    assert.ok(newBed);
    assert.equal(newBed.status, 'OCCUPIED');
  });

  it('should discharge patient, mark admission as DISCHARGED, and set bed for cleaning', () => {
    const service = new IpdService();
    const discharged = service.dischargePatient('adm-20261020-01', 'Pneumonia resolved. Vitals stable on room air.');

    assert.equal(discharged.status, 'DISCHARGED');
    assert.ok(discharged.dischargeDate);

    // Bed must be released to CLEANING_REQUIRED
    const bed = service.getBeds().find((b) => b.id === 'bed-101');
    assert.ok(bed);
    assert.equal(bed.status, 'CLEANING_REQUIRED');
  });

  it('should mark cleaned bed as AVAILABLE', () => {
    const service = new IpdService();
    // bed-103 is CLEANING_REQUIRED by default
    const cleaned = service.markBedCleaned('bed-103');
    assert.equal(cleaned.status, 'AVAILABLE');
  });

  it('should administer medication via e-MAR when Five Rights barcode verification passes', () => {
    const service = new IpdService();
    const admission = service.getAdmission('adm-20261020-01');

    // Administer Ceftriaxone emar-03 (scheduled)
    const result = service.administerMedication(admission.id, 'emar-03', {
      scannedWristbandBarcode: admission.wristbandBarcode,
      scannedMedicationBarcode: 'MED-CEF1G-IV',
      nurseName: 'Nurse Kolap',
      notes: 'Administered via peripheral IV line. No pain or infiltration.',
    });

    assert.equal(result.status, 'GIVEN');
    assert.equal(result.administeringNurse, 'Nurse Kolap');
    assert.equal(result.verifiedBarcodeScan, true);
    assert.ok(result.administeredTime);
  });

  it('should reject medication administration when wristband barcode does not match (Wrong Patient)', () => {
    const service = new IpdService();
    const admission = service.getAdmission('adm-20261020-01');

    assert.throws(
      () => {
        service.administerMedication(admission.id, 'emar-02', {
          scannedWristbandBarcode: 'WB-WRONG-PATIENT-999',
          scannedMedicationBarcode: 'MED-PCM500-TAB',
          nurseName: 'Nurse Kolap',
        });
      },
      {
        message: /Five Rights Violation: Scanned wristband/,
      },
    );
  });

  it('should reject medication administration when drug barcode does not match (Wrong Drug)', () => {
    const service = new IpdService();
    const admission = service.getAdmission('adm-20261020-01');

    assert.throws(
      () => {
        service.administerMedication(admission.id, 'emar-02', {
          scannedWristbandBarcode: admission.wristbandBarcode,
          scannedMedicationBarcode: 'MED-WRONG-DRUG-888',
          nurseName: 'Nurse Kolap',
        });
      },
      {
        message: /Five Rights Violation: Scanned drug barcode/,
      },
    );
  });

  it('should calculate 24-hour Fluid Intake & Output net balance accurately', () => {
    const service = new IpdService();
    const record = service.recordFluidBalance('adm-20261020-01', {
      intakeOralMl: 600,
      intakeIvMl: 1000,
      outputUrineMl: 1100,
      outputDrainMl: 150,
      nurseName: 'Nurse Kolap',
    });

    // Total in: 600 + 1000 = 1600. Total out: 1100 + 150 = 1250. Net: +350.
    assert.equal(record.netBalanceMl, 350);
    assert.equal(record.recordedByNurse, 'Nurse Kolap');
  });

  it('should compute IV infusion flow rate and drop rate accurately', () => {
    const service = new IpdService();
    // 1000 mL over 8 hours with standard macro drop factor (20 gtt/mL)
    // Flow rate = 1000 / 8 = 125 mL/hr
    // Drip rate = (1000 * 20) / (8 * 60) = 20000 / 480 = 41.67 -> 42 gtt/min
    const calc = service.calculateIvDripRate(1000, 8, 20);
    assert.equal(calc.flowRateMlPerHour, 125);
    assert.equal(calc.dripRateGttPerMin, 42);
    assert.equal(calc.totalDrops, 20000);
  });

  it('should guarantee zero emojis across all wards and bed naming', () => {
    const service = new IpdService();
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const b of service.getBeds()) {
      assert.ok(!emojiRegex.test(b.bedNumber));
      assert.ok(!emojiRegex.test(b.wardNameEn));
      assert.ok(!emojiRegex.test(b.wardNameKh));
    }
  });
});
